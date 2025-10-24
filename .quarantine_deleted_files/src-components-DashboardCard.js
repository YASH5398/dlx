import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default function DashboardCard({ status = 'not_joined', onJoin }) {
    const isJoined = status !== 'not_joined';
    const badgeClass = status === 'approved' ? 'badge badge-success' :
        status === 'pending' ? 'badge badge-pending' :
            'badge';
    const label = status === 'approved' ? 'Approved' :
        status === 'pending' ? 'Pending Approval' : 'Not Joined';
    return (_jsxs("div", { className: "widget", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold", children: "Affiliate Partner" }), _jsx("p", { className: "text-xs text-gray-300 mt-1", children: "Refer and earn commissions." })] }), _jsx("span", { className: badgeClass, children: label })] }), _jsx("div", { className: "mt-3 flex gap-2", children: isJoined ? (_jsx("button", { className: "px-3 py-2 rounded-lg bg-white/10 text-white border border-white/15 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]", children: "View Dashboard" })) : (_jsx("button", { onClick: onJoin, className: "px-3 py-2 rounded-lg bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-lg hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#00d4ff]", children: "Join Program" })) })] }));
}
