import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Button from '../Button';
export default function EmptyState({ title, description, actionLabel, onAction, icon, className = '' }) {
    return (_jsxs("div", { className: `glass-card text-center p-8 ${className}`, children: [_jsx("div", { className: "mx-auto h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center mb-4", children: icon ?? _jsx("span", { className: "text-2xl", children: "\uD83E\uDDE9" }) }), _jsx("h3", { className: "text-lg font-semibold brand-text", children: title }), description && _jsx("p", { className: "text-sm text-gray-400 mt-2", children: description }), actionLabel && (_jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "secondary", onClick: onAction, children: actionLabel }) }))] }));
}
