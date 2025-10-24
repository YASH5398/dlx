import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Link } from 'react-router-dom';
const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200';
const variants = {
    primary: 'bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_12px_rgba(0,212,255,0.35)] hover:shadow-[0_0_24px_rgba(0,212,255,0.55)]',
    secondary: 'bg-white/10 text-white border border-white/20 backdrop-blur hover:bg-white/20',
    outline: 'border border-white/30 text-white hover:bg-white/10',
};
export function Button({ children, to, onClick, variant = 'primary', className = '' }) {
    const classes = `${base} ${variants[variant]} ${className}`;
    if (to) {
        return (_jsx(Link, { to: to, className: classes, children: children }));
    }
    return (_jsx("button", { className: classes, onClick: onClick, children: children }));
}
export default Button;
