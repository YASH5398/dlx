import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const testimonials = [
    { name: 'Founder A', quote: 'DigiLinex accelerated our token launch and growth.' },
    { name: 'Founder B', quote: 'World-class web and mobile team. Reliable and fast.' },
    { name: 'Founder C', quote: 'Their AI chatbot improved our support 24/7.' },
];
export default function Testimonials() {
    return (_jsxs("section", { id: "testimonials", className: "container-padded py-10 animate-fade-in", children: [_jsx("h2", { className: "section-title heading-gradient", children: "Client Testimonials" }), _jsx("div", { className: "mt-6 grid md:grid-cols-3 gap-4", children: testimonials.map((t) => (_jsxs("figure", { className: "card", children: [_jsxs("blockquote", { className: "text-sm text-gray-300", children: ["\u201C", t.quote, "\u201D"] }), _jsxs("figcaption", { className: "mt-3 text-xs text-gray-400", children: ["\u2014 ", t.name] })] }, t.name))) })] }));
}
