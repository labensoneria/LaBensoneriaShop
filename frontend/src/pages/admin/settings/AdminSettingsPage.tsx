import { useState, useEffect } from 'react';
import { getAdminSettings, updateAdminSettings } from '../../../api/adminSettings';
import { getAdminPopups, createPopup, deactivatePopup } from '../../../api/popup';
import LoadingRipple from '../../../components/LoadingRipple';
import type { AppSettingsMap } from '../../../api/adminSettings';
import type { PopupMessage } from '../../../api/popup';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettingsMap | null>(null);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function load() {
    Promise.all([getAdminSettings(), getAdminPopups()])
      .then(([s, p]) => {
        setSettings(s);
        setPopups(p);
      })
      .catch((err: Error) => setLoadError(err.message));
  }

  useEffect(load, []);

  async function handleToggleOrders() {
    if (!settings) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateAdminSettings({
        ordersEnabled: settings.ordersEnabled === 'true' ? 'false' : 'true',
      });
      setSettings(updated);
      setSaveMsg('Guardado');
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }

  async function handleNewProductDaysChange(val: string) {
    if (!settings) return;
    setSettings({ ...settings, newProductDays: val });
  }

  async function handleSaveNewProductDays() {
    if (!settings) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateAdminSettings({ newProductDays: settings.newProductDays });
      setSettings(updated);
      setSaveMsg('Guardado');
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }

  async function handleSaveGlobalDiscount() {
    if (!settings) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateAdminSettings({ globalDiscountPercent: settings.globalDiscountPercent });
      setSettings(updated);
      setSaveMsg('Guardado');
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }

  async function handleSaveShipping() {
    if (!settings) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateAdminSettings({
        shipping_peninsular:    settings.shipping_peninsular,
        shipping_baleares:      settings.shipping_baleares,
        shipping_canarias:      settings.shipping_canarias,
        shipping_international: settings.shipping_international,
      });
      setSettings(updated);
      setSaveMsg('Guardado');
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }

  async function handleCreatePopup(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setCreating(true);
    try {
      await createPopup(newContent.trim());
      setNewContent('');
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear mensaje');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivatePopup(id);
      setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, active: false } : p)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  if (loadError) return <div className="max-w-3xl mx-auto px-4 py-8 text-red-500">{loadError}</div>;
  if (!settings) return <div className="max-w-3xl mx-auto px-4 py-8"><LoadingRipple /></div>;

  const ordersOn = settings.ordersEnabled === 'true';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Ajustes</h1>

      {saveMsg && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">{saveMsg}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-brand-dark mb-4">Pedidos</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-dark">Aceptar pedidos</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {ordersOn ? 'La tienda acepta pedidos actualmente.' : 'Los pedidos estan desactivados.'}
            </p>
          </div>
          <button
            onClick={handleToggleOrders}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              ordersOn ? 'bg-brand-green' : 'bg-gray-300'
            }`}
            aria-label="Activar/desactivar pedidos"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                ordersOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-brand-dark mb-4">Etiqueta "Nuevo"</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-dark mb-1">Dias desde publicacion</p>
            <p className="text-xs text-gray-400">
              Los productos publicados en los ultimos N dias se muestran como "Nuevo".
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={settings.newProductDays}
              onChange={(e) => handleNewProductDaysChange(e.target.value)}
              className="w-20 border border-brand-greenLight rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <button
              onClick={handleSaveNewProductDays}
              disabled={saving}
              className="px-3 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-brand-dark mb-4">Descuento global</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-dark mb-1">Descuento para todos los productos (%)</p>
            <p className="text-xs text-gray-400">
              Se aplica a productos sin descuento propio. 0 = sin descuento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={99}
              value={settings.globalDiscountPercent}
              onChange={(e) => setSettings({ ...settings, globalDiscountPercent: e.target.value })}
              className="w-20 border border-brand-greenLight rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <button
              onClick={handleSaveGlobalDiscount}
              disabled={saving}
              className="px-3 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-brand-dark mb-4">Tarifas de envío (€)</h2>
        <div className="flex flex-col gap-3">
          {(
            [
              { key: 'shipping_peninsular',    label: 'Península' },
              { key: 'shipping_baleares',       label: 'Islas Baleares' },
              { key: 'shipping_canarias',       label: 'Islas Canarias, Ceuta y Melilla' },
              { key: 'shipping_international',  label: 'Internacional (UE)' },
            ] as { key: keyof typeof settings; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-brand-dark">{label}</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="w-24 border border-brand-greenLight rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          ))}
          <div className="flex justify-end mt-1">
            <button
              onClick={handleSaveShipping}
              disabled={saving}
              className="px-3 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              Guardar tarifas
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-brand-dark mb-4">Mensaje emergente</h2>
        <p className="text-xs text-gray-400 mb-4">
          El mensaje activo se muestra a los visitantes una vez por dia. Solo puede haber uno activo a la vez.
        </p>

        <form onSubmit={handleCreatePopup} className="mb-6">
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Nuevo mensaje
          </label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: Nuevos llaveros disponibles. Envio gratis este fin de semana."
            className="w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{newContent.length}/500</span>
            <button
              type="submit"
              disabled={creating || !newContent.trim()}
              className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {creating ? 'Publicando...' : 'Publicar mensaje'}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          {popups.length === 0 && (
            <p className="text-sm text-gray-400">No hay mensajes anteriores.</p>
          )}
          {popups.map((popup) => (
            <div
              key={popup.id}
              className={`rounded-xl px-4 py-3 text-sm flex items-start gap-3 ${
                popup.active ? 'bg-brand-sky/10 border border-brand-sky/30' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                {popup.active && (
                  <span className="inline-block px-1.5 py-0.5 bg-brand-sky text-white text-xs rounded mr-1.5 align-middle">
                    Activo
                  </span>
                )}
                <span className={popup.active ? 'text-brand-dark font-medium' : 'text-gray-500'}>
                  {popup.content}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(popup.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                </p>
              </div>
              {popup.active && (
                <button
                  onClick={() => handleDeactivate(popup.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  Desactivar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
