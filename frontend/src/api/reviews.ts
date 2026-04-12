import { apiFetch } from './client';
import type { Review, CreateReviewPayload } from '../types';

export function createReview(productId: string, data: CreateReviewPayload): Promise<Review> {
  return apiFetch<Review>(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body:   JSON.stringify(data),
  });
}

export function getProductReviews(productId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/products/${productId}/reviews`);
}
