import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';
import MobileNavigation from './MobileNavigation';

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
  const { isAuthenticated, user, logout, initialized } = useUser();
  const { approved } = useAffiliateApproval();

  const initials = (user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/work-with-us', label: 'Work With Us' },
  ];

  const dashboardLinks = [
    { label: "Overview", to: "/dashboard" },
    { label: "Orders", to: "/orders" },
    { label: "Mining", to: "/mining" },
    { label: "Wallet", to: "/wallet" },
    { label: approved ? "Affiliate Dashboard" : "Affiliate Program", to: approved ? "/affiliate-dashboard" : "/affiliate-program" },
    { label: "Commission", to: "/commission" },
    { label: "Referrals", to: "/referrals" },
    { label: "Database & Marketing", to: "/database-marketing" },
    { label: "DLX Listing", to: "/dlx-listing" },
    { label: "Work With Us", to: "/work-with-us" },
    { label: "Support", to: "/support" },
    { label: "Settings", to: "/settings" },
  ];

  const desktopLinkClass = isAuthenticated
    ? (args: { isActive: boolean }) => (args.isActive ? 'menu-link-active' : 'menu-link')
    : (args: { isActive: boolean }) => (args.isActive ? 'text-white font-semibold' : 'text-white/80 hover:text-white transition');

  const mobileLinkClass = isAuthenticated
    ? (args: { isActive: boolean }) => (args.isActive ? 'menu-link-active' : 'menu-link')
    : (args: { isActive: boolean }) => (args.isActive ? 'text-white font-semibold' : 'text-white/90 hover:text-white rounded-lg px-3 py-2 bg-white/10 border border-white/20');

  const links = isAuthenticated ? dashboardLinks : publicLinks;

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader onMenuToggle={() => setMobileOpen(!mobileOpen)} isMenuOpen={mobileOpen} />
      
      {/* Mobile Drawer */}
      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      {/* Mobile Bottom Navigation */}
      {isAuthenticated && <MobileNavigation isAuthenticated={isAuthenticated} approved={approved} />}
      
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl hidden md:block">
        <div className="container-padded flex h-16 items-center justify-between text-white">
          {/* Enhanced Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-500 flex items-center justify-center group-hover:scale-110">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-500">
              DigiLinex
            </span>
          </Link>

          {/* Enhanced Desktop nav */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            {links.map((l) => (
              <NavLink 
                key={l.to} 
                to={l.to} 
                className={({ isActive }) => 
                  `relative px-4 py-2 rounded-xl font-medium transition-all duration-300 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30' 
                      : 'text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{l.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Enhanced Right side: auth / profile */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              !isHome ? (
                <>
                  <Link 
                    to="/login" 
                    className="text-sm font-semibold text-white/90 hover:text-white transition-colors duration-300 hover:scale-105"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="hidden sm:inline-flex items-center rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                  >
                    Sign Up
                  </Link>
                </>
              ) : null
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  {initialized ? (
                    <>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
                        <div className="text-xs text-gray-300">{user?.email || ''}</div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white/20 flex items-center justify-center font-semibold shadow-lg hover:scale-110 transition-all duration-300">
                        {initials}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="h-4 w-28 rounded bg-white/20 animate-pulse mb-1" />
                        <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white/10 border-2 border-white/10 animate-pulse" />
                    </>
                  )}
                </div>
                <button
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}