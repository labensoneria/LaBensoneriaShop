import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, selectCartTotal } from '../../store/cartStore';
import { getOrdersAvailability } from '../../api/orders';
import { getProduct } from '../../api/products';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, syncStock } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [stockAdjusted, setStockAdjusted] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const uniqueIds = [...new Set(items.map((i) => i.productId))];
    Promise.all(uniqueIds.map(getProduct))
      .then((products) => {
        let changed = false;
        products.forEach((p) => {
          const newStock = p.stock ?? null;
          const affected = items.filter((i) => i.productId === p.id);
          affected.forEach((i) => {
            if (i.stock !== newStock || (newStock !== null && i.quantity > newStock) || newStock === 0) {
              changed = true;
            }
          });
          syncStock(p.id, newStock);
        });
        if (changed) setStockAdjusted(true);
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleContinueToCheckout() {
    setAvailabilityError(null);
    setCheckingAvailability(true);

    try {
      const { ordersEnabled } = await getOrdersAvailability();

      if (!ordersEnabled) {
        setAvailabilityError('Los pedidos estan temporalmente desactivados.');
        return;
      }

      navigate('/checkout');
    } catch {
      setAvailabilityError('No se pudo comprobar si los pedidos estan disponibles. Intentalo de nuevo.');
    } finally {
      setCheckingAvailability(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">Carrito vacio</p>
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Tu carrito esta vacio</h1>
        <p className="text-brand-greenLight mb-8">Explora el catalogo y anade algo que te guste.</p>
        <Link
          to="/productos"
          className="inline-block bg-brand-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-dark transition-colors"
        >
          Ver catalogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">Carrito</h1>

      {stockAdjusted && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          El stock de algunos productos ha cambiado. Tu carrito ha sido actualizado.
        </p>
      )}

      <div className="flex flex-col gap-4 mb-8">
        {items.map((item) => (
          <div
            key={`${item.productId}_${item.asKeychain}`}
            className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-xl bg-brand-cream overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">?</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-dark truncate">{item.name}</p>
              {item.asKeychain && (
                <p className="text-xs text-brand-sky">Version llavero</p>
              )}
              <p className="text-brand-green font-bold">{item.price.toFixed(2)} EUR</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.asKeychain, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-brand-cream text-brand-dark font-bold hover:bg-brand-greenLight hover:text-white transition-colors flex items-center justify-center"
                  aria-label="Reducir cantidad"
                >
                  -
                </button>
                <span className="w-6 text-center font-semibold text-brand-dark">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.asKeychain, item.quantity + 1)}
                  disabled={item.stock !== null && item.quantity >= item.stock}
                  className="w-7 h-7 rounded-full bg-brand-cream text-brand-dark font-bold hover:bg-brand-greenLight hover:text-white transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              {item.stock !== null && item.quantity >= item.stock && (
                <span className="text-xs text-brand-sky">Máx. disponible</span>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold text-brand-dark">{(item.price * item.quantity).toFixed(2)} EUR</p>
              <button
                onClick={() => removeItem(item.productId, item.asKeychain)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors mt-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between text-brand-dark mb-2">
          <span>Subtotal</span>
          <span className="font-semibold">{total.toFixed(2)} EUR</span>
        </div>

        <p className="text-sm text-gray-400 mb-6">El coste de envio se calculara en el siguiente paso.</p>

        {availabilityError && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4">
            {availabilityError}
          </p>
        )}

        <button
          type="button"
          onClick={handleContinueToCheckout}
          disabled={checkingAvailability}
          className="block w-full text-center bg-brand-green text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkingAvailability ? 'Comprobando...' : 'Continuar con el pedido'}
        </button>

        <Link
          to="/productos"
          className="block w-full text-center text-brand-green mt-3 text-sm hover:underline"
        >
          Volver a productos
        </Link>
      </div>
    </div>
  );
}
