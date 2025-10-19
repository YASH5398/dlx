import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminInviteAccept() {
  const { token } = useParams();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/admin/invite/accept', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Invite failed');
      navigate('/secret-admin');
    } catch (e: any) {
      setError(e.message || 'Invite failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1024] text-white flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-[#0a0e1f] border border-white/10 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold">Accept Admin Invite</h1>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div className="text-xs text-gray-400">Token: {token}</div>
        <div>
          <label className="text-sm text-gray-300">Name (optional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-300">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2">{loading ? 'Creating...' : 'Create Admin'}</button>
      </form>
    </div>
  );
}