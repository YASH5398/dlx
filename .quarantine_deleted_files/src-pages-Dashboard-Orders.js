import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { firestore } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { notifyAdminPayment } from '../../utils/notifications';
import { ShoppingBagIcon, FunnelIcon, MagnifyingGlassIcon, XMarkIcon, ChatBubbleLeftRightIcon, CreditCardIcon, DocumentArrowDownIcon, CheckCircleIcon, ClockIcon, XCircleIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
const formatCurrency = (n, currency = 'USD') => currency === 'USD' ? `$${(n ?? 0).toFixed(2)}` : `₹${(n ?? 0).toFixed(2)}`;
const formatDate = (iso) => {
    if (!iso)
        return '—';
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const StatusIcon = ({ status }) => {
    switch (status) {
        case 'paid':
            return _jsx(CheckCircleIcon, { className: "w-4 h-4" });
        case 'pending':
            return _jsx(ClockIcon, { className: "w-4 h-4" });
        case 'failed':
            return _jsx(XCircleIcon, { className: "w-4 h-4" });
        case 'refunded':
            return _jsx(ArrowPathIcon, { className: "w-4 h-4" });
    }
};
const statusBadge = (s) => {
    const styles = {
        paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
        failed: 'bg-red-500/20 text-red-400 border-red-500/50',
        refunded: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    };
    return styles[s] || '';
};
const orderStatusBadge = (s) => {
    const styles = {
        processing: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return styles[s || 'processing'] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
};
export default function Orders() {
    const { user } = useUser();
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 8;
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();
    // Chat & payment state
    const [agentOnline, setAgentOnline] = useState(false);
    const [socket, setSocket] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState('');
    const [chatId, setChatId] = useState(null);
    const [payCurrency, setPayCurrency] = useState('USDT');
    const [usePurchase, setUsePurchase] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    // Fetch orders (Firestore)
    useEffect(() => {
        if (!user?.id)
            return;
        setLoading(true);
        setError(null);
        const q = query(collection(firestore, 'orders'), where('userId', '==', user.id));
        const unsub = onSnapshot(q, (snap) => {
            const list = [];
            snap.forEach((docSnap) => {
                const d = docSnap.data();
                const ts = d?.timestamp?.toMillis?.() ??
                    (typeof d?.timestamp === 'number' ? d.timestamp : Date.now());
                const priceInUsd = Number(d?.amountUsd ?? d?.priceInUsd ?? 0);
                const priceInInr = Number(d?.amountInr ?? d?.priceInInr ?? 0);
                const statusRaw = String(d?.status ?? 'Completed');
                const status = statusRaw.toLowerCase() === 'completed'
                    ? 'paid'
                    : statusRaw.toLowerCase() === 'refunded'
                        ? 'refunded'
                        : statusRaw.toLowerCase() === 'pending'
                            ? 'pending'
                            : statusRaw.toLowerCase() === 'failed'
                                ? 'failed'
                                : 'paid';
                const orderStatus = status === 'paid' ? 'completed' : 'processing';
                list.push({
                    id: docSnap.id,
                    title: d?.productTitle ?? d?.title ?? 'Order',
                    priceInUsd,
                    priceInInr,
                    status,
                    orderStatus,
                    type: d?.type ?? 'Digital',
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
            list.sort((a, b) => new Date(b.purchaseDate || 0).getTime() -
                new Date(a.purchaseDate || 0).getTime());
            setOrders(list);
            setLoading(false);
        }, (err) => {
            console.error('Orders load failed', err);
            setError('Unable to load orders. Please try again.');
            setLoading(false);
        });
        return () => {
            try {
                unsub();
            }
            catch { }
        };
    }, [user?.id]);
    // Setup chat
    useEffect(() => {
        if (!selected || !user?.id)
            return;
        const s = io('http://localhost:4000', { withCredentials: true });
        s.emit('identify', { role: 'user', userId: user.id });
        setSocket(s);
        fetch('http://localhost:4000/api/agents/status')
            .then((r) => r.json())
            .then((d) => setAgentOnline(!!d.available))
            .catch(() => { });
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
        }
        else {
            setMessages([]);
        }
        s.on('chat:message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => {
            try {
                s.disconnect();
            }
            catch { }
        };
    }, [selected?.id]);
    const requestChat = useCallback(async () => {
        if (!user?.id || !selected)
            return;
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
        }
        finally {
            setChatLoading(false);
        }
    }, [user?.id, selected?.id, socket]);
    const sendMessage = useCallback(() => {
        if (!socket || !chatId || !msgInput.trim())
            return;
        socket.emit('chat:send', { chatId, senderType: 'USER', content: msgInput });
        setMsgInput('');
    }, [socket, chatId, msgInput]);
    const doPay = useCallback(async () => {
        if (!user?.id || !selected)
            return;
        setIsPaying(true);
        try {
            const amount = payCurrency === 'USDT' ? (selected.priceInUsd || 0) : (selected.priceInInr || 0);
            const walletRef = doc(firestore, 'wallets', user.id);
            const orderRef = doc(firestore, 'orders', selected.id);
            await runTransaction(firestore, async (tx) => {
                const walletSnap = await tx.get(walletRef);
                if (!walletSnap.exists())
                    throw new Error('Wallet not found');
                const w = walletSnap.data();
                if (payCurrency === 'USDT') {
                    const main = Number(w?.mainUsdt ?? 0);
                    const purchase = Number(w?.purchaseUsdt ?? 0);
                    if (usePurchase) {
                        const half = Number((amount / 2).toFixed(2));
                        if (purchase < half || main < half) {
                            throw new Error('Insufficient USDT in wallets for split.');
                        }
                        tx.update(walletRef, { mainUsdt: main - half, purchaseUsdt: purchase - half });
                    }
                    else {
                        if (main < amount) {
                            throw new Error('Insufficient USDT in Main Wallet.');
                        }
                        tx.update(walletRef, { mainUsdt: Number((main - amount).toFixed(2)) });
                    }
                }
                else {
                    const main = Number(w?.mainInr ?? 0);
                    const purchase = Number(w?.purchaseInr ?? 0);
                    if (usePurchase) {
                        const half = Math.floor(amount / 2);
                        if (purchase < half || main < half) {
                            throw new Error('Insufficient INR in wallets for split.');
                        }
                        tx.update(walletRef, { mainInr: main - half, purchaseInr: purchase - half });
                    }
                    else {
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
            }
            catch { }
            setSelected({ ...selected, status: 'paid', method: payCurrency });
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setIsPaying(false);
        }
    }, [user?.id, selected, payCurrency, usePurchase]);
    const handleRefund = async (o) => {
        if (!user?.id)
            return;
        await updateDoc(doc(firestore, 'orders', o.id), { status: 'Refunded' });
    };
    const handleMarkPaid = async (o) => {
        if (!user?.id)
            return;
        await updateDoc(doc(firestore, 'orders', o.id), { status: 'Completed' });
    };
    // Filtered orders
    const filtered = useMemo(() => {
        return orders.filter((o) => {
            const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
            const matchesOrderStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
            const matchesType = typeFilter === 'all' || o.type === typeFilter;
            const term = search.trim().toLowerCase();
            const matchesSearch = !term || [o.title, o.transactionId, o.buyer].some((x) => (x || '').toLowerCase().includes(term));
            if (!fromDate && !toDate)
                return matchesStatus && matchesOrderStatus && matchesType && matchesSearch;
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
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white", children: [_jsx("div", { className: "bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30", children: _jsx(ShoppingBagIcon, { className: "w-6 h-6 text-cyan-400" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", children: "My Orders" }), _jsxs("p", { className: "text-sm text-gray-400 mt-0.5", children: [filtered.length, " ", filtered.length === 1 ? 'order' : 'orders', " found"] })] })] }), _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: `flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${showFilters
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                                        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'}`, children: [_jsx(FunnelIcon, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Filters" }), showFilters && _jsx(XMarkIcon, { className: "w-4 h-4" })] })] }), !showFilters && (_jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 animate-in fade-in-50 slide-in-from-top-5 duration-300", children: [_jsx("div", { className: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Total Spent" }), _jsx("p", { className: "text-lg sm:text-xl font-bold text-emerald-400", children: formatCurrency(stats.totalSpent) })] }), _jsx("div", { className: "p-2 bg-emerald-500/20 rounded-lg", children: _jsx(CreditCardIcon, { className: "w-5 h-5 text-emerald-400" }) })] }) }), _jsx("div", { className: "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Paid Orders" }), _jsx("p", { className: "text-lg sm:text-xl font-bold text-cyan-400", children: stats.paidOrders })] }), _jsx("div", { className: "p-2 bg-cyan-500/20 rounded-lg", children: _jsx(CheckCircleIcon, { className: "w-5 h-5 text-cyan-400" }) })] }) }), _jsx("div", { className: "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Pending" }), _jsx("p", { className: "text-lg sm:text-xl font-bold text-amber-400", children: stats.pendingOrders })] }), _jsx("div", { className: "p-2 bg-amber-500/20 rounded-lg", children: _jsx(ClockIcon, { className: "w-5 h-5 text-amber-400" }) })] }) }), _jsx("div", { className: "bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Completed" }), _jsx("p", { className: "text-lg sm:text-xl font-bold text-purple-400", children: stats.completedOrders })] }), _jsx("div", { className: "p-2 bg-purple-500/20 rounded-lg", children: _jsx(ShoppingBagIcon, { className: "w-5 h-5 text-purple-400" }) })] }) })] })), showFilters && (_jsxs("div", { className: "mt-6 p-4 sm:p-5 bg-gray-800/30 border border-gray-700/30 rounded-xl space-y-4 animate-in fade-in-50 slide-in-from-top-5 duration-300", children: [_jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by title, ID, or buyer...", className: "w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-400 mb-2 block", children: "Payment Status" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['all', 'paid', 'pending', 'failed', 'refunded'].map((s) => (_jsx("button", { onClick: () => setStatusFilter(s), className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${statusFilter === s
                                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                                                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/30'}`, children: s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1) }, s))) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-400 mb-1.5 block", children: "Product Type" }), _jsxs("select", { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), className: "w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "Service", children: "Service" }), _jsx("option", { value: "Digital", children: "Digital" }), _jsx("option", { value: "Subscription", children: "Subscription" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-400 mb-1.5 block", children: "Order Status" }), _jsxs("select", { value: orderStatusFilter, onChange: (e) => setOrderStatusFilter(e.target.value), className: "w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50", children: [_jsx("option", { value: "all", children: "All Orders" }), _jsx("option", { value: "processing", children: "Processing" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-400 mb-1.5 block", children: "From Date" }), _jsx("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), className: "w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-400 mb-1.5 block", children: "To Date" }), _jsx("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), className: "w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50" })] })] }), _jsx("div", { className: "flex justify-end pt-2", children: _jsx("button", { onClick: () => {
                                            setSearch('');
                                            setStatusFilter('all');
                                            setTypeFilter('all');
                                            setOrderStatusFilter('all');
                                            setFromDate('');
                                            setToDate('');
                                        }, className: "px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors", children: "Clear All Filters" }) })] }))] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: loading ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: Array.from({ length: 8 }).map((_, i) => (_jsxs("div", { className: "bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 animate-pulse", children: [_jsx("div", { className: "h-4 w-3/4 bg-gray-700/50 rounded mb-3" }), _jsx("div", { className: "h-3 w-1/2 bg-gray-700/30 rounded mb-2" }), _jsx("div", { className: "h-3 w-2/3 bg-gray-700/30 rounded mb-4" }), _jsx("div", { className: "h-8 w-full bg-gray-700/30 rounded" })] }, `skeleton-${i}`))) })) : error ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(XCircleIcon, { className: "w-16 h-16 text-red-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-300 mb-4", children: error }), _jsx("button", { onClick: () => window.location.reload(), className: "px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all", children: "Retry" })] })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx(ShoppingBagIcon, { className: "w-20 h-20 text-gray-600 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-300 mb-2", children: "No orders found" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Start exploring our services and digital products" }), _jsx("button", { onClick: () => navigate('/dashboard/digital-products'), className: "px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all", children: "Browse Services" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8", children: pageItems.map((o) => (_jsxs("div", { className: "group bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer", onClick: () => setSelected(o), children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsx("h3", { className: "text-base font-semibold text-white line-clamp-2 flex-1 mr-2", children: o.title }), _jsxs("span", { className: `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusBadge(o.status)}`, children: [_jsx(StatusIcon, { status: o.status }), o.status.charAt(0).toUpperCase() + o.status.slice(1)] })] }), _jsxs("div", { className: "space-y-2.5 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between text-gray-400", children: [_jsx("span", { children: "Amount:" }), _jsx("span", { className: "text-white font-semibold", children: formatCurrency(o.priceInUsd || 0) })] }), _jsxs("div", { className: "flex items-center justify-between text-gray-400", children: [_jsx("span", { children: "Date:" }), _jsx("span", { className: "text-gray-300", children: formatDate(o.purchaseDate) })] }), _jsxs("div", { className: "flex items-center justify-between text-gray-400", children: [_jsx("span", { children: "Status:" }), _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium border ${orderStatusBadge(o.orderStatus)}`, children: o.orderStatus
                                                            ? o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1)
                                                            : 'N/A' })] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-gray-700/30 flex gap-2", children: [_jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    setSelected(o);
                                                }, className: "flex-1 px-3 py-2 bg-gray-700/30 hover:bg-gray-600/40 rounded-lg text-xs font-medium transition-all", children: "Details" }), _jsxs("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    navigate(`/orders/${o.id}/invoice`);
                                                }, className: "flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 rounded-lg text-xs font-medium transition-all", children: [_jsx(DocumentArrowDownIcon, { className: "w-4 h-4 inline mr-1" }), "Invoice"] })] })] }, o.id))) }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-700/30", children: [_jsxs("p", { className: "text-sm text-gray-400", children: ["Showing ", (page - 1) * pageSize + 1, "\u2013", Math.min(page * pageSize, filtered.length), " of", ' ', filtered.length, " orders"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { disabled: page === 1, onClick: () => setPage((p) => Math.max(1, p - 1)), className: `p-2 rounded-lg transition-all ${page === 1
                                                ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`, children: _jsx(ChevronLeftIcon, { className: "w-5 h-5" }) }), _jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                }
                                                else if (page <= 3) {
                                                    pageNum = i + 1;
                                                }
                                                else if (page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                }
                                                else {
                                                    pageNum = page - 2 + i;
                                                }
                                                return (_jsx("button", { onClick: () => setPage(pageNum), className: `w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === pageNum
                                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`, children: pageNum }, pageNum));
                                            }) }), _jsx("button", { disabled: totalPages === page, onClick: () => setPage((p) => Math.min(totalPages, p + 1)), className: `p-2 rounded-lg transition-all ${totalPages === page
                                                ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`, children: _jsx(ChevronRightIcon, { className: "w-5 h-5" }) })] })] })] })) }), selected && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-300", children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: () => setSelected(null) }), _jsxs("div", { className: "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300", children: [_jsx("div", { className: "sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent", children: "Order Details" }), _jsx("button", { onClick: () => setSelected(null), className: "p-2 hover:bg-gray-800/50 rounded-lg transition-all", children: _jsx(XMarkIcon, { className: "w-5 h-5 text-gray-400" }) })] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Order ID" }), _jsx("p", { className: "text-sm font-mono text-white bg-gray-800/50 px-3 py-2 rounded-lg", children: selected.transactionId || selected.id })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Product/Service" }), _jsx("p", { className: "text-sm text-white font-medium", children: selected.title })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Type" }), _jsx("p", { className: "text-sm text-gray-300", children: selected.type || '—' })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Buyer" }), _jsx("p", { className: "text-sm text-gray-300", children: selected.buyer || '—' })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Purchase Date" }), _jsx("p", { className: "text-sm text-gray-300", children: formatDate(selected.purchaseDate) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Payment Method" }), _jsx("p", { className: "text-sm text-gray-300", children: selected.method || '—' })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Payment Status" }), _jsxs("span", { className: `inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border ${statusBadge(selected.status)}`, children: [_jsx(StatusIcon, { status: selected.status }), selected.status.charAt(0).toUpperCase() + selected.status.slice(1)] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Order Status" }), _jsx("span", { className: `inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${orderStatusBadge(selected.orderStatus)}`, children: selected.orderStatus
                                                            ? selected.orderStatus.charAt(0).toUpperCase() + selected.orderStatus.slice(1)
                                                            : '—' })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-gray-400 mb-2", children: "Total Amount" }), _jsxs("div", { className: "flex items-baseline gap-3", children: [_jsx("p", { className: "text-2xl font-bold text-white", children: formatCurrency(selected.priceInUsd || 0, 'USD') }), _jsx("p", { className: "text-lg text-gray-400", children: formatCurrency(selected.priceInInr || 0, 'INR') })] })] }), selected.downloadUrl && (_jsxs("a", { href: selected.downloadUrl, target: "_blank", rel: "noreferrer", className: "flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all group", children: [_jsx("span", { className: "text-sm font-medium text-emerald-400", children: "Download Available" }), _jsx(DocumentArrowDownIcon, { className: "w-5 h-5 text-emerald-400 group-hover:translate-y-0.5 transition-transform" })] })), selected.features?.length ? (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-semibold text-white", children: "Features" }), _jsx("ul", { className: "space-y-2", children: selected.features.map((f, i) => (_jsxs("li", { className: "flex items-start gap-2 text-sm text-gray-300", children: [_jsx(CheckCircleIcon, { className: "w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" }), _jsx("span", { children: f })] }, i))) })] })) : null, selected.steps?.length ? (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-semibold text-white", children: "Delivery Steps" }), _jsx("ol", { className: "space-y-2", children: selected.steps.map((s, i) => (_jsxs("li", { className: "flex items-start gap-3 text-sm text-gray-300", children: [_jsx("span", { className: "flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium", children: i + 1 }), _jsx("span", { className: "pt-0.5", children: s })] }, i))) })] })) : null, selected.updates?.length ? (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-semibold text-white", children: "Updates" }), _jsx("div", { className: "space-y-2", children: selected.updates.map((u, i) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-800/30 rounded-lg", children: [_jsx("span", { className: "text-sm text-gray-300", children: u.message }), _jsx("span", { className: "text-xs text-gray-500", children: formatDate(u.date) })] }, i))) })] })) : null, chatId && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "text-sm font-semibold text-white", children: "Support Chat" }), _jsxs("span", { className: `flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${agentOnline
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-gray-700/50 text-gray-400'}`, children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${agentOnline ? 'bg-emerald-400' : 'bg-gray-500'}` }), agentOnline ? 'Agent Online' : 'Agent Offline'] })] }), _jsxs("div", { className: "bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden", children: [_jsx("div", { className: "h-64 overflow-y-auto p-4 space-y-3", children: chatLoading ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" }) })) : messages.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-full text-gray-500 text-sm", children: "No messages yet" })) : (messages.map((msg, i) => (_jsx("div", { className: `flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[80%] px-4 py-2 rounded-xl ${msg.senderType === 'USER'
                                                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                                                    : 'bg-gray-700/50 text-gray-200'}`, children: _jsx("p", { className: "text-sm", children: msg.content }) }) }, i)))) }), _jsxs("div", { className: "p-3 bg-gray-900/50 border-t border-gray-700/30 flex gap-2", children: [_jsx("input", { value: msgInput, onChange: (e) => setMsgInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && sendMessage(), placeholder: "Type your message...", className: "flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" }), _jsx("button", { onClick: sendMessage, disabled: !msgInput.trim(), className: "p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all", children: _jsx(PaperAirplaneIcon, { className: "w-5 h-5 text-white" }) })] })] })] })), !chatId && (_jsxs("button", { onClick: requestChat, disabled: chatLoading, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 transition-all", children: [_jsx(ChatBubbleLeftRightIcon, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: chatLoading ? 'Starting chat...' : 'Start Support Chat' })] })), _jsxs("div", { className: "flex flex-wrap gap-3 pt-4", children: [_jsxs("button", { onClick: () => navigate(`/orders/${selected.id}/invoice`), className: "flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all", children: [_jsx(DocumentArrowDownIcon, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: "Invoice" })] }), selected.status !== 'paid' && (_jsx("button", { onClick: () => handleMarkPaid(selected), className: "flex-1 min-w-[140px] px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 rounded-lg transition-all", children: "Mark as Paid" })), selected.status === 'paid' && (_jsx("button", { onClick: () => handleRefund(selected), className: "flex-1 min-w-[140px] px-4 py-2.5 bg-red-600/90 hover:bg-red-600 rounded-lg transition-all", children: "Request Refund" }))] })] })] })] }))] }));
}
