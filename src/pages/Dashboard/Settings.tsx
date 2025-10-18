import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';

export default function Settings() {
  const { user } = useUser();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [status, setStatus] = useState<string | null>(null);

  const save = () => {
    if (!name || !email) { setStatus('Please fill all fields'); return; }
    const updated = { ...user!, name, email };
    localStorage.setItem('dlx_user', JSON.stringify(updated));
    setStatus('Profile updated');
  };

  return (
    <div className="card space-y-3 animate-fade-in">
      <h2 className="text-lg font-semibold heading-gradient">Settings</h2>
      <div className="grid gap-3 max-w-md">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg p-2 bg-white/10 border border-white/20 text-white placeholder-white/60" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg p-2 bg-white/10 border border-white/20 text-white placeholder-white/60" />
        <button onClick={save} className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">Save</button>
        {status && <p className="text-sm text-green-400">{status}</p>}
      </div>
    </div>
  );
}