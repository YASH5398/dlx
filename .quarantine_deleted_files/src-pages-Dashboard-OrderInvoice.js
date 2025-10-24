import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { getOrders } from '../../utils/api';
const formatCurrency = (n, currency = 'USD') => currency === 'USD' ? `$${(n ?? 0).toFixed(2)}` : `${(n ?? 0).toFixed(2)}`;
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');
export default function OrderInvoice() {
    const { user } = useUser();
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user || !orderId)
            return;
        setLoading(true);
        setError(null);
        getOrders(user.id)
            .then((list) => {
            setOrders(list);
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
        return (_jsx("div", { className: "p-6", children: _jsx("div", { className: "rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-200 p-4", children: "Missing invoice ID." }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl md:text-3xl font-bold", children: _jsx("span", { className: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", children: "Invoice" }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => window.print(), className: "px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white", children: "Print" }), _jsx("button", { onClick: () => navigate('/orders'), className: "px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15", children: "Back to Orders" })] })] }), error && (_jsx("div", { className: "rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-200 p-3", children: error })), loading ? (_jsxs("div", { className: "rounded-2xl bg-white/5 border border-white/10 p-6 animate-pulse", children: [_jsx("div", { className: "h-6 w-40 bg-white/10 rounded" }), _jsx("div", { className: "mt-3 h-4 w-64 bg-white/10 rounded" }), _jsx("div", { className: "mt-1 h-4 w-52 bg-white/10 rounded" }), _jsx("div", { className: "mt-1 h-4 w-36 bg-white/10 rounded" }), _jsx("div", { className: "mt-4 h-10 w-28 bg-white/10 rounded" })] })) : !order ? (_jsxs("div", { className: "rounded-2xl bg-white/5 border border-white/10 p-6", children: [_jsx("p", { className: "text-gray-300", children: "Invoice not found." }), _jsx("button", { onClick: () => navigate('/dashboard/digital-products'), className: "mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white", children: "Browse Services" })] })) : (_jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-300", children: "Invoice #" }), _jsx("p", { className: "font-mono text-white text-lg", children: order.transactionId || order.id })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-300", children: "Date" }), _jsx("p", { className: "text-white", children: formatDate(order.purchaseDate) })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-xl bg-white/5 border border-white/10 p-4", children: [_jsx("p", { className: "text-sm text-gray-300", children: "Product/Service" }), _jsx("p", { className: "text-white font-semibold", children: order.title }), _jsxs("p", { className: "mt-2 text-sm text-gray-300", children: ["Type: ", order.type || '—'] }), _jsxs("p", { className: "mt-1 text-sm text-gray-300", children: ["Buyer: ", order.buyer || '—'] })] }), _jsxs("div", { className: "rounded-xl bg-white/5 border border-white/10 p-4", children: [_jsx("p", { className: "text-sm text-gray-300", children: "Payment" }), _jsx("p", { className: "text-white", children: order.method || '—' }), _jsxs("p", { className: "mt-2 text-sm text-gray-300", children: ["Status: ", order.status] }), _jsxs("p", { className: "mt-1 text-sm text-gray-300", children: ["Order: ", order.orderStatus ?? '—'] })] })] }), _jsx("div", { className: "mt-6 rounded-xl bg-white/5 border border-white/10 p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm text-gray-300", children: "Amount" }), _jsxs("p", { className: "text-white text-xl font-semibold", children: [formatCurrency(order.priceInUsd || 0, 'USD'), " ", _jsxs("span", { className: "text-gray-400 text-sm", children: ["(", formatCurrency(order.priceInInr || 0, 'INR'), ")"] })] })] }) }), _jsxs("div", { className: "mt-6 text-sm text-gray-400", children: [_jsx("p", { children: "Thank you for your purchase with Digi Linex." }), _jsx("p", { className: "mt-1", children: "For support, visit the Support section in your dashboard." })] })] }))] }));
}
