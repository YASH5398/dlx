import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function SecretAdminLayout() {
  const [admin, setAdmin] = useState<{ id: string; email: string; name?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/session', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setAdmin(data.admin);
      } catch {}
    })();
  }, []);

  const logout = async () => {
    await fetch('http://localhost:4000/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/secret-admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0b1024] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#0a0e1f] border-r border-white/10 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <Link to="/secret-admin" className="text-lg font-bold">DLX Admin</Link>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {[
            { to: '/secret-admin', label: 'Dashboard' },
            { to: '/secret-admin/users', label: 'Users' },
            { to: '/secret-admin/orders', label: 'Orders' },
            { to: '/secret-admin/products', label: 'Products' },
            { to: '/secret-admin/transactions', label: 'Transactions' },
            { to: '/secret-admin/support', label: 'Support' },
            { to: '/secret-admin/settings', label: 'Settings' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/[0.06] text-white' : 'text-gray-300 hover:bg-white/[0.03] hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10 text-sm text-gray-300">
          <div className="truncate">{admin?.email}</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-[#0a0e1f] border-b border-white/10 flex items-center justify-between px-4">
          <div className="font-semibold">Secret Admin Panel</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">{admin?.name || admin?.email}</span>
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold">Logout</button>
          </div>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}