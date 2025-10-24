import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { db, firestore } from '../../firebase';
import { ref, onValue, off, set, push, update } from 'firebase/database';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { subscribeAgentAvailability, createChat, subscribeMessages, sendMessage as sendChatMessage, saveCommonQA, logAiConversation } from '../../utils/support';
import { doc as fsDoc, setDoc as fsSetDoc, collection as fsCollection, addDoc as fsAddDoc, onSnapshot as fsOnSnapshot, query as fsQuery, orderBy as fsOrderBy, serverTimestamp as fsServerTimestamp } from 'firebase/firestore';
export default function Support() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ticket');
    const [tickets, setTickets] = useState([]);
    const [ticketForm, setTicketForm] = useState({
        title: '',
        description: '',
        category: 'Technical',
        priority: 'Medium',
    });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState('');
    const [agentOnline, setAgentOnline] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const messagesEndRef = useRef(null);
    const chatUnsubRef = useRef(null);
    // Firestore ticket chat state
    const [ticketMessages, setTicketMessages] = useState([]);
    const [ticketMsgInput, setTicketMsgInput] = useState('');
    const ticketChatUnsubRef = useRef(null);
    useEffect(() => {
        let unsubscribeTickets;
        if (user?.id) {
            setLoading(true);
            const ticketsRef = ref(db, `users/${user.id}/tickets`);
            const handler = (snap) => {
                const val = snap.val() || {};
                const list = Object.keys(val).map((id) => ({ ...val[id], id }));
                setTickets(list);
                setNotificationCount(list.filter((t) => t.status === 'Open' || (t.updates?.length ?? 0) > 0).length);
                setLoading(false);
            };
            onValue(ticketsRef, handler);
            unsubscribeTickets = () => off(ticketsRef, 'value', handler);
        }
        const unsubAgent = subscribeAgentAvailability((available) => setAgentOnline(!!available));
        return () => {
            try {
                unsubscribeTickets && unsubscribeTickets();
            }
            catch { }
            try {
                unsubAgent && unsubAgent();
            }
            catch { }
            if (chatUnsubRef.current) {
                try {
                    chatUnsubRef.current();
                }
                catch { }
                chatUnsubRef.current = null;
            }
        };
    }, [user?.id]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, aiMessages, ticketMessages]);
    // Subscribe to Firestore ticket messages when a ticket is selected
    useEffect(() => {
        if (!selectedTicket?.id) {
            if (ticketChatUnsubRef.current) {
                try {
                    ticketChatUnsubRef.current();
                }
                catch { }
            }
            setTicketMessages([]);
            return;
        }
        const q = fsQuery(fsCollection(firestore, 'supportTickets', selectedTicket.id, 'messages'), fsOrderBy('timestamp', 'asc'));
        const unsub = fsOnSnapshot(q, (snap) => {
            const list = [];
            snap.forEach((d) => {
                const data = d.data();
                list.push({
                    id: d.id,
                    chatId: selectedTicket.id,
                    senderType: (data.senderType || data.role || 'USER'),
                    content: String(data.content || ''),
                    timestamp: (data.timestamp && typeof data.timestamp.toDate === 'function') ? data.timestamp.toDate().toISOString() : new Date((data.timestamp || Date.now())).toISOString(),
                });
            });
            setTicketMessages(list);
        });
        ticketChatUnsubRef.current = unsub;
        return () => { try {
            unsub();
        }
        catch { } };
    }, [selectedTicket?.id]);
    const createTicket = useCallback(async () => {
        if (!user?.id || !ticketForm.title || !ticketForm.description)
            return;
        setLoading(true);
        try {
            const globalRef = push(ref(db, `support/tickets`));
            const ticket = {
                id: globalRef.key,
                userId: user.id,
                title: ticketForm.title,
                description: ticketForm.description,
                category: ticketForm.category,
                priority: ticketForm.priority,
                status: 'Open',
                createdAt: new Date().toISOString(),
                updates: [],
            };
            await set(globalRef, ticket);
            await set(ref(db, `users/${user.id}/tickets/${ticket.id}`), ticket);
            // Mirror ticket into Firestore
            try {
                await fsSetDoc(fsDoc(firestore, 'supportTickets', ticket.id), {
                    id: ticket.id,
                    userId: ticket.userId,
                    title: ticket.title,
                    description: ticket.description,
                    category: ticket.category,
                    priority: ticket.priority,
                    status: ticket.status,
                    createdAt: Date.now(),
                }, { merge: true });
            }
            catch { }
            setTicketForm({ title: '', description: '', category: 'Technical', priority: 'Medium' });
            document.dispatchEvent(new CustomEvent('notifications:add', {
                detail: { type: 'service', message: `Ticket "${ticket.title}" created`, route: '/support' },
            }));
        }
        catch (e) {
            setError('Failed to create ticket. Please try again.');
        }
        finally {
            setLoading(false);
        }
    }, [user?.id, ticketForm]);
    const startChat = useCallback(async () => {
        if (!user?.id)
            return;
        setLoading(true);
        try {
            const id = await createChat(user.id);
            setChatId(id);
            setMessages([]);
            if (chatUnsubRef.current) {
                try {
                    chatUnsubRef.current();
                }
                catch { }
            }
            chatUnsubRef.current = subscribeMessages(id, (list) => {
                setMessages(list);
                setNotificationCount((prev) => prev + 1);
                if (activeTab !== 'chat') {
                    document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'service', message: 'New chat message', route: '/support' } }));
                }
            });
            setActiveTab('chat');
        }
        catch (e) {
            setError('Failed to start chat. Please try again.');
        }
        finally {
            setLoading(false);
        }
    }, [user?.id, activeTab]);
    const sendMessage = useCallback(() => {
        if (!chatId || !msgInput.trim())
            return;
        const msg = {
            id: crypto.randomUUID(),
            chatId,
            senderType: 'USER',
            content: msgInput.trim(),
            timestamp: new Date().toISOString(),
        };
        sendChatMessage(chatId, msg);
        setMsgInput('');
    }, [chatId, msgInput]);
    const sendAiMessage = useCallback(async () => {
        if (!aiInput.trim())
            return;
        setLoading(true);
        const userMsg = {
            id: crypto.randomUUID(),
            chatId: 'ai',
            senderType: 'USER',
            content: aiInput,
            timestamp: new Date().toISOString(),
        };
        setAiMessages((prev) => [...prev, userMsg]);
        const maxAttempts = 2;
        let attempt = 0;
        let response = null;
        while (attempt < maxAttempts) {
            try {
                const res = await fetch('http://localhost:4000/api/ai-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.id, prompt: aiInput }),
                });
                if (!res.ok)
                    throw new Error(`AI chat failed (${res.status})`);
                response = await res.json();
                break;
            }
            catch (err) {
                attempt++;
                if (attempt < maxAttempts) {
                    setError('Reconnecting...');
                    const reconnectMsg = {
                        id: crypto.randomUUID(),
                        chatId: 'ai',
                        senderType: 'AGENT',
                        content: 'Reconnecting...',
                        timestamp: new Date().toISOString(),
                    };
                    setAiMessages((prev) => [...prev, reconnectMsg]);
                    await new Promise((r) => setTimeout(r, 1000 * attempt));
                }
            }
        }
        if (!response?.reply) {
            setError('Failed to get AI response. Please try again.');
            const aiMsg = {
                id: crypto.randomUUID(),
                chatId: 'ai',
                senderType: 'AGENT',
                content: 'I am having trouble answering right now. Please raise a ticket or try live chat.',
                timestamp: new Date().toISOString(),
            };
            setAiMessages((prev) => [...prev, aiMsg]);
            try {
                await logAiConversation(user?.id ?? 'anon', userMsg.content, aiMsg.content, true);
            }
            catch { }
        }
        else {
            const aiMsg = {
                id: crypto.randomUUID(),
                chatId: 'ai',
                senderType: 'AI',
                content: response.reply,
                timestamp: new Date().toISOString(),
            };
            setAiMessages((prev) => [...prev, aiMsg]);
            try {
                await saveCommonQA(userMsg.content, aiMsg.content);
                await logAiConversation(user?.id ?? 'anon', userMsg.content, aiMsg.content, false);
            }
            catch { }
            setNotificationCount((prev) => prev + 1);
            document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'service', message: 'AI responded', route: '/support' } }));
        }
        setAiInput('');
        setLoading(false);
    }, [aiInput, user?.id]);
    const sendTicketMessage = useCallback(async () => {
        if (!selectedTicket?.id || !ticketMsgInput.trim() || !user?.id)
            return;
        const content = ticketMsgInput.trim();
        setTicketMsgInput('');
        try {
            await fsAddDoc(fsCollection(firestore, 'supportTickets', selectedTicket.id, 'messages'), {
                senderType: 'USER',
                userId: user.id,
                content,
                timestamp: fsServerTimestamp(),
            });
            await fetch(`http://localhost:4000/api/support/tickets/${selectedTicket.id}/ai-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, prompt: content }),
            });
        }
        catch (e) {
            setError('Failed to send message. Please try again.');
        }
    }, [selectedTicket?.id, ticketMsgInput, user?.id]);
    const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—');
    return (_jsx("div", { className: "min-h-screen bg-gray-900 text-white py-6 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-semibold text-white", children: "Support" }), notificationCount > 0 && (_jsx("span", { className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400", children: notificationCount }))] }), _jsx("div", { className: "flex border-b border-gray-700/30", children: ['ticket', 'chat', 'ai'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 text-sm font-medium transition-all duration-300 ${activeTab === tab
                            ? 'border-b-2 border-cyan-500 text-cyan-400'
                            : 'text-gray-400 hover:text-gray-200'}`, children: tab === 'ticket' ? 'Raise Ticket' : tab === 'chat' ? 'Live Chat' : 'AI Chatbot' }, tab))) }), _jsxs("section", { className: "rounded-xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 animate-fade-in", children: [activeTab === 'ticket' && (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-white", children: "Raise a Ticket" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx("input", { value: ticketForm.title, onChange: (e) => setTicketForm({ ...ticketForm, title: e.target.value }), placeholder: "Ticket Title", className: "w-full px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300" }), _jsxs("select", { value: ticketForm.category, onChange: (e) => setTicketForm({ ...ticketForm, category: e.target.value }), className: "w-full px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300", children: [_jsx("option", { value: "Technical", children: "Technical" }), _jsx("option", { value: "Payment", children: "Payment" }), _jsx("option", { value: "Other", children: "Other" })] }), _jsxs("select", { value: ticketForm.priority, onChange: (e) => setTicketForm({ ...ticketForm, priority: e.target.value }), className: "w-full px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300", children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" })] }), _jsx("textarea", { value: ticketForm.description, onChange: (e) => setTicketForm({ ...ticketForm, description: e.target.value }), placeholder: "Describe your issue", className: "w-full sm:col-span-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300", rows: 4 }), _jsx("button", { onClick: createTicket, disabled: loading, className: "px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50", children: loading ? _jsx("span", { className: "animate-pulse", children: "Submitting..." }) : 'Submit Ticket' })] }), error && _jsx("p", { className: "text-red-400 text-sm", children: error }), _jsxs("div", { className: "mt-6", children: [_jsx("h4", { className: "text-white font-medium mb-2", children: "My Tickets" }), tickets.length === 0 ? (_jsx("p", { className: "text-gray-400 text-sm", children: "No tickets found." })) : (_jsx("div", { className: "space-y-3", children: tickets.map((t) => (_jsxs("div", { onClick: () => setSelectedTicket(t), className: "rounded-lg bg-gray-800/40 p-4 cursor-pointer hover:bg-gray-700/50 transition-all duration-300", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-white truncate", children: t.title }), _jsx("span", { className: `text-xs px-2.5 py-1 rounded-full ${t.status === 'Open'
                                                                    ? 'bg-yellow-500/10 text-yellow-400'
                                                                    : t.status === 'Pending'
                                                                        ? 'bg-blue-500/10 text-blue-400'
                                                                        : 'bg-emerald-500/10 text-emerald-400'}`, children: t.status })] }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: formatDate(t.createdAt) })] }, t.id))) }))] })] })), activeTab === 'chat' && (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-white", children: "Live Chat" }), agentOnline ? (_jsx("p", { className: "text-green-400 text-sm", children: "Agent is online" })) : (_jsx("p", { className: "text-red-400 text-sm", children: "No agents available" })), chatId ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "h-64 overflow-y-auto rounded-lg bg-gray-800/40 p-4", children: [messages.map((m) => (_jsxs("div", { className: `mb-2 ${m.senderType === 'USER' ? 'text-right' : 'text-left'}`, children: [_jsx("span", { className: `inline-block px-3 py-2 rounded-lg ${m.senderType === 'USER'
                                                                ? 'bg-cyan-500/20 text-white'
                                                                : 'bg-gray-700/40 text-gray-200'}`, children: m.content }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: formatDate(m.timestamp) })] }, m.id))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: msgInput, onChange: (e) => setMsgInput(e.target.value), placeholder: "Type your message", className: "flex-1 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300" }), _jsx("button", { onClick: sendMessage, disabled: loading || !chatId || !msgInput.trim(), className: "px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50", children: loading ? _jsx("span", { className: "animate-pulse", children: "Sending..." }) : 'Send' })] })] })) : (_jsx("button", { onClick: startChat, disabled: loading, className: "px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50", children: loading ? _jsx("span", { className: "animate-pulse", children: "Starting..." }) : 'Start Live Chat' })), error && _jsx("p", { className: "text-red-400 text-sm", children: error })] })), activeTab === 'ai' && (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-white", children: "AI Chatbot" }), _jsxs("div", { className: "h-64 overflow-y-auto rounded-lg bg-gray-800/40 p-4", children: [aiMessages.map((m) => (_jsxs("div", { className: `mb-2 ${m.senderType === 'USER' ? 'text-right' : 'text-left'}`, children: [_jsx("span", { className: `inline-block px-3 py-2 rounded-lg ${m.senderType === 'USER'
                                                        ? 'bg-cyan-500/20 text-white'
                                                        : 'bg-gray-700/40 text-gray-200'}`, children: m.content }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: formatDate(m.timestamp) })] }, m.id))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: aiInput, onChange: (e) => setAiInput(e.target.value), placeholder: "Ask the AI bot", className: "flex-1 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300" }), _jsx("button", { onClick: sendAiMessage, disabled: loading, className: "px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50", children: loading ? _jsx("span", { className: "animate-pulse", children: "Responding..." }) : 'Send' })] }), error && _jsx("p", { className: "text-red-400 text-sm", children: error })] }))] }), selectedTicket && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500", onClick: () => setSelectedTicket(null) }), _jsxs("div", { className: "relative w-full max-w-lg rounded-xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 animate-in fade-in-50 slide-in-from-bottom-10 duration-500", children: [_jsx("h3", { className: "text-xl font-semibold text-white mb-4", children: selectedTicket.title }), _jsxs("div", { className: "space-y-3 text-sm text-gray-400", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-medium", children: "Ticket ID" }), _jsx("span", { className: "font-mono text-white", children: selectedTicket.id })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-medium", children: "Category" }), _jsx("span", { children: selectedTicket.category })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-medium", children: "Priority" }), _jsx("span", { children: selectedTicket.priority })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-medium", children: "Status" }), _jsx("span", { className: `text-xs px-2.5 py-1 rounded-full ${selectedTicket.status === 'Open'
                                                        ? 'bg-yellow-500/10 text-yellow-400'
                                                        : selectedTicket.status === 'Pending'
                                                            ? 'bg-blue-500/10 text-blue-400'
                                                            : 'bg-emerald-500/10 text-emerald-400'}`, children: selectedTicket.status })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-medium", children: "Created" }), _jsx("span", { children: formatDate(selectedTicket.createdAt) })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Description" }), _jsx("p", { className: "text-gray-200 mt-1", children: selectedTicket.description })] }), selectedTicket.updates?.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-white font-medium text-sm mb-2", children: "Updates" }), _jsx("div", { className: "space-y-2", children: selectedTicket.updates.map((u, i) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: u.message }), _jsx("span", { className: "text-xs text-gray-500", children: formatDate(u.date) })] }, i))) })] }))] }), _jsxs("div", { className: "mt-6 space-y-3", children: [_jsx("h4", { className: "text-white font-medium text-sm", children: "Chat with AI Agent" }), _jsxs("div", { className: "h-56 overflow-y-auto rounded-lg bg-gray-800/40 p-4", children: [ticketMessages.map((m) => (_jsxs("div", { className: `mb-2 ${m.senderType === 'USER' ? 'text-right' : 'text-left'}`, children: [_jsx("span", { className: `inline-block px-3 py-2 rounded-lg ${m.senderType === 'USER' ? 'bg-cyan-500/20 text-white' : 'bg-gray-700/40 text-gray-200'}`, children: m.content }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: formatDate(m.timestamp) })] }, m.id))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: ticketMsgInput, onChange: (e) => setTicketMsgInput(e.target.value), placeholder: "Type your message to AI", className: "flex-1 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300" }), _jsx("button", { onClick: async () => { await sendTicketMessage(); }, disabled: loading || !ticketMsgInput.trim(), className: "px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50", children: loading ? _jsx("span", { className: "animate-pulse", children: "Sending..." }) : 'Send' })] }), error && _jsx("p", { className: "text-red-400 text-sm", children: error })] }), _jsx("div", { className: "mt-6 flex justify-end gap-2", children: _jsx("button", { onClick: () => setSelectedTicket(null), className: "px-3 py-1.5 rounded-full bg-gray-700/40 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-all duration-300", children: "Close" }) })] })] }))] }) }));
}
