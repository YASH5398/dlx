import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

type Order = { id: string; user: string; total: number; status: string };

export default function AdminOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  useEffect(() => {
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((docSnap) => {
        const d: any = docSnap.data() || {};
        arr.push({
          id: docSnap.id,
          user: d.userEmail || d.user || d.userId || '-',
          total: Number(d.total || d.amountUsd || 0),
          status: d.status || 'pending',
          productName: d.productName || d.product || '-',
          downloadUrl: d.downloadUrl || d.downloadLink || '',
          paymentMethod: d.paymentMethod || '-',
          paymentStatus: d.paymentStatus || '-',
          createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Number(d.createdAt || d.timestamp || 0),
        });
      });
      setRows(arr as any);
    }, (err) => {
      console.error('Failed to stream orders:', err);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(firestore, 'orders', id), { status });
      toast.success('Order status updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Orders</div>
      <div className="space-y-2">
        {rows.map((o) => (
          <div key={o.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{(o as any).productName || '-'}</div>
                <div className="text-xs text-gray-400">Buyer: {o.user} • {o.status} • {((o as any).createdAt ? new Date((o as any).createdAt).toLocaleString() : '')}</div>
                <div className="text-xs text-gray-400">Payment: {(o as any).paymentMethod} • {(o as any).paymentStatus}</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-bold">${o.total}</div>
                <div className="mt-2 flex items-center gap-2">
                  <select defaultValue={(o as any).status} onChange={(e)=>updateStatus((o as any).id, e.target.value)} className="text-xs bg-transparent border border-white/20 rounded px-2 py-1">
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="delivered">delivered</option>
                  </select>
                </div>
              </div>
            </div>
            {(o as any).downloadUrl && (
              <a className="text-xs text-blue-400 hover:underline" href={(o as any).downloadUrl} target="_blank" rel="noreferrer">Download Link</a>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-sm text-gray-400">No orders found.</div>
        )}
      </div>
    </div>
  );
}