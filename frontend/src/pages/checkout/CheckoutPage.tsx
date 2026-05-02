import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCartStore, selectCartTotal } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { getShippingRates, createOrder } from '../../api/orders';
import { createStripeCheckoutSession } from '../../api/payments';
import type { ShippingZone, ShippingRates } from '../../types';

type SpainSubzone = 'peninsular' | 'baleares' | 'canarias';

const ZONE_LABELS: Record<ShippingZone, string> = {
  peninsular:    'España peninsular',
  baleares:      'Islas Baleares',
  canarias:      'Islas Canarias, Ceuta y Melilla',
  international: 'Internacional (UE)',
};

function deriveZone(country: string, subzone: SpainSubzone): ShippingZone {
  if (!country) return 'peninsular';
  if (country === 'España') return subzone;
  return 'international';
}

export default function CheckoutPage() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, clear } = useCartStore();
  const subtotal  = useCartStore(selectCartTotal);
  const { user }  = useAuthStore();

  const [rates, setRates]   = useState<ShippingRates | null>(null);
  const [spainSubzone, setSpainSubzone] = useState<SpainSubzone>('peninsular');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const orderPlaced = useRef(false);

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

  const zone = deriveZone(form.country, spainSubzone);
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

      const { sessionUrl } = await createStripeCheckoutSession(order.id);

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
                <select
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
                  className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                >
                  <option value="">Selecciona un país</option>
                  <option value="Alemania">Alemania</option>
                  <option value="Austria">Austria</option>
                  <option value="Bélgica">Bélgica</option>
                  <option value="Bulgaria">Bulgaria</option>
                  <option value="Chipre">Chipre</option>
                  <option value="Croacia">Croacia</option>
                  <option value="Dinamarca">Dinamarca</option>
                  <option value="Eslovaquia">Eslovaquia</option>
                  <option value="Eslovenia">Eslovenia</option>
                  <option value="España">España</option>
                  <option value="Estonia">Estonia</option>
                  <option value="Finlandia">Finlandia</option>
                  <option value="Francia">Francia</option>
                  <option value="Grecia">Grecia</option>
                  <option value="Hungría">Hungría</option>
                  <option value="Irlanda">Irlanda</option>
                  <option value="Italia">Italia</option>
                  <option value="Letonia">Letonia</option>
                  <option value="Lituania">Lituania</option>
                  <option value="Luxemburgo">Luxemburgo</option>
                  <option value="Malta">Malta</option>
                  <option value="Países Bajos">Países Bajos</option>
                  <option value="Polonia">Polonia</option>
                  <option value="Portugal">Portugal</option>
                  <option value="República Checa">República Checa</option>
                  <option value="Rumanía">Rumanía</option>
                  <option value="Suecia">Suecia</option>
                </select>
              </div>

              {/* Subzona España */}
              {form.country === 'España' && (
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-sm font-medium text-brand-dark">¿Dónde te enviamos?</p>
                  {(
                    [
                      { value: 'peninsular', label: 'Península y Portugal' },
                      { value: 'baleares',   label: 'Islas Baleares' },
                      { value: 'canarias',   label: 'Islas Canarias, Ceuta y Melilla' },
                    ] as { value: SpainSubzone; label: string }[]
                  ).map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="spainSubzone"
                        value={value}
                        checked={spainSubzone === value}
                        onChange={() => setSpainSubzone(value)}
                        className="w-4 h-4 accent-brand-green"
                      />
                      <span className="text-sm text-brand-dark">
                        {label}
                        {rates ? ` — ${rates[value].toFixed(2)} €` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}

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
          {/* Zona de envío (solo lectura) */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-3">Zona de envío</h2>
            {form.country ? (
              <p className="text-sm text-brand-dark">
                {ZONE_LABELS[zone]}
                {shippingCost !== null && (
                  <span className="ml-1 font-semibold">&mdash; {shippingCost.toFixed(2)} €</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Selecciona un país para calcular el envío</p>
            )}
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
            <div className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">
              <p>{error}</p>
              {(error.toLowerCase().includes('stock') || error.toLowerCase().includes('agotado')) && (
                <Link to="/carrito" className="underline font-medium block mt-1">
                  Volver al carrito para ajustar las cantidades
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !rates || !form.country}
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
