import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Header
 * - Public: shows marketing links + Login/Signup
 * - Logged-in: shows dashboard-style menu links with user avatar + Logout
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useUser();

  const initials = (user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/exchanges', label: 'Exchanges' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/tutorials', label: 'Tutorials' },
    { to: '/docs', label: 'Docs' },
    { to: '/blogs', label: 'Blogs' },
    { to: '/apply', label: 'Apply' },
    { to: '/digital-products', label: 'Digital Products' },
  ];

  const dashboardLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/dashboard/commission', label: 'Commission & Rewards' },
    { to: '/dashboard/orders', label: 'Orders' },
    { to: '/dashboard/digital-products', label: 'Digital Products' },
    { to: '/dashboard/mining', label: 'Mining' },
    { to: '/dashboard/referrals', label: 'Referrals' },
    { to: '/dashboard/wallet', label: 'Wallet' },
    { to: '/dashboard/support', label: 'Support' },
    { to: '/dashboard/settings', label: 'Settings' },
    { to: '/dashboard/affiliate-program', label: 'Affiliate Program' },
  ];

  const desktopLinkClass = isAuthenticated
    ? (args: { isActive: boolean }) => (args.isActive ? 'menu-link-active' : 'menu-link')
    : (args: { isActive: boolean }) => (args.isActive ? 'text-white font-semibold' : 'text-white/80 hover:text-white transition');

  const mobileLinkClass = isAuthenticated
    ? (args: { isActive: boolean }) => (args.isActive ? 'menu-link-active' : 'menu-link')
    : (args: { isActive: boolean }) => (args.isActive ? 'text-white font-semibold' : 'text-white/90 hover:text-white rounded-lg px-3 py-2 bg-white/10 border border-white/20');

  const links = isAuthenticated ? dashboardLinks : publicLinks;

  return (
    <header className="sticky top-0 z-40 navbar-gradient backdrop-blur-xl border-b border-white/10">
      <div className="container-padded flex h-16 items-center justify-between text-white">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded bg-gradient-to-r from-[#7c3aed] to-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.35)]" />
          <span className="font-bold text-lg">DigiLinex</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3 text-sm">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={desktopLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: auth / profile */}
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-sm font-semibold text-white/90 hover:text-white">Login</Link>
              <Link to="/signup" className="hidden sm:inline-flex items-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_12px_rgba(255,255,255,0.25)] hover:bg-white/20">Sign Up</Link>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-semibold">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-400">{user?.email || ''}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-semibold">
                  {initials}
                </div>
              </div>
              <button
                className="inline-flex items-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          )}

          {/* Mobile toggle */}
          <button
            aria-label="Toggle menu"
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 border border-white/20"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">Open menu</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="container-padded py-4 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  {l.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <button
                  onClick={async () => { await logout(); setMobileOpen(false); navigate('/'); }}
                  className="rounded-xl px-3 py-2 bg-red-500 text-white font-semibold"
                >
                  Logout
                </button>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white">Login</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}