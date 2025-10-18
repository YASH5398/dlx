import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { ref, onValue, update, push, set } from 'firebase/database';

export default function AdminUserDetail() {
  const { uid } = useParams();
  const [userNode, setUserNode] = useState<any>(null);
  const [activities, setActivities] = useState<Record<string, any>>({});
  const [level, setLevel] = useState<'Starter' | 'Silver' | 'Gold'>('Starter');
  const [wallet, setWallet] = useState({ dlx: 0, usdt: 0, inr: 0 });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!uid) return;
    const unsubUser = onValue(ref(db, `users/${uid}`), (snap) => {
      const val = snap.val() || {};
      setUserNode(val);
      const tier = val.referrals?.tier ?? 1;
      setLevel(tier === 1 ? 'Starter' : tier === 2 ? 'Silver' : 'Gold');
      setWallet({ dlx: val.wallet?.dlx ?? 0, usdt: val.wallet?.usdt ?? 0, inr: val.wallet?.inr ?? 0 });
    });
    const unsubAct = onValue(ref(db, `activities/${uid}`), (snap) => setActivities(snap.val() || {}));
    return () => { unsubUser(); unsubAct(); };
  }, [uid]);

  const timeline = useMemo(() => {
    const entries = Object.entries(activities).map(([ts, a]) => ({ ts: Number(ts), ...a as any }));
    return entries.sort((a, b) => b.ts - a.ts);
  }, [activities]);

  const saveEdits = async () => {
    const tier = level === 'Starter' ? 1 : level === 'Silver' ? 2 : 3;
    await update(ref(db, `users/${uid}/referrals`), { tier });
    await update(ref(db, `users/${uid}/wallet`), wallet);
    try {
      const listRef = ref(db, `notifications/users/${uid}`);
      const n1 = push(listRef);
      await set(n1, { id: n1.key as string, type: 'referral', message: `Referral tier updated to ${level}`, createdAt: Date.now(), read: false });
      const n2 = push(listRef);
      await set(n2, { id: n2.key as string, type: 'wallet', message: `Wallet balances updated by admin`, createdAt: Date.now(), read: false });
    } catch {}
  };

  const sendNotification = async () => {
    if (!message.trim()) return;
    const listRef = ref(db, `notifications/users/${uid}`);
    const newRef = push(listRef);
    await set(newRef, { id: newRef.key as string, type: 'info', message, createdAt: Date.now(), read: false });
    setMessage('');
  };

  const exportCsv = () => {
    const header = ['timestamp','type','detail'];
    const lines = timeline.map((t) => [t.ts, t.type, JSON.stringify(t.meta ?? {})].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_${uid}_activities.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Detail</h1>
      {!userNode ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <div className="text-sm text-gray-300">Name</div>
            <div className="text-lg font-semibold">{userNode.profile?.name ?? 'User'}</div>
            <div className="text-sm text-gray-300 mt-2">Email</div>
            <div className="text-lg">{userNode.profile?.email ?? ''}</div>
            <div className="text-sm text-gray-300 mt-2">Level</div>
            <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="mt-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20">
              <option value="Starter">Starter</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
            <div className="mt-4 text-sm text-gray-300">Wallet</div>
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-20 text-gray-400">DLX</label>
                <input type="number" value={wallet.dlx} onChange={(e) => setWallet((w) => ({ ...w, dlx: Number(e.target.value) }))} className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-gray-400">USDT</label>
                <input type="number" value={wallet.usdt} onChange={(e) => setWallet((w) => ({ ...w, usdt: Number(e.target.value) }))} className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-gray-400">INR</label>
                <input type="number" value={wallet.inr} onChange={(e) => setWallet((w) => ({ ...w, inr: Number(e.target.value) }))} className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20" />
              </div>
            </div>
            <button onClick={saveEdits} className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">Save Changes</button>
          </div>

          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Activity Timeline</h2>
              <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20">Export CSV</button>
            </div>
            <div className="mt-3 space-y-3">
              {timeline.length === 0 && <div className="text-sm text-gray-400">No activities found.</div>}
              {timeline.map((t) => (
                <div key={t.ts} className="rounded-xl p-3 bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400">{new Date(t.ts).toLocaleString()}</div>
                  <div className="text-sm font-semibold">{t.type}</div>
                  {t.meta && <div className="text-xs text-gray-300 mt-1">{JSON.stringify(t.meta)}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <h2 className="text-lg font-semibold">Notify User</h2>
            <div className="mt-2">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" placeholder="Type a message..." />
            </div>
            <button onClick={sendNotification} className="mt-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15">Send Notification</button>
          </div>
        </div>
      )}
    </div>
  );
}