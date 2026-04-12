import { useState, useEffect } from 'react';
import { getAdminReport } from '../../../api/adminReports';
import type { SalesReport } from '../../../api/adminReports';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

export default function AdminDashboardPage() {
  const [from, setFrom]     = useState(thirtyDaysAgo());
  const [to, setTo]         = useState(todayStr());
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getAdminReport(from, to)
      .then(setReport)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Panel de ventas</h1>

      {/* Date range selector */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={to}
            min={from}
            max={todayStr()}
            onChange={(e) => setTo(e.target.value)}
            className="border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Ingresos (entregados)', value: `${report.summary.totalRevenue.toFixed(2)} €` },
              { label: 'Total pedidos',          value: String(report.summary.totalOrders) },
              { label: 'Pedidos entregados',     value: String(report.summary.completedOrders) },
              { label: 'Ticket medio',           value: `${report.summary.avgOrderValue.toFixed(2)} €` },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-brand-dark">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            {/* By status */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-brand-dark mb-3 text-sm">Pedidos por estado</h2>
              {Object.entries(report.byStatus).map(([status, count]) => {
                const labels: Record<string, string> = {
                  PENDING: 'Pendiente', PROCESSING: 'En preparación',
                  SHIPPED: 'Enviado',   COMPLETED: 'Entregado',
                };
                const colors: Record<string, string> = {
                  PENDING: 'bg-yellow-100 text-yellow-800',
                  PROCESSING: 'bg-blue-100 text-blue-800',
                  SHIPPED: 'bg-purple-100 text-purple-800',
                  COMPLETED: 'bg-green-100 text-green-800',
                };
                return (
                  <div key={status} className="flex items-center justify-between py-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {labels[status] ?? status}
                    </span>
                    <span className="font-bold text-brand-dark">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Top products */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-brand-dark mb-3 text-sm">Top productos (por ingresos)</h2>
              {report.topProducts.length === 0 && (
                <p className="text-sm text-gray-400">Sin datos</p>
              )}
              {report.topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                    <span className="text-xs text-gray-400 mr-1.5">{i + 1}.</span>
                    {p.name}
                    <span className="text-xs text-gray-400 ml-1">×{p.quantity}</span>
                  </span>
                  <span className="font-medium text-brand-dark text-sm flex-shrink-0">{p.revenue.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by day */}
          {report.revenueByDay.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-brand-dark mb-3 text-sm">Ingresos por día</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-4">Fecha</th>
                      <th className="pb-2 pr-4">Pedidos</th>
                      <th className="pb-2">Ingresos (entregados)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.revenueByDay.map((row) => (
                      <tr key={row.date} className="border-b border-gray-50 hover:bg-brand-cream transition-colors">
                        <td className="py-1.5 pr-4 text-gray-600">{row.date}</td>
                        <td className="py-1.5 pr-4 text-gray-600">{row.orders}</td>
                        <td className="py-1.5 font-medium text-brand-dark">{row.revenue.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !report && !error && (
        <div className="text-center py-20 text-brand-greenLight">Selecciona un rango y pulsa Actualizar.</div>
      )}
    </div>
  );
}
