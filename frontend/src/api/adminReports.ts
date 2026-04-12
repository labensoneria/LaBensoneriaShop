import { apiFetch } from './client';

export interface SalesReportSummary {
  totalRevenue:    number;
  totalOrders:     number;
  completedOrders: number;
  avgOrderValue:   number;
}

export interface TopProduct {
  productId: string;
  name:      string;
  quantity:  number;
  revenue:   number;
}

export interface RevenueByDay {
  date:    string;
  revenue: number;
  orders:  number;
}

export interface SalesReport {
  summary:      SalesReportSummary;
  byStatus:     Record<string, number>;
  topProducts:  TopProduct[];
  revenueByDay: RevenueByDay[];
}

export function getAdminReport(from: string, to: string) {
  return apiFetch<SalesReport>(`/api/admin/reports?from=${from}&to=${to}`);
}
