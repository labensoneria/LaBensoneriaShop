import { apiFetch } from './client';
import type { PaginatedProducts, Product, ProductSort } from '../types';

export function getProducts(params?: {
  sort?: ProductSort;
  page?: number;
  limit?: number;
}): Promise<PaginatedProducts> {
  const qs = new URLSearchParams();
  if (params?.sort)  qs.set('sort',  params.sort);
  if (params?.page)  qs.set('page',  String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString() ? `?${qs}` : '';
  return apiFetch<PaginatedProducts>(`/api/products${query}`);
}

export function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`);
}
