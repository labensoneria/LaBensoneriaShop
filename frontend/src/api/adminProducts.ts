import { apiFetch } from './client';
import type { PaginatedProducts, Product, ProductColor } from '../types';

export function adminGetProducts(page = 1, limit = 20): Promise<PaginatedProducts> {
  return apiFetch<PaginatedProducts>(`/api/admin/products?page=${page}&limit=${limit}`);
}

export function adminGetProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/admin/products/${id}`);
}

export function adminCreateProduct(data: {
  name: string;
  description?: string | null;
  price: number;
  convertibleToKeychain?: boolean;
  stock?: number | null;
  discountPercent?: number | null;
}): Promise<Product> {
  return apiFetch<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function adminUpdateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    price: number;
    convertibleToKeychain: boolean;
    active: boolean;
    stock: number | null;
    discountPercent: number | null;
  }>
): Promise<Product> {
  return apiFetch<Product>(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function adminDeleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export function adminPermanentDeleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/products/${id}/permanent`, { method: 'DELETE' });
}

export function adminDeleteImage(productId: string, imageId: string): Promise<void> {
  return apiFetch<void>(`/api/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
}

export function adminUploadImages(id: string, files: FileList): Promise<Product> {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append('images', f));
  return apiFetch<Product>(`/api/admin/products/${id}/images`, {
    method: 'POST',
    body: form,
  });
}

export function adminAddProductColor(productId: string, hex: string, name: string): Promise<ProductColor> {
  return apiFetch<ProductColor>(`/api/admin/products/${productId}/colors`, {
    method: 'POST',
    body: JSON.stringify({ hex, name }),
  });
}

export function adminDeleteProductColor(productId: string, colorId: string): Promise<void> {
  return apiFetch<void>(`/api/admin/products/${productId}/colors/${colorId}`, {
    method: 'DELETE',
  });
}
