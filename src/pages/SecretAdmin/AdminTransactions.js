import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collectionGroup, onSnapshot, query, orderBy } from 'firebase/firestore';
export default function AdminTransactions() {
    const [rows, setRows] = useState([]);
    useEffect(() => {
        const q = query(collectionGroup(firestore, 'transactions'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                const d = doc.data() || {};
                arr.push({ id: doc.id, amount: Number(d.amount || 0), method: d.currency || d.method || 'USDT', status: d.status || 'pending' });
            });
            setRows(arr);
        }, (err) => {
            console.error('Failed to stream transactions:', err);
        });
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    return (_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Transactions" }), _jsxs("div", { className: "space-y-2", children: [rows.map((t) => (_jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3 flex justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: t.method }), _jsx("div", { className: "text-xs text-gray-400", children: t.status })] }), _jsxs("div", { className: "text-emerald-400 font-bold", children: ["$", t.amount] })] }, t.id))), rows.length === 0 && (_jsx("div", { className: "text-sm text-gray-400", children: "No transactions found." }))] })] }));
}
