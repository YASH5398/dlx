import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

export default function AdminLayout() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initials = (user?.name || 'Admin')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const topNavItems = [
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/activities', label: 'Activities' },
    { path: '/admin/services', label: 'Services' },
    { path: '/admin/wallets', label: 'Wallets' },
    { path: '/admin/settings', label: 'Settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1230] via-[#0a0e1f] to-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
        <div className="h-full flex items-center justify-between px-4 md:px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {menuOpen ? (
                  <path d="M6 6L18 18M6 18L18 6" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">DigiLinex Admin</div>
          </div>

          {/* Center: Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {topNavItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-lg shadow-blue-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <div className="text-sm font-semibold text-white">{user?.name || 'Admin'}</div>
              <div className="text-xs text-gray-400">{user?.email || ''}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white/20 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex px-4 py-2 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-semibold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {menuOpen && isMobile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity duration-300" style={{ top: '4rem' }} onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 w-72 transform transition-all duration-500 ease-in-out ${menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="h-full bg-gradient-to-b from-[#0f1629] via-[#0a0f1f] to-black border-r border-white/10 shadow-2xl">
          <div className="h-full flex flex-col p-4">
            <nav className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {topNavItems.map(({ path, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => isMobile && setMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-lg shadow-blue-500/10 scale-105'
                          : 'text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105 hover:translate-x-1'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">{label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`pt-16 pb-6 transition-all duration-500 ease-in-out ${menuOpen && !isMobile ? 'lg:ml-72' : 'ml-0'} px-4 md:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}