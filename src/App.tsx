import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import AffiliateProgram from './pages/AffiliateProgram.jsx';
import OrderInvoice from './pages/Dashboard/OrderInvoice';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminUserDetail from './pages/Admin/AdminUserDetail';
import AdminActivities from './pages/Admin/AdminActivities';
import AdminServices from './pages/Admin/AdminServices';
import AdminWallets from './pages/Admin/AdminWallets';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminServiceForms from './pages/Admin/AdminServiceForms';
import Home from './pages/Home';
import AffiliateProgramInfo from './pages/AffiliateProgramInfo';
import AffiliateDashboard from './pages/AffiliateDashboard';

// Secret Admin Panel
import AdminProtectedRoute from './components/AdminProtectedRoute';
import SecretAdminLayout from './pages/SecretAdmin/SecretAdminLayout';
import AdminLogin from './pages/SecretAdmin/AdminLogin';
import AdminInviteAccept from './pages/SecretAdmin/AdminInviteAccept';
import AdminDashboard from './pages/SecretAdmin/AdminDashboard';
import SecretAdminUsers from './pages/SecretAdmin/AdminUsers';
import SecretAdminOrders from './pages/SecretAdmin/AdminOrders';
import SecretAdminProducts from './pages/SecretAdmin/AdminProducts';
import SecretAdminTransactions from './pages/SecretAdmin/AdminTransactions';
import SecretAdminSupport from './pages/SecretAdmin/AdminSupport';
import SecretAdminSettings from './pages/SecretAdmin/AdminSettings';

// Public pages
// Removed public pages: Exchanges, Pricing, Tutorials, Docs, Blogs, Apply
import DigitalProducts from './pages/DigitalProducts';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Otp from './pages/Otp';
import PhoneSignup from './pages/PhoneSignup';

// Dashboard pages
import DashboardHome from './pages/Dashboard/DashboardHome';
import Commission from './pages/Dashboard/Commission';
import Orders from './pages/Dashboard/Orders';
import Mining from './pages/Dashboard/Mining';
import Referrals from './pages/Dashboard/Referrals';
import Wallet from './pages/Dashboard/Wallet';
import Support from './pages/Dashboard/Support';
import SettingsFull from './pages/Dashboard/SettingsFull';
import Profile from './pages/Dashboard/Profile';

function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/phone-signup';
  return (
    <div className="min-h-screen flex flex-col">
      {!isHome && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Hide footer on home and auth pages */}
      {!isHome && !isAuthRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        {/* Removed public routes: exchanges, pricing, tutorials, docs, blogs, apply */}
        {/* Removed public route: digital-products (dashboard-only now) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* New phone signup route */}
        <Route path="/phone-signup" element={<PhoneSignup />} />
        <Route path="/otp" element={<Otp />} />
      </Route>

      {/* Authenticated dashboard */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/commission" element={<Commission />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:orderId/invoice" element={<OrderInvoice />} />
        <Route path="/mining" element={<Mining />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/affiliate-program" element={<AffiliateProgram />} />
        <Route path="/affiliate-program/info" element={<AffiliateProgramInfo />} />
        <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
        <Route path="/support" element={<Support />} />
        <Route path="/settings" element={<SettingsFull />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/digital-products" element={<DigitalProducts />} />
      </Route>

      {/* Admin */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        <Route path="/admin/activities" element={<AdminActivities />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/forms" element={<AdminServiceForms />} />
        <Route path="/admin/wallets" element={<AdminWallets />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* Secret Admin (JWT cookie protected) */}
      <Route path="/secret-admin/login" element={<AdminLogin />} />
      <Route path="/secret-admin/invite/:token" element={<AdminInviteAccept />} />
      <Route
        element={
          <AdminProtectedRoute>
            <SecretAdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="/secret-admin" element={<AdminDashboard />} />
        <Route path="/secret-admin/users" element={<SecretAdminUsers />} />
        <Route path="/secret-admin/orders" element={<SecretAdminOrders />} />
        <Route path="/secret-admin/products" element={<SecretAdminProducts />} />
        <Route path="/secret-admin/transactions" element={<SecretAdminTransactions />} />
        <Route path="/secret-admin/support" element={<SecretAdminSupport />} />
        <Route path="/secret-admin/settings" element={<SecretAdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;