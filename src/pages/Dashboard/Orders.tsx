import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { firestore } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { notifyAdminPayment } from '../../utils/notifications';
import { 
  ShoppingBagIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

// Types
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
  release?: {
    expectedTime?: string;
    website?: string;
    panelLink?: string;
    adminEmail?: string;
    adminPassword?: string;
  };
  chatId?: string | null;
}

const formatCurrency = (n: number | undefined, currency: 'USD' | 'INR' = 'USD') =>
  currency === 'USD' ? `$${(n ?? 0).toFixed(2)}` : `₹${(n ?? 0).toFixed(2)}`;

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatusIcon = ({ status }: { status: Status }) => {
  switch (status) {
    case 'paid':
      return <CheckCircleIcon className="w-4 h-4" />;
    case 'pending':
      return <ClockIcon className="w-4 h-4" />;
    case 'failed':
      return <XCircleIcon className="w-4 h-4" />;
    case 'refunded':
      return <ArrowPathIcon className="w-4 h-4" />;
  }
};

const statusBadge = (s: Status) => {
  const styles = {
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    failed: 'bg-red-500/20 text-red-400 border-red-500/50',
    refunded: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  };
  return styles[s] || '';
};

const orderStatusBadge = (s?: OrderStatus) => {
  const styles = {
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
  };
  return styles[s || 'processing'] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
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
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Chat & payment state
  const [agentOnline, setAgentOnline] = useState<boolean>(false);
  const [socket, setSocket] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState<string>('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [payCurrency, setPayCurrency] = useState<'USDT' | 'INR'>('USDT');
  const [usePurchase, setUsePurchase] = useState<boolean>(true);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [upiTxnId, setUpiTxnId] = useState<string>('');


  // Fetch orders (Firestore)
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    const q = query(collection(firestore, 'orders'), where('userId', '==', user.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: OrderItem[] = [];
        snap.forEach((docSnap) => {
          const d: any = docSnap.data();
          const ts =
            d?.timestamp?.toMillis?.() ??
            (typeof d?.timestamp === 'number' ? d.timestamp : Date.now());
          const priceInUsd = Number(d?.amountUsd ?? d?.priceInUsd ?? 0);
          const priceInInr = Number(d?.amountInr ?? d?.priceInInr ?? 0);
          const statusRaw = String(d?.status ?? 'Completed');
          const status: Status =
            statusRaw.toLowerCase() === 'completed'
              ? 'paid'
              : statusRaw.toLowerCase() === 'refunded'
              ? 'refunded'
              : statusRaw.toLowerCase() === 'pending'
              ? 'pending'
              : statusRaw.toLowerCase() === 'failed'
              ? 'failed'
              : 'paid';
          const orderStatus: OrderStatus = status === 'paid' ? 'completed' : 'processing';

          list.push({
            id: docSnap.id,
            title: d?.productTitle ?? d?.title ?? 'Order',
            priceInUsd,
            priceInInr,
            status,
            orderStatus,
            type: (d?.type as any) ?? 'Digital',
            purchaseDate: new Date(ts).toISOString(),
            method: d?.paymentMode ?? d?.method,
            transactionId: d?.transactionId,
            buyer: d?.buyer ?? (d?.userId === user.id ? 'You' : d?.userName),
            downloadUrl: d?.downloadUrl ?? null,
            features: d?.features ?? [],
            steps: d?.steps ?? [],
            updates: d?.updates ?? [],
            release: d?.release ?? undefined,
            chatId: d?.chatId ?? null,
          });
        });
        list.sort(
          (a, b) =>
            new Date(b.purchaseDate || 0).getTime() -
            new Date(a.purchaseDate || 0).getTime()
        );
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error('Orders load failed', err);
        setError('Unable to load orders. Please try again.');
        setLoading(false);
      }
    );

    return () => {
      try {
        unsub();
      } catch {}
    };
  }, [user?.id]);

  // Setup chat
  useEffect(() => {
    if (!selected || !user?.id) return;
    const s = io('http://localhost:4000', { withCredentials: true });
    s.emit('identify', { role: 'user', userId: user.id });
    setSocket(s);
    
    fetch('http://localhost:4000/api/agents/status')
      .then((r) => r.json())
      .then((d) => setAgentOnline(!!d.available))
      .catch(() => {});
    
    s.on('agent:status', ({ available }) => setAgentOnline(!!available));
    
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const chat = await res.json();
      if (chat?._id) {
        setChatId(chat._id);
        socket?.emit('chat:join', { chatId: chat._id });
        await updateDoc(doc(firestore, 'orders', selected.id), { chatId: chat._id });
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
      const walletRef = doc(firestore, 'wallets', user.id);
      const orderRef = doc(firestore, 'orders', selected.id);

      await runTransaction(firestore, async (tx) => {
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists()) throw new Error('Wallet not found');

        const w: any = walletSnap.data();

        if (payCurrency === 'USDT') {
          const main = Number(w?.mainUsdt ?? 0);
          const purchase = Number(w?.purchaseUsdt ?? 0);

          if (usePurchase) {
            const half = Number((amount / 2).toFixed(2));
            if (purchase < half || main < half) {
              throw new Error('Insufficient USDT in wallets for split.');
            }
            tx.update(walletRef, { mainUsdt: main - half, purchaseUsdt: purchase - half });
          } else {
            if (main < amount) {
              throw new Error('Insufficient USDT in Main Wallet.');
            }
            tx.update(walletRef, { mainUsdt: Number((main - amount).toFixed(2)) });
          }
        } else {
          const main = Number(w?.mainInr ?? 0);
          const purchase = Number(w?.purchaseInr ?? 0);

          if (usePurchase) {
            const half = Math.floor(amount / 2);
            if (purchase < half || main < half) {
              throw new Error('Insufficient INR in wallets for split.');
            }
            tx.update(walletRef, { mainInr: main - half, purchaseInr: purchase - half });
          } else {
            if (main < amount) {
              throw new Error('Insufficient INR in Main Wallet.');
            }
            tx.update(walletRef, { mainInr: main - amount });
          }
        }

        tx.update(orderRef, { status: 'Completed', paymentMode: payCurrency });
      });

      try {
        const nid = crypto.randomUUID();
        await notifyAdminPayment({
          id: nid,
          orderId: selected.id,
          userId: user.id,
          amountUsd: selected.priceInUsd || 0,
          method: payCurrency
        });
      } catch {}

      setSelected({ ...selected, status: 'paid', method: payCurrency });
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  }, [user?.id, selected, payCurrency, usePurchase]);

  const submitUpiPayment = useCallback(async () => {
    if (!user?.id || !selected) return;
    try {
      const orderRef = doc(firestore, 'orders', selected.id);
      await updateDoc(orderRef, { paymentMode: 'INR', status: 'Pending', transactionId: upiTxnId });
      try {
        const nid = crypto.randomUUID();
        await notifyAdminPayment({ id: nid, orderId: selected.id, userId: user.id, amountUsd: selected.priceInUsd || 0, method: 'INR' });
      } catch {}
      setSelected({ ...selected, method: 'INR', status: 'pending', transactionId: upiTxnId });
      alert('UPI payment submitted. Wait 15–30 minutes for admin approval.');
    } catch (e) {
      console.error(e);
    }
  }, [user?.id, selected, upiTxnId]);

  const handleRefund = async (o: OrderItem) => {
    if (!user?.id) return;
    await updateDoc(doc(firestore, 'orders', o.id), { status: 'Refunded' });
  };

  const handleMarkPaid = async (o: OrderItem) => {
    if (!user?.id) return;
    await updateDoc(doc(firestore, 'orders', o.id), { status: 'Completed' });
  };

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesOrderStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
      const matchesType = typeFilter === 'all' || o.type === typeFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || [o.title, o.transactionId, o.buyer].some((x) => 
        (x || '').toLowerCase().includes(term)
      );
      
      if (!fromDate && !toDate) return matchesStatus && matchesOrderStatus && matchesType && matchesSearch;
      
      const t = o.purchaseDate ? new Date(o.purchaseDate).getTime() : 0;
      const f = fromDate ? new Date(fromDate).getTime() : -Infinity;
      const to = toDate ? new Date(toDate).getTime() : Infinity;
      
      return matchesStatus && matchesOrderStatus && matchesType && matchesSearch && t >= f && t <= to;
    });
  }, [orders, statusFilter, orderStatusFilter, typeFilter, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + (o.priceInUsd || 0), 0);
    const paidOrders = orders.filter(o => o.status === 'paid').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.orderStatus === 'completed').length;
    
    return { totalSpent, paidOrders, pendingOrders, completedOrders };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header - Fixed at top */}
      <div className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Title and Filter Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30">
                <ShoppingBagIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  My Orders
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {filtered.length} {filtered.length === 1 ? 'order' : 'orders'} found
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20' 
                  : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Filters</span>
              {showFilters && <XMarkIcon className="w-4 h-4" />}
            </button>
          </div>

          {/* Stats Cards - Only show when filters are hidden */}
          {!showFilters && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 animate-in fade-in-50 slide-in-from-top-5 duration-300">
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-400">
                      {formatCurrency(stats.totalSpent)}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CreditCardIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Paid Orders</p>
                    <p className="text-lg sm:text-xl font-bold text-cyan-400">{stats.paidOrders}</p>
                  </div>
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Pending</p>
                    <p className="text-lg sm:text-xl font-bold text-amber-400">{stats.pendingOrders}</p>
                  </div>
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Completed</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-400">{stats.completedOrders}</p>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <ShoppingBagIcon className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Panel - Only show when button is clicked */}
          {showFilters && (
            <div className="mt-6 p-4 sm:p-5 bg-gray-800/30 border border-gray-700/30 rounded-xl space-y-4 animate-in fade-in-50 slide-in-from-top-5 duration-300">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, ID, or buyer..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Status Filters */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Payment Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        statusFilter === s
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/30'
                      }`}
                    >
                      {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type and Order Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Product Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Types</option>
                    <option value="Service">Service</option>
                    <option value="Digital">Digital</option>
                    <option value="Subscription">Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Order Status</label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Orders</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setOrderStatusFilter('all');
                    setFromDate('');
                    setToDate('');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 animate-pulse"
              >
                <div className="h-4 w-3/4 bg-gray-700/50 rounded mb-3" />
                <div className="h-3 w-1/2 bg-gray-700/30 rounded mb-2" />
                <div className="h-3 w-2/3 bg-gray-700/30 rounded mb-4" />
                <div className="h-8 w-full bg-gray-700/30 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBagIcon className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">Start exploring our services and digital products</p>
            <button
              onClick={() => navigate('/dashboard/digital-products')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {pageItems.map((o) => (
                <div
                  key={o.id}
                  className="group bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelected(o)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-base font-semibold text-white line-clamp-2 flex-1 mr-2">
                      {o.title}
                    </h3>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusBadge(
                        o.status
                      )}`}
                    >
                      <StatusIcon status={o.status} />
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Amount:</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(o.priceInUsd || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Date:</span>
                      <span className="text-gray-300">{formatDate(o.purchaseDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${orderStatusBadge(
                          o.orderStatus
                        )}`}
                      >
                        {o.orderStatus
                          ? o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-700/30 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(o);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-700/30 hover:bg-gray-600/40 rounded-lg text-xs font-medium transition-all"
                    >
                      Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${o.id}/invoice`);
                      }}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 rounded-lg text-xs font-medium transition-all"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 inline mr-1" />
                      Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-700/30">
              <p className="text-sm text-gray-400">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of{' '}
                {filtered.length} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`p-2 rounded-lg transition-all ${
                    page === 1
                      ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={totalPages === page}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`p-2 rounded-lg transition-all ${
                    totalPages === page
                      ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Modal - Keep the same as before */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Order Details
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 hover:bg-gray-800/50 rounded-lg transition-all"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="text-sm font-mono text-white bg-gray-800/50 px-3 py-2 rounded-lg">
                    {selected.transactionId || selected.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Product/Service</p>
                  <p className="text-sm text-white font-medium">{selected.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm text-gray-300">{selected.type || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Buyer</p>
                  <p className="text-sm text-gray-300">{selected.buyer || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Purchase Date</p>
                  <p className="text-sm text-gray-300">{formatDate(selected.purchaseDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-sm text-gray-300">{selected.method || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border ${statusBadge(
                      selected.status
                    )}`}
                  >
                    <StatusIcon status={selected.status} />
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Order Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${orderStatusBadge(
                      selected.orderStatus
                    )}`}
                  >
                    {selected.orderStatus
                      ? selected.orderStatus.charAt(0).toUpperCase() + selected.orderStatus.slice(1)
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Amount Card */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Total Amount</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(selected.priceInUsd || 0, 'USD')}
                  </p>
                  <p className="text-lg text-gray-400">
                    {formatCurrency(selected.priceInInr || 0, 'INR')}
                  </p>
                </div>
              </div>

              {/* Download Link */}
              {selected.downloadUrl && (
                <a
                  href={selected.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all group"
                >
                  <span className="text-sm font-medium text-emerald-400">Download Available</span>
                  <DocumentArrowDownIcon className="w-5 h-5 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                </a>
              )}

              {/* Features */}
              {selected.features?.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Features</h4>
                  <ul className="space-y-2">
                    {selected.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircleIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Steps */}
              {selected.steps?.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Delivery Steps</h4>
                  <ol className="space-y-2">
                    {selected.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {/* Updates */}
              {selected.updates?.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Updates</h4>
                  <div className="space-y-2">
                    {selected.updates.map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                      >
                        <span className="text-sm text-gray-300">{u.message}</span>
                        <span className="text-xs text-gray-500">{formatDate(u.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Chat Section */}
              {chatId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Support Chat</h4>
                    <span
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                        agentOnline
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-700/50 text-gray-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          agentOnline ? 'bg-emerald-400' : 'bg-gray-500'
                        }`}
                      />
                      {agentOnline ? 'Agent Online' : 'Agent Offline'}
                    </span>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
                    <div className="h-64 overflow-y-auto p-4 space-y-3">
                      {chatLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                          No messages yet
                        </div>
                      ) : (
                        messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${
                              msg.senderType === 'USER' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2 rounded-xl ${
                                msg.senderType === 'USER'
                                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                  : 'bg-gray-700/50 text-gray-200'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 bg-gray-900/50 border-t border-gray-700/30 flex gap-2">
                      <input
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!msgInput.trim()}
                        className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <PaperAirplaneIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!chatId && (
                <button
                  onClick={requestChat}
                  disabled={chatLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 transition-all"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span className="font-medium">
                    {chatLoading ? 'Starting chat...' : 'Start Support Chat'}
                  </span>
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-4">
                {/* Payment Options */}
                {selected.status !== 'paid' && (
                  <div className="rounded-xl border border-gray-700/50 p-4 bg-gray-800/30">
                    <p className="text-sm font-semibold text-white mb-3">Payment Options</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Digi Wallet */}
                      <div className="rounded-lg bg-gray-900/40 border border-gray-700/50 p-3">
                        <p className="text-sm text-gray-300 mb-2">Digi Wallet</p>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs text-gray-400">Currency</label>
                          <select
                            value={payCurrency}
                            onChange={(e) => setPayCurrency(e.target.value as any)}
                            className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700/50 text-white text-xs"
                          >
                            <option value="USDT">USDT</option>
                            <option value="INR">INR</option>
                          </select>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-gray-300">
                          <input type="checkbox" checked={usePurchase} onChange={(e) => setUsePurchase(e.target.checked)} />
                          Split 50% Main Wallet + 50% Purchase Wallet
                        </label>
                        <button
                          onClick={doPay}
                          disabled={isPaying}
                          className="mt-3 w-full px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 rounded-lg text-sm"
                        >
                          {isPaying ? 'Processing...' : 'Pay with Digi Wallet'}
                        </button>
                      </div>

                      {/* UPI Payment */}
                      <div className="rounded-lg bg-gray-900/40 border border-gray-700/50 p-3">
                        <p className="text-sm text-gray-300 mb-2">UPI Payment</p>
                        <div className="text-xs text-gray-400 mb-2">Pay to UPI ID: <span className="text-white font-mono">digilinex@ibl</span></div>
                        <input
                          value={upiTxnId}
                          onChange={(e) => setUpiTxnId(e.target.value)}
                          placeholder="Enter UTR / Transaction ID"
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500"
                        />
                        <button
                          onClick={submitUpiPayment}
                          disabled={!upiTxnId.trim()}
                          className="mt-3 w-full px-3 py-2 bg-cyan-600/90 hover:bg-cyan-600 rounded-lg text-sm"
                        >
                          Submit UPI Payment
                        </button>
                        <div className="text-[11px] text-gray-500 mt-2">Wait 15–30 minutes for admin approval.</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/orders/${selected.id}/invoice`)}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span className="font-medium">Invoice</span>
                  </button>
                  
                  {selected.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(selected)}
                      className="flex-1 min-w-[140px] px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 rounded-lg transition-all"
                    >
                      Mark as Paid
                    </button>
                  )}
                  
                  {selected.status === 'paid' && (
                    <button
                      onClick={() => handleRefund(selected)}
                      className="flex-1 min-w-[140px] px-4 py-2.5 bg-red-600/90 hover:bg-red-600 rounded-lg transition-all"
                    >
                      Request Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
