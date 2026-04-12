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
        items:   { include: { product: { select: { name: true } } } },
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

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Pedido no encontrado', 404);

  return prisma.order.update({
    where: { id },
    data:  { status },
    include: {
      items:   { include: { product: { select: { name: true } } } },
      address: true,
    },
  });
}
