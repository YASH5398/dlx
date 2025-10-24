import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useReferral } from '../hooks/useReferral';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';
import { firestore } from '../firebase.ts';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardDocumentIcon, LinkIcon, CheckBadgeIcon, ChartBarIcon, UsersIcon, WalletIcon } from '@heroicons/react/24/outline';
export default function AffiliateDashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { approved, affiliate } = useAffiliateApproval();
    const { referralCode, totalEarnings, level, tier, rate, activeReferrals, history } = useReferral();
    const [customSlug, setCustomSlug] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setCustomSlug(affiliate?.slug || '');
    }, [affiliate?.slug]);
    const referralLink = useMemo(() => {
        const base = typeof window !== 'undefined' ? window.location.origin : 'https://digilinex.com';
        const slug = customSlug || referralCode;
        return `${base}/signup?ref=${slug}`;
    }, [customSlug, referralCode]);
    const clicks = Number(affiliate?.clicks || 0);
    const invitesSent = Number(affiliate?.invitesSent || history.length || 0);
    const usersJoined = history.filter((h) => h.status === 'joined').length;
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            toast.success('Referral link copied');
        }
        catch {
            toast.error('Failed to copy');
        }
    };
    const validateSlug = (value) => {
        const v = (value || '').trim().toLowerCase();
        if (!v)
            return 'Slug is required';
        if (v.length < 3 || v.length > 32)
            return 'Use 3–32 characters';
        if (!/^[a-z0-9-]+$/.test(v))
            return 'Only lowercase letters, numbers and dashes allowed';
        return null;
    };
    const saveSlug = async () => {
        if (!user?.id)
            return;
        const err = validateSlug(customSlug);
        if (err)
            return toast.error(err);
        setSaving(true);
        try {
            const col = collection(firestore, 'affiliates');
            const q = query(col, where('slug', '==', customSlug));
            const snap = await getDocs(q);
            const taken = snap.docs.some((d) => d.id !== user.id);
            if (taken) {
                toast.error('This link is already taken');
                setSaving(false);
                return;
            }
            const docRef = doc(firestore, 'affiliates', user.id);
            await setDoc(docRef, { slug: customSlug, ownerId: user.id, updatedAt: Date.now() }, { merge: true });
            toast.success('Referral link updated');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to update link');
        }
        finally {
            setSaving(false);
        }
    };
    if (!approved) {
        return (_jsx("div", { className: "min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white font-inter", children: _jsx("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 py-8", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300", children: [_jsx("h1", { className: "text-2xl font-semibold mb-4", children: "Affiliate Dashboard" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6 text-sm", children: "Your affiliate account is pending approval." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("button", { onClick: () => navigate('/affiliate-program'), className: "px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-300 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 w-full sm:w-auto", "aria-label": "Apply to affiliate program", children: "Apply to Program" }), _jsx(Link, { to: "/affiliate-program/info", className: "px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 text-center w-full sm:w-auto", "aria-label": "Learn more about affiliate program", children: "Learn More" })] })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white font-inter", children: _jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx(CheckBadgeIcon, { className: "w-6 h-6 text-indigo-500 dark:text-indigo-400" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold", children: "Affiliate Dashboard" })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 text-sm", children: "Track your referrals, earnings, and manage your link effortlessly." })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(LinkIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }), _jsx("h2", { className: "text-lg font-medium", children: "Referral Link" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("input", { className: "flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-sm", value: customSlug, onChange: (e) => setCustomSlug(e.target.value), placeholder: "your-custom-link", "aria-label": "Custom referral slug" }), _jsx("button", { onClick: saveSlug, className: "px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 w-full sm:w-auto", disabled: saving, "aria-label": "Save referral link", children: saving ? 'Saving...' : 'Save Link' })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("code", { className: "flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 text-sm font-mono break-all", children: referralLink }), _jsxs("button", { onClick: copyLink, className: "px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2 transition-all duration-300 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 w-full sm:w-auto", "aria-label": "Copy referral link", children: [_jsx(ClipboardDocumentIcon, { className: "w-4 h-4" }), " Copy"] })] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Use lowercase letters, numbers, and dashes. 3\u201332 characters. Must be unique." })] })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6", children: [_jsx(StatCard, { label: "Clicks", value: clicks, icon: _jsx(ChartBarIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }) }), _jsx(StatCard, { label: "Invites Sent", value: invitesSent, icon: _jsx(UsersIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }) }), _jsx(StatCard, { label: "Users Joined", value: usersJoined, icon: _jsx(CheckBadgeIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }) }), _jsx(StatCard, { label: "Active Referrals", value: activeReferrals, icon: _jsx(UsersIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(WalletIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }), _jsx("h3", { className: "text-lg font-medium", children: "Total Earnings" })] }), _jsxs("div", { className: "text-2xl sm:text-3xl font-semibold text-indigo-600 dark:text-indigo-400", children: ["$", totalEarnings.toFixed(2)] }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-xs mt-2", children: "Commission from completed orders." })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 lg:col-span-2 border border-gray-200 dark:border-gray-700 transition-all duration-300", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(ChartBarIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }), _jsx("h3", { className: "text-lg font-medium", children: "Level & Commission Rate" })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("div", { className: "rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm", children: ["Level: ", _jsx("span", { className: "font-semibold text-indigo-600 dark:text-indigo-400", children: level })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm", children: ["Tier: ", _jsx("span", { className: "font-semibold text-indigo-600 dark:text-indigo-400", children: tier })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm", children: ["Rate: ", _jsxs("span", { className: "font-semibold text-indigo-600 dark:text-indigo-400", children: [rate, "%"] })] })] }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-xs mt-2", children: "Rate adjusts based on verified referrals." })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(UsersIcon, { className: "w-5 h-5 text-indigo-500 dark:text-indigo-400" }), _jsx("h3", { className: "text-lg font-medium", children: "Referral & Commission History" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700", children: [_jsx("th", { className: "py-2 px-3 font-medium", children: "User" }), _jsx("th", { className: "py-2 px-3 font-medium", children: "Date" }), _jsx("th", { className: "py-2 px-3 font-medium", children: "Status" }), _jsx("th", { className: "py-2 px-3 font-medium", children: "Commission" })] }) }), _jsxs("tbody", { children: [history.map((h) => (_jsxs("tr", { className: "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200", children: [_jsx("td", { className: "py-2 px-3", children: h.username }), _jsx("td", { className: "py-2 px-3", children: h.date ? new Date(h.date).toLocaleString() : '' }), _jsx("td", { className: "py-2 px-3 capitalize", children: h.status }), _jsxs("td", { className: "py-2 px-3", children: ["$", h.commissionUsd.toFixed(2)] })] }, h.id))), history.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "py-4 text-center text-gray-500 dark:text-gray-400 text-sm", children: "No referral history yet." }) }))] })] }) })] })] }) }));
}
function StatCard({ label, value, icon }) {
    return (_jsxs("div", { className: "rounded-2xl p-5 bg-white/5 border border-white/10", children: [_jsx("div", { className: "text-sm text-gray-300", children: label }), _jsx("div", { className: "text-2xl font-bold", children: Number(value || 0) })] }));
}
