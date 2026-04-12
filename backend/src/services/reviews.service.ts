import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export interface CreateReviewInput {
  productId: string;
  userId:    string;
  stars:     number;
  comment?:  string;
}

export async function createReview(input: CreateReviewInput) {
  // Verificar que el producto existe
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new AppError('Producto no encontrado', 404);

  // El usuario debe tener al menos un pedido COMPLETED con este producto
  const completedOrder = await prisma.order.findFirst({
    where: {
      userId: input.userId,
      status: 'COMPLETED',
      items:  { some: { productId: input.productId } },
    },
  });
  if (!completedOrder) {
    throw new AppError('Solo puedes reseñar productos de pedidos completados', 403);
  }

  // Un usuario solo puede reseñar cada producto una vez
  const existing = await prisma.review.findFirst({
    where: { productId: input.productId, userId: input.userId },
  });
  if (existing) throw new AppError('Ya has reseñado este producto', 409);

  return prisma.review.create({
    data: {
      productId: input.productId,
      userId:    input.userId,
      stars:     input.stars,
      comment:   input.comment,
    },
    include: { user: { select: { name: true } } },
  });
}

export async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where:   { productId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
}
