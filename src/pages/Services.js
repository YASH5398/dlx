import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
const services = [
    { title: 'Crypto Token Creation', price: '$2,999' },
    { title: 'Smart Contract Development' },
    { title: 'Website Development', price: '$1,499' },
    { title: 'Chatbot', price: '$999' },
    { title: 'MLM Plan', price: '$3,999' },
    { title: 'Mobile App', price: '$4,999' },
    { title: 'Business Automation', price: '$1,999' },
    { title: 'Telegram Bot', price: '$799' },
    { title: 'Crypto Audit', price: '$2,499' },
];
export default function Services() {
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(Header, {}), _jsxs("main", { className: "container-padded py-10", children: [_jsx("h1", { className: "section-title", children: "Our Services" }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: "Choose a service and get started." }), _jsx("div", { className: "mt-6 grid md:grid-cols-3 gap-4", children: services.map((s) => (_jsx(ServiceCard, { title: s.title, price: s.price }, s.title))) })] }), _jsx(Footer, {})] }));
}
