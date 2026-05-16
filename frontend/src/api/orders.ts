import { apiFetch } from './client';
import type { Order, CreateOrderPayload, PaginatedOrders, OrderStatus, OrdersAvailability, ShippingQuote, PickupPoint } from '../types';

export function getOrdersAvailability() {
  return apiFetch<OrdersAvailability>('/api/orders/availability');
}

export function quoteShipping(payload: {
  toCountry: string;
  toZip:     string;
  items:     { productId: string; quantity: number }[];
}) {
  return apiFetch<ShippingQuote>('/api/orders/shipping-quote', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

export function getPickupPoints(carrierId: string, country: string, zip: string) {
  const qs = new URLSearchParams({ carrierId, country, zip });
  return apiFetch<PickupPoint[]>(`/api/orders/pickup-points?${qs}`);
}

export function createOrder(payload: CreateOrderPayload) {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

export function getOrder(id: string) {
  return apiFetch<Order>(`/api/orders/${id}`);
}

export function getMyOrders() {
  return apiFetch<Order[]>('/api/orders/my-orders');
}

export function getAdminOrders(params?: { page?: number; limit?: number; status?: OrderStatus }) {
  const qs = new URLSearchParams();
  if (params?.page)   qs.set('page',   String(params.page));
  if (params?.limit)  qs.set('limit',  String(params.limit));
  if (params?.status) qs.set('status', params.status);
  return apiFetch<PaginatedOrders>(`/api/admin/orders?${qs}`);
}

export function updateOrderStatus(id: string, status: OrderStatus, replenishStock?: Record<string, number>, skipPacklink?: boolean) {
  return apiFetch<Order>(`/api/admin/orders/${id}/status`, {
    method: 'PUT',
    body:   JSON.stringify({ status, ...(replenishStock ? { replenishStock } : {}), ...(skipPacklink ? { skipPacklink } : {}) }),
  });
}
