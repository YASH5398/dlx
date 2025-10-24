import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
/**
 * Signup Page - Premium Enhanced Design
 * Ultra-modern standalone registration page
 * No header/footer - Pure focus on signup experience
 */
const Signup = () => {
    const { signup, loginWithGoogle } = useUser();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [referral, setReferral] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // const [showPhone, setShowPhone] = useState(false); // moved to dedicated phone signup
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [subscribe, setSubscribe] = useState(false);
    const [strength, setStrength] = useState('weak');
    // Auto-fill referral code from URL query (?ref=DLX1234)
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('ref') || params.get('r');
            if (code)
                setReferral(code);
        }
        catch { }
    }, []);
    const validate = () => {
        if (!name.trim() || !email || !password || !confirm)
            return 'Please fill all required fields';
        if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email))
            return 'Enter a valid email address';
        if (password.length < 6)
            return 'Password must be at least 6 characters';
        if (password !== confirm)
            return 'Passwords must match';
        if (phone && !/^\d{10}$/.test(phone))
            return 'Phone must be 10 digits';
        if (!agreeTerms)
            return 'Please agree to the Terms and Privacy Policy';
        return null;
    };
    const computeStrength = (p) => {
        let score = 0;
        if (p.length >= 8)
            score++;
        if (/[A-Z]/.test(p) && /[a-z]/.test(p))
            score++;
        if (/\d/.test(p))
            score++;
        if (/[^A-Za-z0-9]/.test(p))
            score++;
        if (score <= 1)
            return 'weak';
        if (score <= 3)
            return 'medium';
        return 'strong';
    };
    useEffect(() => {
        setStrength(computeStrength(password));
    }, [password]);
    const handleSignup = async (e) => {
        if (e)
            e.preventDefault();
        setError(null);
        const v = validate();
        if (v)
            return setError(v);
        try {
            setLoading(true);
            await signup(name.trim(), email, password, phone, referral);
            navigate('/dashboard');
        }
        catch (e) {
            setError(e?.message ?? 'Registration failed');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogle = async () => {
        setError(null);
        try {
            setLoading(true);
            await loginWithGoogle();
            navigate('/dashboard');
        }
        catch (e) {
            setError(e?.message ?? 'Google sign-up failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex relative overflow-x-hidden", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [_jsx("div", { className: "absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" }), _jsx("div", { className: "absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse", style: { animationDelay: '2s' } }), _jsx("div", { className: "absolute top-1/2 left-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse", style: { animationDelay: '4s' } })] }), _jsx("div", { className: "flex-1 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12 overflow-y-auto relative z-10", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 mb-10 group", children: [_jsx("svg", { className: "w-5 h-5 transition-transform group-hover:-translate-x-1.5 duration-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }), _jsx("span", { className: "font-semibold tracking-wide", children: "Home" })] }), _jsxs("div", { className: "bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-900/20", children: [_jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/50", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" }) }) }), _jsx("h1", { className: "text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-3", children: "Create Account" }), _jsx("p", { className: "text-slate-400 text-base sm:text-lg leading-relaxed", children: "Join thousands of users transforming their digital presence" })] }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsxs("button", { onClick: handleGoogle, disabled: loading, className: "w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100", children: [_jsxs("svg", { className: "w-5 h-5 relative z-10", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), _jsx("span", { className: "relative z-10", children: "Continue with Google" })] }), _jsxs("button", { onClick: () => navigate('/phone-signup'), disabled: loading, className: "w-full group flex items-center justify-center gap-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold py-3.5 px-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }), _jsx("span", { children: "Sign up with Phone" })] })] }), _jsxs("div", { className: "relative my-8", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-slate-700" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-4 bg-slate-900/40 text-slate-400 font-medium", children: "Or continue with email" }) })] }), error && (_jsxs("div", { className: "mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-2xl text-red-400 text-sm flex items-start gap-3 animate-shake", children: [_jsx("svg", { className: "w-5 h-5 flex-shrink-0 mt-0.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: error })] })), _jsxs("form", { onSubmit: handleSignup, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-300 mb-2.5", children: "Full Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Enter your full name", className: "w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-300 mb-2.5", children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", className: "w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600", required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-semibold text-slate-300 mb-2.5", children: ["Referral Code", _jsx("span", { className: "text-slate-500 font-normal ml-1.5", children: "(Optional)" })] }), _jsx("input", { type: "text", value: referral, onChange: (e) => setReferral(e.target.value), placeholder: "Enter referral code", className: "w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-300 mb-2.5", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Create a strong password", className: "w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600 pr-12", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(v => !v), className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: showPassword ? (_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" })) : (_jsxs(_Fragment, { children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) }) })] }), password && (_jsxs("div", { className: "mt-3 space-y-2", children: [_jsx("div", { className: "h-2 w-full bg-slate-700/50 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-500 ease-out ${strength === 'weak' ? 'w-1/3 bg-gradient-to-r from-red-500 to-red-600' :
                                                                    strength === 'medium' ? 'w-2/3 bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                                        'w-full bg-gradient-to-r from-green-500 to-emerald-500'}` }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${strength === 'weak' ? 'bg-red-500' :
                                                                        strength === 'medium' ? 'bg-yellow-500' :
                                                                            'bg-green-500'}` }), _jsx("p", { className: `text-xs font-medium ${strength === 'weak' ? 'text-red-400' :
                                                                        strength === 'medium' ? 'text-yellow-400' :
                                                                            'text-green-400'}`, children: strength === 'weak' ? 'Weak - Add numbers and symbols' :
                                                                        strength === 'medium' ? 'Medium - Add uppercase and symbols' :
                                                                            'Strong password! Perfect.' })] })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-300 mb-2.5", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showConfirmPassword ? "text" : "password", value: confirm, onChange: (e) => setConfirm(e.target.value), placeholder: "Re-enter your password", className: "w-full px-4 py-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-slate-600 pr-12", required: true }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(v => !v), className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: showConfirmPassword ? (_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" })) : (_jsxs(_Fragment, { children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) }) })] })] }), _jsxs("div", { className: "space-y-3 pt-2", children: [_jsxs("label", { className: "flex items-start gap-3 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: agreeTerms, onChange: (e) => setAgreeTerms(e.target.checked), className: "mt-1 w-5 h-5 rounded-lg border-slate-600 bg-slate-800 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-slate-900 cursor-pointer transition-all" }), _jsxs("span", { className: "text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed", children: ["I agree to the", ' ', _jsx("a", { href: "#", className: "text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium", children: "Terms of Service" }), ' ', "and", ' ', _jsx("a", { href: "#", className: "text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium", children: "Privacy Policy" })] })] }), _jsxs("label", { className: "flex items-start gap-3 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: subscribe, onChange: (e) => setSubscribe(e.target.checked), className: "mt-1 w-5 h-5 rounded-lg border-slate-600 bg-slate-800 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-slate-900 cursor-pointer transition-all" }), _jsx("span", { className: "text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed", children: "Send me updates, newsletters, and promotional content" })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-purple-500/30 mt-8 group", children: loading ? (_jsxs("span", { className: "flex items-center justify-center gap-3", children: [_jsxs("svg", { className: "animate-spin h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Creating Your Account..."] })) : (_jsxs("span", { className: "flex items-center justify-center gap-2", children: ["Create Account", _jsx("svg", { className: "w-5 h-5 transition-transform group-hover:translate-x-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7l5 5m0 0l-5 5m5-5H6" }) })] })) })] }), _jsxs("p", { className: "text-center text-slate-400 mt-8 text-sm", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 font-bold transition-all", children: "Sign in \u2192" })] })] })] }) }), _jsxs("div", { className: "hidden lg:flex flex-1 bg-gradient-to-br from-purple-950 via-pink-950 to-purple-950 p-12 items-center justify-center relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden", children: [_jsx("div", { className: "absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-purple-500/20 rounded-full blur-3xl animate-pulse" }), _jsx("div", { className: "absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-pink-500/20 rounded-full blur-3xl animate-pulse", style: { animationDelay: '2s' } }), _jsx("div", { className: "absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse", style: { animationDelay: '4s' } })] }), _jsxs("div", { className: "relative z-10 max-w-xl", children: [_jsxs("div", { className: "flex items-center gap-4 mb-10", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-white to-purple-100 rounded-3xl flex items-center justify-center text-2xl font-black text-purple-700 shadow-2xl shadow-purple-500/30 transform rotate-3", children: "DL" }), _jsxs("div", { children: [_jsx("span", { className: "text-4xl font-black text-white tracking-tight", children: "DigiLinex" }), _jsx("p", { className: "text-purple-300 text-sm font-medium", children: "Digital Excellence Platform" })] })] }), _jsxs("h2", { className: "text-5xl font-black text-white mb-3 leading-tight", children: ["Why Join ", _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400", children: "DigiLinex" }), "?"] }), _jsx("p", { className: "text-purple-200 text-lg mb-10 leading-relaxed", children: "Experience the future of digital transformation with cutting-edge tools and expert guidance" }), _jsx("div", { className: "grid grid-cols-2 gap-5 mb-10", children: [
                                    { icon: '🚀', title: 'Fast Setup', desc: 'Launch in minutes, not hours', gradient: 'from-blue-500 to-cyan-500' },
                                    { icon: '🔒', title: 'Secure Platform', desc: 'Bank-grade encryption', gradient: 'from-green-500 to-emerald-500' },
                                    { icon: '💡', title: 'Expert Support', desc: '24/7 live assistance', gradient: 'from-yellow-500 to-orange-500' },
                                    { icon: '📊', title: 'Analytics', desc: 'Real-time insights', gradient: 'from-purple-500 to-pink-500' },
                                    { icon: '🌐', title: 'Global Reach', desc: '150+ countries', gradient: 'from-red-500 to-pink-500' },
                                    { icon: '⚡', title: 'Performance', desc: '99.99% uptime', gradient: 'from-indigo-500 to-purple-500' },
                                ].map((benefit, idx) => (_jsxs("div", { className: "group bg-white/5 backdrop-blur-md rounded-3xl p-5 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:-rotate-1 border border-white/10 hover:border-white/20", children: [_jsx("div", { className: `inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${benefit.gradient} rounded-2xl mb-3 text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`, children: benefit.icon }), _jsx("h3", { className: "text-white font-bold text-lg mb-1", children: benefit.title }), _jsx("p", { className: "text-purple-200 text-sm leading-relaxed", children: benefit.desc })] }, idx))) }), _jsx("div", { className: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-7 border border-white/20 shadow-2xl", children: _jsxs("div", { className: "flex items-start gap-5", children: [_jsx("div", { className: "w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg", children: "JD" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex gap-1 mb-3", children: [...Array(5)].map((_, i) => (_jsx("svg", { className: "w-5 h-5 text-yellow-400 fill-current", viewBox: "0 0 20 20", children: _jsx("path", { d: "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" }) }, i))) }), _jsx("p", { className: "text-white text-base leading-relaxed mb-4 italic", children: "\"DigiLinex completely transformed how we operate. The platform is incredibly intuitive, powerful, and their support team goes above and beyond.\"" }), _jsxs("div", { children: [_jsx("div", { className: "text-white font-bold text-base", children: "Jane Doe" }), _jsx("div", { className: "text-purple-300 text-sm", children: "CEO, TechStart Inc." })] })] })] }) }), _jsxs("div", { className: "mt-10 flex items-center justify-center gap-8 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400", children: "10K+" }), _jsx("div", { className: "text-purple-300 text-sm font-medium", children: "Active Users" })] }), _jsx("div", { className: "w-px h-12 bg-white/20" }), _jsxs("div", { children: [_jsx("div", { className: "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400", children: "4.9\u2605" }), _jsx("div", { className: "text-purple-300 text-sm font-medium", children: "User Rating" })] }), _jsx("div", { className: "w-px h-12 bg-white/20" }), _jsxs("div", { children: [_jsx("div", { className: "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400", children: "150+" }), _jsx("div", { className: "text-purple-300 text-sm font-medium", children: "Countries" })] })] })] })] }), _jsx("style", { children: `
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
      ` })] }));
};
export default Signup;
