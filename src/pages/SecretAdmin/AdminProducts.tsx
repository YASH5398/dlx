import React, { useEffect, useState } from 'react';

type Product = { id: string; name: string; price: number };

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/products', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setRows(data);
      } catch {}
    })();
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Products</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((p) => (
          <div key={p.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-emerald-400">${p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}