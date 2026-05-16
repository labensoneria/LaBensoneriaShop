import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCartStore, selectCartTotal } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { quoteShipping, getPickupPoints, createOrder } from '../../api/orders';
import { createStripeCheckoutSession } from '../../api/payments';
import type { DeliveryType, QuotedService, ShippingQuote, PickupPoint } from '../../types';

const COUNTRIES: { code: string; label: string }[] = [
  { code: 'ES', label: 'España' },
  { code: 'PT', label: 'Portugal' },
  { code: 'FR', label: 'Francia' },
  { code: 'DE', label: 'Alemania' },
  { code: 'IT', label: 'Italia' },
  { code: 'BE', label: 'Bélgica' },
  { code: 'NL', label: 'Países Bajos' },
  { code: 'AT', label: 'Austria' },
  { code: 'IE', label: 'Irlanda' },
  { code: 'LU', label: 'Luxemburgo' },
  { code: 'DK', label: 'Dinamarca' },
  { code: 'SE', label: 'Suecia' },
  { code: 'FI', label: 'Finlandia' },
  { code: 'PL', label: 'Polonia' },
  { code: 'CZ', label: 'República Checa' },
  { code: 'SK', label: 'Eslovaquia' },
  { code: 'HU', label: 'Hungría' },
  { code: 'SI', label: 'Eslovenia' },
  { code: 'HR', label: 'Croacia' },
  { code: 'RO', label: 'Rumanía' },
  { code: 'BG', label: 'Bulgaria' },
  { code: 'EE', label: 'Estonia' },
  { code: 'LV', label: 'Letonia' },
  { code: 'LT', label: 'Lituania' },
  { code: 'GR', label: 'Grecia' },
  { code: 'CY', label: 'Chipre' },
  { code: 'MT', label: 'Malta' },
];

// Legacy support: map old Spanish names stored in user.addressCountry to ISO codes
const LEGACY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.label, c.code]),
);

function normalizeCountry(value: string | null | undefined): string {
  if (!value) return 'ES';
  if (COUNTRIES.some((c) => c.code === value)) return value;
  return LEGACY_NAME_TO_CODE[value] ?? '';
}

export default function CheckoutPage() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, clear } = useCartStore();
  const subtotal  = useCartStore(selectCartTotal);
  const { user }  = useAuthStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('HOME');
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<QuotedService | null>(null);

  const [showAllServices, setShowAllServices] = useState(false);

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<PickupPoint | null>(null);

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
    country:    normalizeCountry(user?.addressCountry),
  });

  useEffect(() => {
    if (items.length === 0 && !orderPlaced.current) {
      navigate('/carrito', { replace: true });
    }
  }, [items.length, navigate]);

  // Debounced shipping quote when country + postal code + items are valid
  const quoteKey = `${form.country}|${form.postalCode}|${items.map((i) => `${i.productId}x${i.quantity}`).join(',')}`;
  useEffect(() => {
    if (!form.country || form.postalCode.trim().length < 4 || items.length === 0) {
      setQuote(null);
      setSelectedService(null);
      return;
    }
    const handle = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const q = await quoteShipping({
          toCountry: form.country,
          toZip:     form.postalCode.trim(),
          items:     items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        setQuote(q);
        setSelectedService(null);
        setSelectedPickup(null);
        setPickupPoints([]);
        setShowAllServices(false);
      } catch (err: unknown) {
        setQuote(null);
        const raw = err instanceof Error ? err.message : '';
        const friendly = /bad request|postal|zip|invalid/i.test(raw)
          ? 'Código postal inválido o sin cobertura para envíos'
          : 'No podemos calcular el envío ahora, inténtalo de nuevo';
        setQuoteError(friendly);
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [quoteKey]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Reset chosen service when delivery type changes
  useEffect(() => {
    setSelectedService(null);
    setSelectedPickup(null);
    setPickupPoints([]);
    setPickupError(null);
    setShowAllServices(false);
  }, [deliveryType]);

  // Load pickup points when a pickup service is selected
  useEffect(() => {
    if (deliveryType !== 'PICKUP_POINT' || !selectedService) {
      setPickupPoints([]);
      setSelectedPickup(null);
      return;
    }
    if (!selectedService.carrierId || !form.country || !form.postalCode.trim()) {
      setPickupError('Faltan datos para buscar puntos de recogida. Revisa el país y código postal.');
      return;
    }
    setPickupLoading(true);
    setSelectedPickup(null);
    setPickupError(null);
    getPickupPoints(selectedService.carrierId, form.country, form.postalCode.trim())
      .then((pts) => setPickupPoints(pts))
      .catch((err: unknown) => {
        setPickupPoints([]);
        setPickupError(err instanceof Error ? err.message : 'Error al obtener puntos de recogida');
      })
      .finally(() => setPickupLoading(false));
  }, [selectedService, deliveryType, form.country, form.postalCode]);

  const visibleServices = useMemo(() => {
    if (!quote) return [];
    return deliveryType === 'HOME' ? quote.home : quote.pickup;
  }, [quote, deliveryType]);

  const shippingCost = selectedService ? selectedService.priceTotal : null;
  const total = shippingCost !== null ? subtotal + shippingCost : null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const canSubmit =
    !!form.country && !!form.postalCode && !!selectedService &&
    (deliveryType === 'HOME' || !!selectedPickup);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({
          productId:         i.productId,
          quantity:          i.quantity,
          asKeychain:        i.asKeychain,
          ...(i.selectedColorHex
            ? { selectedColorHex: i.selectedColorHex, selectedColorName: i.selectedColorName }
            : {}),
        })),
        guestEmail:        form.guestEmail,
        guestName:         form.guestName,
        deliveryType,
        packlinkServiceId: selectedService.serviceId,
        ...(deliveryType === 'PICKUP_POINT' && selectedPickup ? {
          pickupPointId:      selectedPickup.id,
          pickupPointName:    selectedPickup.name,
          pickupPointAddress: `${selectedPickup.address}, ${selectedPickup.zip} ${selectedPickup.city}`,
        } : {}),
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
                  autoComplete="name"
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
                  autoComplete="email"
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
                  autoComplete="name"
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
                  autoComplete="address-line1"
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
                  autoComplete="address-line2"
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
                    autoComplete="address-level2"
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
                    autoComplete="postal-code"
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
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
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

        {/* Envío + resumen */}
        <div className="flex flex-col gap-6">
          {/* Tipo de entrega + servicio */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-3">Método de envío</h2>

            <div className="flex gap-2 mb-4">
              {([
                { value: 'HOME',         label: 'Domicilio' },
                { value: 'PICKUP_POINT', label: 'Punto de recogida' },
              ] as { value: DeliveryType; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeliveryType(value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    deliveryType === value
                      ? 'bg-brand-green text-white border-brand-green'
                      : 'bg-white text-brand-dark border-brand-greenLight hover:bg-brand-cream'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!form.country || form.postalCode.trim().length < 4 ? (
              <p className="text-sm text-gray-500">Introduce código postal y país para calcular los envíos disponibles.</p>
            ) : quoteLoading ? (
              <p className="text-sm text-gray-500">Calculando tarifas…</p>
            ) : quoteError ? (
              <p className="text-sm text-red-600">{quoteError}</p>
            ) : visibleServices.length === 0 ? (
              <p className="text-sm text-amber-700">No hay servicios {deliveryType === 'PICKUP_POINT' ? 'con punto de recogida' : 'a domicilio'} disponibles para esa dirección.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(showAllServices ? visibleServices : visibleServices.slice(0, 3)).map((s) => (
                  <label
                    key={s.serviceId}
                    className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-2 cursor-pointer text-sm ${
                      selectedService?.serviceId === s.serviceId
                        ? 'border-brand-green bg-brand-cream'
                        : 'border-brand-greenLight hover:bg-brand-cream/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="packlinkService"
                        checked={selectedService?.serviceId === s.serviceId}
                        onChange={() => setSelectedService(s)}
                        className="w-4 h-4 accent-brand-green"
                      />
                      <div>
                        <div className="font-medium text-brand-dark">{s.carrierName}</div>
                        <div className="text-xs text-gray-500">
                          {s.serviceName}{s.transitDays ? ` · ${s.transitDays} días` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-brand-dark">{s.priceTotal.toFixed(2)} €</span>
                  </label>
                ))}
                {visibleServices.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllServices((v) => !v)}
                    className="text-sm text-brand-green hover:underline text-left mt-1"
                  >
                    {showAllServices
                      ? 'Mostrar menos'
                      : `Ver ${visibleServices.length - 3} opciones más`}
                  </button>
                )}
              </div>
            )}

            {deliveryType === 'PICKUP_POINT' && selectedService && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-brand-dark mb-1">Punto de recogida</label>
                {pickupLoading ? (
                  <p className="text-sm text-gray-500">Buscando puntos cercanos…</p>
                ) : pickupError ? (
                  <p className="text-sm text-red-600">{pickupError}</p>
                ) : pickupPoints.length === 0 ? (
                  <p className="text-sm text-amber-700">No se encontraron puntos para este transportista. Prueba con otro servicio.</p>
                ) : (
                  <select
                    required
                    value={selectedPickup?.id ?? ''}
                    onChange={(e) => setSelectedPickup(pickupPoints.find((p) => p.id === e.target.value) ?? null)}
                    className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                  >
                    <option value="">Selecciona un punto…</option>
                    {pickupPoints.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.address}, {p.zip} {p.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </section>

          {/* Resumen */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Resumen</h2>

            <div className="flex flex-col gap-2 mb-4">
              {items.map((item) => (
                <div key={`${item.productId}_${item.asKeychain}_${item.selectedColorHex ?? ''}`} className="flex justify-between text-sm">
                  <span className="text-brand-dark flex items-center gap-1.5">
                    {item.name}{item.asKeychain ? ' (llavero)' : ''}
                    {item.selectedColorHex && (
                      <>
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.selectedColorHex }}
                        />
                        <span className="text-xs text-gray-500">{item.selectedColorName}</span>
                      </>
                    )} × {item.quantity}
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
            disabled={submitting || !canSubmit}
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
