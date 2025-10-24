import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
const DEFAULT_RANKS = [
    {
        name: 'DLX Associate',
        minReferrals: 8,
        minVolume: 400,
        commission: 25,
        reward: 'Smart Watch',
        image: 'https://images.unsplash.com/photo-1518443871495-1f3f23227460?q=80&w=640&auto=format&fit=crop'
    },
    {
        name: 'DLX Executive',
        minReferrals: 25,
        minVolume: 2000,
        commission: 30,
        reward: 'Laptop',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=640&auto=format&fit=crop'
    },
    {
        name: 'DLX Director',
        minReferrals: 50,
        minVolume: 10000,
        commission: 35,
        reward: 'Bullet Bike',
        image: 'https://images.unsplash.com/photo-1518655048521-f58c3a2b1aa5?q=80&w=640&auto=format&fit=crop'
    },
    {
        name: 'DLX President',
        minReferrals: 100,
        minVolume: 50000,
        commission: 45,
        reward: 'Tata Car',
        image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=640&auto=format&fit=crop'
    }
];
const formatUsd = (n) => `$${Number(n).toLocaleString()}`;
const ProgressBar = ({ label, value, total }) => {
    const pct = Math.min(100, Math.round(((total ? value / total : 0) * 100)));
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-xs sm:text-sm text-slate-400", children: [_jsx("span", { children: label }), _jsxs("span", { className: "font-semibold text-slate-200", children: [pct, "%"] })] }), _jsx("div", { className: "h-3 rounded-full bg-slate-700/50 overflow-hidden ring-1 ring-slate-600/40", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 transition-[width] duration-700 ease-out", style: { width: `${pct}%` } }) })] }));
};
const CriteriaContent = () => (_jsxs("div", { className: "space-y-4 text-slate-300 text-sm", children: [_jsx("div", { children: _jsx("div", { className: "font-semibold text-slate-200 mb-1", children: "Rank Qualification Process" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-200", children: "1\uFE0F\u20E3 Volume Generation" }), _jsx("p", { children: "- Your total volume is calculated from the sales of digital products and services made by you and your direct referrals." }), _jsx("p", { children: "- Every product or service purchase contributes to your team volume." })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-200", children: "2\uFE0F\u20E3 Active Referral" }), _jsx("p", { children: "- A referral becomes \u2018Active\u2019 when they make their first product or service purchase." }), _jsx("p", { children: "- Inactive users (no purchase) are not counted in active referrals." })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-200", children: "3\uFE0F\u20E3 Commission Distribution" }), _jsx("p", { children: "- You earn commission on every direct and indirect sale based on your rank percentage." }), _jsx("p", { children: "- Example: DLX Executive = 30% commission on total eligible volume." })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-200", children: "4\uFE0F\u20E3 Reward Unlock" }), _jsx("p", { children: "- Once the required referrals and volume are completed, your rank reward (like Smartwatch, Laptop, Bike, or Car) will be unlocked." })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-200", children: "5\uFE0F\u20E3 Rank Upgrade" }), _jsx("p", { children: "- Higher ranks automatically unlock when both referral & volume conditions are met." }), _jsx("p", { children: "- Progress is visible in real time through Firebase data." })] })] }));
const RankCard = ({ rank, activeReferrals, totalVolume, currentRank }) => {
    const [open, setOpen] = useState(false);
    const referralPct = Math.min(100, Math.round((activeReferrals / rank.minReferrals) * 100));
    const volumePct = Math.min(100, Math.round((totalVolume / rank.minVolume) * 100));
    const unlocked = referralPct >= 100 && volumePct >= 100;
    const isCurrent = currentRank && currentRank.toLowerCase().includes(rank.name.split(' ')[1]?.toLowerCase() || '');
    return (_jsxs("div", { className: `group relative flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl transition-all duration-300 ${unlocked ? 'hover:shadow-emerald-500/20 hover:ring-emerald-400/30' : 'hover:shadow-2xl hover:ring-violet-500/30'}`, children: [_jsxs("div", { className: "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none", children: [_jsx("div", { className: "absolute -top-20 -left-20 size-48 rounded-full bg-cyan-500/10 blur-2xl" }), _jsx("div", { className: "absolute -bottom-20 -right-20 size-48 rounded-full bg-fuchsia-500/10 blur-2xl" })] }), _jsxs("div", { className: "p-4 flex items-start gap-4", children: [_jsx("img", { src: rank.image, alt: rank.name, className: "size-16 sm:size-20 rounded-lg ring-1 ring-white/15 object-cover" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("h3", { className: "text-base sm:text-lg font-semibold text-slate-100", children: rank.name }), isCurrent && (_jsx("span", { className: "text-xs px-2 py-1 rounded-full ring-1 bg-cyan-500/15 text-cyan-300 ring-cyan-400/30", children: "Current" })), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ring-1 ${unlocked ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' : 'bg-rose-500/10 text-rose-300 ring-rose-400/30'}`, children: unlocked ? 'Unlocked' : 'Locked' })] }), _jsxs("div", { className: "mt-1 text-xs sm:text-sm text-slate-400", children: ["Commission ", rank.commission, "% \u2022 Reward: ", rank.reward] })] })] }), _jsxs("div", { className: "px-4 pb-4 space-y-4", children: [_jsx(ProgressBar, { label: `Active Referrals (${activeReferrals} / ${rank.minReferrals})`, value: activeReferrals, total: rank.minReferrals }), _jsx(ProgressBar, { label: `Volume (${formatUsd(totalVolume)} / ${formatUsd(rank.minVolume)})`, value: totalVolume, total: rank.minVolume }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "rounded-xl bg-white/5 ring-1 ring-white/10 p-3", children: [_jsx("div", { className: "text-xs text-slate-400", children: "Active Referrals" }), _jsx("div", { className: "mt-0.5 text-sm font-semibold text-slate-100", children: activeReferrals })] }), _jsxs("div", { className: "rounded-xl bg-white/5 ring-1 ring-white/10 p-3", children: [_jsx("div", { className: "text-xs text-slate-400", children: "Total Volume" }), _jsx("div", { className: "mt-0.5 text-sm font-semibold text-slate-100", children: formatUsd(totalVolume) })] })] }), _jsx("div", { className: "flex gap-2 pt-2", children: _jsx("button", { onClick: () => setOpen((v) => !v), className: "flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-500 hover:to-fuchsia-500 transition-colors px-3", children: "Read Full Criteria" }) }), _jsx("div", { className: `rounded-xl bg-white/5 ring-1 ring-white/10 p-4 transition-all duration-300 overflow-hidden ${open ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0'}`, children: _jsx(CriteriaContent, {}) })] })] }));
};
export default function Commission() {
    const { user } = useUser();
    const uid = user?.id;
    const [ranks, setRanks] = useState(DEFAULT_RANKS);
    const [activeReferrals, setActiveReferrals] = useState(0);
    const [totalVolume, setTotalVolume] = useState(0);
    const [currentRank, setCurrentRank] = useState(null);
    // Stream ranks from Firestore (fallback to defaults)
    useEffect(() => {
        const unsub = onSnapshot(collection(firestore, 'ranks'), (snap) => {
            const rows = [];
            snap.forEach((d) => {
                const data = d.data();
                rows.push({
                    name: String(data.name || d.id),
                    minReferrals: Number(data.minReferrals ?? 0),
                    minVolume: Number(data.minVolume ?? 0),
                    commission: Number(data.commission ?? 0),
                    reward: String(data.reward || ''),
                    image: String(data.image || '')
                });
            });
            // Ensure expected order: Associate, Executive, Director, President
            const order = ['DLX Associate', 'DLX Executive', 'DLX Director', 'DLX President'];
            const sorted = rows.length > 0 ? rows.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)) : DEFAULT_RANKS;
            setRanks(sorted);
        }, () => setRanks(DEFAULT_RANKS));
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    // Stream user stats: activeReferrals, totalVolume, currentRank
    useEffect(() => {
        if (!uid)
            return;
        const userDoc = doc(firestore, 'users', uid);
        const unsubUser = onSnapshot(userDoc, (snap) => {
            const data = snap.data() || {};
            setActiveReferrals(Number(data.activeReferrals || 0));
            setTotalVolume(Number(data.totalVolume || 0));
            setCurrentRank(String(data.currentRank || '') || null);
        });
        // Also compute volume from orders for real-time progress if not present
        const ordersQ = query(collection(firestore, 'orders'), where('affiliateId', '==', uid));
        const unsubOrders = onSnapshot(ordersQ, (snap) => {
            let vol = 0;
            const activeUsers = new Set();
            snap.forEach((docSnap) => {
                const d = docSnap.data();
                const amt = Number(d.amountUsd || 0);
                const status = String(d.status || '');
                if (status.toLowerCase() === 'completed') {
                    vol += amt;
                    if (d.userId)
                        activeUsers.add(String(d.userId));
                }
            });
            // Prefer explicit user doc value; otherwise fallback to computed
            setTotalVolume((prev) => (prev > 0 ? prev : Number(vol.toFixed(2))));
            setActiveReferrals((prev) => (prev > 0 ? prev : activeUsers.size));
        });
        return () => {
            try {
                unsubUser();
            }
            catch { }
            try {
                unsubOrders();
            }
            catch { }
        };
    }, [uid]);
    const headerTitle = useMemo(() => 'DLX Commission & Ranks', []);
    const headerSubtitle = useMemo(() => 'Track your growth, unlock rewards, and earn higher commissions.', []);
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("section", { className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 sm:p-8 backdrop-blur-xl", children: [_jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [_jsx("div", { className: "absolute -top-24 -left-24 size-72 rounded-full bg-cyan-500/10 blur-3xl" }), _jsx("div", { className: "absolute -bottom-24 -right-24 size-72 rounded-full bg-fuchsia-500/10 blur-3xl" })] }), _jsx("h2", { className: "text-2xl md:text-3xl font-bold mb-2", children: _jsx("span", { className: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", children: headerTitle }) }), _jsx("p", { className: "text-gray-300 text-sm md:text-base", children: headerSubtitle })] }), _jsx("section", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4", children: ranks.map((rk) => (_jsx(RankCard, { rank: rk, activeReferrals: activeReferrals, totalVolume: totalVolume, currentRank: currentRank }, rk.name))) })] }));
}
