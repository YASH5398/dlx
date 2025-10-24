import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { db, firestore } from '../../firebase';
import { get, ref } from 'firebase/database';
import { collection, onSnapshot } from 'firebase/firestore';
export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        // RTDB fallback for legacy counts
        (async () => {
            try {
                const usersSnap = await get(ref(db, 'users'));
                const usersVal = usersSnap.val() || {};
                const userIds = Object.keys(usersVal);
                const ordersCount = userIds.reduce((acc, uid) => acc + Object.keys(usersVal[uid]?.orders || {}).length, 0);
                setStats((prev) => ({ ...(prev || { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 }), users: userIds.length, orders: ordersCount }));
            }
            catch (error) {
                console.error('Failed to load admin stats from Firebase RTDB:', error);
            }
        })();
        // Live Firestore subscriptions
        const unsubs = [];
        // Users count
        unsubs.push(onSnapshot(collection(firestore, 'users'), (snap) => {
            setStats((prev) => ({ ...(prev || { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 }), users: snap.size }));
        }));
        // Products count
        unsubs.push(onSnapshot(collection(firestore, 'products'), (snap) => {
            setStats((prev) => ({ ...(prev || { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 }), products: snap.size }));
        }));
        // Orders count + revenue
        unsubs.push(onSnapshot(collection(firestore, 'orders'), (snap) => {
            let orders = 0;
            let revenue = 0;
            let referrals = 0;
            snap.forEach((d) => {
                const x = d.data() || {};
                orders += 1;
                revenue += Number(x.total || x.amountUsd || x.amount || 0);
                if (x.affiliateId || x.referrerId)
                    referrals += 1;
            });
            setStats((prev) => ({ ...(prev || { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 }), orders, revenue, referrals }));
        }));
        // Referrals collection (preferred) overrides count if present
        try {
            unsubs.push(onSnapshot(collection(firestore, 'referrals'), (snap) => {
                setStats((prev) => ({ ...(prev || { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 }), referrals: snap.size }));
            }));
        }
        catch { }
        // Wallet totals (USDT sum)
        unsubs.push(onSnapshot(collection(firestore, 'wallets'), (snap) => {
            let usdt = 0;
            snap.forEach((d) => {
                const x = d.data() || {};
                const w = x.usdt || {};
                usdt += Number(w.mainUsdt || 0) + Number(w.purchaseUsdt || 0);
            });
            setStats((prev) => ({ ...(prev || { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 }), walletUsdt: usdt }));
        }));
        return () => { unsubs.forEach((u) => { try {
            u();
        }
        catch { } }); };
    }, []);
    const cards = [
        { label: 'Users', value: stats?.users ?? 0, icon: (_jsx("svg", { className: "w-8 h-8 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) })), gradient: 'from-blue-600/10 to-blue-900/10' },
        { label: 'Orders', value: stats?.orders ?? 0, icon: (_jsx("svg", { className: "w-8 h-8 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" }) })), gradient: 'from-green-600/10 to-green-900/10' },
        { label: 'Products', value: stats?.products ?? 0, icon: (_jsx("svg", { className: "w-8 h-8 text-cyan-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 7l9-4 9 4-9 4-9-4zm0 8l9 4 9-4" }) })), gradient: 'from-cyan-600/10 to-cyan-900/10' },
        { label: 'Revenue', value: `$${Number(stats?.revenue ?? 0).toFixed(2)}`, icon: (_jsx("svg", { className: "w-8 h-8 text-yellow-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })), gradient: 'from-yellow-600/10 to-yellow-900/10' },
        { label: 'Referrals', value: stats?.referrals ?? 0, icon: (_jsx("svg", { className: "w-8 h-8 text-pink-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 1.714a5.002 5.002 0 0110.288 0" }) })), gradient: 'from-pink-600/10 to-pink-900/10' },
        { label: 'Wallet USDT', value: `$${Number(stats?.walletUsdt ?? 0).toFixed(2)}`, icon: (_jsx("svg", { className: "w-8 h-8 text-emerald-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })), gradient: 'from-emerald-600/10 to-emerald-900/10' },
        { label: 'Tickets', value: stats?.tickets ?? 0, icon: (_jsx("svg", { className: "w-8 h-8 text-purple-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" }) })), gradient: 'from-purple-600/10 to-purple-900/10' },
    ];
    return (_jsx("div", { className: "min-h-screen bg-gray-950 text-white p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("header", { className: "mb-10", children: [_jsx("h1", { className: "text-4xl font-extrabold tracking-tight", children: "Admin Dashboard" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Real-time overview of platform metrics" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: cards.map((c) => (_jsxs("div", { className: `relative rounded-2xl bg-gradient-to-br ${c.gradient} border border-gray-800/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400 font-semibold uppercase tracking-wider", children: c.label }), _jsx("div", { className: "text-3xl font-bold mt-1", children: c.value })] }), _jsx("div", { className: "opacity-60", children: c.icon })] }), _jsx("div", { className: "absolute inset-0 rounded-2xl overflow-hidden", children: _jsx("div", { className: "absolute inset-0 bg-gray-900/50 opacity-0 hover:opacity-10 transition-opacity duration-300" }) })] }, c.label))) })] }) }));
}
