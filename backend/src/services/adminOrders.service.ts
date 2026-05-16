import { OrderStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { sendOrderShipped } from './email.service';
import * as packlink from './packlink.service';

export async function listOrders(page = 1, limit = 20, status?: OrderStatus) {
  const skip  = (page - 1) * limit;
  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items:   { include: { product: { select: { name: true, stock: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, limit, pages: Math.ceil(total / limit) };
}

interface UpdateStatusOptions {
  replenishStock?: Record<string, number>;
  skipPacklink?:   boolean;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  opts: UpdateStatusOptions = {},
) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items:   { include: { product: { select: { name: true, weightGrams: true } } } },
      address: true,
    },
  });
  if (!order) throw new AppError('Pedido no encontrado', 404);

  const transitioningToShipped = status === 'SHIPPED' && order.status !== 'SHIPPED';

  // If transitioning to SHIPPED, book the Packlink shipment first (unless skipped)
  if (transitioningToShipped && !opts.skipPacklink) {
    if (!order.packlinkServiceId) {
      throw new AppError('Este pedido no tiene un servicio Packlink asociado. Usa skipPacklink=true para enviarlo manualmente.', 400);
    }
    if (order.packlinkShipmentRef) {
      throw new AppError('Este pedido ya tiene un envío Packlink creado.', 409);
    }
    let reference: string;
    let tracking: { trackingNumber?: string; trackingUrl?: string; labelUrl?: string };
    try {
      const created = await packlink.createShipment(order as any, {
        serviceId:     order.packlinkServiceId,
        pickupPointId: order.pickupPointId ?? undefined,
      });
      reference = created.reference;
      tracking  = created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Packlink createShipment failed';
      throw new AppError(`Packlink: ${msg}`, 502);
    }
    // Persist reference immediately so admin can retry payment safely
    await prisma.order.update({
      where: { id },
      data:  { packlinkShipmentRef: reference },
    });
    try {
      await packlink.payShipment(reference);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Packlink payShipment failed';
      throw new AppError(`Packlink (pago envío): ${msg}`, 502);
    }
    // Try to fetch updated tracking/label after payment if not in create response
    if (!tracking.trackingNumber || !tracking.labelUrl) {
      try {
        const refreshed = await packlink.getShipment(reference);
        tracking = { ...tracking, ...refreshed };
      } catch { /* non-fatal */ }
    }
    await prisma.order.update({
      where: { id },
      data: {
        packlinkTrackingNumber: tracking.trackingNumber ?? null,
        packlinkTrackingUrl:    tracking.trackingUrl    ?? null,
        packlinkLabelUrl:       tracking.labelUrl       ?? null,
      },
    });
  }

  const updated = await prisma.order.update({
    where: { id },
    data:  { status },
    include: {
      items:   { include: { product: { select: { name: true, stock: true } } } },
      address: true,
    },
  });

  if (transitioningToShipped) {
    sendOrderShipped(id).catch((err) =>
      console.error('[email] Order shipped failed:', err),
    );
  }

  if (opts.replenishStock) {
    for (const [productId, qty] of Object.entries(opts.replenishStock)) {
      if (qty > 0) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (product && product.stock !== null) {
          await prisma.product.update({
            where: { id: productId },
            data:  { stock: { increment: qty } },
          });
        }
      }
    }
  }

  return updated;
}
