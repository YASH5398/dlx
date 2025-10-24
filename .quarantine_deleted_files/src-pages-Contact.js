import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
export default function Contact() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const submit = () => {
        if (!name || !email || !message)
            return alert('Please fill all fields');
        setSubmitted(true);
    };
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(Header, {}), _jsxs("main", { className: "container-padded py-10", children: [_jsx("h1", { className: "section-title", children: "Contact Us" }), _jsxs("div", { className: "card mt-6 grid md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "Name" }), _jsx("input", { className: "mt-1 w-full rounded border border-gray-300 p-2", value: name, onChange: (e) => setName(e.target.value) }), _jsx("label", { className: "block text-sm font-medium mt-4", children: "Email" }), _jsx("input", { className: "mt-1 w-full rounded border border-gray-300 p-2", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx("label", { className: "block text-sm font-medium mt-4", children: "Message" }), _jsx("textarea", { className: "mt-1 w-full rounded border border-gray-300 p-2", rows: 4, value: message, onChange: (e) => setMessage(e.target.value) }), _jsx(Button, { className: "mt-4", onClick: submit, children: "Send" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-700", children: "Email: hello@digilinex.com" }), _jsx("p", { className: "text-sm text-gray-700", children: "Support: support@digilinex.com" })] })] }), submitted && _jsx("div", { className: "card mt-4 text-sm text-green-700", children: "Thanks! We\u2019ll get back to you." })] }), _jsx(Footer, {})] }));
}
