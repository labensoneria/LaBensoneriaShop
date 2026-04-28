import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct } from '../../api/products';
import { createReview } from '../../api/reviews';
import ImageGallery from '../../components/ImageGallery';
import LoadingRipple from '../../components/LoadingRipple';
import StarRating from '../../components/StarRating';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import type { Product, Review } from '../../types';

function BackToCatalogLink({ className = '' }: { className?: string }) {
  return (
    <Link to="/productos" className={`cta inline-flex items-center no-underline ${className}`.trim()}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>Volver al cat&aacute;logo</span>
    </Link>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asKeychain, setAsKeychain] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  // Review form state
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(setProduct)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingRipple className="py-20" />;
  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error ?? 'Producto no encontrado'}</p>
        <BackToCatalogLink className="mx-auto" />
      </div>
    );
  }

  const price = parseFloat(product.price).toFixed(2);
  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock === 0;
  const isLowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 5;
  const avgStars = product.reviews?.length
    ? product.reviews.reduce((s, r) => s + r.stars, 0) / product.reviews.length
    : null;

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(null);
    setReviewSending(true);
    if (!product) return;
    try {
      const newReview = await createReview(product.id, {
        stars: reviewStars,
        comment: reviewComment || undefined,
      });
      // Anadir la review a la lista local sin recargar
      setProduct((prev) => (prev ? {
        ...prev,
        reviews: [newReview as Review, ...(prev.reviews ?? [])],
      } : prev));
      setReviewSent(true);
      setReviewComment('');
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : 'Error al enviar la reseña');
    } finally {
      setReviewSending(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BackToCatalogLink className="mb-6" />

      {/* Main product panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Galeria */}
          <ImageGallery images={product.images} name={product.name} />

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-brand-dark mb-2 leading-tight">{product.name}</h1>

            {avgStars !== null && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating stars={Math.round(avgStars)} />
                <span className="text-sm text-gray-500">({product.reviews?.length} reseñas)</span>
              </div>
            )}

            {/* Price tag */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-extrabold text-brand-green tracking-tight">{price}</span>
              <span className="text-xl font-semibold text-brand-green/80">&euro;</span>
            </div>

            {isOutOfStock && (
              <p className="inline-flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1 mb-4 self-start">
                No disponible
              </p>
            )}
            {isLowStock && (
              <p className="inline-flex items-center gap-1.5 text-sm text-brand-sky bg-brand-skyLight/20 rounded-full px-3 py-1 mb-4 self-start">
                {product.stock} unidad(es) disponibles
              </p>
            )}
            {product.convertibleToKeychain && (
              <p className="inline-flex items-center gap-1.5 text-sm text-brand-sky bg-brand-skyLight/20 rounded-full px-3 py-1 mb-4 self-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Disponible tambi&eacute;n en versi&oacute;n llavero
              </p>
            )}

            <p className="text-brand-dark/80 leading-relaxed mb-6">{product.description}</p>

            {/* Opcion llavero */}
            {product.convertibleToKeychain && (
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-brand-cream/60 border border-brand-greenLight/30">
                <div className="checkbox-wrapper-5">
                  <div className="check">
                    <input
                      type="checkbox"
                      id="keychain-toggle"
                      checked={asKeychain}
                      onChange={(e) => setAsKeychain(e.target.checked)}
                    />
                    <label htmlFor="keychain-toggle" />
                  </div>
                </div>
                <span className="text-sm text-brand-dark select-none cursor-pointer" onClick={() => setAsKeychain(!asKeychain)}>
                  Quiero la versi&oacute;n llavero
                </span>
              </div>
            )}

            {/* Anadir al carrito */}
            <button
              disabled={isOutOfStock}
              onClick={() => {
                if (isOutOfStock) return;
                addItem(product, asKeychain);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              className={`mt-auto w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? 'bg-gray-300 cursor-not-allowed'
                  : added
                    ? 'bg-brand-dark scale-[0.98]'
                    : 'bg-brand-green hover:bg-brand-dark hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isOutOfStock ? (
                'No disponible'
              ) : added ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Añadido al carrito!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Añadir al carrito
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resenas */}
      <section className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-brand-dark mb-4">Reseñas</h2>

        {/* Formulario de resena, solo usuarios autenticados */}
        {user && !reviewSent && (
          <form onSubmit={handleReviewSubmit} className="bg-white/60 rounded-xl p-5 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-brand-dark mb-3">Escribe tu reseña</h3>

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewStars(s)}
                  className={`text-2xl leading-none transition-colors ${s <= reviewStars ? 'text-yellow-400' : 'text-gray-300'}`}
                  aria-label={`${s} estrellas`}
                >
                  &#9733;
                </button>
              ))}
              <span className="text-sm text-gray-400 ml-2">{reviewStars} de 5</span>
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Comenta tu experiencia con el producto (opcional)"
              rows={3}
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none mb-3"
            />

            {reviewError && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2 mb-3">{reviewError}</p>
            )}

            <button
              type="submit"
              disabled={reviewSending}
              className="bg-brand-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {reviewSending ? 'Enviando...' : 'Publicar reseña'}
            </button>
          </form>
        )}

        {reviewSent && (
          <p className="text-brand-green text-sm bg-green-50 rounded-xl px-4 py-3 mb-4">
            ¡Gracias por tu reseña!
          </p>
        )}

        {!user && (
          <p className="text-sm text-gray-500 mb-4">
            <Link to="/login" className="text-brand-green hover:underline">Inicia sesi&oacute;n</Link>
            {' '}para dejar una reseña (solo si has comprado este producto)
          </p>
        )}

        {/* Lista de resenas */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="flex flex-col gap-3">
            {product.reviews.map((r) => (
              <div key={r.id} className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <StarRating stars={r.stars} />
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                {r.user?.name && (
                  <p className="text-sm font-medium text-brand-dark">{r.user.name}</p>
                )}
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Todav&iacute;a no hay reseñas para este producto.</p>
        )}
      </section>
    </div>
  );
}
