import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Signup Page
 * User registration with modern design
 * Dark blue + black gradient theme matching the DigiLinex brand
 */

const Signup: React.FC = () => {
  const { signup, loginWithGoogle } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const validate = () => {
    if (!name.trim() || !email || !password || !confirm) return 'Please fill all required fields';
    if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirm) return 'Passwords must match';
    if (phone && !/^\d{10}$/.test(phone)) return 'Phone must be 10 digits';
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
      await signup(name.trim(), email, password, phone, referral);
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
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="signup-container">
      {/* Left Side - Form */}
      <div className="signup-left">
        <div className="signup-form-wrapper">
          {/* Back Button */}
          <Link to="/" className="back-button">
            <span className="back-arrow">←</span>
            Back to Home
          </Link>

          <div className="form-header">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Join DigiLinex and start your digital transformation journey</p>
          </div>

          {/* Social Signup */}
          <div className="social-signup">
            <button className="social-btn google" onClick={handleGoogle}>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Sign up with Google
            </button>
            <button className="social-btn phone" onClick={() => setShowPhone(v => !v)}>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.05-.24c1.14.38 2.37.59 3.54.59a1 1 0 011 1v3.75a1 1 0 01-1 1C12.39 22.29 1.71 11.61 1.71 2a1 1 0 011-1H6.5a1 1 0 011 1c0 1.17.21 2.4.59 3.54a1 1 0 01-.24 1.05l-2.23 2.2z"/>
              </svg>
              Sign up with Phone
            </button>
          </div>

          <div className="divider">
            <span className="divider-text">Or sign up with email</span>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Signup Form */}
          <form className="signup-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={`phone-collapse ${showPhone ? 'show' : ''}`}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input"
                  placeholder="Enter 10-digit number (no country code)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
                <small className="input-help">We’ll add +91 automatically.</small>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Referral Code (optional)</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Enter referral code"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              <div className="password-strength">
                <div className="strength-bar">
                  <div className={`strength-fill ${strength}`}></div>
                </div>
                <span className="strength-text">{strength === 'weak' ? 'Weak - Add numbers and symbols' : strength === 'medium' ? 'Medium - Add uppercase and symbols' : 'Strong password'}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="password-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(v => !v)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <label className="checkbox-wrapper">
              <input type="checkbox" className="checkbox-input" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
              <span className="checkbox-label">
                I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
              </span>
            </label>

            <label className="checkbox-wrapper">
              <input type="checkbox" className="checkbox-input" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} />
              <span className="checkbox-label">
                Send me updates, newsletters, and promotional content
              </span>
            </label>

            <button type="submit" className="btn-signup" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="login-prompt">
            <span className="prompt-text">Already have an account? </span>
            <Link to="/login" className="login-link">Sign in</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Benefits & Branding */}
      <div className="signup-right">
        <div className="benefits-content">
          <div className="logo-section">
            <div className="logo-icon">DL</div>
            <h1 className="brand-name">DigiLinex</h1>
          </div>

          <h2 className="benefits-title">Why Join DigiLinex?</h2>

          <div className="benefits-list">
            <div className="benefit-card">
              <div className="benefit-icon">🚀</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Fast Setup</h3>
                <p className="benefit-description">
                  Get started in minutes with our streamlined onboarding process
                </p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Secure Platform</h3>
                <p className="benefit-description">
                  Enterprise-grade security to protect your data and privacy
                </p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">💡</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Expert Support</h3>
                <p className="benefit-description">
                  24/7 customer support from our team of specialists
                </p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Analytics Dashboard</h3>
                <p className="benefit-description">
                  Track your progress with comprehensive analytics tools
                </p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🌐</div>
              <div className="benefit-content">
                <h3 className="benefit-title">Global Reach</h3>
                <p className="benefit-description">
                  Access to worldwide markets and opportunities
                </p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <div className="benefit-content">
                <h3 className="benefit-title">High Performance</h3>
                <p className="benefit-description">
                  Lightning-fast infrastructure with 99.9% uptime
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="testimonial-card">
            <div className="quote-icon">"</div>
            <p className="testimonial-text">
              DigiLinex transformed our business operations. The platform is intuitive, 
              powerful, and their support team is exceptional.
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">JD</div>
              <div className="author-info">
                <div className="author-name">Jane Doe</div>
                <div className="author-title">CEO, TechStart Inc.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <style>{`
        .signup-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1420 100%);
        }

        /* Left Side - Form */
        .signup-left {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-y: auto;
          background: linear-gradient(135deg, #0f1420 0%, #1a1f3a 100%);
        }

+        .input-help {
+          display: block;
+          color: #64748b;
+          font-size: 0.85rem;
+          margin-top: 0.5rem;
+        }
+
+        /* Hide sections not in reference design */
        .account-type-options { display: none; }
+
        .signup-form-wrapper {
          width: 100%;
          max-width: 550px;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 3rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          color: #667eea;
          gap: 0.75rem;
        }

        .back-arrow {
          font-size: 1.2rem;
        }

        .form-header {
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
          line-height: 1.5;
        }

        /* Social Signup */
        .social-signup {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
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

        /* Phone collapse */
        .phone-collapse {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-6px);
          transition: max-height 0.4s ease, opacity 0.3s ease, transform 0.3s ease;
          margin-bottom: 0;
        }
        .phone-collapse.show {
          max-height: 180px;
          opacity: 1;
          transform: translateY(0);
          margin-bottom: 1rem;
        }

        /* Divider */
        .divider {
          position: relative;
          text-align: center;
          margin: 1.5rem 0;
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

        /* Error banner */
        .error-banner {
          background: rgba(248, 113, 113, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.35);
          color: #fecaca;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin: 0.75rem 0 1rem;
          animation: shake 0.25s ease-in-out;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }

        /* Form */
        .signup-form {
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          color: #cbd5e1;
          font-weight: 600;
          margin-bottom: 0.4rem;
          font-size: 0.95rem;
        }

        .form-input {
          width: 100%;
          padding: 0.85rem 1rem;
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

        .password-strength {
          margin-top: 0.5rem;
        }

        .strength-bar {
          height: 4px;
          background: rgba(100, 116, 139, 0.2);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
        }

        .strength-fill.weak {
          width: 33%;
          background: #f87171;
        }
        .strength-fill.medium {
          width: 66%;
          background: #f59e0b;
        }
        .strength-fill.strong {
          width: 100%;
          background: #10b981;
        }

        .strength-text {
          color: #94a3b8;
          font-size: 0.85rem;
        }

        /* Account Type Options */
        .account-type-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .radio-option {
          cursor: pointer;
        }

        .radio-option input[type="radio"] {
          display: none;
        }

        .radio-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .radio-option input[type="radio"]:checked + .radio-content {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .radio-icon {
          font-size: 2rem;
        }

        .radio-label {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .radio-label strong {
          color: #ffffff;
          font-size: 0.95rem;
        }

        .radio-label small {
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
          cursor: pointer;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          margin-top: 0.2rem;
        }

        .checkbox-label {
          color: #cbd5e1;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .link:hover {
          color: #764ba2;
        }

        .btn-signup {
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
          margin-top: 0.5rem;
        }

        .btn-signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        }

        .login-prompt {
          text-align: center;
          margin-top: 1.5rem;
        }

        .prompt-text {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .login-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 700;
          transition: color 0.3s ease;
        }

        .login-link:hover {
          color: #764ba2;
        }

        /* Right Side - Benefits */
        .signup-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          background: linear-gradient(135deg, #1a1f3a 0%, #0f1420 100%);
          position: relative;
          overflow: hidden;
        }

        .benefits-content {
          position: relative;
          z-index: 1;
          max-width: 600px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .brand-name {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
        }

        .benefits-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 2rem;
        }

        .benefits-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .benefit-card {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(100, 116, 139, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .benefit-card:hover {
          transform: translateY(-5px);
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
        }

        .benefit-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .benefit-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .benefit-description {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        /* Testimonial */
        .testimonial-card {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
        }

        .quote-icon {
          font-size: 4rem;
          color: rgba(102, 126, 234, 0.3);
          line-height: 1;
          margin-bottom: 1rem;
        }

        .testimonial-text {
          color: #cbd5e1;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
        }

        .author-name {
          font-weight: 700;
          color: #ffffff;
          font-size: 1.05rem;
        }

        .author-title {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        /* Floating Shapes */
        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          right: 5%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 150px;
          height: 150px;
          bottom: 15%;
          left: 5%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 100px;
          height: 100px;
          top: 50%;
          right: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .signup-container {
            grid-template-columns: 1fr;
          }

          .signup-right {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .signup-left {
            padding: 1.5rem 1rem;
          }

          .signup-form-wrapper {
            padding: 2rem 1.5rem;
          }

          .form-title {
            font-size: 2rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .social-signup {
            grid-template-columns: 1fr;
          }

          .account-type-options {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .signup-form-wrapper {
            padding: 1.5rem 1rem;
          }

          .form-title {
            font-size: 1.8rem;
          }

          .social-btn {
            font-size: 0.85rem;
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Signup;