import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import AffiliateProgram from './pages/AffiliateProgram.jsx';
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
import SecretAdminUsers from './pages/SecretAdmin/AdminUsers2';
import SecretAdminOrders from './pages/SecretAdmin/AdminOrders';
import SecretAdminProducts from './pages/SecretAdmin/AdminProducts';
import SecretAdminTransactions from './pages/SecretAdmin/AdminTransactions2';
import SecretAdminSupport from './pages/SecretAdmin/AdminSupport';
import SecretAdminSettings from './pages/SecretAdmin/AdminSettings';
import SecretAdminReferrals from './pages/SecretAdmin/AdminReferrals';
import SecretAdminAffiliates from './pages/SecretAdmin/AdminAffiliates';
import SecretAdminNotifications from './pages/SecretAdmin/AdminNotifications';
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
import Mining2 from './pages/Dashboard/Mining';
import Tasks from './pages/Dashboard/tasks';
import Referrals from './pages/Dashboard/Referrals';
import Wallet from './pages/Dashboard/Wallet';
import Support from './pages/Dashboard/Support';
import SettingsFull from './pages/Dashboard/SettingsFull';
import Profile from './pages/Dashboard/Profile';
function PublicLayout() {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/phone-signup';
    return (_jsxs("div", { className: "min-h-screen flex flex-col", children: [!isHome && _jsx(Header, {}), _jsx("main", { className: "flex-1", children: _jsx(Outlet, {}) }), !isHome && !isAuthRoute && _jsx(Footer, {})] }));
}
function App() {
    return (_jsxs(Routes, { children: [_jsxs(Route, { element: _jsx(PublicLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: _jsx(Signup, {}) }), _jsx(Route, { path: "/phone-signup", element: _jsx(PhoneSignup, {}) }), _jsx(Route, { path: "/otp", element: _jsx(Otp, {}) })] }), _jsxs(Route, { element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, {}) }), children: [_jsx(Route, { path: "/dashboard", element: _jsx(DashboardHome, {}) }), _jsx(Route, { path: "/commission", element: _jsx(Commission, {}) }), _jsx(Route, { path: "/orders", element: _jsx(Orders, {}) }), _jsx(Route, { path: "/orders/:orderId/invoice", element: _jsx(OrderInvoice, {}) }), _jsx(Route, { path: "/mining", element: _jsx(Mining2, {}) }), _jsx(Route, { path: "/dashboard/tasks", element: _jsx(Tasks, {}) }), _jsx(Route, { path: "/referrals", element: _jsx(Referrals, {}) }), _jsx(Route, { path: "/wallet", element: _jsx(Wallet, {}) }), _jsx(Route, { path: "/affiliate-program", element: _jsx(AffiliateProgram, {}) }), _jsx(Route, { path: "/affiliate-program/info", element: _jsx(AffiliateProgramInfo, {}) }), _jsx(Route, { path: "/affiliate-dashboard", element: _jsx(AffiliateDashboard, {}) }), _jsx(Route, { path: "/support", element: _jsx(Support, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsFull, {}) }), _jsx(Route, { path: "/dashboard/profile", element: _jsx(Profile, {}) }), _jsx(Route, { path: "/dashboard/digital-products", element: _jsx(DigitalProducts, {}) })] }), _jsx(Route, { path: "/secret-admin/login", element: _jsx(AdminLogin, {}) }), _jsx(Route, { path: "/secret-admin/invite/:token", element: _jsx(AdminInviteAccept, {}) }), _jsxs(Route, { element: _jsx(AdminProtectedRoute, { children: _jsx(SecretAdminLayout, {}) }), children: [_jsx(Route, { path: "/secret-admin", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/secret-admin/users", element: _jsx(SecretAdminUsers, {}) }), _jsx(Route, { path: "/secret-admin/orders", element: _jsx(SecretAdminOrders, {}) }), _jsx(Route, { path: "/secret-admin/products", element: _jsx(SecretAdminProducts, {}) }), _jsx(Route, { path: "/secret-admin/transactions", element: _jsx(SecretAdminTransactions, {}) }), _jsx(Route, { path: "/secret-admin/referrals", element: _jsx(SecretAdminReferrals, {}) }), _jsx(Route, { path: "/secret-admin/affiliates", element: _jsx(SecretAdminAffiliates, {}) }), _jsx(Route, { path: "/secret-admin/support", element: _jsx(SecretAdminSupport, {}) }), _jsx(Route, { path: "/secret-admin/notifications", element: _jsx(SecretAdminNotifications, {}) }), _jsx(Route, { path: "/secret-admin/settings", element: _jsx(SecretAdminSettings, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }));
}
export default App;
