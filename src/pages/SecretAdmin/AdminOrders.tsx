import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

type Order = { id: string; user: string; total: number; status: string; productName: string; downloadUrl: string; paymentMethod: string; paymentStatus: string; createdAt: number };

export default function AdminOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

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
      toast.error('Failed to load orders');
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await updateDoc(doc(firestore, 'orders', id), { status });
      toast.success('Order status updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Order Management</h1>
          <p className="text-gray-400 mt-2">Track and update customer orders in real-time</p>
        </header>
        <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-800/50 p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-6">Orders</h2>
          {rows.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200">
                      <td className="py-4 px-4 font-medium">{o.productName}</td>
                      <td className="py-4 px-4">{o.user}</td>
                      <td className="py-4 px-4 text-emerald-400 font-bold">${o.total.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        {o.paymentMethod} <span className="text-gray-400">({o.paymentStatus})</span>
                      </td>
                      <td className="py-4 px-4">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                      <td className="py-4 px-4">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          disabled={updating === o.id}
                          className={`text-sm rounded-lg px-3 py-1.5 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                            o.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : o.status === 'processing'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                          } ${updating === o.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        {o.downloadUrl && (
                          <a
                            href={o.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Link
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}