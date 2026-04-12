import prisma from '../utils/prisma';
import { uploadBuffer, deleteImage } from '../utils/cloudinary';
import { AppError } from '../utils/AppError';

export async function listAllProducts(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count(),
  ]);
  return { products, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  });

  if (!product) throw new AppError('Producto no encontrado', 404);

  return product;
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  convertibleToKeychain?: boolean;
}) {
  return prisma.product.create({ data });
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    convertibleToKeychain?: boolean;
    active?: boolean;
  }
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Producto no encontrado', 404);
  return prisma.product.update({ where: { id }, data });
}

export async function deactivateProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Producto no encontrado', 404);
  return prisma.product.update({ where: { id }, data: { active: false } });
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) throw new AppError('Imagen no encontrada', 404);

  // Extract Cloudinary public_id from the URL (everything after the last slash, without extension)
  const urlPath = new URL(image.cloudinaryUrl).pathname;
  const parts = urlPath.split('/');
  const fileWithExt = parts[parts.length - 1];
  const folder = parts.slice(parts.indexOf('labensoneria')).slice(0, -1).join('/');
  const publicId = `${folder}/${fileWithExt.replace(/\.[^.]+$/, '')}`;

  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteImage(publicId);
}

export async function deleteProductPermanently(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Producto no encontrado', 404);
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) throw new AppError('No se puede eliminar un producto con pedidos asociados', 409);

  await prisma.productImage.deleteMany({ where: { productId: id } });
  await prisma.review.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
}

export async function addProductImages(
  productId: string,
  files: Express.Multer.File[]
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Producto no encontrado', 404);

  const existing = await prisma.productImage.count({ where: { productId } });

  const uploads = await Promise.all(
    files.map((file, i) =>
      uploadBuffer(file.buffer, 'labensoneria/products').then((result) => ({
        productId,
        cloudinaryUrl: result.secure_url,
        order: existing + i,
      }))
    )
  );

  await prisma.productImage.createMany({ data: uploads });

  return prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { order: 'asc' } } },
  });
}
