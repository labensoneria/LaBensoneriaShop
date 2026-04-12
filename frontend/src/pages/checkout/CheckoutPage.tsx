import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCartStore, selectCartTotal } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { getShippingRates, createOrder } from '../../api/orders';
import { createStripeCheckoutSession } from '../../api/payments';
import type { ShippingZone, ShippingRates } from '../../types';

const ZONE_LABELS: Record<ShippingZone, string> = {
  peninsular:    'España peninsular y Portugal',
  baleares:      'Islas Baleares',
  canarias:      'Islas Canarias, Ceuta y Melilla',
  international: 'Internacional',
};

const ZONES = Object.keys(ZONE_LABELS) as ShippingZone[];

export default function CheckoutPage() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, clear } = useCartStore();
  const subtotal  = useCartStore(selectCartTotal);
  const { user }  = useAuthStore();

  const [rates, setRates]   = useState<ShippingRates | null>(null);
  const [zone, setZone]     = useState<ShippingZone>('peninsular');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const orderPlaced = useRef(false);

  // Mensaje cuando el usuario vuelve desde Stripe con "cancelado"
  const cancelado = searchParams.get('cancelado') === 'true';

  const [form, setForm] = useState({
    guestName:  user?.name  ?? '',
    guestEmail: user?.email ?? '',
    addrName:   user?.addressName    ?? '',
    street:     user?.addressStreet  ?? '',
    street2:    user?.addressStreet2 ?? '',
    city:       user?.addressCity    ?? '',
    postalCode: user?.addressPostal  ?? '',
    country:    user?.addressCountry ?? 'España',
  });

  useEffect(() => {
    if (items.length === 0 && !orderPlaced.current) {
      navigate('/carrito', { replace: true });
      return;
    }
    getShippingRates().then(setRates).catch(() => null);
  }, [items.length, navigate]);

  const shippingCost = rates ? rates[zone] : null;
  const total = shippingCost !== null ? subtotal + shippingCost : null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // 1. Crear el pedido en estado PENDING
      const order = await createOrder({
        items: items.map((i) => ({
          productId:  i.productId,
          quantity:   i.quantity,
          asKeychain: i.asKeychain,
        })),
        guestEmail:   form.guestEmail,
        guestName:    form.guestName,
        shippingZone: zone,
        saveAddressToProfile: user ? saveAddress : undefined,
        address: {
          name:       form.addrName,
          street:     form.street,
          ...(form.street2 ? { street2: form.street2 } : {}),
          city:       form.city,
          postalCode: form.postalCode,
          country:    form.country,
        },
      });

      // 2. Crear sesión de Stripe Checkout
      const { sessionUrl } = await createStripeCheckoutSession(order.id);

      // 3. Vaciar el carrito y redirigir a Stripe
      orderPlaced.current = true;
      clear();
      window.location.href = sessionUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        {/* Datos de contacto + envío */}
        <div className="flex flex-col gap-6">
          {/* Datos de contacto */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Datos de contacto</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Nombre completo</label>
                <input
                  type="text"
                  name="guestName"
                  required
                  value={form.guestName}
                  onChange={handleChange}
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Correo electrónico</label>
                <input
                  type="email"
                  name="guestEmail"
                  required
                  value={form.guestEmail}
                  onChange={handleChange}
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
            </div>
          </section>

          {/* Dirección de envío */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Dirección de entrega</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Nombre del destinatario</label>
                <input
                  type="text"
                  name="addrName"
                  required
                  value={form.addrName}
                  onChange={handleChange}
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Calle y número</label>
                <input
                  type="text"
                  name="street"
                  required
                  value={form.street}
                  onChange={handleChange}
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">
                  Escalera, piso, puerta
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="street2"
                  value={form.street2}
                  onChange={handleChange}
                  placeholder="Ej: 3º izquierda, escalera B"
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Código postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={form.postalCode}
                    onChange={handleChange}
                    className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">País</label>
                <input
                  type="text"
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              {/* Checkbox guardar dirección — solo para usuarios autenticados */}
              {user && (
                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 accent-brand-green"
                  />
                  <span className="text-sm text-brand-dark">Actualizar mi dirección de perfil con esta</span>
                </label>
              )}
            </div>
          </section>
        </div>

        {/* Resumen del pedido */}
        <div className="flex flex-col gap-6">
          {/* Zona de envío */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Zona de envío</h2>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value as ShippingZone)}
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {ZONE_LABELS[z]}{rates ? ` — ${rates[z].toFixed(2)} €` : ''}
                </option>
              ))}
            </select>
          </section>

          {/* Resumen */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Resumen</h2>

            <div className="flex flex-col gap-2 mb-4">
              {items.map((item) => (
                <div key={`${item.productId}_${item.asKeychain}`} className="flex justify-between text-sm">
                  <span className="text-brand-dark">
                    {item.name}{item.asKeychain ? ' (llavero)' : ''} × {item.quantity}
                  </span>
                  <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Envío</span>
                <span>{shippingCost !== null ? `${shippingCost.toFixed(2)} €` : '—'}</span>
              </div>
              <div className="flex justify-between text-brand-dark font-bold mt-2 text-lg">
                <span>Total</span>
                <span>{total !== null ? `${total.toFixed(2)} €` : '—'}</span>
              </div>
            </div>
          </section>

          {cancelado && !error && (
            <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Has cancelado el pago. Puedes revisar los datos e intentarlo de nuevo.
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !rates}
            className="w-full bg-brand-green text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Redirigiendo a Stripe...' : 'Pagar con tarjeta'}
          </button>

          <Link to="/carrito" className="block text-center text-brand-green text-sm hover:underline">
            ← Volver al carrito
          </Link>
        </div>
      </form>
    </div>
  );
}
