import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collectionGroup, onSnapshot, query, orderBy } from 'firebase/firestore';

type Txn = { id: string; amount: number; method: string; status: string };

export default function AdminTransactions() {
  const [rows, setRows] = useState<Txn[]>([]);
  useEffect(() => {
    const q = query(collectionGroup(firestore, 'transactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Txn[] = [];
      snap.forEach((doc) => {
        const d: any = doc.data() || {};
        arr.push({ id: doc.id, amount: Number(d.amount || 0), method: d.currency || d.method || 'USDT', status: d.status || 'pending' });
      });
      setRows(arr);
    }, (err) => {
      console.error('Failed to stream transactions:', err);
    });
    return () => { try { unsub(); } catch {} };
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
        {rows.length === 0 && (
          <div className="text-sm text-gray-400">No transactions found.</div>
        )}
      </div>
    </div>
  );
}