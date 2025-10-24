import React, { useEffect, useState } from 'react';
import { subscribeAllTickets, sendTicketMessage, updateTicketStatus, deleteTicket } from '../../utils/support';
import type { Ticket } from '../../utils/support';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeAllTickets((list) => setTickets(list));
    return () => { try { unsub(); } catch {} };
  }, []);

  const active = tickets.find((t) => t.id === activeId) || null;
  const updates = Array.isArray(active?.updates)
    ? (active!.updates as any[])
    : (active && typeof active.updates === 'object' ? Object.keys(active.updates).map((k) => ({ id: k, ...(active!.updates as any)[k] })) : []);

  const sendReply = async () => {
    if (!active?.id || !reply.trim()) return;
    setLoading(true);
    try {
      await sendTicketMessage(active.id, reply.trim());
      setReply('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeTicket = async (id: string) => {
    try { await updateTicketStatus(id, 'Resolved'); } catch (e) { console.error(e); }
  };
  const markPending = async (id: string) => {
    try { await updateTicketStatus(id, 'Pending'); } catch (e) { console.error(e); }
  };
  const removeTicket = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    try { await deleteTicket(id); if (activeId === id) setActiveId(null); } catch (e) { console.error(e); }
  };

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4 space-y-4">
      <div className="text-lg font-semibold">Support Tickets</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className={`rounded-lg border p-3 cursor-pointer ${activeId===t.id? 'bg-white/10 border-white/30':'bg-white/5 border-white/10'}`} onClick={() => setActiveId(t.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{t.title || 'Ticket'}</div>
                  <div className="text-xs text-gray-400">{t.category} • {t.priority}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${t.status==='Open'?'bg-emerald-500/20 text-emerald-300':t.status==='Pending'?'bg-yellow-500/20 text-yellow-300':'bg-blue-500/20 text-blue-300'}`}>{t.status}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{formatDate(t.createdAt)}</div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="text-sm text-gray-400">No tickets found.</div>
          )}
        </div>

        <div className="lg:col-span-2">
          {active ? (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{active.title}</div>
                  <div className="text-xs text-gray-400">User: {active.userId}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>markPending(active.id)} className="px-3 py-1 rounded bg-white/10 border border-white/20">Mark Pending</button>
                  <button onClick={()=>closeTicket(active.id)} className="px-3 py-1 rounded bg-white/10 border border-white/20">Close</button>
                  <button onClick={()=>removeTicket(active.id)} className="px-3 py-1 rounded bg-red-600/20 border border-red-500/40 text-red-300">Delete</button>
                </div>
              </div>
              <div className="text-sm text-gray-300">{active.description}</div>

              <div className="rounded bg-[#0a0e1f] border border-white/10 p-3 h-48 overflow-y-auto">
                {updates.map((u: any, idx: number) => (
                  <div key={u.id || idx} className="mb-2">
                    <div className="text-xs text-gray-400">{formatDate(u.date)} {u.adminId ? '• Admin' : ''}</div>
                    <div className="text-white">{u.message}</div>
                  </div>
                ))}
                {updates.length === 0 && (
                  <div className="text-xs text-gray-500">No messages yet.</div>
                )}
              </div>

              <div className="flex gap-2">
                <input value={reply} onChange={(e)=>setReply(e.target.value)} placeholder="Type a reply" className="flex-1 px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
                <button disabled={loading} onClick={sendReply} className="px-4 py-2 rounded bg-cyan-600/30 border border-cyan-400/40">Send</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Select a ticket to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}