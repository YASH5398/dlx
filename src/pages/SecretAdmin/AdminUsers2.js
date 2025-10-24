import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { Dialog } from '@headlessui/react';
// Simplified Users Management with pagination, filters, modal, CSV, ban/unban
export default function AdminUsers() {
    const [users, setUsers] = useState({});
    const [wallets, setWallets] = useState({});
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 12;
    const [viewUid, setViewUid] = useState(null);
    useEffect(() => {
        const uUnsub = onSnapshot(query(collection(firestore, 'users')), (snap) => {
            const next = {};
            snap.forEach((d) => { const x = d.data(); next[d.id] = { email: x.email || x.userEmail || '', name: x.name || x.displayName || '', role: (x.role || x.userRole || 'user').toLowerCase(), lastLoginAt: x.lastLoginAt || x.lastActiveAt, banned: !!x.banned }; });
            setUsers(next);
        });
        const wUnsub = onSnapshot(query(collection(firestore, 'wallets')), (snap) => {
            const next = {};
            snap.forEach((d) => { const x = d.data(); next[d.id] = { dlx: Number(x.dlx || 0), usdt: { mainUsdt: Number(x.usdt?.mainUsdt || 0), purchaseUsdt: Number(x.usdt?.purchaseUsdt || 0) } }; });
            setWallets(next);
        });
        return () => { try {
            uUnsub();
        }
        catch { } try {
            wUnsub();
        }
        catch { } };
    }, []);
    const now = Date.now();
    const rows = useMemo(() => {
        const arr = Object.entries(users).map(([uid, u]) => {
            const w = wallets[uid] || {};
            const last = u.lastLoginAt?.toMillis ? u.lastLoginAt.toMillis() : Number(u.lastLoginAt || 0);
            const active = last ? now - last < 24 * 60 * 60 * 1000 : false;
            return { uid, name: u.name || u.email || 'User', email: u.email || '', role: u.role || 'user', active, banned: !!u.banned, dlx: Number(w.dlx || 0), mainUsdt: Number(w.usdt?.mainUsdt || 0), purchaseUsdt: Number(w.usdt?.purchaseUsdt || 0) };
        });
        const q = search.trim().toLowerCase();
        let f = arr.filter(r => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
        if (status === 'active')
            f = f.filter(r => r.active && !r.banned);
        if (status === 'inactive')
            f = f.filter(r => !r.active && !r.banned);
        if (status === 'banned')
            f = f.filter(r => r.banned);
        return f.sort((a, b) => a.name.localeCompare(b.name));
    }, [users, wallets, search, status, now]);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
    const toggleBan = async (uid, banned) => {
        try {
            await updateDoc(doc(firestore, 'users', uid), { banned: !banned, bannedAt: !banned ? Date.now() : null });
        }
        catch (e) {
            console.error(e);
            alert('Failed to update user');
        }
    };
    const exportCsv = () => {
        const header = ['name', 'email', 'role', 'status', 'dlx', 'mainUsdt', 'purchaseUsdt'];
        const lines = rows.map(r => [r.name, r.email, r.role, r.banned ? 'banned' : (r.active ? 'active' : 'inactive'), r.dlx.toFixed(2), r.mainUsdt.toFixed(2), r.purchaseUsdt.toFixed(2)].join(','));
        const blob = new Blob([[header.join(',')].concat(lines).join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
        URL.revokeObjectURL(url);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Users" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { value: search, onChange: (e) => { setPage(1); setSearch(e.target.value); }, placeholder: "Search name/email...", className: "px-3 py-2 rounded-lg bg-[#0a0e1f] border border-white/10 text-sm w-56" }), ['all', 'active', 'inactive', 'banned'].map(s => (_jsx("button", { onClick: () => { setPage(1); setStatus(s); }, className: `px-3 py-2 rounded-lg border text-sm ${status === s ? 'bg-white/[0.08] border-white/30' : 'bg-transparent border-white/10 hover:bg-white/[0.04]'}`, children: s[0].toUpperCase() + s.slice(1) }, s))), _jsx("button", { onClick: exportCsv, className: "px-3 py-2 rounded-lg bg-white/10 border border-white/20", children: "Export CSV" })] })] }), _jsx("div", { className: "rounded-xl bg-white/5 border border-white/10 overflow-x-auto hidden md:block", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-300", children: [_jsx("th", { className: "px-4 py-3", children: "User" }), _jsx("th", { className: "px-4 py-3", children: "Role" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "DLX" }), _jsx("th", { className: "px-4 py-3", children: "Main USDT" }), _jsx("th", { className: "px-4 py-3", children: "Purchase USDT" }), _jsx("th", { className: "px-4 py-3", children: "Actions" })] }) }), _jsxs("tbody", { children: [pageRows.map(r => (_jsxs("tr", { className: `border-t border-white/10 ${r.banned ? 'opacity-60' : ''}`, children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx("div", { className: "font-medium", children: r.name }), _jsx("div", { className: "text-xs text-gray-400", children: r.email })] }), _jsx("td", { className: "px-4 py-3 capitalize", children: r.role }), _jsx("td", { className: "px-4 py-3", children: r.banned ? _jsx("span", { className: "px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs", children: "Banned" }) : _jsx("span", { className: `px-2 py-1 rounded text-xs ${r.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`, children: r.active ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-4 py-3", children: r.dlx.toFixed(2) }), _jsxs("td", { className: "px-4 py-3", children: ["$", r.mainUsdt.toFixed(2)] }), _jsxs("td", { className: "px-4 py-3", children: ["$", r.purchaseUsdt.toFixed(2)] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setViewUid(r.uid), className: "px-3 py-1 rounded-lg bg-white/10 border border-white/20", children: "View" }), r.banned ? _jsx("button", { onClick: () => toggleBan(r.uid, true), className: "px-3 py-1 rounded-lg bg-white/10 border border-white/20", children: "Unban" }) : _jsx("button", { onClick: () => toggleBan(r.uid, false), className: "px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300", children: "Ban" })] }) })] }, r.uid))), pageRows.length === 0 && (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-gray-400", colSpan: 7, children: "No users match filters." }) }))] })] }) }), _jsx("div", { className: "md:hidden space-y-3", children: pageRows.map(r => (_jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: r.name }), _jsx("div", { className: "text-xs text-gray-400", children: r.email })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-xs capitalize", children: r.role }), r.banned ? _jsx("span", { className: "px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs", children: "Banned" }) : _jsx("span", { className: `px-2 py-1 rounded text-xs ${r.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`, children: r.active ? 'Active' : 'Inactive' })] })] }), _jsxs("div", { className: "mt-2 text-xs text-gray-300", children: ["DLX ", r.dlx.toFixed(2), " \u2022 USDT $", r.mainUsdt.toFixed(2), " (P $", r.purchaseUsdt.toFixed(2), ")"] }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("button", { onClick: () => setViewUid(r.uid), className: "px-3 py-1 rounded-lg bg-white/10 border border-white/20", children: "View" }), r.banned ? _jsx("button", { onClick: () => toggleBan(r.uid, true), className: "px-3 py-1 rounded-lg bg-white/10 border border-white/20", children: "Unban" }) : _jsx("button", { onClick: () => toggleBan(r.uid, false), className: "px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300", children: "Ban" })] })] }, r.uid))) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-400", children: ["Page ", page, " of ", totalPages, " \u2022 ", rows.length, " users"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { disabled: page <= 1, onClick: () => setPage(p => Math.max(1, p - 1)), className: "px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50", children: "Prev" }), _jsx("button", { disabled: page >= totalPages, onClick: () => setPage(p => Math.min(totalPages, p + 1)), className: "px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50", children: "Next" })] })] }), _jsxs(Dialog, { open: !!viewUid, onClose: () => setViewUid(null), className: "relative z-50", children: [_jsx("div", { className: "fixed inset-0 bg-black/40", "aria-hidden": "true" }), _jsx("div", { className: "fixed inset-0 flex items-center justify-center p-4", children: _jsx(Dialog.Panel, { className: "mx-auto max-w-md rounded-xl bg-[#101435] border border-white/10 p-5", children: viewUid && (_jsxs(_Fragment, { children: [_jsx(Dialog.Title, { className: "text-lg font-semibold", children: "User Profile" }), _jsxs("div", { className: "mt-3 text-sm text-gray-300", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Name:" }), " ", users[viewUid]?.name || users[viewUid]?.email] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Email:" }), " ", users[viewUid]?.email] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Role:" }), " ", (users[viewUid]?.role || 'user')] }), _jsxs("div", { className: "mt-2", children: [_jsx("span", { className: "text-gray-400", children: "DLX:" }), " ", Number(wallets[viewUid]?.dlx || 0).toFixed(2)] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Main USDT:" }), " ", Number(wallets[viewUid]?.usdt?.mainUsdt || 0).toFixed(2)] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Purchase USDT:" }), " ", Number(wallets[viewUid]?.usdt?.purchaseUsdt || 0).toFixed(2)] })] }), _jsx("div", { className: "mt-4 flex items-center justify-end gap-2", children: _jsx("button", { onClick: () => setViewUid(null), className: "px-3 py-2 rounded-lg bg-white/10 border border-white/20", children: "Close" }) })] })) }) })] })] }));
}
