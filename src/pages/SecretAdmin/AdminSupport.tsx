import React, { useEffect, useState } from 'react';

type Ticket = { _id: string; subject: string; status: string; created_at: number };

export default function AdminSupport() {
  const [rows, setRows] = useState<Ticket[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/support', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setRows(data);
      } catch {}
    })();
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Support Tickets</div>
      <div className="space-y-2">
        {rows.map((t) => (
          <div key={t._id} className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.subject}</div>
              <div className="text-xs text-gray-400">{t.status}</div>
            </div>
            <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}