import React, { useState } from 'react';

export default function Support() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const submit = () => {
    if (!subject || !message) { setStatus('Please fill all fields.'); return; }
    const ticketsRaw = localStorage.getItem('dlx_tickets');
    const tickets = ticketsRaw ? JSON.parse(ticketsRaw) : [];
    tickets.push({ id: crypto.randomUUID(), subject, message, createdAt: Date.now() });
    localStorage.setItem('dlx_tickets', JSON.stringify(tickets));
    setStatus('Ticket submitted successfully. Our team will contact you.');
    setSubject(''); setMessage('');
  };

  return (
    <div className="card space-y-3 animate-fade-in">
      <h2 className="text-lg font-semibold heading-gradient">Support</h2>
      <div className="grid gap-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-xl p-2 bg-white/10 border border-white/20 text-white placeholder-white/60" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue" className="rounded-xl p-2 h-28 bg-white/10 border border-white/20 text-white placeholder-white/60" />
        <button onClick={submit} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]">Submit Ticket</button>
        {status && <p className="text-sm text-green-400">{status}</p>}
      </div>
    </div>
  );
}