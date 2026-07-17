import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Guards
import AdminGuard from './components/AdminGuard';

// User Pages
import SplashPage from './pages/user/SplashPage';
import Onboarding from './pages/user/Onboarding';
import Home from './pages/user/Home';
import Shop from './pages/user/Shop';
import ProductDetail from './pages/user/ProductDetail';
import Checkout from './pages/user/Checkout';
import OrderSuccess from './pages/user/OrderSuccess';
import Profile from './pages/user/Profile';
import Offline from './pages/user/Offline';
import Notifications from './pages/user/Notifications';
import StaticPage from './pages/user/StaticPage';

// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import CategoriesCoupons from './pages/admin/CategoriesCoupons';
import StoreSettings from './pages/admin/Settings';
import HomepageContentEditor from './pages/admin/HomepageContentEditor';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Transient Entry Routes */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/offline" element={<Offline />} />

            {/* User Storefront Routes (Layout wrapped) */}
            <Route element={<UserLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/info/:pageId" element={<StaticPage />} />
            </Route>

            {/* Auth Flows */}
            <Route path="/auth">
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="reset" element={<ResetPassword />} />
            </Route>

            {/* Admin Management (Protected) */}
            <Route 
              path="/admin" 
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="orders" element={<ManageOrders />} />
              <Route path="coupons" element={<CategoriesCoupons />} />
              <Route path="settings" element={<StoreSettings />} />
              <Route path="homepage-editor" element={<HomepageContentEditor />} />
            </Route>

            {/* Fallback to root (Splash check redirects) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

