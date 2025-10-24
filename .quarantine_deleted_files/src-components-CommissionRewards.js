import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
const formatVolume = (n) => {
    if (n >= 1_000_000_000)
        return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
};
// Fallback image for bullet bike (in case remote fails)
const BULLET_BIKE_URL = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=640&auto=format&fit=crop';
const ProgressBar = ({ label, value, total }) => {
    const pct = Math.min(100, Math.round((value / total) * 100));
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm text-slate-400", children: [_jsx("span", { children: label }), _jsxs("span", { className: "font-semibold text-slate-200", children: [pct, "%"] })] }), _jsx("div", { className: "h-3 rounded-full bg-slate-700/50 overflow-hidden ring-1 ring-slate-600/40", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-700 ease-out", style: { width: `${pct}%` } }) })] }));
};
const Stat = ({ label, value }) => (_jsxs("div", { className: "rounded-xl bg-white/5 ring-1 ring-white/10 p-4", children: [_jsx("div", { className: "text-sm text-slate-400", children: label }), _jsx("div", { className: "mt-1 text-xl sm:text-2xl font-semibold text-slate-100", children: value })] }));
const ShareIcon = (props) => (_jsx("svg", { viewBox: "0 0 24 24", fill: "none", className: "size-4", stroke: "currentColor", strokeWidth: "1.5", ...props, children: _jsx("path", { d: "M15 8a3 3 0 1 0-3-3M6 12a3 3 0 1 0 3 3m3-9v8m0 0l3-3m-3 3l-3-3" }) }));
const InfoIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", className: "size-4", stroke: "currentColor", strokeWidth: "1.5", ...props, children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 8h.01M11 12h2v4h-2z" })] }));
const StarIcon = (props) => (_jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "size-5 text-yellow-300", ...props, children: _jsx("path", { d: "M11.48 3.5l2.07 4.2 4.64.68-3.36 3.27.79 4.62-4.14-2.18-4.14 2.18.79-4.62-3.36-3.27 4.64-.68 2.07-4.2z" }) }));
const CurrentBadge = ({ stats }) => (_jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl p-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-1 ring-white/20 flex items-center justify-center", children: _jsx(StarIcon, {}) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-slate-400", children: "Current Badge" }), _jsx("div", { className: "text-lg font-semibold text-slate-100", children: stats.currentBadge })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsx(Stat, { label: "Total Referrals", value: stats.referrals }), _jsx(Stat, { label: "Total Volume", value: formatVolume(stats.volume) }), _jsx(Stat, { label: "Commission", value: `${stats.commissionPercent}%` })] })] }));
const BadgeCard = ({ badge, stats }) => {
    const referralPct = Math.min(100, Math.round((stats.referrals / badge.referralsRequired) * 100));
    const volumePct = Math.min(100, Math.round((stats.volume / badge.volumeRequired) * 100));
    const unlocked = referralPct >= 100 && volumePct >= 100;
    const [open, setOpen] = useState(false);
    const handleShare = async () => {
        const shareData = {
            title: `Join me on ${badge.name}!`,
            text: `I'm aiming for ${badge.name} — commission ${badge.commissionRange} with ${badge.reward}.`,
            url: window.location.origin
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            }
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('Share text copied to clipboard!');
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    return (_jsxs("div", { className: `group relative flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl transition-all duration-300 ${unlocked ? 'hover:shadow-emerald-500/20 hover:ring-emerald-400/30' : 'hover:shadow-2xl hover:ring-violet-500/30'}`, children: [_jsxs("div", { className: "p-4 flex items-start gap-4", children: [_jsx("img", { src: badge.image, alt: badge.name, onError: (e) => { e.currentTarget.src = BULLET_BIKE_URL; e.currentTarget.onerror = null; }, className: "size-16 sm:size-20 rounded-lg ring-1 ring-white/15 object-cover" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-base sm:text-lg font-semibold text-slate-100", children: badge.name }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ring-1 ${unlocked ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' : 'bg-rose-500/10 text-rose-300 ring-rose-400/30'}`, children: unlocked ? 'Unlocked' : 'Locked' })] }), _jsxs("div", { className: "mt-1 text-xs sm:text-sm text-slate-400", children: ["Commission ", badge.commissionRange, " \u2022 Reward: ", badge.reward] })] })] }), _jsxs("div", { className: "px-4 pb-4 space-y-4", children: [_jsx(ProgressBar, { label: `Referrals (${stats.referrals}/${badge.referralsRequired})`, value: stats.referrals, total: badge.referralsRequired }), _jsx(ProgressBar, { label: `Volume (${formatVolume(stats.volume)}/${formatVolume(badge.volumeRequired)})`, value: stats.volume, total: badge.volumeRequired }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsxs("button", { onClick: handleShare, "aria-label": "Share progress", className: "flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 text-slate-200 hover:bg-white/10 hover:ring-violet-400/30 transition-colors px-3", children: [_jsx(ShareIcon, { className: "size-5" }), "Share"] }), _jsxs("button", { onClick: () => setOpen((v) => !v), "aria-label": "Toggle details", "aria-expanded": open, "aria-controls": `badge-${badge.name}-details`, className: "h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-500 hover:to-fuchsia-500 transition-colors px-3", children: [_jsx(InfoIcon, { className: "size-5" }), "Details"] })] }), _jsxs("div", { id: `badge-${badge.name}-details`, className: `grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300 overflow-hidden ${open ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'}`, children: [_jsxs("div", { className: "text-xs sm:text-sm text-slate-300", children: [_jsx("div", { className: "font-medium text-slate-200 mb-1", children: "Referrals" }), _jsxs("div", { children: ["Progress: ", stats.referrals, "/", badge.referralsRequired, " (", referralPct, "%)"] }), _jsxs("div", { children: ["Remaining: ", Math.max(0, badge.referralsRequired - stats.referrals)] })] }), _jsxs("div", { className: "text-xs sm:text-sm text-slate-300", children: [_jsx("div", { className: "font-medium text-slate-200 mb-1", children: "Volume" }), _jsxs("div", { children: ["Progress: ", formatVolume(stats.volume), "/", formatVolume(badge.volumeRequired), " (", volumePct, "%)"] }), _jsxs("div", { children: ["Remaining: ", formatVolume(Math.max(0, badge.volumeRequired - stats.volume))] })] })] })] })] }));
};
const Instruction = () => (_jsx("div", { className: "rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-slate-300", children: "You are currently at Starter rank. Begin referring and generating volume to unlock badges." }));
const CommissionRewards = () => {
    // Mock stats; you can wire real data via props or context
    const userStats = {
        currentBadge: 'Starter',
        referrals: 8,
        volume: 120000,
        commissionPercent: 22,
    };
    const badges = [
        {
            name: 'Rising Star',
            commissionRange: '25–30%',
            reward: 'Smartphone',
            referralsRequired: 10,
            volumeRequired: 200000,
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'
        },
        {
            name: 'Growth Champion',
            commissionRange: '30–35%',
            reward: 'Laptop',
            referralsRequired: 25,
            volumeRequired: 500000,
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop'
        },
        {
            name: 'Elite Partner',
            commissionRange: '35–40%',
            reward: 'Bullet Bike',
            referralsRequired: 50,
            volumeRequired: 1000000,
            image: 'https://images.unsplash.com/photo-1518655048521-f58c3a2b1aa5?q=80&w=400&auto=format&fit=crop'
        },
        {
            name: 'Legend of Linex',
            commissionRange: '40–45%',
            reward: 'Car',
            referralsRequired: 100,
            volumeRequired: 2500000,
            image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=400&auto=format&fit=crop'
        }
    ];
    return (_jsxs("section", { className: "w-full space-y-6", children: [_jsx(CurrentBadge, { stats: userStats }), _jsx(Instruction, {}), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: badges.map((b) => (_jsx(BadgeCard, { badge: b, stats: userStats }, b.name))) })] }));
};
export default CommissionRewards;
