import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Button from './Button';
export default function CTASection() {
    return (_jsx("section", { className: "container-padded py-12 animate-fade-in", children: _jsxs("div", { className: "card text-center", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: "Ready to build?" }), _jsx("p", { className: "text-sm text-gray-300 mt-2", children: "Start Your Project or Get Free Consultation" }), _jsx("div", { className: "mt-4 flex items-center justify-center gap-3", children: _jsx(Button, { to: "/contact", children: "Start Your Project" }) }), _jsx("p", { className: "text-xs text-gray-400 mt-4", children: "Contact: hello@digilinex.com" })] }) }));
}
