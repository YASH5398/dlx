import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
export default function AdminSettings() {
    const [config, setConfig] = useState(null);
    const [email, setEmail] = useState('');
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        (async () => {
            try {
                const cfgRef = doc(firestore, 'config', 'admin');
                const snap = await getDoc(cfgRef);
                if (snap.exists()) {
                    setConfig(snap.data());
                }
                else {
                    const defaultCfg = { auth: 'firebase', hashing: 'argon2 (client-only)', invites: true, updatedAt: Date.now() };
                    await setDoc(cfgRef, defaultCfg);
                    setConfig(defaultCfg);
                }
            }
            catch (error) {
                console.error('Failed to load admin config:', error);
                setConfig({ auth: 'firebase', hashing: 'argon2 (client-only)', invites: true });
            }
        })();
    }, []);
    const generateInvite = async (e) => {
        e.preventDefault();
        setError(null);
        setInvite(null);
        try {
            if (!email)
                throw new Error('Email is required');
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
            const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24h
            const invCol = collection(firestore, 'admin_invites');
            await addDoc(invCol, { email, token, expiresAt, createdAt: Date.now(), status: 'pending' });
            const base = typeof window !== 'undefined' ? window.location.origin : '';
            const link = `${base}/secret-admin/invite/${token}`;
            setInvite({ link, expires_at: new Date(expiresAt).toLocaleString() });
        }
        catch (e) {
            setError(e.message || 'Failed to generate invite');
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Configuration" }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Auth: ", config?.auth] }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Hashing: ", config?.hashing] }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Invites: ", config?.invites ? 'Enabled' : 'Disabled'] })] }), _jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Generate Admin Invite" }), error && _jsx("div", { className: "text-sm text-red-400", children: error }), _jsxs("form", { onSubmit: generateInvite, className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2", required: true })] }), _jsx("button", { className: "rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-2", children: "Generate Invite" })] }), invite && (_jsxs("div", { className: "mt-3 text-sm", children: [_jsx("div", { className: "text-gray-300", children: "Invite Link:" }), _jsx("a", { href: invite.link, className: "text-emerald-400 break-words", children: invite.link }), _jsxs("div", { className: "text-gray-400", children: ["Expires at: ", invite.expires_at] })] }))] })] }));
}
