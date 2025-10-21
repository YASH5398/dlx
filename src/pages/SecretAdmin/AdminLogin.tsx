import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', u.uid));
          const data = userDoc.data() as any || {};
          const role = (data.role || data.userRole || '').toLowerCase();
          if (userDoc.exists() && role === 'admin') {
            navigate('/secret-admin');
          }
        } catch {}
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      const data = userDoc.data() as any || {};
      const role = (data.role || data.userRole || '').toLowerCase();
      if (!userDoc.exists() || role !== 'admin') {
        setError('Access Denied');
        return;
      }
      navigate('/secret-admin');
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes('network') || msg.includes('Failed to fetch') || msg.includes('Connection refused')) {
        setError('Access Denied');
      } else {
        setError(msg);
      }
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
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
        </div>
        <div>
          <label className="text-sm text-gray-300">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2">{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );
}