import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateProfile } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const INPUT_CLASS = 'w-full border border-brand-greenLight rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    name:           user?.name           ?? '',
    email:          user?.email          ?? '',
    addressName:    user?.addressName    ?? '',
    addressStreet:  user?.addressStreet  ?? '',
    addressStreet2: user?.addressStreet2 ?? '',
    addressCity:    user?.addressCity    ?? '',
    addressPostal:  user?.addressPostal  ?? '',
    addressCountry: user?.addressCountry ?? '',
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-3xl font-bold text-brand-dark mb-3">Tu perfil</h1>
          <p className="text-gray-500 mb-6">Inicia sesión para ver y editar tus datos y consultar tus pedidos.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-brand-green text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-dark transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await updateProfile({
        name:           form.name           || null,
        email:          form.email          || undefined,
        addressName:    form.addressName    || null,
        addressStreet:  form.addressStreet  || null,
        addressStreet2: form.addressStreet2 || null,
        addressCity:    form.addressCity    || null,
        addressPostal:  form.addressPostal  || null,
        addressCountry: form.addressCountry || null,
      });
      updateUser(updated);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-brand-dark">Mi perfil</h1>
        <Link
          to="/mis-pedidos"
          className="inline-flex items-center justify-center rounded-xl border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green hover:text-white transition-colors"
        >
          Ver mis pedidos
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Datos personales */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-dark mb-4">Datos personales</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Nombre
              </label>
              <input type="text" name="name" required value={form.name} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Correo electrónico</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange} className={INPUT_CLASS} />
            </div>
          </div>
        </section>

        {/* Dirección por defecto */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-dark mb-1">Dirección de envío por defecto</h2>
          <p className="text-xs text-gray-400 mb-4">Se usará para pre-rellenar el checkout en tus pedidos</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Nombre del destinatario</label>
              <input type="text" name="addressName" value={form.addressName} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Calle y número</label>
              <input type="text" name="addressStreet" value={form.addressStreet} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Escalera, piso, puerta <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input type="text" name="addressStreet2" value={form.addressStreet2} onChange={handleChange} placeholder="Ej: 3º izquierda" className={INPUT_CLASS} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Ciudad</label>
                <input type="text" name="addressCity" value={form.addressCity} onChange={handleChange} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Código postal</label>
                <input type="text" name="addressPostal" value={form.addressPostal} onChange={handleChange} className={INPUT_CLASS} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">País</label>
              <input type="text" name="addressCountry" value={form.addressCountry} onChange={handleChange} className={INPUT_CLASS} />
            </div>
          </div>
        </section>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}
        {success && (
          <p className="text-brand-green text-sm bg-green-50 rounded-xl px-4 py-3">Perfil actualizado correctamente</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-green text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
