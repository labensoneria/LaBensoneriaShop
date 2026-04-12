import { useEffect, useState } from 'react';
import { getProducts } from '../../api/products';
import { getNewProductDays } from '../../api/adminSettings';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import type { Product, ProductSort } from '../../types';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest',     label: 'Más recientes' },
  { value: 'popular',    label: 'Más vendidos' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];

export default function CatalogPage() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [sort, setSort]               = useState<ProductSort>('newest');
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [newProductDays, setNewProductDays] = useState(14);

  useEffect(() => {
    getNewProductDays().then((d) => setNewProductDays(d.newProductDays)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProducts({ sort, page, limit: 12 })
      .then((data) => {
        setProducts(data.products);
        setPages(data.pages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sort, page]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero heading */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight mb-2">
          Nuestra colección
        </h1>
        <div className="mt-4 h-0.5 w-16 bg-gradient-to-r from-brand-green to-brand-sky rounded-full mx-auto" />
      </div>

      {/* Ordenación */}
      <div className="flex justify-end mb-6">
        <label className="flex items-center gap-2 text-sm text-brand-dark/70">
          <span>Ordenar por</span>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as ProductSort); setPage(1); }}
            className="border border-brand-greenLight/60 rounded-lg px-3 py-2 text-sm text-brand-dark bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-green shadow-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Estado — skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[20px] overflow-hidden shadow-sm">
              <div className="skeleton h-[200px] rounded-none" />
              <div className="p-4 flex flex-col gap-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-4 w-1/4 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="text-center py-20 text-red-500">{error}</div>
      )}

      {/* Grid */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🧶</p>
          <p className="text-brand-dark/60 text-lg">No hay productos disponibles todavía.</p>
        </div>
      )}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} newProductDays={newProductDays} />
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
