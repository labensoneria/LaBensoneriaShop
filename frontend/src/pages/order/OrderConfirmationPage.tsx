import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getOrder } from '../../api/orders';
import LoadingRipple from '../../components/LoadingRipple';
import type { Order, OrderStatus, PaymentStatus } from '../../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    'Pendiente de confirmación',
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

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID:   'Pendiente de pago',
  PAID:     'Pagado',
  FAILED:   'Pago fallido',
  REFUNDED: 'Reembolsado',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  UNPAID:   'bg-yellow-100 text-yellow-800',
  PAID:     'bg-green-100 text-green-800',
  FAILED:   'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // Viene de Stripe success_url — el webhook puede tardar unos segundos
  const venimosDeStripe = searchParams.get('pagado') === 'true';

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(setOrder)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingRipple className="py-20" />;
  if (error || !order) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-4">{error ?? 'Pedido no encontrado'}</p>
      <Link to="/productos" className="text-brand-green underline">Ir al catálogo</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Cabecera */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">¡Pedido recibido!</h1>
        <p className="text-brand-greenLight">
          Gracias, {order.guestName}. Te escribiremos a <strong>{order.guestEmail}</strong> cuando tu pedido esté listo.
        </p>
      </div>

      {/* Aviso de pago en procesamiento */}
      {venimosDeStripe && order.paymentStatus !== 'PAID' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-4 text-sm text-blue-800">
          Tu pago está siendo procesado. El estado se actualizará en breve.
          Puedes recargar la página en unos instantes.
        </div>
      )}

      {/* Estado + ID */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Nº de pedido</p>
            <p className="font-mono text-sm text-brand-dark mt-0.5">{order.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Fecha: {new Date(order.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </span>
        </div>
      </div>

      {/* Artículos */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <h2 className="font-bold text-brand-dark mb-4">Artículos</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-brand-cream overflow-hidden flex-shrink-0">
                {item.product.images[0] ? (
                  <img
                    src={item.product.images[0].cloudinaryUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🧶</div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-dark">
                  {item.product.name}{item.asKeychain ? ' (llavero)' : ''}
                </p>
                <p className="text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <p className="font-semibold text-brand-dark">
                {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)} €
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totales + dirección */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Importes */}
          <div>
            <h2 className="font-bold text-brand-dark mb-3">Importes</h2>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{parseFloat(order.subtotal).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Envío</span>
                <span>{parseFloat(order.shippingCost).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-brand-dark mt-2">
                <span>Total</span>
                <span>{parseFloat(order.total).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Dirección */}
          {order.address && (
            <div>
              <h2 className="font-bold text-brand-dark mb-3">Dirección de entrega</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-medium text-brand-dark">{order.address.name}</p>
                <p>{order.address.street}</p>
                {order.address.street2 && <p>{order.address.street2}</p>}
                <p>{order.address.postalCode} {order.address.city}</p>
                <p>{order.address.country}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Link
        to="/productos"
        className="block w-full text-center bg-brand-green text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition-colors"
      >
        Seguir comprando
      </Link>
    </div>
  );
}
