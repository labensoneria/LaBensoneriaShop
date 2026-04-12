import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const GROUP_INPUT_CLASS =
  'h-10 w-full border-0 border-b border-b-[rgba(128,128,128,0.3)] px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0 last:border-b-0';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    addressName: '',
    addressStreet: '',
    addressStreet2: '',
    addressCity: '',
    addressPostal: '',
    addressCountry: 'España',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        name: form.name,
        ...(form.addressName ? { addressName: form.addressName } : {}),
        ...(form.addressStreet ? { addressStreet: form.addressStreet } : {}),
        ...(form.addressStreet2 ? { addressStreet2: form.addressStreet2 } : {}),
        ...(form.addressCity ? { addressCity: form.addressCity } : {}),
        ...(form.addressPostal ? { addressPostal: form.addressPostal } : {}),
        ...(form.addressCountry ? { addressCountry: form.addressCountry } : {}),
      };
      const { token, user } = await register(payload);
      setAuth(token, user);
      navigate('/productos', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[15px] bg-white/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(74,124,89,0.14)]">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center">
          <div className="flex flex-col gap-4">
            <span className="text-[1.6rem] font-extrabold text-brand-dark">Crear cuenta</span>
            <p className="text-[1.05rem] text-[#7C6666]">Regístrate y deja lista tu información para comprar más rápido.</p>
          </div>

          <section className="w-full text-left">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-green">Acceso</h2>
            <div className="w-full overflow-hidden rounded-lg bg-white">
              <input type="text" name="name" required placeholder="Nombre" value={form.name} onChange={handleChange} className={GROUP_INPUT_CLASS} />
              <input
                type="email"
                name="email"
                required
                placeholder="Correo electrónico"
                value={form.email}
                onChange={handleChange}
                className={GROUP_INPUT_CLASS}
              />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                className={GROUP_INPUT_CLASS}
              />
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Confirmar contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                className={GROUP_INPUT_CLASS}
              />
            </div>
          </section>

          <section className="w-full text-left">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-green">Dirección de envío por defecto</h2>
            <p className="mb-3 text-xs text-[#7C6666]">Opcional, podrás cambiarla más tarde desde tu perfil.</p>
            <div className="w-full overflow-hidden rounded-lg bg-white">
              <input
                type="text"
                name="addressName"
                placeholder="Nombre del destinatario"
                value={form.addressName}
                onChange={handleChange}
                className={GROUP_INPUT_CLASS}
              />
              <input
                type="text"
                name="addressStreet"
                placeholder="Calle y número"
                value={form.addressStreet}
                onChange={handleChange}
                className={GROUP_INPUT_CLASS}
              />
              <input
                type="text"
                name="addressStreet2"
                placeholder="Escalera, piso, puerta"
                value={form.addressStreet2}
                onChange={handleChange}
                className={GROUP_INPUT_CLASS}
              />
              <div className="grid grid-cols-2">
                <input
                  type="text"
                  name="addressCity"
                  placeholder="Ciudad"
                  value={form.addressCity}
                  onChange={handleChange}
                  className="h-10 w-full border-0 border-b border-r border-b-[rgba(128,128,128,0.3)] border-r-[rgba(128,128,128,0.3)] px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0"
                />
                <input
                  type="text"
                  name="addressPostal"
                  placeholder="Código postal"
                  value={form.addressPostal}
                  onChange={handleChange}
                  className="h-10 w-full border-0 border-b border-b-[rgba(128,128,128,0.3)] px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0"
                />
              </div>
              <input
                type="text"
                name="addressCountry"
                placeholder="País"
                value={form.addressCountry}
                onChange={handleChange}
                className="h-10 w-full border-0 px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0"
              />
            </div>
          </section>

          {error && (
            <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-10 w-full overflow-hidden rounded-[25px] border-0 bg-brand-green px-4 py-2 text-base font-semibold text-white transition-all duration-300 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="bg-[#e8f0eb] px-4 py-4 text-center text-base">
          <p className="text-[#5F5656]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-extrabold text-brand-green transition-colors duration-300 hover:text-brand-dark">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
