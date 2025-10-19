import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ users: number; tickets: number; orders: number; revenue: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/stats', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch {}
    })();
  }, []);

  const cards = [
    { label: 'Users', value: stats?.users ?? 0 },
    { label: 'Orders', value: stats?.orders ?? 0 },
    { label: 'Revenue', value: `$${stats?.revenue ?? 0}` },
    { label: 'Tickets', value: stats?.tickets ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4 shadow-lg">
          <div className="text-sm text-gray-400">{c.label}</div>
          <div className="text-2xl font-bold mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}