import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
export default function AdminOrders() {
    const [rows, setRows] = useState([]);
    const [updating, setUpdating] = useState(null);
    useEffect(() => {
        const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const arr = [];
            snap.forEach((docSnap) => {
                const d = docSnap.data() || {};
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
            setRows(arr);
        }, (err) => {
            console.error('Failed to stream orders:', err);
            toast.error('Failed to load orders');
        });
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            await updateDoc(doc(firestore, 'orders', id), { status });
            toast.success('Order status updated');
        }
        catch (e) {
            console.error(e);
            toast.error('Failed to update status');
        }
        finally {
            setUpdating(null);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-950 text-white p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("header", { className: "mb-10", children: [_jsx("h1", { className: "text-4xl font-extrabold tracking-tight", children: "Order Management" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Track and update customer orders in real-time" })] }), _jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-800/50 p-6 shadow-xl backdrop-blur-sm", children: [_jsx("h2", { className: "text-2xl font-semibold mb-6", children: "Orders" }), rows.length === 0 ? (_jsx("div", { className: "text-gray-400 text-center py-8", children: "No orders found." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-gray-400 text-sm uppercase tracking-wider", children: [_jsx("th", { className: "py-3 px-4", children: "Product" }), _jsx("th", { className: "py-3 px-4", children: "Buyer" }), _jsx("th", { className: "py-3 px-4", children: "Total" }), _jsx("th", { className: "py-3 px-4", children: "Payment" }), _jsx("th", { className: "py-3 px-4", children: "Date" }), _jsx("th", { className: "py-3 px-4", children: "Status" }), _jsx("th", { className: "py-3 px-4", children: "Download" })] }) }), _jsx("tbody", { children: rows.map((o) => (_jsxs("tr", { className: "border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200", children: [_jsx("td", { className: "py-4 px-4 font-medium", children: o.productName }), _jsx("td", { className: "py-4 px-4", children: o.user }), _jsxs("td", { className: "py-4 px-4 text-emerald-400 font-bold", children: ["$", o.total.toFixed(2)] }), _jsxs("td", { className: "py-4 px-4", children: [o.paymentMethod, " ", _jsxs("span", { className: "text-gray-400", children: ["(", o.paymentStatus, ")"] })] }), _jsx("td", { className: "py-4 px-4", children: o.createdAt ? new Date(o.createdAt).toLocaleString() : '-' }), _jsx("td", { className: "py-4 px-4", children: _jsxs("select", { value: o.status, onChange: (e) => updateStatus(o.id, e.target.value), disabled: updating === o.id, className: `text-sm rounded-lg px-3 py-1.5 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${o.status === 'delivered'
                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                            : o.status === 'processing'
                                                                ? 'bg-yellow-500/20 text-yellow-300'
                                                                : 'bg-red-500/20 text-red-300'} ${updating === o.id ? 'opacity-50 cursor-not-allowed' : ''}`, children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "processing", children: "Processing" }), _jsx("option", { value: "delivered", children: "Delivered" })] }) }), _jsx("td", { className: "py-4 px-4", children: o.downloadUrl && (_jsxs("a", { href: o.downloadUrl, target: "_blank", rel: "noreferrer", className: "inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors", children: [_jsx("svg", { className: "w-4 h-4 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }), "Link"] })) })] }, o.id))) })] }) }))] })] }) }));
}
