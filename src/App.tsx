import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import AffiliateProgram from './pages/AffiliateProgram';
import OrderInvoice from './pages/Dashboard/OrderInvoice';
import Home from './pages/Home';
import AffiliateProgramInfo from './pages/AffiliateProgramInfo';
import AffiliateDashboard from './pages/AffiliateDashboard';

// Secret Admin Panel
import AdminProtectedRoute from './components/AdminProtectedRoute';
import SecretAdminLayout from './pages/SecretAdmin/SecretAdminLayout';
import AdminLogin from './pages/SecretAdmin/AdminLogin';
import AdminInviteAccept from './pages/SecretAdmin/AdminInviteAccept';
import AdminDashboard from './pages/SecretAdmin/AdminDashboard';
import SecretAdminUsers from './pages/SecretAdmin/AdminUsersEnhanced';
import AdminUserRanks from './pages/SecretAdmin/AdminUserRanks';
import SecretAdminOrders from './pages/SecretAdmin/AdminOrders';
import SecretAdminProducts from './pages/SecretAdmin/AdminProductsEnhanced';
import SecretAdminTransactions from './pages/SecretAdmin/AdminTransactionsEnhanced';
import AdminDepositRequests from './pages/SecretAdmin/AdminDepositRequests';
import AdminWithdrawalRequests from './pages/SecretAdmin/AdminWithdrawalRequests';
import SecretAdminSupport from './pages/SecretAdmin/AdminServiceRequestsEnhanced';
import AdminSupportRequests from './pages/SecretAdmin/AdminSupportRequests';
import AdminServiceManage from './pages/SecretAdmin/AdminServiceManage';
import SecretAdminSettings from './pages/SecretAdmin/AdminSettings';
import SecretAdminReferrals from './pages/SecretAdmin/AdminReferrals';
import SecretAdminAffiliates from './pages/SecretAdmin/AdminAffiliates';
import SecretAdminNotifications from './pages/SecretAdmin/AdminNotifications';
import AdminDLXListing from './pages/SecretAdmin/AdminDLXListing';
import AdminReviews from './pages/SecretAdmin/AdminReviews';

// Public pages
// Removed public pages: Exchanges, Pricing, Tutorials, Docs, Blogs, Apply
import AboutUs from './pages/AboutUs';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Otp from './pages/Otp';
import PhoneSignup from './pages/PhoneSignup';
import GoogleReferralSignup from './pages/GoogleReferralSignup';

// Dashboard pages
import DashboardHome from './pages/Dashboard/DashboardHome';
import Commission from './pages/Dashboard/Commission';
import Orders from './pages/Dashboard/Orders';
import OrdersEnhanced from './pages/Dashboard/OrdersEnhanced';
import Mining2 from './pages/Dashboard/Mining';
import Tasks from './pages/Dashboard/tasks';
import Referrals from './pages/Dashboard/Referrals';
import Wallet from './pages/Dashboard/Wallet';
import Support from './pages/Dashboard/Support';
import SettingsFull from './pages/Dashboard/SettingsFull';
import Profile from './pages/Dashboard/Profile';

// Database & Marketing pages
import DatabaseMarketing from './pages/DatabaseMarketing';
import DatabaseCategories from './pages/DatabaseCategories';
import BuyDatabase from './pages/BuyDatabase';
import MarketingSoftware from './pages/MarketingSoftware';
import WhatsAppDashboard from './pages/WhatsAppDashboard';
import OrderData from './pages/OrderData';
import AdminDatabaseRequests from './pages/AdminDatabaseRequests';
import WorkWithUs from './pages/WorkWithUs';
import AdminApplicants from './pages/AdminApplicants';
import DLXListing from './pages/DLXListing';

function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className="min-h-screen flex flex-col">
      {!isHome && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        {/* Public pages */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Route>

      {/* Authentication pages - no header/footer */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/phone-signup" element={<PhoneSignup />} />
        <Route path="/google-referral-signup" element={<GoogleReferralSignup />} />
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
        <Route path="/orders" element={<OrdersEnhanced />} />
        <Route path="/orders/:orderId/invoice" element={<OrderInvoice />} />
        <Route path="/mining" element={<Mining2 />} />
        <Route path="/dashboard/tasks" element={<Tasks />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/affiliate-program" element={<AffiliateProgram />} />
        <Route path="/affiliate-program/info" element={<AffiliateProgramInfo />} />
        <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
        <Route path="/support" element={<Support />} />
        <Route path="/settings" element={<SettingsFull />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/database-marketing" element={<DatabaseMarketing />} />
        <Route path="/database-marketing/categories" element={<DatabaseCategories />} />
        <Route path="/database-marketing/buy-database" element={<BuyDatabase />} />
        <Route path="/database-marketing/marketing-software" element={<MarketingSoftware />} />
        <Route path="/database-marketing/whatsapp-dashboard" element={<WhatsAppDashboard />} />
        <Route path="/database-marketing/order-data" element={<OrderData />} />
        <Route path="/work-with-us" element={<WorkWithUs />} />
        <Route path="/dlx-listing" element={<DLXListing />} />
        <Route path="/about" element={<AboutUs />} />
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
        <Route path="/secret-admin/user-ranks" element={<AdminUserRanks />} />
        <Route path="/secret-admin/orders" element={<SecretAdminOrders />} />
        <Route path="/secret-admin/support-requests" element={<AdminSupportRequests />} />
        <Route path="/secret-admin/products" element={<SecretAdminProducts />} />
        <Route path="/secret-admin/transactions" element={<SecretAdminTransactions />} />
        <Route path="/secret-admin/transactions/deposit-requests" element={<AdminDepositRequests />} />
        <Route path="/secret-admin/transactions/withdrawal-requests" element={<AdminWithdrawalRequests />} />
        <Route path="/secret-admin/database-requests" element={<AdminDatabaseRequests />} />
        <Route path="/secret-admin/applicants" element={<AdminApplicants />} />
        <Route path="/secret-admin/referrals" element={<SecretAdminReferrals />} />
        <Route path="/secret-admin/affiliates" element={<SecretAdminAffiliates />} />
        <Route path="/secret-admin/support" element={<SecretAdminSupport />} />
        <Route path="/secret-admin/notifications" element={<SecretAdminNotifications />} />
        <Route path="/secret-admin/service-requests" element={<SecretAdminSupport />} />
        <Route path="/secret-admin/service-requests/manage" element={<AdminServiceManage />} />
        <Route path="/secret-admin/dlx-listing" element={<AdminDLXListing />} />
        <Route path="/secret-admin/reviews" element={<AdminReviews />} />
        <Route path="/secret-admin/settings" element={<SecretAdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;