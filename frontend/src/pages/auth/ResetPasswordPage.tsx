import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, form.password);
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[320px] overflow-hidden rounded-[15px] bg-white/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(74,124,89,0.14)]">
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <span className="text-[1.6rem] font-extrabold text-brand-dark">Enlace no válido</span>
            <p className="text-sm text-[#7C6666]">Este enlace de restablecimiento no es válido o ha caducado.</p>
            <Link to="/olvide-contrasena" className="text-sm font-semibold text-brand-green hover:text-brand-dark transition-colors">
              Solicitar un nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[320px] overflow-hidden rounded-[15px] bg-white/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(74,124,89,0.14)]">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center">
          <div className="flex flex-col gap-2">
            <span className="text-[1.6rem] font-extrabold text-brand-dark">Nueva contraseña</span>
            <p className="text-sm text-[#7C6666]">Elige una contraseña de al menos 6 caracteres.</p>
          </div>

          <div className="my-2 w-full overflow-hidden rounded-lg bg-white">
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Nueva contraseña"
              value={form.password}
              onChange={handleChange}
              className="h-10 w-full border-0 border-b border-b-[rgba(128,128,128,0.3)] px-[15px] py-2 text-sm font-light text-brand-dark outline-none placeholder:text-[#9B8E8E] focus:ring-0"
            />
            <input
              type="password"
              name="confirm"
              required
              minLength={6}
              placeholder="Repetir contraseña"
              value={form.confirm}
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
            {submitting ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        <div className="bg-[#e8f0eb] px-4 py-4 text-center text-sm">
          <Link to="/login" className="text-[#5F5656] transition-colors hover:text-brand-green">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
