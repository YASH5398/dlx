import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
export default function AdminReferrals() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        setLoading(true);
        const q = query(collection(firestore, 'orders'), orderBy('timestamp', 'desc'));
        const userCache = {};
        const getUserLabel = async (uid) => {
            if (!uid)
                return 'Unknown';
            if (userCache[uid])
                return userCache[uid];
            try {
                const uref = doc(firestore, 'users', uid);
                const snap = await getDoc(uref);
                const d = snap.exists() ? snap.data() : {};
                const label = d.email || d.name || d.displayName || uid;
                userCache[uid] = label;
                return label;
            }
            catch {
                return uid;
            }
        };
        const unsub = onSnapshot(q, async (snap) => {
            const list = [];
            const promises = [];
            snap.forEach((docSnap) => {
                const d = docSnap.data() || {};
                const affiliateId = d.affiliateId || d.referrerId || undefined;
                if (!affiliateId)
                    return; // skip non-referral orders
                const userId = d.userId || d.uid || undefined;
                const amountUsd = Number(d.amountUsd || d.amount || 0);
                const earningsUsd = Number(((amountUsd * 0.7)).toFixed(2));
                const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : Number(d.timestamp || Date.now());
                const row = {
                    id: docSnap.id,
                    referredById: affiliateId,
                    referredUserId: String(userId || 'unknown'),
                    referredByLabel: affiliateId,
                    referredUserLabel: String(d.userName || 'User'),
                    earningsUsd,
                    referralDate: ts,
                };
                // hydrate labels lazily
                promises.push((async () => {
                    row.referredByLabel = await getUserLabel(affiliateId);
                    row.referredUserLabel = row.referredUserLabel || await getUserLabel(userId);
                })());
                list.push(row);
            });
            try {
                await Promise.all(promises);
            }
            catch { }
            setRows(list);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('Failed to stream referrals (orders):', err);
            setError('Failed to load referral data');
            setLoading(false);
        });
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    const totalEarnings = useMemo(() => rows.reduce((s, r) => s + Number(r.earningsUsd || 0), 0), [rows]);
    const totalReferralCount = useMemo(() => {
        const setIds = new Set(rows.map((r) => r.referredUserId));
        return setIds.size;
    }, [rows]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-xs text-gray-400", children: "Total Referral Count" }), _jsx("div", { className: "text-2xl font-bold", children: totalReferralCount })] }), _jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-xs text-gray-400", children: "Total Earnings (USD)" }), _jsxs("div", { className: "text-2xl font-bold", children: ["$", totalEarnings.toFixed(2)] })] }), _jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-xs text-gray-400", children: "Live Status" }), _jsx("div", { className: "text-2xl font-bold", children: loading ? 'Loading…' : (error ? 'Error' : 'Live') })] })] }), _jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Referral Records" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-400 border-b border-white/10", children: [_jsx("th", { className: "px-3 py-2", children: "Referred By" }), _jsx("th", { className: "px-3 py-2", children: "Referred User" }), _jsx("th", { className: "px-3 py-2", children: "Earnings (USD)" }), _jsx("th", { className: "px-3 py-2", children: "Referral Date" })] }) }), _jsxs("tbody", { className: "divide-y divide-white/10", children: [rows.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "px-3 py-6 text-center text-gray-500", children: "No referrals found." }) })), rows.map((r) => (_jsxs("tr", { className: "hover:bg-white/5", children: [_jsxs("td", { className: "px-3 py-2 text-white", children: [_jsx("div", { className: "font-medium", children: r.referredByLabel }), _jsxs("div", { className: "text-xs text-gray-400", children: ["UID: ", r.referredById] })] }), _jsxs("td", { className: "px-3 py-2 text-white", children: [_jsx("div", { className: "font-medium", children: r.referredUserLabel }), _jsxs("div", { className: "text-xs text-gray-400", children: ["UID: ", r.referredUserId] })] }), _jsxs("td", { className: "px-3 py-2 text-emerald-400 font-bold", children: ["$", Number(r.earningsUsd || 0).toFixed(2)] }), _jsx("td", { className: "px-3 py-2 text-gray-300", children: r.referralDate ? new Date(r.referralDate).toLocaleString() : '—' })] }, r.id)))] })] }) })] })] }));
}
