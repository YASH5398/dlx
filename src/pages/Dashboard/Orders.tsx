import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update, off, runTransaction, set, push } from 'firebase/database';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../utils/api';
import { io } from 'socket.io-client';
import { purchase, getBalances } from '../../utils/wallet';
import { notifyAdminPayment } from '../../utils/notifications';

// Types for order records
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
  method?: 'USDT' | 'DLX' | 'Card' | 'Bank' | 'UPI' | 'INR';
  transactionId?: string;
  buyer?: string;
  downloadUrl?: string | null;
  features?: string[];
  steps?: string[];
  updates?: { date?: string; message: string }[];
  // Optional release details populated by admin
  release?: {
    expectedTime?: string;
    website?: string;
    panelLink?: string;
    adminEmail?: string;
    adminPassword?: string;
  };
  // Optional chat session id
  chatId?: string | null;
}

const formatCurrency = (n: number | undefined, currency: 'USD' | 'INR' = 'USD') =>
  currency === 'USD' ? `$${(n ?? 0).toFixed(2)}` : `${(n ?? 0).toFixed(2)}`;

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '—');

const statusBadge = (s: Status) => {
  switch (s) {
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 shadow-yellow-500/20';
    case 'failed':
      return 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-red-500/20';
    case 'refunded':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-cyan-500/20';
  }
};

const orderStatusBadge = (s?: OrderStatus) => {
  switch (s) {
    case 'processing':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-blue-500/20';
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20';
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-red-500/20';
    default:
      return 'bg-gray-700/10 text-gray-400 border border-gray-600/30 shadow-gray-600/20';
  }
};

export default function Orders() {
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NonNullable<OrderItem['type']>>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Chat & payment UI state
  const [agentOnline, setAgentOnline] = useState<boolean>(false);
  const [socket, setSocket] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState<string>('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [payCurrency, setPayCurrency] = useState<'USDT' | 'INR'>('USDT');
  const [usePurchase, setUsePurchase] = useState<boolean>(true);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const balances = getBalances();

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getOrders(user.id)
      .then((list) => {
        setOrders(list as OrderItem[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Orders fetch failed', err);
        setError('Unable to load orders. Please try again.');
        setLoading(false);
      });

    const ordersRef = ref(db, `users/${user.id}/orders`);
    const unsub = onValue(ordersRef, (snap) => {
      const val = snap.val() || {};
      const list: OrderItem[] = Object.keys(val).map((id) => ({ ...(val[id] as OrderItem), id }));
      setOrders(list);
    });
    return () => off(ordersRef);
  }, [user?.id]);

  // Setup chat when opening details
  useEffect(() => {
    if (!selected || !user?.id) return;
    const s = io('http://localhost:4000', { withCredentials: true });
    s.emit('identify', { role: 'user', userId: user.id });
    setSocket(s);
    // agent availability
    fetch('http://localhost:4000/api/agents/status')
      .then((r) => r.json())
      .then((d) => setAgentOnline(!!d.available))
      .catch(() => {});
    s.on('agent:status', ({ available }) => setAgentOnline(!!available));
    // join chat if exists
    const cid = selected.chatId || null;
    setChatId(cid);
    if (cid) {
      s.emit('chat:join', { chatId: cid });
      setChatLoading(true);
      fetch(`http://localhost:4000/api/messages?chat_id=${cid}`)
        .then((r) => r.json())
        .then((d) => setMessages(d || []))
        .finally(() => setChatLoading(false));
    } else {
      setMessages([]);
    }
    s.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      try { s.disconnect(); } catch {}
    };
  }, [selected?.id]);

  const requestChat = useCallback(async () => {
    if (!user?.id || !selected) return;
    setChatLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/live-chats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id })
      });
      const chat = await res.json();
      if (chat?._id) {
        setChatId(chat._id);
        socket?.emit('chat:join', { chatId: chat._id });
        await update(ref(db, `users/${user.id}/orders/${selected.id}`), { chatId: chat._id });
        setMessages([]);
      }
    } finally {
      setChatLoading(false);
    }
  }, [user?.id, selected?.id, socket]);

  const sendMessage = useCallback(() => {
    if (!socket || !chatId || !msgInput.trim()) return;
    socket.emit('chat:send', { chatId, senderType: 'USER', content: msgInput });
    setMsgInput('');
  }, [socket, chatId, msgInput]);

  const doPay = useCallback(async () => {
    if (!user?.id || !selected) return;
    setIsPaying(true);
    try {
      const amount = payCurrency === 'USDT' ? (selected.priceInUsd || 0) : (selected.priceInInr || 0);
      const key = payCurrency === 'USDT' ? 'usdt' : 'inr';
      const half = amount / 2;
      const useFromPurchaseAmt = usePurchase ? Math.min(balances.purchase[key], half) : 0;
      const useFromMainAmt = amount - useFromPurchaseAmt;
      const balPath = ref(db, `users/${user.id}/wallet/${key}`);
      await runTransaction(balPath, (curr) => (typeof curr === 'number' ? curr : 0) - useFromMainAmt);
      await purchase(amount, payCurrency as any);
      await update(ref(db, `users/${user.id}/orders/${selected.id}`), { status: 'paid', method: payCurrency });
      try {
        const nid = crypto.randomUUID();
        await notifyAdminPayment({ id: nid, orderId: selected.id, userId: user.id, amountUsd: selected.priceInUsd || 0, method: payCurrency });
      } catch {}
      try {
        document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'order', message: `Payment received for ${selected.title}`, meta: { order: selected } } }));
      } catch {}
      setSelected({ ...selected, status: 'paid', method: payCurrency });
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  }, [user?.id, selected, payCurrency, usePurchase, balances]);

  const submitAdditionalRequest = useCallback(async (text: string) => {
    if (!user?.id || !selected || !text.trim()) return;
    const rid = crypto.randomUUID();
    const reqRef = ref(db, `users/${user.id}/orders/${selected.id}/additionalRequests/${rid}`);
    await set(reqRef, { id: rid, text: text.trim(), createdAt: Date.now() });
    try {
      const nid = crypto.randomUUID();
      await notifyAdminPayment({ id: nid, orderId: selected.id, userId: user.id, amountUsd: selected.priceInUsd || 0, method: 'REQUEST' });
    } catch {}
  }, [user?.id, selected?.id]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      const matchesOrderStatus = orderStatusFilter === 'all' ? true : o.orderStatus === orderStatusFilter;
      const matchesType = typeFilter === 'all' ? true : o.type === typeFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch = term
        ? [o.title, o.transactionId, o.buyer].some((x) => (x || '').toLowerCase().includes(term))
        : true;
      const withinDate = (() => {
        if (!fromDate && !toDate) return true;
        const t = o.purchaseDate ? new Date(o.purchaseDate).getTime() : 0;
        const f = fromDate ? new Date(fromDate).getTime() : -Infinity;
        const to = toDate ? new Date(toDate).getTime() : Infinity;
        return t >= f && t <= to;
      })();
      return matchesStatus && matchesOrderStatus && matchesType && matchesSearch && withinDate;
    });
  }, [orders, statusFilter, orderStatusFilter, typeFilter, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleRefund = async (o: OrderItem) => {
    if (!user?.id) return;
    await update(ref(db, `users/${user.id}/orders/${o.id}`), { status: 'refunded' as Status });
    try {
      document.dispatchEvent(
        new CustomEvent('notifications:add', {
          detail: { type: 'order', message: `Order ${(o.transactionId || o.id)} refunded: ${o.title}`, meta: { order: o } },
        })
      );
    } catch {}
  };

  const handleMarkPaid = async (o: OrderItem) => {
    if (!user?.id) return;
    await update(ref(db, `users/${user.id}/orders/${o.id}`), { status: 'paid' as Status });
    try {
      document.dispatchEvent(
        new CustomEvent('notifications:add', {
          detail: { type: 'order', message: `Order ${(o.transactionId || o.id)} marked paid: ${o.title}`, meta: { order: o } },
        })
      );
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <section className="rounded-2xl bg-gray-800/20 border border-gray-700/20 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Your Orders
              </h2>
              <p className="text-gray-300 text-sm mt-2">
                {filtered.length} {filtered.length === 1 ? 'order' : 'orders'} found
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    statusFilter === s
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-700/20 text-gray-200 hover:bg-gray-600/30 border border-gray-600/20'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, ID, or buyer"
              className="lg:col-span-5 w-full px-4 py-3 rounded-lg bg-gray-800/30 border border-gray-700/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="lg:col-span-3 w-full px-4 py-3 rounded-lg bg-gray-800/30 border border-gray-700/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
            >
              <option value="all">All Types</option>
              <option value="Service">Service</option>
              <option value="Digital">Digital</option>
              <option value="Subscription">Subscription</option>
            </select>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value as any)}
              className="lg:col-span-2 w-full px-4 py-3 rounded-lg bg-gray-800/30 border border-gray-700/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
            >
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="lg:col-span-2 flex gap-3">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/30 border border-gray-700/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/30 border border-gray-700/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
              />
            </div>
          </div>
        </section>

        {/* Orders Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="rounded-2xl bg-gray-800/20 border border-gray-700/20 backdrop-blur-xl p-6 animate-pulse"
              >
                <div className="h-5 w-3/4 bg-gray-700/30 rounded mb-4" />
                <div className="h-4 w-1/2 bg-gray-700/30 rounded mb-2" />
                <div className="h-4 w-2/3 bg-gray-700/30 rounded mb-2" />
                <div className="h-4 w-1/3 bg-gray-700/30 rounded mb-4" />
                <div className="h-8 w-1/2 bg-gray-700/30 rounded ml-auto" />
              </div>
            ))
          ) : error ? (
            <div className="col-span-full rounded-2xl bg-gray-800/20 border border-gray-700/20 backdrop-blur-xl p-8 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-gray-800/20 border border-gray-700/20 backdrop-blur-xl p-8 text-center">
              <p className="text-gray-300 text-sm mb-4">No orders found.</p>
              <button
                onClick={() => navigate('/dashboard/digital-products')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
              >
                Browse Services
              </button>
            </div>
          ) : (
            pageItems.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl bg-gray-800/20 border border-gray-700/20 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white truncate">{o.title}</h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge(
                      o.status
                    )} animate-pulse`}
                  >
                    {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <span className="font-medium">ID:</span>{' '}
                    <span className="font-mono">{o.transactionId || o.id}</span>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {formatDate(o.purchaseDate)}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>{' '}
                    <span className="text-white">{formatCurrency(o.priceInUsd || 0, 'USD')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Order:</span>{' '}
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${orderStatusBadge(
                        o.orderStatus
                      )}`}
                    >
                      {o.orderStatus ? o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1) : '—'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <button
                    onClick={() => setSelected(o)}
                    className="px-4 py-2 rounded-full bg-gray-700/30 text-gray-200 hover:bg-gray-600/40 hover:text-white transition-all duration-300 transform hover:scale-105"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/orders/${o.id}/invoice`)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105"
                  >
                    Invoice
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <p className="text-sm text-gray-300">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-4 py-2 rounded-full text-sm ${
                page === 1
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700/30 text-gray-200 hover:bg-gray-600/40 hover:text-white'
              } transition-all duration-300 transform hover:scale-105`}
            >
              Prev
            </button>
            <button
              disabled={totalPages === page}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-4 py-2 rounded-full text-sm ${
                totalPages === page
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700/30 text-gray-200 hover:bg-gray-600/40 hover:text-white'
              } transition-all duration-300 transform hover:scale-105`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Details Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500"
              onClick={() => setSelected(null)}
            />
            <div className="relative w-full max-w-md sm:max-w-lg rounded-2xl bg-gray-800/30 border border-gray-700/20 backdrop-blur-xl p-6 sm:p-8 shadow-2xl animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Order Details
              </h3>
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order ID</span>
                  <span className="font-mono text-white">{selected.transactionId || selected.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Product/Service</span>
                  <span className="text-white truncate">{selected.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Type</span>
                  <span>{selected.type || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Buyer</span>
                  <span>{selected.buyer || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Purchase Date</span>
                  <span>{formatDate(selected.purchaseDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Payment Method</span>
                  <span>{selected.method || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Payment Status</span>
                  <span
                    className={`text-sm ${statusBadge(selected.status)} px-3 py-1 rounded-full animate-pulse`}
                  >
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Status</span>
                  <span className={`text-sm ${orderStatusBadge(selected.orderStatus)} px-3 py-1 rounded-full`}>
                    {selected.orderStatus ? selected.orderStatus.charAt(0).toUpperCase() + selected.orderStatus.slice(1) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount</span>
                  <span className="text-white">
                    {formatCurrency(selected.priceInUsd || 0, 'USD')} /{' '}
                    {formatCurrency(selected.priceInInr || 0, 'INR')}
                  </span>
                </div>
                {selected.downloadUrl && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Download</span>
                    <a
                      className="text-cyan-400 hover:text-cyan-300 transition-all duration-300"
                      href={selected.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open link
                    </a>
                  </div>
                )}
              </div>
              {(selected.features?.length || selected.steps?.length || selected.updates?.length) && (
                <div className="mt-8 space-y-6">
                  {selected.features?.length ? (
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-3">Features</h4>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-2">
                        {selected.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {selected.steps?.length ? (
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-3">Delivery Steps</h4>
                      <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
                        {selected.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {selected.updates?.length ? (
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-3">Updates</h4>
                      <div className="space-y-3 text-gray-300 text-sm">
                        {selected.updates.map((u, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>{u.message}</span>
                            <span className="text-xs text-gray-400">{formatDate(u.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="mt-8 flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => handleMarkPaid(selected)}
                  className="px-4 py-2 rounded-full bg-emerald-600/90 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => navigate(`/orders/${selected.id}/invoice`)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  View Invoice
                </button>
                <button
                  onClick={() => handleRefund(selected)}
                  className="px-4 py-2 rounded-full bg-red-600/90 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  Refund
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-full bg-gray-700/30 text-gray-200 hover:bg-gray-600/40 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}