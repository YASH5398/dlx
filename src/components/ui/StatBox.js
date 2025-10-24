import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import {} from 'react';
export default function StatBox({ title, value, icon, progress, footer, className = '' }) {
    return (_jsx("div", { className: `widget ${className}`, children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "widget-icon text-white", children: icon ?? _jsx("span", { className: "font-bold", children: "\u2605" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "widget-title mb-1", children: title }), _jsx("div", { className: "widget-value mb-1", children: value }), progress !== undefined && (_jsx("div", { className: "w-full bg-white/10 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-[#0070f3] to-[#00d4ff] transition-all duration-500 rounded-full", style: { width: `${Math.min(100, Math.max(0, progress))}%` } }) })), footer && _jsx("div", { className: "mt-2 text-xs text-gray-400", children: footer })] })] }) }));
}
