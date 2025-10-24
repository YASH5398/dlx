import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';
/**
 * Header
 * - Public: shows marketing links + Login/Signup
 * - Logged-in: shows dashboard-style menu links with user avatar + Logout
 */
export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { isAuthenticated, user, logout } = useUser();
    const { approved } = useAffiliateApproval();
    const initials = (user?.name || 'User')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const publicLinks = [
        { to: '/', label: 'Home' },
    ];
    const dashboardLinks = [
        { label: "Overview", to: "/dashboard" },
        { label: "Orders", to: "/orders" },
        { label: "Mining", to: "/mining" },
        { label: "Wallet", to: "/wallet" },
        { label: approved ? "Affiliate Dashboard" : "Affiliate Program", to: approved ? "/affiliate-dashboard" : "/affiliate-program" },
        { label: "Commission", to: "/commission" },
        { label: "Referrals", to: "/referrals" },
        { label: "Digital Products", to: "/dashboard/digital-products" },
        { label: "Support", to: "/support" },
        { label: "Settings", to: "/settings" },
    ];
    const desktopLinkClass = isAuthenticated
        ? (args) => (args.isActive ? 'menu-link-active' : 'menu-link')
        : (args) => (args.isActive ? 'text-white font-semibold' : 'text-white/80 hover:text-white transition');
    const mobileLinkClass = isAuthenticated
        ? (args) => (args.isActive ? 'menu-link-active' : 'menu-link')
        : (args) => (args.isActive ? 'text-white font-semibold' : 'text-white/90 hover:text-white rounded-lg px-3 py-2 bg-white/10 border border-white/20');
    const links = isAuthenticated ? dashboardLinks : publicLinks;
    return (_jsxs("header", { className: "sticky top-0 z-40 navbar-gradient backdrop-blur-xl border-b border-white/10", children: [_jsxs("div", { className: "container-padded flex h-16 items-center justify-between text-white", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx("span", { className: "h-8 w-8 rounded bg-gradient-to-r from-[#7c3aed] to-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.35)]" }), _jsx("span", { className: "font-bold text-lg", children: "DigiLinex" })] }), _jsx("nav", { className: "hidden md:flex items-center gap-3 text-sm", children: links.map((l) => (_jsx(NavLink, { to: l.to, className: desktopLinkClass, children: l.label }, l.to))) }), _jsxs("div", { className: "flex items-center gap-3", children: [!isAuthenticated ? (!isHome ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/login", className: "text-sm font-semibold text-white/90 hover:text-white", children: "Login" }), _jsx(Link, { to: "/signup", className: "hidden sm:inline-flex items-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_12px_rgba(255,255,255,0.25)] hover:bg-white/20", children: "Sign Up" })] })) : null) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hidden sm:flex items-center gap-2", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm font-semibold", children: user?.name || 'User' }), _jsx("div", { className: "text-xs text-gray-400", children: user?.email || '' })] }), _jsx("div", { className: "h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-semibold", children: initials })] }), _jsx("button", { className: "inline-flex items-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20", onClick: async () => {
                                            await logout();
                                            navigate('/login');
                                        }, children: "Logout" })] })), _jsxs("button", { "aria-label": "Toggle menu", className: "md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 border border-white/20", onClick: () => setMobileOpen((v) => !v), children: [_jsx("span", { className: "sr-only", children: "Open menu" }), _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M4 7h16M4 12h16M4 17h16", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round" }) })] })] })] }), mobileOpen && (_jsx("div", { className: "md:hidden border-t border-white/10 bg-white/5 backdrop-blur-xl", children: _jsx("div", { className: "container-padded py-4 space-y-3", children: _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [links.map((l) => (_jsx(NavLink, { to: l.to, onClick: () => setMobileOpen(false), className: mobileLinkClass, children: l.label }, l.to))), isAuthenticated ? (_jsx("button", { onClick: async () => { await logout(); setMobileOpen(false); navigate('/login'); }, className: "rounded-xl px-3 py-2 bg-red-500 text-white font-semibold", children: "Logout" })) : (!isHome ? (_jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx(Link, { to: "/login", onClick: () => setMobileOpen(false), className: "flex-1 text-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white", children: "Login" }), _jsx(Link, { to: "/signup", onClick: () => setMobileOpen(false), className: "flex-1 text-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white", children: "Sign Up" })] })) : null)] }) }) }))] }));
}
