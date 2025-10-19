import React, { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../../firebase';
import { ref, onValue, off, set, push, update } from 'firebase/database';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { subscribeAgentAvailability, createChat, subscribeMessages, sendMessage as sendChatMessage, saveCommonQA, logAiConversation } from '../../utils/support';

interface Ticket {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'Technical' | 'Payment' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Pending' | 'Resolved';
  createdAt: string;
  updates: { date: string; message: string; adminId?: string }[];
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderType: 'USER' | 'AGENT' | 'AI';
  content: string;
  timestamp: string;
}

export default function Support() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ticket' | 'chat' | 'ai'>('ticket');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'Technical' as Ticket['category'],
    priority: 'Medium' as Ticket['priority'],
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [agentOnline, setAgentOnline] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let unsubscribeTickets: (() => void) | undefined;
    if (user?.id) {
      setLoading(true);
      const ticketsRef = ref(db, `users/${user.id}/tickets`);
      const handler = (snap: any) => {
        const val = snap.val() || {};
        const list: Ticket[] = Object.keys(val).map((id) => ({ ...(val[id] as any), id }));
        setTickets(list);
        setNotificationCount(list.filter((t) => t.status === 'Open' || (t.updates?.length ?? 0) > 0).length);
        setLoading(false);
      };
      onValue(ticketsRef, handler);
      unsubscribeTickets = () => off(ticketsRef, 'value', handler);
    }

    const unsubAgent = subscribeAgentAvailability((available) => setAgentOnline(!!available));

    return () => {
      try { unsubscribeTickets && unsubscribeTickets(); } catch {}
      try { unsubAgent && unsubAgent(); } catch {}
      if (chatUnsubRef.current) {
        try { chatUnsubRef.current(); } catch {}
        chatUnsubRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages]);

  const createTicket = useCallback(async () => {
    if (!user?.id || !ticketForm.title || !ticketForm.description) return;
    setLoading(true);
    try {
      const globalRef = push(ref(db, `support/tickets`));
      const ticket: Ticket = {
        id: globalRef.key!,
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
      setTicketForm({ title: '', description: '', category: 'Technical', priority: 'Medium' });
      document.dispatchEvent(new CustomEvent('notifications:add', {
        detail: { type: 'service', message: `Ticket "${ticket.title}" created`, route: '/support' },
      }));
    } catch (e) {
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, ticketForm]);

  const startChat = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const id = await createChat(user.id);
      setChatId(id);
      setMessages([]);
      if (chatUnsubRef.current) { try { chatUnsubRef.current(); } catch {} }
      chatUnsubRef.current = subscribeMessages(id, (list) => {
        setMessages(list);
        setNotificationCount((prev) => prev + 1);
        if (activeTab !== 'chat') {
          document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'service', message: 'New chat message', route: '/support' } }));
        }
      });
      setActiveTab('chat');
    } catch (e) {
      setError('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  const sendMessage = useCallback(() => {
    if (!chatId || !msgInput.trim()) return;
    const msg: ChatMessage = {
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
    if (!aiInput.trim()) return;
    setLoading(true);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      chatId: 'ai',
      senderType: 'USER',
      content: aiInput,
      timestamp: new Date().toISOString(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    try {
      const res = await fetch('http://localhost:4000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, prompt: aiInput }),
      });
      if (!res.ok) throw new Error('AI chat failed');
      const response = await res.json();
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        chatId: 'ai',
        senderType: 'AGENT',
        content: response.reply || 'Sorry, I couldn’t process your request.',
        timestamp: new Date().toISOString(),
      };
      setAiMessages((prev) => [...prev, aiMsg]);
      await saveCommonQA(userMsg.content, aiMsg.content);
      await logAiConversation(user?.id ?? 'anon', userMsg.content, aiMsg.content, !response?.reply);

      if (response.suggestTicket || !response.reply) {
        setAiMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            chatId: 'ai',
            senderType: 'AGENT',
            content: 'Would you like to raise a ticket or connect with a live agent?',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      setNotificationCount((prev) => prev + 1);
      document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'service', message: 'AI responded', route: '/support' } }));
    } catch (e) {
      setError('Failed to get AI response. Please try again.');
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        chatId: 'ai',
        senderType: 'AGENT',
        content: 'I am having trouble answering right now. Please raise a ticket or try live chat.',
        timestamp: new Date().toISOString(),
      };
      setAiMessages((prev) => [...prev, aiMsg]);
      try {
        await logAiConversation(user?.id ?? 'anon', userMsg.content, aiMsg.content, true);
      } catch {}
    } finally {
      setAiInput('');
      setLoading(false);
    }
  }, [aiInput, user?.id]);

  const formatDate = (iso: string) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—');

  return (
    <div className="min-h-screen bg-gray-900 text-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Support</h2>
          {notificationCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
              {notificationCount}
            </span>
          )}
        </div>

        <div className="flex border-b border-gray-700/30">
          {(['ticket', 'chat', 'ai'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'border-b-2 border-cyan-500 text-cyan-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'ticket' ? 'Raise Ticket' : tab === 'chat' ? 'Live Chat' : 'AI Chatbot'}
            </button>
          ))}
        </div>

        <section className="rounded-xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 animate-fade-in">
          {activeTab === 'ticket' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Raise a Ticket</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder="Ticket Title"
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                />
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                >
                  <option value="Technical">Technical</option>
                  <option value="Payment">Payment</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Describe your issue"
                  className="w-full sm:col-span-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                  rows={4}
                />
                <button
                  onClick={createTicket}
                  disabled={loading}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? <span className="animate-pulse">Submitting...</span> : 'Submit Ticket'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="mt-6">
                <h4 className="text-white font-medium mb-2">My Tickets</h4>
                {tickets.length === 0 ? (
                  <p className="text-gray-400 text-sm">No tickets found.</p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="rounded-lg bg-gray-800/40 p-4 cursor-pointer hover:bg-gray-700/50 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white truncate">{t.title}</span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              t.status === 'Open'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : t.status === 'Pending'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{formatDate(t.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Live Chat</h3>
              {agentOnline ? (
                <p className="text-green-400 text-sm">Agent is online</p>
              ) : (
                <p className="text-red-400 text-sm">No agents available</p>
              )}
              {chatId ? (
                <div className="space-y-3">
                  <div className="h-64 overflow-y-auto rounded-lg bg-gray-800/40 p-4">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`mb-2 ${m.senderType === 'USER' ? 'text-right' : 'text-left'}`}
                      >
                        <span
                          className={`inline-block px-3 py-2 rounded-lg ${
                            m.senderType === 'USER'
                              ? 'bg-cyan-500/20 text-white'
                              : 'bg-gray-700/40 text-gray-200'
                          }`}
                        >
                          {m.content}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(m.timestamp)}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      placeholder="Type your message"
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !chatId || !msgInput.trim()}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? <span className="animate-pulse">Sending...</span> : 'Send'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startChat}
                  disabled={loading}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? <span className="animate-pulse">Starting...</span> : 'Start Live Chat'}
                </button>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">AI Chatbot</h3>
              <div className="h-64 overflow-y-auto rounded-lg bg-gray-800/40 p-4">
                {aiMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-2 ${m.senderType === 'USER' ? 'text-right' : 'text-left'}`}
                  >
                    <span
                      className={`inline-block px-3 py-2 rounded-lg ${
                        m.senderType === 'USER'
                          ? 'bg-cyan-500/20 text-white'
                          : 'bg-gray-700/40 text-gray-200'
                      }`}
                    >
                      {m.content}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(m.timestamp)}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask the AI bot"
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                />
                <button
                  onClick={sendAiMessage}
                  disabled={loading}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? <span className="animate-pulse">Responding...</span> : 'Send'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </section>

        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500"
              onClick={() => setSelectedTicket(null)}
            />
            <div className="relative w-full max-w-lg rounded-xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
              <h3 className="text-xl font-semibold text-white mb-4">{selectedTicket.title}</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Ticket ID</span>
                  <span className="font-mono text-white">{selectedTicket.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Category</span>
                  <span>{selectedTicket.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Priority</span>
                  <span>{selectedTicket.priority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status</span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      selectedTicket.status === 'Open'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : selectedTicket.status === 'Pending'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Created</span>
                  <span>{formatDate(selectedTicket.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium">Description</span>
                  <p className="text-gray-200 mt-1">{selectedTicket.description}</p>
                </div>
                {selectedTicket.updates?.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium text-sm mb-2">Updates</h4>
                    <div className="space-y-2">
                      {selectedTicket.updates.map((u, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span>{u.message}</span>
                          <span className="text-xs text-gray-500">{formatDate(u.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-3 py-1.5 rounded-full bg-gray-700/40 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}