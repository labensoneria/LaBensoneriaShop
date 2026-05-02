import { apiFetch } from './client';

export interface AppSettingsMap {
  ordersEnabled:          string;
  newProductDays:         string;
  globalDiscountPercent:  string;
  shipping_peninsular:    string;
  shipping_baleares:      string;
  shipping_canarias:      string;
  shipping_international: string;
}

export function getNewProductDays() {
  return apiFetch<{ newProductDays: number }>('/api/admin/settings/public');
}

export function getAdminSettings() {
  return apiFetch<AppSettingsMap>('/api/admin/settings');
}

export function updateAdminSettings(data: Partial<AppSettingsMap>) {
  return apiFetch<AppSettingsMap>('/api/admin/settings', {
    method: 'PUT',
    body:   JSON.stringify(data),
  });
}
