import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useReferralTracking } from '../hooks/useReferralTracking';

/**
 * GoogleReferralSignup Page
 * Handles Google signup with referral code input
 * User signs up with Google first, then enters referral code
 */
const GoogleReferralSignup: React.FC = () => {
  const { loginWithGoogle } = useUser();
  const navigate = useNavigate();
  const { trackSignup } = useReferralTracking();
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleSignupComplete, setIsGoogleSignupComplete] = useState(false);

  // Auto-fill referral code from URL query (?ref=DLX1234)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('ref') || params.get('r');
      if (code) setReferral(code);
    } catch {}
  }, []);

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      setLoading(true);
      await loginWithGoogle();
      setIsGoogleSignupComplete(true);
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      // Save referral code to user profile using Firestore
      const { doc, updateDoc, getDocs, query, collection, where, increment } = await import('firebase/firestore');
      const { firestore } = await import('../firebase');
      
      // Get current user ID (assuming user is logged in after Google signup)
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      
      if (uid && referral.trim()) {
        // Update user's referrerCode
        await updateDoc(doc(firestore, 'users', uid), {
          referrerCode: referral.trim()
        });
        
        // Update referrer's count if valid referral code
        const referrerQuery = await getDocs(query(collection(firestore, 'users'), where('referralCode', '==', referral.trim())));
        if (!referrerQuery.empty) {
          const referrerDoc = referrerQuery.docs[0];
          const referrerId = referrerDoc.id;
          
          // Update referrer's count
          await updateDoc(doc(firestore, 'users', referrerId), {
            referralCount: increment(1),
            activeReferrals: increment(1)
          });
          
          // Track referral signup with join bonus
          const { trackReferralSignup } = await import('../utils/referralTracking');
          await trackReferralSignup(referrerId, uid, auth.currentUser?.email || '', auth.currentUser?.displayName || '');
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save referral code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipReferral = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center px-4 py-8 overflow-x-hidden">
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/signup" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Back</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            {!isGoogleSignupComplete ? 'Sign up with Google' : 'Enter Referral Code'}
          </h1>
          <p className="text-slate-400 mt-1">
            {!isGoogleSignupComplete 
              ? 'Create your account using Google' 
              : 'Do you have a referral code? (Optional)'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {!isGoogleSignupComplete ? (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="relative z-10">
                {loading ? 'Signing up...' : 'Continue with Google'}
              </span>
            </button>

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                By continuing, you agree to our{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReferralSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                placeholder="Enter referral code"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                If you have a referral code, enter it to get bonus rewards
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-3 rounded-xl transition-all hover:opacity-95 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue to Dashboard'}
              </button>
              
              <button
                type="button"
                onClick={skipReferral}
                className="w-full bg-slate-800 text-slate-200 font-semibold py-3 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
              >
                Skip for Now
              </button>
            </div>
          </form>
        )}

        {/* Terms */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          By continuing, you agree to our{' '}
          <a href="#" className="text-purple-400 hover:text-purple-300 underline">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default GoogleReferralSignup;
