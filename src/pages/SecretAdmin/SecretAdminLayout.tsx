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
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-white/[0.06] text-white' : 'text-gray-300 hover:bg-white/[0.03] hover:text-white'
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
    <div className="min-h-screen bg-[#0b1024] text-white flex">
      {/* Sidebar (desktop) */}
      <aside className="w-64 shrink-0 bg-[#0a0e1f] border-r border-white/10 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <Link to="/secret-admin" className="text-lg font-bold">DLX Admin</Link>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <MenuItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10 text-sm text-gray-300">
          <div className="truncate">{admin?.email}</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Transition appear show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={() => setMobileOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-start">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 -translate-x-5" enterTo="opacity-100 translate-x-0" leave="ease-in duration-150" leaveFrom="opacity-100 translate-x-0" leaveTo="opacity-0 -translate-x-5">
                <Dialog.Panel className="w-72 h-screen bg-[#0a0e1f] border-r border-white/10 p-3">
                  <div className="h-16 flex items-center px-1 border-b border-white/10">
                    <Link to="/secret-admin" className="text-lg font-bold">DLX Admin</Link>
                  </div>
                  <nav className="mt-3 space-y-1 overflow-y-auto h-[calc(100vh-5rem)] pr-2">
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
        <header className="sticky top-0 z-40 h-16 bg-[#0a0e1f] border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden inline-flex items-center justify-center rounded-md p-2 bg-white/10 hover:bg-white/20" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="font-semibold">Secret Admin Panel</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">{admin?.name || admin?.email}</span>
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold">Logout</button>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}