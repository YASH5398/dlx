import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
export default function AdminNotifications() {
    const [type, setType] = useState('push');
    const [target, setTarget] = useState('all');
    const [targetUser, setTargetUser] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [rows, setRows] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const q = query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setRows(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        }, (err) => console.error('Failed to stream notifications:', err));
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    const send = async (e) => {
        e.preventDefault();
        setSending(true);
        setError(null);
        try {
            const data = {
                type,
                target: target === 'all' ? 'all' : (targetUser || 'all'),
                title,
                message,
                createdAt: Date.now(),
            };
            await addDoc(collection(firestore, 'notifications'), data);
            setTitle('');
            setMessage('');
            setTargetUser('');
        }
        catch (e) {
            setError(e.message || 'Failed to send notification');
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Send Notification" }), error && _jsx("div", { className: "text-sm text-red-400", children: error }), _jsxs("form", { onSubmit: send, className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300", children: "Type" }), _jsxs("select", { value: type, onChange: (e) => setType(e.target.value), className: "mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2", children: [_jsx("option", { value: "push", children: "Push" }), _jsx("option", { value: "email", children: "Email" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300", children: "Target" }), _jsxs("select", { value: target, onChange: (e) => setTarget(e.target.value), className: "mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2", children: [_jsx("option", { value: "all", children: "All Users" }), _jsx("option", { value: "user", children: "Specific User" })] })] })] }), target === 'user' && (_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300", children: "User ID or Email" }), _jsx("input", { value: targetUser, onChange: (e) => setTargetUser(e.target.value), className: "mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" })] })), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300", children: "Title" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), className: "mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300", children: "Message" }), _jsx("textarea", { value: message, onChange: (e) => setMessage(e.target.value), className: "mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-24", required: true })] }), _jsx("button", { disabled: sending, className: "rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-2", children: sending ? 'Sending...' : 'Send' })] })] }), _jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "Recent Notifications" }), _jsxs("div", { className: "space-y-2", children: [rows.map((n) => (_jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-semibold", children: n.title || '(No title)' }), _jsx("span", { className: "text-xs text-gray-400", children: new Date(Number(n.createdAt || 0)).toLocaleString() })] }), _jsxs("div", { className: "text-xs text-gray-400", children: [(n.type || 'push').toUpperCase(), " \u2022 ", (n.target || 'all')] }), _jsx("div", { className: "mt-2 text-sm", children: n.message })] }, n.id))), rows.length === 0 && (_jsx("div", { className: "text-sm text-gray-400", children: "No notifications yet." }))] })] })] }));
}
