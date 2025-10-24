import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
export default function Settings() {
    const { user } = useUser();
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [status, setStatus] = useState(null);
    const save = () => {
        if (!name || !email) {
            setStatus('Please fill all fields');
            return;
        }
        const updated = { ...user, name, email };
        localStorage.setItem('dlx_user', JSON.stringify(updated));
        setStatus('Profile updated');
    };
    return (_jsxs("div", { className: "card space-y-3 animate-fade-in", children: [_jsx("h2", { className: "text-lg font-semibold heading-gradient", children: "Settings" }), _jsxs("div", { className: "grid gap-3 max-w-md", children: [_jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Name", className: "rounded-xl p-2 bg-white/10 border border-white/20 text-white placeholder-white/60" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email", className: "rounded-xl p-2 bg-white/10 border border-white/20 text-white placeholder-white/60" }), _jsx("button", { onClick: save, className: "px-3 py-2 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]", children: "Save" }), status && _jsx("p", { className: "text-sm text-green-400", children: status })] })] }));
}
