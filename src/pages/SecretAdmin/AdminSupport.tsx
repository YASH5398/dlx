import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

type Ticket = { id: string; subject: string; status: string };

export default function AdminSupport() {
  const [rows, setRows] = useState<Ticket[]>([]);
  useEffect(() => {
    const q = query(collection(firestore, 'tickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Ticket[] = [];
      snap.forEach((doc) => {
        const d: any = doc.data() || {};
        arr.push({ id: doc.id, subject: d.subject || '-', status: d.status || 'open' });
      });
      setRows(arr);
    }, (err) => {
      console.error('Failed to stream tickets:', err);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Support Tickets</div>
      <div className="space-y-2">
        {rows.map((t) => (
          <div key={t.id} className="rounded-lg bg-white/5 border border-white/10 p-3 flex justify-between">
            <div>
              <div className="font-semibold">{t.subject}</div>
              <div className="text-xs text-gray-400">{t.status}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-sm text-gray-400">No tickets found.</div>
        )}
      </div>
    </div>
  );
}