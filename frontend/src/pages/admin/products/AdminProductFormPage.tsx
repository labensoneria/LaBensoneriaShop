import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import LoadingRipple from '../../../components/LoadingRipple';
import {
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminUploadImages,
  adminDeleteImage,
  adminAddProductColor,
  adminDeleteProductColor,
} from '../../../api/adminProducts';
import type { Product } from '../../../types';

interface FormState {
  name: string;
  description: string;
  price: string;
  convertibleToKeychain: boolean;
  stock: string;
  discountPercent: string;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  price: '',
  convertibleToKeychain: false,
  stock: '',
  discountPercent: '',
};

export default function AdminProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [product, setProduct] = useState<Product | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newColorHex, setNewColorHex] = useState('#7FAF8A');
  const [newColorName, setNewColorName] = useState('');
  const [colorError, setColorError] = useState<string | null>(null);
  const [colorBusy, setColorBusy] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      setProduct(null);
      setForm(EMPTY);
      return;
    }

    let ignore = false;

    async function loadProduct() {
      setLoading(true);
      setError(null);

      try {
        const found = await adminGetProduct(id!);

        if (ignore) return;

        setProduct(found);
        setForm({
          name: found.name,
          description: found.description ?? '',
          price: found.price,
          convertibleToKeychain: found.convertibleToKeychain,
          stock: found.stock !== null && found.stock !== undefined ? String(found.stock) : '',
          discountPercent: found.discountPercent !== null && found.discountPercent !== undefined ? String(found.discountPercent) : '',
        });
      } catch (err: unknown) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  async function handleAddColor() {
    if (!product) return;
    setColorError(null);
    const name = newColorName.trim();
    if (!name) { setColorError('Pon un nombre al color'); return; }
    setColorBusy(true);
    try {
      const created = await adminAddProductColor(product.id, newColorHex, name);
      setProduct((prev) => prev ? { ...prev, colors: [...(prev.colors ?? []), created] } : prev);
      setNewColorName('');
    } catch (err: unknown) {
      setColorError(err instanceof Error ? err.message : 'Error');
    } finally {
      setColorBusy(false);
    }
  }

  async function handleDeleteColor(colorId: string) {
    if (!product) return;
    if (!confirm('¿Eliminar este color?')) return;
    try {
      await adminDeleteProductColor(product.id, colorId);
      setProduct((prev) => prev ? { ...prev, colors: (prev.colors ?? []).filter((c) => c.id !== colorId) } : prev);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        convertibleToKeychain: form.convertibleToKeychain,
        stock: form.stock !== '' ? parseInt(form.stock, 10) : null,
        discountPercent: form.discountPercent !== '' ? parseInt(form.discountPercent, 10) : null,
      };

      const saved = isEdit && id
        ? await adminUpdateProduct(id, payload)
        : await adminCreateProduct(payload);

      if (files && files.length > 0) {
        setUploading(true);
        await adminUploadImages(saved.id, files);
      }

      navigate('/admin/productos');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/admin/productos"
        className="text-brand-green text-sm mb-6 inline-block hover:underline"
      >
        Volver a productos
      </Link>

      <h1 className="text-2xl font-bold text-brand-dark mb-6">
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      {loading && <LoadingRipple className="mb-4" />}

      {!loading && isEdit && error && !product && (
        <p className="text-red-500">{error}</p>
      )}

      {!loading && (!isEdit || product) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Descripcion <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Precio (EUR)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-dark cursor-pointer">
            <input
              type="checkbox"
              name="convertibleToKeychain"
              checked={form.convertibleToKeychain}
              onChange={handleChange}
              className="accent-brand-green"
            />
            Disponible en version llavero
          </label>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Stock <span className="text-gray-400 font-normal">(dejar vacío para no controlar)</span>
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              placeholder="Sin control de stock"
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Descuento <span className="text-gray-400 font-normal">% (1–99, dejar vacío para sin descuento)</span>
            </label>
            <input
              name="discountPercent"
              type="number"
              min="1"
              max="99"
              step="1"
              value={form.discountPercent}
              onChange={handleChange}
              placeholder="Sin descuento"
              className="w-full border border-brand-greenLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              Imagenes {isEdit ? '(anadir mas)' : ''}
            </label>
            {isEdit && product && product.images.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {product.images.map((img) => (
                  <div key={img.id} className="relative group w-16 h-16">
                    <img
                      src={img.cloudinaryUrl}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-brand-greenLight"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('¿Eliminar esta imagen?')) return;
                        try {
                          await adminDeleteImage(product.id, img.id);
                          setProduct((prev) =>
                            prev ? { ...prev, images: prev.images.filter((i) => i.id !== img.id) } : prev
                          );
                        } catch (err: unknown) {
                          alert(err instanceof Error ? err.message : 'Error');
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white text-lg font-bold"
                      title="Eliminar imagen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="text-sm text-brand-dark"
            />
          </div>

          {isEdit && product && (
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Colores disponibles</label>
              <p className="text-xs text-gray-400 mb-2">
                Si añades colores, los clientes deberán elegir uno antes de comprar. Si no, no se mostrará selector.
              </p>

              {product.colors && product.colors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.colors.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 bg-brand-cream/60 border border-brand-greenLight/40 rounded-full pl-1 pr-3 py-1"
                    >
                      <span
                        className="inline-block w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-sm text-brand-dark">{c.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{c.hex}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteColor(c.id)}
                        className="text-red-400 hover:text-red-600 text-sm leading-none"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-12 h-10 border border-brand-greenLight rounded-lg cursor-pointer"
                  aria-label="Elegir color"
                />
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Nombre (ej. Rosa pastel)"
                  className="flex-1 min-w-[140px] border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  disabled={colorBusy}
                  className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  Añadir color
                </button>
              </div>
              {colorError && <p className="text-red-500 text-sm mt-2">{colorError}</p>}
            </div>
          )}

          {isEdit === false && (
            <p className="text-xs text-gray-400">Los colores se podrán configurar al guardar el producto.</p>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-brand-green text-white rounded-lg py-2 font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {uploading
              ? 'Subiendo imagenes...'
              : saving
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Crear producto'}
          </button>
        </form>
      )}
    </div>
  );
}
