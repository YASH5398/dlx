import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { getOrders } from '../../utils/api';

type Status = 'paid' | 'pending' | 'failed' | 'refunded';
type OrderStatus = 'processing' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  title: string;
  priceInUsd: number;
  priceInInr: number;
  status: Status;
  orderStatus?: OrderStatus;
  type?: 'Service' | 'Digital' | 'Subscription';
  purchaseDate?: string;
  method?: 'USDT' | 'DLX' | 'Card' | 'Bank' | 'UPI';
  transactionId?: string;
  buyer?: string;
}

const formatCurrency = (n: number, currency: 'USD' | 'INR' = 'USD') =>
  currency === 'USD' ? `$${(n ?? 0).toFixed(2)}` : `${(n ?? 0).toFixed(2)}`;

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '—');

export default function OrderInvoice() {
  const { user } = useUser();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !orderId) return;
    setLoading(true);
    setError(null);
    getOrders(user.id)
      .then((list) => {
        setOrders(list as OrderItem[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Invoice fetch failed', err);
        setError('Unable to load invoice. Please try again.');
        setLoading(false);
      });
  }, [user?.id, orderId]);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!orderId) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-200 p-4">
          Missing invoice ID.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Invoice</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Print</button>
          <button onClick={() => navigate('/orders')} className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15">Back to Orders</button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-200 p-3">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 animate-pulse">
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="mt-3 h-4 w-64 bg-white/10 rounded" />
          <div className="mt-1 h-4 w-52 bg-white/10 rounded" />
          <div className="mt-1 h-4 w-36 bg-white/10 rounded" />
          <div className="mt-4 h-10 w-28 bg-white/10 rounded" />
        </div>
      ) : !order ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <p className="text-gray-300">Invoice not found.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Browse Services</button>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-300">Invoice #</p>
              <p className="font-mono text-white text-lg">{order.transactionId || order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Date</p>
              <p className="text-white">{formatDate(order.purchaseDate)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-gray-300">Product/Service</p>
              <p className="text-white font-semibold">{order.title}</p>
              <p className="mt-2 text-sm text-gray-300">Type: {order.type || '—'}</p>
              <p className="mt-1 text-sm text-gray-300">Buyer: {order.buyer || '—'}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-gray-300">Payment</p>
              <p className="text-white">{order.method || '—'}</p>
              <p className="mt-2 text-sm text-gray-300">Status: {order.status}</p>
              <p className="mt-1 text-sm text-gray-300">Order: {order.orderStatus ?? '—'}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">Amount</p>
              <p className="text-white text-xl font-semibold">{formatCurrency(order.priceInUsd || 0, 'USD')} <span className="text-gray-400 text-sm">({formatCurrency(order.priceInInr || 0, 'INR')})</span></p>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400">
            <p>Thank you for your purchase with Digi Linex.</p>
            <p className="mt-1">For support, visit the Support section in your dashboard.</p>
          </div>
        </div>
      )}
    </div>
  );
}