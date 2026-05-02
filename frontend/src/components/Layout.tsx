import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useCartStore, selectCartCount } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import PopupBanner from './PopupBanner';

export default function Layout() {
  const count = useCartStore(selectCartCount);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menu al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/productos');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PopupBanner />
      {/* Green accent top bar */}
      <div className="h-1 bg-gradient-to-r from-brand-green via-brand-sky to-brand-greenLight" />
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-1.5 sm:py-3 flex items-center justify-between">
          <Link to="/productos" className="shrink-0" aria-label="La Bensoneria">
            <img src="/img/logoWeb.png" alt="La Bensoneria" className="h-14 w-auto sm:h-20" />
          </Link>

          <div className="flex items-center gap-2">
            {/* Menu de usuario */}
            {user && !user.isAdmin ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-dark hover:bg-brand-cream transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.name ?? user.email}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <Link
                      to="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-cream transition-colors"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      to="/mis-pedidos"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-cream transition-colors"
                    >
                      Mis pedidos
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm text-brand-dark hover:text-brand-green transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-cream"
                aria-label="Iniciar sesion"
                title="Iniciar sesion"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}

            {/* Ayuda */}
            <Link
              to="/help"
              className="p-2 text-brand-dark hover:text-brand-green transition-colors"
              aria-label="Preguntas frecuentes"
              title="Preguntas frecuentes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </Link>

            {/* Carrito */}
            <Link
              to="/carrito"
              className="relative p-2 text-brand-dark hover:text-brand-green transition-colors"
              aria-label={`Carrito (${count} articulos)`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-green text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-brand-greenLight/30 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-dark/60">
          <div className="flex items-center gap-2">
            <img src="/img/logoWeb.png" alt="La Bensoneria" className="h-12 w-auto opacity-70" />
          </div>

          <Link to="/help" className="text-xs text-brand-dark/50 hover:text-brand-green transition-colors">
            Preguntas frecuentes
          </Link>

          <ul className="social-links example-2">
            <li className="icon-content">
              <a
                href="https://www.instagram.com/la_bensoneria/"
                aria-label="Instagram de La Bensoneria"
                data-social="instagram"
                target="_blank"
                rel="noreferrer"
              >
                <div className="filled" />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5Zm8.75 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 6.5A5.5 5.5 0 1 1 6.5 12 5.51 5.51 0 0 1 12 6.5Zm0 1.5A4 4 0 1 0 16 12a4 4 0 0 0-4-4Z"
                  />
                </svg>
              </a>
              <div className="tooltip">@la_bensoneria</div>
            </li>
            <li className="icon-content">
              <a
                href="https://www.tiktok.com/@la_bensoneria"
                aria-label="TikTok de La Bensoneria"
                data-social="tiktok"
                target="_blank"
                rel="noreferrer"
              >
                <div className="filled" />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M14.5 3c.38 1.82 1.47 3.28 3.2 4.03 1.03.45 2.02.57 2.3.59v3.15a8.58 8.58 0 0 1-3.97-1.16v5.5a6.11 6.11 0 1 1-6.11-6.11c.2 0 .39.01.58.03v3.18a2.93 2.93 0 1 0 2.35 2.88V3h1.65Z"
                  />
                </svg>
              </a>
              <div className="tooltip">@la_bensoneria</div>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

