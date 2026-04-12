import prisma from '../utils/prisma';

export async function getSalesReport(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: {
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const completed = orders.filter((o) => o.status === 'COMPLETED');

  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

  const byStatus = { PENDING: 0, PROCESSING: 0, SHIPPED: 0, COMPLETED: 0 } as Record<string, number>;
  for (const order of orders) byStatus[order.status]++;

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of completed) {
    for (const item of order.items) {
      const prev = productMap.get(item.productId) ?? { name: item.product.name, quantity: 0, revenue: 0 };
      prev.quantity += item.quantity;
      prev.revenue  += Number(item.unitPrice) * item.quantity;
      productMap.set(item.productId, prev);
    }
  }
  const topProducts = [...productMap.entries()]
    .map(([productId, d]) => ({ productId, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const date = order.createdAt.toISOString().split('T')[0];
    const prev = dayMap.get(date) ?? { revenue: 0, orders: 0 };
    prev.orders++;
    if (order.status === 'COMPLETED') prev.revenue += Number(order.total);
    dayMap.set(date, prev);
  }
  const revenueByDay = [...dayMap.entries()]
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalRevenue,
      totalOrders: orders.length,
      completedOrders: completed.length,
      avgOrderValue,
    },
    byStatus,
    topProducts,
    revenueByDay,
  };
}
