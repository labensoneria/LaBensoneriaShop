import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const from = (location.state as { from?: string })?.from ?? '/productos';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await login(form.email, form.password);
      setAuth(token, user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[320px] overflow-hidden rounded-[15px] bg-white/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(74,124,89,0.14)]">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center">
          <div className="flex flex-col gap-4">
            <span className="text-[1.6rem] font-extrabold text-brand-dark">Iniciar sesión</span>
            <p className="text-[1.05rem] text-[#7C6666]">Accede a tu cuenta para seguir comprando.</p>
          </div>

          <div className="my-4 w-full overflow-hidden rounded-lg bg-white">
            <input
              type="email"
              name="email"
              required
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              className="h-10 w-full border-0 border-b border-b-[rgba(128,128,128,0.3)] px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0"
            />
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              className="h-10 w-full border-0 px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0"
            />
          </div>

          {error && (
            <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-10 w-full overflow-hidden rounded-[25px] border-0 bg-brand-green px-4 py-2 text-base font-semibold text-white transition-all duration-300 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="bg-[#e8f0eb] px-4 py-4 text-center text-base">
          <p className="text-[#5F5656]">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-extrabold text-brand-green transition-colors duration-300 hover:text-brand-dark">
              Crear cuenta
            </Link>
          </p>
          <p className="mt-2 text-sm">
            <Link to="/productos" className="text-[#5F5656] transition-colors duration-300 hover:text-brand-green">
              ← Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
