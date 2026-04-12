import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CatalogPage from './pages/catalog/CatalogPage';
import ProductPage from './pages/product/ProductPage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import OrderConfirmationPage from './pages/order/OrderConfirmationPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/profile/ProfilePage';
import MyOrdersPage from './pages/orders/MyOrdersPage';
import AdminLoginPage from './pages/admin/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminProductsPage from './pages/admin/products/AdminProductsPage';
import AdminProductFormPage from './pages/admin/products/AdminProductFormPage';
import AdminOrdersPage from './pages/admin/orders/AdminOrdersPage';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AdminSettingsPage from './pages/admin/settings/AdminSettingsPage';
import FaqPage from './pages/faq/FaqPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tienda pública (con header + carrito) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/productos" replace />} />
          <Route path="/productos" element={<CatalogPage />} />
          <Route path="/productos/:id" element={<ProductPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/mis-pedidos" element={<MyOrdersPage />} />
          <Route path="/help" element={<FaqPage />} />
        </Route>

        {/* Auth pública (sin header de tienda) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="productos" element={<AdminProductsPage />} />
          <Route path="productos/nuevo" element={<AdminProductFormPage />} />
          <Route path="productos/:id" element={<AdminProductFormPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="ajustes" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/productos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
