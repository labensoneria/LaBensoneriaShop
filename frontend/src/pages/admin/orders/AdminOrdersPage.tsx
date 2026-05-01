import { useEffect, useState } from 'react';
import { getAdminOrders, updateOrderStatus } from '../../../api/orders';
import LoadingRipple from '../../../components/LoadingRipple';
import type { Order, OrderStatus, PaginatedOrders } from '../../../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    'Pendiente',
  PROCESSING: 'En preparación',
  SHIPPED:    'Enviado',
  COMPLETED:  'Entregado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  COMPLETED:  'bg-green-100 text-green-800',
};

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED'];

export default function AdminOrdersPage() {
  const [data, setData]         = useState<PaginatedOrders | null>(null);
  const [page, setPage]         = useState(1);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getAdminOrders({
      page,
      limit: 20,
      status: filterStatus || undefined,
    })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, filterStatus]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    setUpdating(order.id);
    try {
      // Ask admin if they want to replenish stock for items that have stock tracking
      const stockItems = order.items.filter((item) => item.product.stock !== null && item.product.stock !== undefined);
      const replenishStock: Record<string, number> = {};
      for (const item of stockItems) {
        if (window.confirm(`¿Reponer stock de "${item.product.name}" (+${item.quantity})?`)) {
          replenishStock[item.productId] = item.quantity;
        }
      }

      const updated = await updateOrderStatus(
        order.id,
        status,
        Object.keys(replenishStock).length > 0 ? replenishStock : undefined
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              orders: prev.orders.map((o) => (o.id === updated.id ? updated : o)),
            }
          : prev
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Pedidos</h1>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as OrderStatus | ''); setPage(1); }}
          className="border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {loading && <LoadingRipple className="py-20" />}
      {error   && <div className="text-center py-20 text-red-500">{error}</div>}

      {!loading && !error && data && (
        <>
          {data.orders.length === 0 && (
            <div className="text-center py-20 text-brand-greenLight">No hay pedidos.</div>
          )}

          <div className="flex flex-col gap-3">
            {data.orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Cabecera del pedido */}
                <button
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{order.id.slice(0, 8)}…</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="font-semibold text-brand-dark truncate mt-0.5">
                      {order.guestName ?? '—'}
                    </p>
                    {order.guestEmail && (
                      <a
                        href={`mailto:${order.guestEmail}?subject=Tu pedido en La Bensonería (${order.id.slice(0, 8)})`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-brand-sky hover:underline"
                      >
                        {order.guestEmail}
                      </a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-brand-dark">{parseFloat(order.total).toFixed(2)} €</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className="text-gray-300 ml-2">{expanded === order.id ? '▲' : '▼'}</span>
                </button>

                {/* Detalle expandible */}
                {expanded === order.id && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="grid sm:grid-cols-2 gap-6 mt-4">
                      {/* Artículos */}
                      <div>
                        <h3 className="font-semibold text-brand-dark mb-2 text-sm">Artículos</h3>
                        <div className="flex flex-col gap-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.product.name}{item.asKeychain ? ' (llavero)' : ''} × {item.quantity}
                              </span>
                              <span className="font-medium">
                                {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)} €
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
                          <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span><span>{parseFloat(order.subtotal).toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Envío</span><span>{parseFloat(order.shippingCost).toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between font-bold text-brand-dark mt-1">
                            <span>Total</span><span>{parseFloat(order.total).toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>

                      {/* Dirección + cambio de estado */}
                      <div>
                        {order.address && (
                          <div className="mb-4">
                            <h3 className="font-semibold text-brand-dark mb-2 text-sm">Dirección</h3>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              <p className="font-medium">{order.address.name}</p>
                              <p>{order.address.street}</p>
                              {order.address.street2 && <p>{order.address.street2}</p>}
                              <p>{order.address.postalCode} {order.address.city}</p>
                              <p>{order.address.country}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="font-semibold text-brand-dark mb-2 text-sm">Cambiar estado</h3>
                          <div className="flex flex-wrap gap-2">
                            {ALL_STATUSES.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(order, s)}
                                disabled={order.status === s || updating === order.id}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  order.status === s
                                    ? STATUS_COLORS[s]
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Paginación */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white shadow-sm text-brand-dark hover:bg-brand-cream disabled:opacity-40 text-sm"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm text-brand-dark">
                {page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 rounded-lg bg-white shadow-sm text-brand-dark hover:bg-brand-cream disabled:opacity-40 text-sm"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
