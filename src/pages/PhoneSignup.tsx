import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * PhoneSignup Page
 * Simple, mobile-first flow using Firebase Phone Auth (OTP)
 */
const PhoneSignup: React.FC = () => {
  const { sendPhoneOtp, verifyPhoneOtp } = useUser();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter' | 'verify'>('enter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    try {
      setLoading(true);
      await sendPhoneOtp(phone);
      setStep('verify');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      await verifyPhoneOtp(otp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center px-4 py-8 overflow-x-hidden">
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/signup" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Back</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Sign up with Phone</h1>
          <p className="text-slate-400 mt-1">Use your mobile number to create an account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 'enter' ? (
          <form onSubmit={onSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
              <div className="flex gap-2">
                <div className="px-3 py-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-slate-300 flex items-center">+91</div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">We automatically apply the +91 country code</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-3 rounded-xl transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-3 rounded-xl transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={() => setStep('enter')}
              className="w-full bg-slate-800 text-slate-200 font-semibold py-3 rounded-xl border border-slate-700 hover:bg-slate-700"
            >
              Change Phone Number
            </button>
          </form>
        )}

        {/* Terms */}
        <p className="text-xs text-slate-500 mt-4">
          By continuing, you agree to our <a className="underline">Terms</a> and <a className="underline">Privacy Policy</a>.
        </p>

        {/* Invisible reCAPTCHA container for Firebase */}
        <div id="recaptcha-container" style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default PhoneSignup;