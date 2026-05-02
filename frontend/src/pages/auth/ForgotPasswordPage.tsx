import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-[320px] overflow-hidden rounded-[15px] bg-white/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(74,124,89,0.14)]">
        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-8 text-center">
            <span className="text-[1.6rem] font-extrabold text-brand-dark">Correo enviado</span>
            <p className="text-sm text-[#7C6666] leading-relaxed">
              Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
            </p>
            <Link
              to="/login"
              className="mt-2 text-sm font-semibold text-brand-green hover:text-brand-dark transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center">
            <div className="flex flex-col gap-2">
              <span className="text-[1.6rem] font-extrabold text-brand-dark">¿Olvidaste tu contraseña?</span>
              <p className="text-sm text-[#7C6666] leading-relaxed">
                Introduce tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>

            <div className="my-2 w-full overflow-hidden rounded-lg bg-white">
              <input
                type="email"
                required
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {submitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <div className="bg-[#e8f0eb] px-4 py-4 text-center text-sm">
          <Link to="/login" className="text-[#5F5656] transition-colors hover:text-brand-green">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
