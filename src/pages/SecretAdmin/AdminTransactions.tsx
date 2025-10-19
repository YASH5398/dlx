import React, { useEffect, useState } from 'react';

type Txn = { id: string; amount: number; method: string; status: string };

export default function AdminTransactions() {
  const [rows, setRows] = useState<Txn[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/transactions', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setRows(data);
      } catch {}
    })();
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Transactions</div>
      <div className="space-y-2">
        {rows.map((t) => (
          <div key={t.id} className="rounded-lg bg-white/5 border border-white/10 p-3 flex justify-between">
            <div>
              <div className="font-semibold">{t.method}</div>
              <div className="text-xs text-gray-400">{t.status}</div>
            </div>
            <div className="text-emerald-400 font-bold">${t.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}