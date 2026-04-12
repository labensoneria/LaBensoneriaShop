import { apiFetch } from './client';

export interface CheckoutSessionResponse {
  sessionUrl: string;
}

export function createStripeCheckoutSession(orderId: string) {
  return apiFetch<CheckoutSessionResponse>('/api/payments/stripe/checkout-session', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}
