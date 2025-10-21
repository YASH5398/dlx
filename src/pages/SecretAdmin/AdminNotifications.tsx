import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';

interface NotificationDoc {
  id?: string;
  type?: 'push' | 'email';
  target?: 'all' | string;
  title?: string;
  message?: string;
  createdAt?: number;
}

export default function AdminNotifications() {
  const [type, setType] = useState<'push' | 'email'>('push');
  const [target, setTarget] = useState<'all' | 'user'>('all');
  const [targetUser, setTargetUser] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<NotificationDoc[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ ...(d.data() as NotificationDoc), id: d.id })));
    }, (err) => console.error('Failed to stream notifications:', err));
    return () => { try { unsub(); } catch {} };
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const data: NotificationDoc = {
        type,
        target: target === 'all' ? 'all' : (targetUser || 'all'),
        title,
        message,
        createdAt: Date.now(),
      };
      await addDoc(collection(firestore, 'notifications'), data);
      setTitle(''); setMessage(''); setTargetUser('');
    } catch (e: any) {
      setError(e.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Send Notification</div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <form onSubmit={send} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-gray-300">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <option value="push">Push</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300">Target</label>
              <select value={target} onChange={(e) => setTarget(e.target.value as any)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <option value="all">All Users</option>
                <option value="user">Specific User</option>
              </select>
            </div>
          </div>
          {target === 'user' && (
            <div>
              <label className="text-sm text-gray-300">User ID or Email</label>
              <input value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-300">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
          </div>
          <div>
            <label className="text-sm text-gray-300">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-24" required />
          </div>
          <button disabled={sending} className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-2">{sending ? 'Sending...' : 'Send'}</button>
        </form>
      </div>

      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Recent Notifications</div>
        <div className="space-y-2">
          {rows.map((n) => (
            <div key={n.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{n.title || '(No title)'}</div>
                <span className="text-xs text-gray-400">{new Date(Number(n.createdAt || 0)).toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-400">{(n.type || 'push').toUpperCase()} • {(n.target || 'all')}</div>
              <div className="mt-2 text-sm">{n.message}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-sm text-gray-400">No notifications yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}