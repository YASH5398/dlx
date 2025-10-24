import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const features = [
    { title: 'Verified Smart Contracts' },
    { title: 'ISO 27001' },
    { title: '$50M+ Market Cap' },
    { title: 'Ethereum' },
    { title: 'AI' },
    { title: 'Mobile' },
    { title: 'Cloud' },
];
export default function FeaturesSection() {
    return (_jsxs("section", { id: "features", className: "container-padded py-10 animate-fade-in", children: [_jsx("h2", { className: "section-title", children: "Trusted Features" }), _jsx("div", { className: "mt-6 grid grid-cols-2 md:grid-cols-4 gap-4", children: features.map((f) => (_jsxs("div", { className: "card text-center", children: [_jsx("div", { className: "mx-auto h-10 w-10 rounded bg-sky-100" }), _jsx("div", { className: "mt-2 text-sm font-semibold text-gray-300", children: f.title })] }, f.title))) })] }));
}
