import prisma from '../utils/prisma';

export type ProductSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';

const ORDER_BY: Record<ProductSort, object> = {
  newest:     { publishedAt: 'desc' },
  oldest:     { publishedAt: 'asc' },
  price_asc:  { price: 'asc' },
  price_desc: { price: 'desc' },
  popular:    { soldCount: 'desc' },
};

export async function listProducts(
  sort: ProductSort = 'newest',
  page = 1,
  limit = 12
) {
  const skip = (page - 1) * limit;
  const where = { active: true };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: ORDER_BY[sort],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, active: true },
    include: {
      images: { orderBy: { order: 'asc' } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}
