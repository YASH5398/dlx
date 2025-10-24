import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
export default function AdminAffiliates() {
    const [rows, setRows] = useState([]);
    useEffect(() => {
        const unsub = onSnapshot(collection(firestore, 'affiliates'), (snap) => {
            setRows(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        }, (err) => console.error('Failed to stream affiliates:', err));
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    const totals = useMemo(() => {
        return rows.reduce((acc, a) => ({
            clicks: acc.clicks + (a.clicks ?? 0),
            referrals: acc.referrals + (a.referrals ?? 0),
            sales: acc.sales + (a.sales ?? 0),
            earnings: acc.earnings + (a.earnings ?? 0),
        }), { clicks: 0, referrals: 0, sales: 0, earnings: 0 });
    }, [rows]);
    const toggleApproval = async (id, approved) => {
        if (!id)
            return;
        await updateDoc(doc(firestore, 'affiliates', id), { approved: !approved, updatedAt: Date.now() });
    };
    const cards = [
        {
            label: 'Total Clicks',
            value: totals.clicks,
            icon: (_jsx("svg", { className: "w-8 h-8 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 15l-2 5L9 9l11 4-5 2z" }) })),
            gradient: 'from-blue-600/10 to-blue-900/10'
        },
        {
            label: 'Total Referrals',
            value: totals.referrals,
            icon: (_jsx("svg", { className: "w-8 h-8 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 1.714a5.002 5.002 0 0110.288 0" }) })),
            gradient: 'from-green-600/10 to-green-900/10'
        },
        {
            label: 'Total Sales',
            value: totals.sales,
            icon: (_jsx("svg", { className: "w-8 h-8 text-yellow-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" }) })),
            gradient: 'from-yellow-600/10 to-yellow-900/10'
        },
        {
            label: 'Total Earnings',
            value: `$${totals.earnings.toFixed(2)}`,
            icon: (_jsx("svg", { className: "w-8 h-8 text-purple-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })),
            gradient: 'from-purple-600/10 to-purple-900/10'
        },
    ];
    return (_jsx("div", { className: "min-h-screen bg-gray-950 text-white p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("header", { className: "mb-10", children: [_jsx("h1", { className: "text-4xl font-extrabold tracking-tight", children: "Affiliate Management" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Monitor and manage affiliate performance metrics" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10", children: cards.map((c) => (_jsxs("div", { className: `relative rounded-2xl bg-gradient-to-br ${c.gradient} border border-gray-800/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400 font-semibold uppercase tracking-wider", children: c.label }), _jsx("div", { className: "text-3xl font-bold mt-1", children: c.value })] }), _jsx("div", { className: "opacity-60", children: c.icon })] }), _jsx("div", { className: "absolute inset-0 rounded-2xl overflow-hidden", children: _jsx("div", { className: "absolute inset-0 bg-gray-900/50 opacity-0 hover:opacity-10 transition-opacity duration-300" }) })] }, c.label))) }), _jsxs("div", { className: "rounded-2xl bg-gray-900/50 border border-gray-800/50 p-6 shadow-xl backdrop-blur-sm", children: [_jsx("h2", { className: "text-2xl font-semibold mb-6", children: "Affiliate Applications" }), rows.length === 0 ? (_jsx("div", { className: "text-gray-400 text-center py-8", children: "No affiliate applications found." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-gray-400 text-sm uppercase tracking-wider", children: [_jsx("th", { className: "py-3 px-4", children: "Affiliate" }), _jsx("th", { className: "py-3 px-4", children: "Clicks" }), _jsx("th", { className: "py-3 px-4", children: "Referrals" }), _jsx("th", { className: "py-3 px-4", children: "Sales" }), _jsx("th", { className: "py-3 px-4", children: "Earnings" }), _jsx("th", { className: "py-3 px-4", children: "Status" }), _jsx("th", { className: "py-3 px-4", children: "Action" })] }) }), _jsx("tbody", { children: rows.map((a) => (_jsxs("tr", { className: "border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200", children: [_jsx("td", { className: "py-4 px-4 font-medium", children: a.slug || a.ownerId || 'Affiliate' }), _jsx("td", { className: "py-4 px-4", children: a.clicks || 0 }), _jsx("td", { className: "py-4 px-4", children: a.referrals || 0 }), _jsx("td", { className: "py-4 px-4", children: a.sales || 0 }), _jsxs("td", { className: "py-4 px-4", children: ["$", (a.earnings || 0).toFixed(2)] }), _jsx("td", { className: "py-4 px-4", children: _jsx("span", { className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${a.approved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`, children: a.approved ? 'Approved' : 'Pending' }) }), _jsx("td", { className: "py-4 px-4", children: _jsx("button", { onClick: () => toggleApproval(a.id, a.approved), className: `px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${a.approved
                                                            ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/30'
                                                            : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-600/30'}`, children: a.approved ? 'Unapprove' : 'Approve' }) })] }, a.id))) })] }) }))] })] }) }));
}
