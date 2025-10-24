import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default function StatsCard({ title, value, icon }) {
    return (_jsxs("div", { className: "card flex items-center gap-4 animate-fade-in", children: [_jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-br from-[#0070f3] to-[#00d4ff] text-white/90 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.35)] animate-glow", children: icon ?? _jsx("span", { className: "font-bold", children: "\u2605" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-300", children: title }), _jsx("div", { className: "text-2xl font-bold shimmer-text", children: value })] })] }));
}
