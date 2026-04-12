import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { token, user, logout } = useAuthStore();

  if (!token || !user?.isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <nav className="bg-brand-dark text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-brand-greenLight">La Bensonería · Admin</span>
          <Link to="/admin/dashboard" className="text-sm hover:text-brand-greenLight transition-colors">
            Ventas
          </Link>
          <Link to="/admin/productos" className="text-sm hover:text-brand-greenLight transition-colors">
            Productos
          </Link>
          <Link to="/admin/pedidos" className="text-sm hover:text-brand-greenLight transition-colors">
            Pedidos
          </Link>
          <Link to="/admin/ajustes" className="text-sm hover:text-brand-greenLight transition-colors">
            Ajustes
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">{user.email}</span>
          <button onClick={logout} className="hover:text-brand-greenLight transition-colors">
            Salir
          </button>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
