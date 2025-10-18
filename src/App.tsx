import React from 'react';

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Services from './pages/Services';
import DigitalProducts from './pages/DigitalProducts';
import Mining from './pages/Mining';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Commission from './pages/Dashboard/Commission';
import Orders from './pages/Dashboard/Orders';
import Referrals from './pages/Dashboard/Referrals';
import Wallet from './pages/Dashboard/Wallet';
import Support from './pages/Dashboard/Support';
import Settings from './pages/Dashboard/Settings';
import AffiliateProgram from './pages/Dashboard/AffiliateProgram';
import Exchanges from './pages/Exchanges';
import Pricing from './pages/Pricing';
import Tutorials from './pages/Tutorials';
import Docs from './pages/Docs';
import Blogs from './pages/Blogs';
import Apply from './pages/Apply';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminUserDetail from './pages/Admin/AdminUserDetail';
import AdminActivities from './pages/Admin/AdminActivities';
import AdminServices from './pages/Admin/AdminServices';
import AdminWallets from './pages/Admin/AdminWallets';
import AdminSettings from './pages/Admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/exchanges" element={<Exchanges />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/tutorials" element={<Tutorials />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/services" element={<Services />} />
      <Route path="/digital-products" element={<DigitalProducts />} />
      <Route path="/mining" element={<Mining />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:uid" element={<AdminUserDetail />} />
        <Route path="activities" element={<AdminActivities />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="wallets" element={<AdminWallets />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      {/* Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="commission" element={<Commission />} />
        <Route path="orders" element={<Orders />} />
        <Route path="digital-products" element={<DigitalProducts />} />
        <Route path="mining" element={<Mining />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="support" element={<Support />} />
        <Route path="settings" element={<Settings />} />
        <Route path="affiliate-program" element={<AffiliateProgram />} />
      </Route>
    </Routes>
  );
}
