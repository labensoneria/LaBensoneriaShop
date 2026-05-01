import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminUpdateProduct, adminPermanentDeleteProduct } from '../../../api/adminProducts';
import LoadingRipple from '../../../components/LoadingRipple';
import type { Product } from '../../../types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  function loadProducts() {
    setLoading(true);
    adminGetProducts()
      .then((data) => setProducts(data.products))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProducts, []);

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await adminUpdateProduct(id, { active: !current });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !current } : p)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar permanentemente "${name}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await adminPermanentDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Productos</h1>
        <Link
          to="/admin/productos/nuevo"
          className="bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      {loading && <LoadingRipple />}
      {error   && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-cream text-brand-dark">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Precio</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Visible</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className={p.active ? '' : 'opacity-50'}>
                  <td className="px-4 py-3 font-medium text-brand-dark">{p.name}</td>
                  <td className="px-4 py-3">{parseFloat(p.price).toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    {p.stock === null || p.stock === undefined
                      ? <span className="text-gray-400">—</span>
                      : <span className={p.stock === 0 ? 'text-red-500 font-semibold' : 'text-brand-dark'}>{p.stock}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(p.id, p.active)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        p.active ? 'bg-brand-green' : 'bg-gray-300'
                      }`}
                      title={p.active ? 'Ocultar producto' : 'Mostrar producto'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          p.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link
                      to={`/admin/productos/${p.id}`}
                      className="text-brand-sky hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="text-center py-8 text-brand-greenLight">Sin productos todavía.</p>
          )}
        </div>
      )}
    </div>
  );
}
