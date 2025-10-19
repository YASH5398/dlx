import React, { useEffect, useState } from 'react';

type AdminRow = { id: string; email: string; name?: string; created_at?: string; last_login_at?: string };

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/users', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setRows(data.map((d: any) => ({ id: d._id, email: d.email, name: d.name, created_at: d.created_at, last_login_at: d.last_login_at })));
      } catch {}
    })();
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Admins</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-300">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2 pr-4">{r.email}</td>
                <td className="py-2 pr-4">{r.name || '-'}</td>
                <td className="py-2 pr-4">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                <td className="py-2 pr-4">{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}