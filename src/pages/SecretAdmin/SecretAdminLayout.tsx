import React, { Fragment, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';

export default function SecretAdminLayout() {
  const [admin, setAdmin] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAdmin(null);
        navigate('/secret-admin/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(firestore, 'users', u.uid));
        const data = (userDoc.data() as any) || {};
        const role = (data.role || data.userRole || '').toLowerCase();
        if (!userDoc.exists() || role !== 'admin') {
          setAdmin(null);
          navigate('/secret-admin/login');
          return;
        }
        setAdmin({ id: u.uid, email: u.email || '', name: u.displayName || undefined });
      } catch {
        setAdmin(null);
        navigate('/secret-admin/login');
      }
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, [navigate]);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      try { localStorage.removeItem('isAdmin'); } catch {}
      navigate('/secret-admin/login');
    }
  };

  const MenuItem = ({ to, label }: { to: string; label: string }) => (
    <NavLink
      key={to}
      to={to}
      end
      className={({ isActive }) =>
        `block rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-500'
            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
        }`
      }
      onClick={() => setMobileOpen(false)}
    >
      {label}
    </NavLink>
  );

  const navItems = [
    { to: '/secret-admin', label: 'Dashboard' },
    { to: '/secret-admin/users', label: 'Users' },
    { to: '/secret-admin/orders', label: 'Orders' },
    { to: '/secret-admin/products', label: 'Products' },
    { to: '/secret-admin/transactions', label: 'Transactions' },
    { to: '/secret-admin/referrals', label: 'Referrals' },
    { to: '/secret-admin/affiliates', label: 'Affiliates' },
    { to: '/secret-admin/support', label: 'Support' },
    { to: '/secret-admin/notifications', label: 'Notifications' },
    { to: '/secret-admin/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar (desktop) */}
      <aside className="w-64 shrink-0 bg-gradient-to-b from-gray-900 to-gray-850 border-r border-gray-800/50 hidden md:flex md:flex-col shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-gray-800/50">
          <Link to="/secret-admin" className="text-xl font-extrabold tracking-tight text-emerald-400">
            DLX Admin
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <MenuItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-800/50 text-sm">
          <div className="truncate text-gray-300">{admin?.name || admin?.email}</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Transition appear show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={() => setMobileOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-start">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 -translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-full"
              >
                <Dialog.Panel className="w-80 max-w-full h-screen bg-gradient-to-b from-gray-900 to-gray-850 border-r border-gray-800/50 p-6 shadow-xl">
                  <div className="h-16 flex items-center border-b border-gray-800/50">
                    <Link to="/secret-admin" className="text-xl font-extrabold tracking-tight text-emerald-400">
                      DLX Admin
                    </Link>
                  </div>
                  <nav className="mt-4 space-y-1.5 overflow-y-auto h-[calc(100vh-5rem)]">
                    {navItems.map((item) => (
                      <MenuItem key={item.to} to={item.to} label={item.label} />
                    ))}
                  </nav>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-gray-900 to-gray-850 border-b border-gray-800/50 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-lg font-semibold text-gray-200">Secret Admin Panel</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 truncate max-w-xs">{admin?.name || admin?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white text-sm font-medium transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}