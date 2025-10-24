import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default function DashboardWidget({ label, value, sublabel }) {
    return (_jsxs("div", { className: "card animate-fade-in", children: [_jsx("div", { className: "text-sm text-gray-300", children: label }), _jsx("div", { className: "text-2xl font-bold mt-1 shimmer-text", children: value }), sublabel && _jsx("div", { className: "text-xs text-gray-400 mt-2", children: sublabel })] }));
}
