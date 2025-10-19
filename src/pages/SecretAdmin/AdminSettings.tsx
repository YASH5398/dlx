import React, { useEffect, useState } from 'react';

export default function AdminSettings() {
  const [config, setConfig] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState<{ link: string; expires_at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/settings', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setConfig(data);
      } catch {}
    })();
  }, []);

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvite(null);
    try {
      const res = await fetch('http://localhost:4000/api/admin/invite/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate invite');
      setInvite({ link: data.link, expires_at: new Date(data.expires_at).toLocaleString() });
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