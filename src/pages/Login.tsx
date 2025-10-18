import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Login Page
 * Matches the design from the reference image
 * Dark blue + black gradient theme with modern authentication UI
 */

const Login: React.FC = () => {
  const { login, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp, resetPassword } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

  const validateEmailLogin = () => {
    if (!email || !password) return 'Email and password required';
    if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validateEmailLogin();
    if (v) return setError(v);
    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    if (!/^\d{10}$/.test(phone)) return setError('Enter valid 10-digit phone');
    try {
      setLoading(true);
      await sendPhoneOtp(phone);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otp) return setError('Enter the 6-digit OTP');
    try {
      setLoading(true);
      await verifyPhoneOtp(otp);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (!email) return setError('Enter email to reset password');
    try {
      await resetPassword(email);
      alert('Password reset email sent');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset email');
    }
  };
  return (
    <div className="login-container">
      <div id="recaptcha-container" style={{ display: 'none' }} />
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="branding-content">
          <div className="logo-wrapper">
            <div className="logo-icon">DL</div>
          </div>
          <h1 className="brand-title">Welcome to DigiLinex</h1>
          <p className="brand-tagline">
            Your gateway to digital transformation and business growth
          </p>

          {/* Features List */}
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Digital Services & Products</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">Fast & Secure Platform</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">24/7 Customer Support</span>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Happy Clients</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">500+</div>
              <div className="stat-label">Digital Products</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="decoration-grid">
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Sign in to your DigiLinex account</p>
          </div>

          {/* Social Login Buttons */}
          <div className="social-login">
            <button className="social-btn google" onClick={handleGoogle}>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Continue with Google
            </button>
            <button className="social-btn phone" onClick={() => setShowPhoneLogin(true)}>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l1.5-1.5a1 1 0 011.11-.27 11.36 11.36 0 003.55.57 1 1 0 011 1v3.5a1 1 0 01-1 1A19 19 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.55 1 1 0 01-.27 1.11z"/>
              </svg>
              Continue with Phone
            </button>
          </div>

          <div className="divider">
            <span className="divider-text">Or continue with email</span>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input"
                placeholder="test@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input 
                  type="password" 
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                />
                <button type="button" className="password-toggle">
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkbox-label">Remember me</span>
              </label>
              <button type="button" className="forgot-link" onClick={handleResetPassword}>Forgot password?</button>
            </div>

            {error && <p className="terms-text" style={{ color: '#f87171' }}>{error}</p>}

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Phone OTP login (hidden until toggled) */}
            <div className={`phone-login-panel ${showPhoneLogin ? 'open' : ''}`}>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Phone (10 digits)</label>
                <div className="password-wrapper">
                  <input 
                    type="tel" 
                    className="form-input"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e)=>setPhone(e.target.value.replace(/[^\d]/g, '').slice(0,10))}
                  />
                  <button type="button" className="forgot-link" onClick={handleSendOtp}>Send OTP</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <div className="password-wrapper">
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e)=>setOtp(e.target.value.replace(/[^\d]/g, '').slice(0,6))}
                  />
                  <button type="button" className="btn-signin" onClick={handleVerifyOtp} style={{ padding: '0.6rem 1rem' }}>Verify OTP</button>
                </div>
              </div>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="signup-prompt">
            <span className="prompt-text">New here? </span>
            <Link to="/signup" className="signup-link">Create an account</Link>
          </div>

          {/* Terms */}
          <p className="terms-text">
            By continuing, you agree to our{' '}
            <a href="#" className="terms-link">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="terms-link">Privacy Policy</a>
          </p>
        </div>
      </div>

      <style>{`
        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1420 100%);
        }

        /* Left Side - Branding */
        .login-left {
          background: linear-gradient(135deg, #1a1f3a 0%, #0f1420 100%);
          padding: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .branding-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
        }

        .logo-wrapper {
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .brand-title {
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .brand-tagline {
          font-size: 1.2rem;
          color: #94a3b8;
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .features-list {
          margin-bottom: 3rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: #cbd5e1;
          font-size: 1.1rem;
        }

        .feature-icon {
          width: 32px;
          height: 32px;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          font-weight: 700;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(100, 116, 139, 0.2);
        }

        .stat-box {
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #64748b;
        }

        .decoration-grid {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 200px;
          opacity: 0.1;
        }

        .grid-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #667eea, transparent);
          margin-bottom: 4rem;
        }

        /* Right Side - Form */
        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #0f1420 0%, #1a1f3a 100%);
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 450px;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 3rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          color: #94a3b8;
          font-size: 1.05rem;
        }

        /* Social Login */
        .social-login {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.9rem;
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          color: #cbd5e1;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .social-btn:hover {
          background: rgba(102, 126, 234, 0.2);
          border-color: rgba(102, 126, 234, 0.5);
          transform: translateY(-2px);
        }

        .social-icon {
          width: 20px;
          height: 20px;
        }

        .social-btn.phone {
          background: rgba(100, 116, 139, 0.2);
          border-color: rgba(100, 116, 139, 0.3);
        }

        .social-btn.phone:hover {
          background: rgba(102, 126, 234, 0.2);
          border-color: rgba(102, 126, 234, 0.5);
        }

        .phone-login-panel {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-8px);
          transition: max-height 0.4s ease, opacity 0.3s ease, transform 0.3s ease;
        }

        .phone-login-panel.open {
          max-height: 350px;
          opacity: 1;
          transform: translateY(0);
        }

        /* Divider */
        .divider {
          position: relative;
          text-align: center;
          margin: 2rem 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: rgba(100, 116, 139, 0.2);
        }

        .divider-text {
          position: relative;
          background: rgba(30, 41, 59, 0.9);
          padding: 0 1rem;
          color: #64748b;
          font-size: 0.9rem;
        }

        /* Form */
        .login-form {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          color: #cbd5e1;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          color: #ffffff;
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input::placeholder {
          color: #64748b;
        }

        .password-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .password-toggle:hover {
          color: #cbd5e1;
        }

        .eye-icon {
          width: 20px;
          height: 20px;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-label {
          color: #cbd5e1;
          font-size: 0.95rem;
        }

        .forgot-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: color 0.3s ease;
        }

        .forgot-link:hover {
          color: #764ba2;
        }

        .btn-signin {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-signin:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        }

        .btn-signin:active {
          transform: translateY(0);
        }

        .signup-prompt {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .prompt-text {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .signup-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 700;
          transition: color 0.3s ease;
        }

        .signup-link:hover {
          color: #764ba2;
        }

        .terms-text {
          text-align: center;
          color: #64748b;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .terms-link {
          color: #667eea;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .terms-link:hover {
          color: #764ba2;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .login-container {
            grid-template-columns: 1fr;
          }

          .login-left {
            display: none;
          }

          .login-right {
            padding: 2rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .login-form-wrapper {
            padding: 2rem 1.5rem;
          }

          .form-title {
            font-size: 2rem;
          }

          .social-login {
            grid-template-columns: 1fr;
          }

          .social-btn {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;