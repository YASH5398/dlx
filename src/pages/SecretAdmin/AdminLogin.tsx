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
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const navigate = useNavigate();

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setSavePassword(true);
    }
  }, []);

  // Handle auth state change
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

    // Save credentials to localStorage if savePassword is checked
    if (savePassword) {
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminPassword', password);
    } else {
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminPassword');
    }

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
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-850 border border-gray-800/50 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Admin Login</h1>
        <p className="text-gray-400 mb-6">Secure access to the admin dashboard</p>
        {error && (
          <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-sm text-gray-300 font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-gray-800/50 border border-gray-700/50 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="relative">
            <label className="text-sm text-gray-300 font-medium">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-gray-800/50 border border-gray-700/50 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={savePassword}
              onChange={(e) => setSavePassword(e.target.checked)}
              className="h-4 w-4 text-emerald-500 bg-gray-800 border-gray-700 rounded focus:ring-emerald-500/50"
            />
            <label className="ml-2 text-sm text-gray-300">Save password</label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg font-semibold py-3 transition-all duration-200 ${
              loading
                ? 'bg-emerald-500/50 text-gray-300 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}