import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminInviteAccept() {
  const { token } = useParams();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        if (!token) return;
        const invCol = collection(firestore, 'admin_invites');
        const q = query(invCol, where('token', '==', token));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError('Invalid invite token');
          return;
        }
        const docSnap = snap.docs[0];
        const data: any = docSnap.data();
        setEmail(data.email || '');
        const exp = Number(data.expiresAt || 0);
        if (exp && Date.now() > exp) {
          setExpired(true);
          setError('Invite expired');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load invite');
      }
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!token || !email) throw new Error('Invalid invite');
      if (expired) throw new Error('Invite expired');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      const uid = cred.user.uid;
      await setDoc(doc(firestore, 'users', uid), {
        email,
        name: name || '',
        role: 'admin',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      }, { merge: true });
      // Delete invite token
      const invCol = collection(firestore, 'admin_invites');
      const q = query(invCol, where('token', '==', token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        try { await deleteDoc(doc(firestore, 'admin_invites', d.id)); } catch {}
      }
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
        <div className="text-xs text-gray-400">Email: {email || '-'}</div>
        <div>
          <label className="text-sm text-gray-300">Name (optional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-300">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" required />
        </div>
        <button disabled={loading || expired} className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2">{loading ? 'Creating...' : 'Create Admin'}</button>
      </form>
    </div>
  );
}