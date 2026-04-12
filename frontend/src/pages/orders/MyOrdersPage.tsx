import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../api/orders';
import LoadingRipple from '../../components/LoadingRipple';
import type { Order, OrderStatus } from '../../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    'Pendiente',
  PROCESSING: 'En preparación',
  SHIPPED:    'Enviado',
  COMPLETED:  'Completado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED:    'bg-purple-100 text-purple-700',
  COMPLETED:  'bg-green-100 text-green-700',
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingRipple className="py-20" />;
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Todavía no tienes pedidos</p>
          <Link to="/productos" className="text-brand-green hover:underline">
            Ir a la tienda →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/pedido/${order.id}`}
              className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    {new Date(order.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                  <p className="font-semibold text-brand-dark text-sm">
                    {order.items.map((i) => `${i.product.name}${i.asKeychain ? ' (llavero)' : ''} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-bold text-brand-dark">{parseFloat(order.total).toFixed(2)} €</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
