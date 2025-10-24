import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape')
            onClose(); };
        if (open)
            window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: `relative w-[95vw] ${maxWidth} rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 p-6 shadow-2xl animate-fade-in`, children: [title && _jsx("h3", { className: "text-lg font-semibold text-white", children: title }), _jsx("div", { className: "mt-3", children: children }), footer && _jsx("div", { className: "mt-4 flex justify-end gap-2", children: footer })] })] }));
}
