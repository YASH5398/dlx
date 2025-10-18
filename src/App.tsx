import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import AffiliateProgram from './components/AffiliateProgram.jsx';

// Public pages
import Home from './pages/Home';
import Exchanges from './pages/Exchanges';
import Pricing from './pages/Pricing';
import Tutorials from './pages/Tutorials';
import Docs from './pages/Docs';
import Blogs from './pages/Blogs';
import Apply from './pages/Apply';
import DigitalProducts from './pages/DigitalProducts';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Otp from './pages/Otp';

// Dashboard pages
import DashboardHome from './pages/Dashboard/DashboardHome';
import Commission from './pages/Dashboard/Commission';
import Orders from './pages/Dashboard/Orders';
import Mining from './pages/Mining';
import Referrals from './pages/Dashboard/Referrals';
import Wallet from './pages/Dashboard/Wallet';
import Support from './pages/Dashboard/Support';
import Settings from './pages/Dashboard/Settings';
import Profile from './pages/Dashboard/Profile';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/exchanges" element={<Exchanges />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/digital-products" element={<DigitalProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
        <Route path="/dashboard/commission" element={<Commission />} />
        <Route path="/dashboard/orders" element={<Orders />} />
        <Route path="/dashboard/mining" element={<Mining />} />
        <Route path="/dashboard/referrals" element={<Referrals />} />
        <Route path="/dashboard/wallet" element={<Wallet />} />
        <Route path="/dashboard/support" element={<Support />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/digital-products" element={<DigitalProducts />} />
        <Route path="/dashboard/affiliate" element={<AffiliateProgram />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;