import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type Product = { id: string; name: string; price: number };

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  useEffect(() => {
    const col = collection(firestore, 'products');
    const unsub = onSnapshot(col, (snap) => {
      const arr: Product[] = [];
      snap.forEach((doc) => {
        const d: any = doc.data() || {};
        arr.push({ id: doc.id, name: d.name || '-', price: Number(d.price || 0) });
      });
      setRows(arr);
    }, (err) => {
      console.error('Failed to stream products:', err);
    });
    return () => { try { unsub(); } catch {} };
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
        {rows.length === 0 && (
          <div className="text-sm text-gray-400">No products found.</div>
        )}
      </div>
    </div>
  );
}