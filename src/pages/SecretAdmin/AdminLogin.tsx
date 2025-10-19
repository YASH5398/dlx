import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      navigate('/secret-admin');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1024] text-white flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-[#0a0e1f] border border-white/10 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold">Admin Login</h1>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div>
          <label className="text-sm text-gray-300">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
        </div>
        <div>
          <label className="text-sm text-gray-300">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2">{loading ? 'Logging in...' : 'Login'}</button>
        <div className="text-xs text-gray-400">Have an invite? <Link to="/secret-admin/invite/" className="text-emerald-400">Accept here</Link></div>
      </form>
    </div>
  );
}