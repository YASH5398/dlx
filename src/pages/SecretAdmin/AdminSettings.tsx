import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export default function AdminSettings() {
  const [config, setConfig] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState<{ link: string; expires_at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cfgRef = doc(firestore, 'config', 'admin');
        const snap = await getDoc(cfgRef);
        if (snap.exists()) {
          setConfig(snap.data());
        } else {
          const defaultCfg = { auth: 'firebase', hashing: 'argon2 (client-only)', invites: true, updatedAt: Date.now() };
          await setDoc(cfgRef, defaultCfg);
          setConfig(defaultCfg);
        }
      } catch (error) {
        console.error('Failed to load admin config:', error);
        setConfig({ auth: 'firebase', hashing: 'argon2 (client-only)', invites: true });
      }
    })();
  }, []);

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvite(null);
    try {
      if (!email) throw new Error('Email is required');
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24h
      const invCol = collection(firestore, 'admin_invites');
      await addDoc(invCol, { email, token, expiresAt, createdAt: Date.now(), status: 'pending' });
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${base}/secret-admin/invite/${token}`;
      setInvite({ link, expires_at: new Date(expiresAt).toLocaleString() });
    } catch (e: any) {
      setError(e.message || 'Failed to generate invite');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Configuration</div>
        <div className="text-sm text-gray-300">Auth: {config?.auth}</div>
        <div className="text-sm text-gray-300">Hashing: {config?.hashing}</div>
        <div className="text-sm text-gray-300">Invites: {config?.invites ? 'Enabled' : 'Disabled'}</div>
      </div>
      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Generate Admin Invite</div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <form onSubmit={generateInvite} className="space-y-3">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
          </div>
          <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-2">Generate Invite</button>
        </form>
        {invite && (
          <div className="mt-3 text-sm">
            <div className="text-gray-300">Invite Link:</div>
            <a href={invite.link} className="text-emerald-400 break-words">{invite.link}</a>
            <div className="text-gray-400">Expires at: {invite.expires_at}</div>
          </div>
        )}
      </div>
    </div>
  );
}