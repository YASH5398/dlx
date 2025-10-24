import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { subscribeAllTickets, sendTicketMessage, updateTicketStatus, deleteTicket } from '../../utils/support';
export default function AdminSupport() {
    const [tickets, setTickets] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const unsub = subscribeAllTickets((list) => setTickets(list));
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    const active = tickets.find((t) => t.id === activeId) || null;
    const updates = Array.isArray(active?.updates)
        ? active.updates
        : (active && typeof active.updates === 'object' ? Object.keys(active.updates).map((k) => ({ id: k, ...active.updates[k] })) : []);
    const sendReply = async () => {
        if (!active?.id || !reply.trim())
            return;
        setLoading(true);
        try {
            await sendTicketMessage(active.id, reply.trim());
            setReply('');
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    const closeTicket = async (id) => {
        try {
            await updateTicketStatus(id, 'Resolved');
        }
        catch (e) {
            console.error(e);
        }
    };
    const markPending = async (id) => {
        try {
            await updateTicketStatus(id, 'Pending');
        }
        catch (e) {
            console.error(e);
        }
    };
    const removeTicket = async (id) => {
        if (!confirm('Delete this ticket?'))
            return;
        try {
            await deleteTicket(id);
            if (activeId === id)
                setActiveId(null);
        }
        catch (e) {
            console.error(e);
        }
    };
    const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
    return (_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4 space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Support Tickets" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [_jsxs("div", { className: "lg:col-span-1 space-y-2", children: [tickets.map((t) => (_jsxs("div", { className: `rounded-lg border p-3 cursor-pointer ${activeId === t.id ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'}`, onClick: () => setActiveId(t.id), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: t.title || 'Ticket' }), _jsxs("div", { className: "text-xs text-gray-400", children: [t.category, " \u2022 ", t.priority] })] }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${t.status === 'Open' ? 'bg-emerald-500/20 text-emerald-300' : t.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`, children: t.status })] }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: formatDate(t.createdAt) })] }, t.id))), tickets.length === 0 && (_jsx("div", { className: "text-sm text-gray-400", children: "No tickets found." }))] }), _jsx("div", { className: "lg:col-span-2", children: active ? (_jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: active.title }), _jsxs("div", { className: "text-xs text-gray-400", children: ["User: ", active.userId] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => markPending(active.id), className: "px-3 py-1 rounded bg-white/10 border border-white/20", children: "Mark Pending" }), _jsx("button", { onClick: () => closeTicket(active.id), className: "px-3 py-1 rounded bg-white/10 border border-white/20", children: "Close" }), _jsx("button", { onClick: () => removeTicket(active.id), className: "px-3 py-1 rounded bg-red-600/20 border border-red-500/40 text-red-300", children: "Delete" })] })] }), _jsx("div", { className: "text-sm text-gray-300", children: active.description }), _jsxs("div", { className: "rounded bg-[#0a0e1f] border border-white/10 p-3 h-48 overflow-y-auto", children: [updates.map((u, idx) => (_jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "text-xs text-gray-400", children: [formatDate(u.date), " ", u.adminId ? '• Admin' : ''] }), _jsx("div", { className: "text-white", children: u.message })] }, u.id || idx))), updates.length === 0 && (_jsx("div", { className: "text-xs text-gray-500", children: "No messages yet." }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: reply, onChange: (e) => setReply(e.target.value), placeholder: "Type a reply", className: "flex-1 px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsx("button", { disabled: loading, onClick: sendReply, className: "px-4 py-2 rounded bg-cyan-600/30 border border-cyan-400/40", children: "Send" })] })] })) : (_jsx("div", { className: "text-sm text-gray-400", children: "Select a ticket to view details." })) })] })] }));
}
