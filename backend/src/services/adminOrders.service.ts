import { OrderStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

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

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  replenishStock?: Record<string, number>
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Pedido no encontrado', 404);

  const updated = await prisma.order.update({
    where: { id },
    data:  { status },
    include: {
      items:   { include: { product: { select: { name: true, stock: true } } } },
      address: true,
    },
  });

  if (replenishStock) {
    for (const [productId, qty] of Object.entries(replenishStock)) {
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
