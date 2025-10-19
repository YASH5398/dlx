import React, { useEffect, useState } from 'react';

type Order = { id: string; user: string; total: number; status: string };

export default function AdminOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/orders', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setRows(data);
      } catch {}
    })();
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Orders</div>
      <div className="space-y-2">
        {rows.map((o) => (
          <div key={o.id} className="rounded-lg bg-white/5 border border-white/10 p-3 flex justify-between">
            <div>
              <div className="font-semibold">{o.user}</div>
              <div className="text-xs text-gray-400">{o.status}</div>
            </div>
            <div className="text-emerald-400 font-bold">${o.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}