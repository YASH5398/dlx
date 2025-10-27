import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useReferralTracking } from '../hooks/useReferralTracking';

/**
 * Signup Page - Premium Enhanced Design
 * Ultra-modern standalone registration page
 * No header/footer - Pure focus on signup experience
 */

const Signup: React.FC = () => {
  const { signup, loginWithGoogle } = useUser();
  const navigate = useNavigate();
  const { trackSignup } = useReferralTracking();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // const [showPhone, setShowPhone] = useState(false); // moved to dedicated phone signup
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Auto-fill referral code from URL query (?ref=DLX1234)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('ref') || params.get('r');
      if (code) setReferral(code);
    } catch {}
  }, []);

  const validate = () => {
    if (!name.trim() || !email || !phone || !password || !confirm) return 'Please fill all required fields';
    if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirm) return 'Passwords must match';
    if (!/^\d{10}$/.test(phone)) return 'Phone must be 10 digits';
    if (!agreeTerms) return 'Please agree to the Terms and Privacy Policy';
    return null;
  };

  const computeStrength = (p: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  };

  useEffect(() => {
    setStrength(computeStrength(password));
  }, [password]);

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    try {
      setLoading(true);
      const result = await signup(name.trim(), email, password, phone, referral);
      
      // Track referral signup if there's a valid referral code
      if ((result as any)?.user?.uid) {
        await trackSignup((result as any).user.uid, email, name.trim());
      }
      
      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      setLoading(true);
      navigate('/google-referral-signup');
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex relative overflow-x-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12 overflow-y-auto relative z-10">
        <div className="w-full max-w-lg">
          {/* Minimal Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 mb-10 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1.5 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold tracking-wide">Home</span>
          </Link>

          {/* Form Container with Glass Effect */}
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-900/20">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-3">
                Create Account
              </h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Join thousands of users transforming their digital presence
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <button 
                onClick={handleGoogle}
                disabled={loading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="relative z-10">Continue with Google</span>
              </button>

              <button 
                onClick={() => alert('📱 Feature coming soon!')}
                disabled={loading}
                className="w-full group flex items-center justify-center gap-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold py-3.5 px-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Sign up with Phone</span>
              </button>
            </div>

            {/* Elegant Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/40 text-slate-400 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Error Banner with Icon */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-2xl text-red-400 text-sm flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                  Phone Number
                  <span className="text-slate-500 font-normal ml-1.5">(Required)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600"
                  required
                />
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                  Referral Code 
                  <span className="text-slate-500 font-normal ml-1.5">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  placeholder="Enter referral code"
                  className="w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {/* Enhanced Password Strength */}
                {password && (
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          strength === 'weak' ? 'w-1/3 bg-gradient-to-r from-red-500 to-red-600' :
                          strength === 'medium' ? 'w-2/3 bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'w-full bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        strength === 'weak' ? 'bg-red-500' :
                        strength === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <p className={`text-xs font-medium ${
                        strength === 'weak' ? 'text-red-400' :
                        strength === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {strength === 'weak' ? 'Weak - Add numbers and symbols' :
                         strength === 'medium' ? 'Medium - Add uppercase and symbols' :
                         'Strong password! Perfect.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Checkboxes with better styling */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded-lg border-slate-600 bg-slate-800 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-slate-900 cursor-pointer transition-all"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium">Privacy Policy</a>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded-lg border-slate-600 bg-slate-800 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-slate-900 cursor-pointer transition-all"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed">
                    Send me updates, newsletters, and promotional content
                  </span>
                </label>
              </div>

              {/* Enhanced Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-purple-500/30 mt-8 group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Your Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-slate-400 mt-8 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 font-bold transition-all">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Premium Benefits Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-950 via-pink-950 to-purple-950 p-12 items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 max-w-xl">
          {/* Premium Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-white to-purple-100 rounded-3xl flex items-center justify-center text-2xl font-black text-purple-700 shadow-2xl shadow-purple-500/30 transform rotate-3">
              DL
            </div>
            <div>
              <span className="text-4xl font-black text-white tracking-tight">DigiLinex</span>
              <p className="text-purple-300 text-sm font-medium">Digital Excellence Platform</p>
            </div>
          </div>

          <h2 className="text-5xl font-black text-white mb-3 leading-tight">
            Why Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">DigiLinex</span>?
          </h2>
          <p className="text-purple-200 text-lg mb-10 leading-relaxed">
            Experience the future of digital transformation with cutting-edge tools and expert guidance
          </p>

          {/* Enhanced Benefits Grid */}
          <div className="grid grid-cols-2 gap-5 mb-10">
            {[
              { icon: '🚀', title: 'Fast Setup', desc: 'Launch in minutes, not hours', gradient: 'from-blue-500 to-cyan-500' },
              { icon: '🔒', title: 'Secure Platform', desc: 'Bank-grade encryption', gradient: 'from-green-500 to-emerald-500' },
              { icon: '💡', title: 'Expert Support', desc: '24/7 live assistance', gradient: 'from-yellow-500 to-orange-500' },
              { icon: '📊', title: 'Analytics', desc: 'Real-time insights', gradient: 'from-purple-500 to-pink-500' },
              { icon: '🌐', title: 'Global Reach', desc: '150+ countries', gradient: 'from-red-500 to-pink-500' },
              { icon: '⚡', title: 'Performance', desc: '99.99% uptime', gradient: 'from-indigo-500 to-purple-500' },
            ].map((benefit, idx) => (
              <div key={idx} className="group bg-white/5 backdrop-blur-md rounded-3xl p-5 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:-rotate-1 border border-white/10 hover:border-white/20">
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${benefit.gradient} rounded-2xl mb-3 text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                  {benefit.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{benefit.title}</h3>
                <p className="text-purple-200 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Premium Testimonial */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-7 border border-white/20 shadow-2xl">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                JD
              </div>
              <div className="flex-1">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-white text-base leading-relaxed mb-4 italic">
                  "DigiLinex completely transformed how we operate. The platform is incredibly intuitive, powerful, and their support team goes above and beyond."
                </p>
                <div>
                  <div className="text-white font-bold text-base">Jane Doe</div>
                  <div className="text-purple-300 text-sm">CEO, TechStart Inc.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex items-center justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">10K+</div>
              <div className="text-purple-300 text-sm font-medium">Active Users</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">4.9★</div>
              <div className="text-purple-300 text-sm font-medium">User Rating</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">150+</div>
              <div className="text-purple-300 text-sm font-medium">Countries</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .bg-size-200 {
          background-size: 200% 100%;
        }
        .bg-pos-0 {
          background-position: 0% 50%;
        }
        .bg-pos-100 {
          background-position: 100% 50%;
        }
      `}</style>
    </div>
  );
};

export default Signup;