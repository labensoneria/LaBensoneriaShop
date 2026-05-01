import prisma from '../utils/prisma';

export type ProductSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';

export function computeEffectivePrice(
  price: number,
  discountPercent: number | null,
  globalPct: number
): { effectivePrice: string; appliedDiscountPercent: number | null } {
  const pct = discountPercent !== null ? discountPercent : globalPct;
  if (pct <= 0) return { effectivePrice: price.toFixed(2), appliedDiscountPercent: null };
  const effective = Math.round(price * (100 - pct)) / 100;
  return { effectivePrice: effective.toFixed(2), appliedDiscountPercent: pct };
}

async function getGlobalDiscountPct(): Promise<number> {
  const setting = await prisma.appSettings.findUnique({ where: { key: 'globalDiscountPercent' } });
  const pct = setting ? parseInt(setting.value, 10) : 0;
  return isNaN(pct) ? 0 : pct;
}

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

  const [products, total, globalPct] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: ORDER_BY[sort],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
    getGlobalDiscountPct(),
  ]);

  const enriched = products.map((p) => {
    const { effectivePrice, appliedDiscountPercent } = computeEffectivePrice(
      parseFloat(p.price.toString()),
      p.discountPercent,
      globalPct
    );
    return { ...p, effectivePrice, appliedDiscountPercent };
  });

  return { products: enriched, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getProduct(id: string) {
  const [product, globalPct] = await Promise.all([
    prisma.product.findFirst({
      where: { id, active: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    getGlobalDiscountPct(),
  ]);

  if (!product) return null;

  const { effectivePrice, appliedDiscountPercent } = computeEffectivePrice(
    parseFloat(product.price.toString()),
    product.discountPercent,
    globalPct
  );
  return { ...product, effectivePrice, appliedDiscountPercent };
}
