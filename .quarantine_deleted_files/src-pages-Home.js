import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { Shield, Award, TrendingUp, Code, Globe, Smartphone, Bot, Cloud, Zap, Users, CheckCircle, Star, ArrowRight, Menu, X, Check, Sparkles, Rocket, Target, DollarSign, Gift, MessageCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useNavigate } from 'react-router-dom';
// ============================================================================
// ERROR BOUNDARY
// ============================================================================
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }
    render() {
        return this.state.hasError ? (_jsx("div", { className: "text-white bg-red-600/20 border border-red-500/30 rounded-lg p-4", children: "Something went wrong rendering this section." })) : (this.props.children);
    }
}
// ============================================================================
// FLOATING PARTICLES BACKGROUND
// ============================================================================
const FloatingParticles = () => {
    return (_jsx("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [...Array(20)].map((_, i) => (_jsx(motion.div, { className: "absolute w-1 h-1 bg-blue-400/30 rounded-full", initial: {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
            }, animate: {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
            }, transition: {
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
            } }, i))) }));
};
// ============================================================================
// HEADER COMPONENT
// ============================================================================
const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (_jsx(motion.header, { className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-white/10'
            : 'bg-transparent'}`, initial: { y: -100 }, animate: { y: 0 }, transition: { duration: 0.6, ease: "easeOut" }, children: _jsxs("div", { className: "container mx-auto px-4 sm:px-6", children: [_jsxs("div", { className: "flex items-center justify-between h-16 md:h-20", children: [_jsxs(motion.div, { className: "flex items-center gap-2 md:gap-3", whileHover: { scale: 1.05 }, children: [_jsx(motion.div, { className: "w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-white text-lg md:text-xl shadow-lg", whileHover: { rotate: 360 }, transition: { duration: 0.6 }, children: "DL" }), _jsx("span", { className: "text-white font-bold text-xl md:text-2xl tracking-tight", children: "DigiLinex" })] }), _jsx("nav", { className: "hidden lg:flex items-center gap-8", children: ["Home", "Services", "Process", "Affiliate", "Testimonials", "Contact"].map((item) => (_jsxs(motion.a, { href: `#${item.toLowerCase()}`, className: "text-gray-300 hover:text-white text-base font-medium transition-colors duration-300 relative group", whileHover: { y: -2 }, children: [item, _jsx("span", { className: "absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300" })] }, item))) }), _jsxs("div", { className: "hidden lg:flex items-center gap-4", children: [_jsx(motion.button, { className: "px-5 py-2.5 text-white text-sm font-medium bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-lg", whileHover: { scale: 1.05, boxShadow: "0 5px 20px rgba(255,255,255,0.2)" }, whileTap: { scale: 0.95 }, onClick: () => navigate('/login'), children: "Login" }), _jsxs(motion.button, { className: "px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => navigate('/signup'), children: [_jsx("span", { className: "relative z-10", children: "Get Started" }), _jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300", initial: { x: '-100%' }, whileHover: { x: 0 }, transition: { duration: 0.3 } })] })] }), _jsx(motion.button, { onClick: () => setIsMenuOpen(!isMenuOpen), className: "lg:hidden text-white p-2", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, children: isMenuOpen ? _jsx(X, { className: "w-7 h-7" }) : _jsx(Menu, { className: "w-7 h-7" }) })] }), _jsx(AnimatePresence, { children: isMenuOpen && (_jsx(motion.div, { className: "lg:hidden py-6 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl", initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.3 }, children: _jsxs("nav", { className: "flex flex-col gap-4 px-4", children: [["Home", "Services", "Process", "Affiliate", "Testimonials", "Contact"].map((item) => (_jsx(motion.a, { href: `#${item.toLowerCase()}`, className: "text-gray-300 hover:text-white text-base font-medium py-2", onClick: () => setIsMenuOpen(false), whileHover: { x: 10, color: "#ffffff" }, children: item }, item))), _jsxs("div", { className: "flex flex-col gap-3 pt-4 border-t border-white/10", children: [_jsx(motion.button, { className: "px-5 py-2.5 text-white text-sm font-medium bg-white/10 rounded-xl", whileTap: { scale: 0.95 }, onClick: () => navigate('/login'), children: "Login" }), _jsx(motion.button, { className: "px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl", whileTap: { scale: 0.95 }, onClick: () => navigate('/signup'), children: "Get Started" })] })] }) })) })] }) }));
};
// ============================================================================
// HERO SECTION
// ============================================================================
const HeroSection = () => {
    const navigate = useNavigate();
    const [typedText, setTypedText] = useState("");
    const fullText = "Digital Reality";
    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setTypedText(fullText.slice(0, currentIndex));
                currentIndex++;
            }
            else {
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("section", { id: "home", className: "relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-20", children: [_jsx(FloatingParticles, {}), _jsx("div", { className: "absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" }), _jsx("div", { className: "absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" }), _jsxs("div", { className: "relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [_jsxs(motion.div, { className: "text-center lg:text-left", initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: "easeOut" }, children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full backdrop-blur-lg", initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: "spring" }, whileHover: { scale: 1.05 }, children: [_jsx(Sparkles, { className: "w-4 h-4 text-blue-400" }), _jsx("span", { className: "text-blue-300 text-sm md:text-base font-medium", children: "Premium Digital Solutions" })] }), _jsxs(motion.h1, { className: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.8 }, children: ["Transforming Ideas into", _jsx("br", {}), _jsxs("span", { className: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", children: [typedText, _jsx(motion.span, { className: "inline-block w-1 h-12 md:h-16 bg-purple-400 ml-1", animate: { opacity: [1, 0] }, transition: { duration: 0.8, repeat: Infinity } })] })] }), _jsx(motion.p, { className: "text-lg md:text-xl text-gray-300 mb-4 leading-relaxed", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5, duration: 0.8 }, children: "Blockchain | AI | Websites | Mobile Apps | Business Automation" }), _jsxs(motion.p, { className: "text-base md:text-lg text-gray-400 mb-8 flex items-center justify-center lg:justify-start gap-2", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.6, duration: 0.8 }, children: [_jsx(Users, { className: "w-5 h-5" }), "Trusted by 200+ founders & teams globally"] }), _jsx(motion.div, { className: "flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.7, duration: 0.8 }, children: _jsxs(motion.button, { className: "group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-semibold rounded-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 relative overflow-hidden", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => navigate('/signup'), children: [_jsxs("span", { className: "relative z-10 flex items-center gap-2", children: ["Start Your Project", _jsx(motion.div, { animate: { x: [0, 5, 0] }, transition: { duration: 1, repeat: Infinity }, children: _jsx(ArrowRight, { className: "w-5 h-5" }) })] }), _jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600", initial: { x: '100%' }, whileHover: { x: 0 }, transition: { duration: 0.3 } })] }) }), _jsxs(motion.div, { className: "flex flex-wrap items-center justify-center lg:justify-start gap-6", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.8, duration: 0.8 }, children: [_jsxs(motion.div, { className: "flex items-center gap-2 text-green-400", whileHover: { scale: 1.05 }, children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm md:text-base", children: "100% Verified Smart Contracts" })] }), _jsxs(motion.div, { className: "flex items-center gap-2 text-blue-400", whileHover: { scale: 1.05 }, children: [_jsx(Award, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm md:text-base", children: "ISO 27001 Certified" })] })] })] }), _jsx(motion.div, { className: "hidden lg:block", initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay: 0.4 }, children: _jsxs("div", { className: "relative", children: [_jsxs(motion.div, { className: "bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl", whileHover: { scale: 1.02 }, transition: { duration: 0.3 }, children: [_jsxs(motion.div, { className: "text-center mb-8", initial: { scale: 0.8 }, animate: { scale: 1 }, transition: { delay: 0.5, type: "spring" }, children: [_jsx(motion.div, { className: "w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl", animate: { rotate: [0, 360] }, transition: { duration: 20, repeat: Infinity, ease: "linear" }, children: _jsx(Code, { className: "w-10 h-10 text-white" }) }), _jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: "Tech Stack" }), _jsx("p", { className: "text-sm text-gray-400", children: "Modern Development Tools" })] }), _jsx("div", { className: "grid grid-cols-4 gap-4", children: [
                                                        { icon: "⚛️", name: "React", color: "from-cyan-500 to-blue-500" },
                                                        { icon: "🟢", name: "Node", color: "from-green-500 to-emerald-500" },
                                                        { icon: "🐍", name: "Python", color: "from-yellow-500 to-green-500" },
                                                        { icon: "💎", name: "Ruby", color: "from-red-500 to-pink-500" },
                                                        { icon: "₿", name: "Bitcoin", color: "from-orange-500 to-yellow-500" },
                                                        { icon: "👻", name: "Solidity", color: "from-gray-500 to-slate-500" },
                                                        { icon: "🍓", name: "Angular", color: "from-red-500 to-rose-500" },
                                                        { icon: "☁️", name: "Cloud", color: "from-blue-500 to-indigo-500" },
                                                    ].map((tech, idx) => (_jsxs(motion.div, { className: `bg-gradient-to-br ${tech.color} rounded-xl p-4 flex items-center justify-center cursor-pointer shadow-lg relative group`, title: tech.name, initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.6 + idx * 0.1, type: "spring" }, whileHover: { scale: 1.1, rotate: 5 }, children: [_jsx("span", { className: "text-3xl", children: tech.icon }), _jsx(motion.div, { className: "absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity", initial: { scale: 0 }, whileHover: { scale: 1 } })] }, idx))) })] }), _jsx(motion.div, { className: "absolute -top-4 -right-4 w-24 h-24 bg-pink-500/30 rounded-full blur-2xl", animate: { scale: [1, 1.2, 1] }, transition: { duration: 3, repeat: Infinity } }), _jsx(motion.div, { className: "absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl", animate: { scale: [1.2, 1, 1.2] }, transition: { duration: 3, repeat: Infinity } })] }) })] }), _jsx(motion.div, { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-16", initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.9, duration: 0.8 }, children: [
                            { label: "Projects Completed", value: "200+", icon: Rocket },
                            { label: "Token Creation", value: "1-2 Weeks", icon: Zap },
                            { label: "Market Cap", value: "$50M+", icon: TrendingUp },
                            { label: "Support", value: "24/7", icon: Shield },
                        ].map((stat, idx) => (_jsxs(motion.div, { className: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all shadow-lg group", whileHover: { scale: 1.05, y: -5 }, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 1 + idx * 0.1 }, children: [_jsx(stat.icon, { className: "w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" }), _jsx("div", { className: "text-2xl md:text-3xl font-bold text-white mb-2", children: stat.value }), _jsx("div", { className: "text-gray-400 text-xs md:text-sm", children: stat.label })] }, idx))) })] }), _jsx(motion.div, { className: "absolute bottom-8 left-1/2 transform -translate-x-1/2", animate: { y: [0, 10, 0] }, transition: { duration: 2, repeat: Infinity }, children: _jsx("div", { className: "w-6 h-10 border-2 border-white/30 rounded-full flex justify-center", children: _jsx(motion.div, { className: "w-1.5 h-3 bg-white rounded-full mt-2", animate: { y: [0, 12, 0] }, transition: { duration: 2, repeat: Infinity } }) }) })] }));
};
// ============================================================================
// SERVICES SECTION
// ============================================================================
const ServicesSection = () => {
    const services = [
        {
            title: "Blockchain Development",
            price: "$2,999",
            description: "Smart contracts, tokens, and DeFi solutions",
            icon: Code,
            gradient: "from-blue-500 to-cyan-500",
            features: ["Token Creation", "Smart Contracts", "Security Audit", "DEX Listing"],
        },
        {
            title: "Website Development",
            price: "$1,499",
            description: "Modern responsive websites with SEO",
            icon: Globe,
            gradient: "from-purple-500 to-pink-500",
            features: ["Responsive Design", "SEO Optimized", "CMS Integration", "Analytics"],
        },
        {
            title: "Mobile App Development",
            price: "$4,999",
            description: "Native iOS & Android applications",
            icon: Smartphone,
            gradient: "from-green-500 to-emerald-500",
            features: ["Cross-Platform", "Push Notifications", "API Integration", "App Store Deploy"],
        },
        {
            title: "AI Solutions",
            price: "$1,999",
            description: "AI chatbots and automation tools",
            icon: Bot,
            gradient: "from-orange-500 to-red-500",
            features: ["ChatGPT Integration", "Custom Training", "Multi-Language", "24/7 Support"],
        },
        {
            title: "Business Automation",
            price: "$1,999",
            description: "Workflow automation and optimization",
            icon: Zap,
            gradient: "from-yellow-500 to-orange-500",
            features: ["Process Automation", "CRM Integration", "Reporting", "Custom Workflows"],
        },
        {
            title: "Cloud Solutions",
            price: "$999",
            description: "Scalable cloud infrastructure setup",
            icon: Cloud,
            gradient: "from-indigo-500 to-purple-500",
            features: ["AWS/Azure Setup", "Auto Scaling", "Security Config", "Monitoring"],
        },
    ];
    return (_jsxs("section", { id: "services", className: "relative py-20 md:py-32 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 opacity-30", children: [_jsx("div", { className: "absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" }), _jsx("div", { className: "absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" })] }), _jsxs("div", { className: "relative z-10 container mx-auto px-4 sm:px-6", children: [_jsxs(motion.div, { className: "text-center mb-16", initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-100px" }, transition: { duration: 0.8 }, children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 0.2, type: "spring" }, children: [_jsx(Sparkles, { className: "w-4 h-4 text-blue-400" }), _jsx("span", { className: "text-blue-300 text-sm font-medium", children: "Our Services" })] }), _jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6", children: "Professional Services" }), _jsx("p", { className: "text-lg md:text-xl text-gray-400 max-w-3xl mx-auto", children: "Comprehensive digital solutions tailored for your business success" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: services.map((service, idx) => (_jsx(motion.div, { className: "group relative", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" }, transition: { duration: 0.6, delay: idx * 0.1 }, children: _jsxs(motion.div, { className: "relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden", whileHover: { y: -10, scale: 1.02 }, children: [_jsx(motion.div, { className: `absolute -inset-1 bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500` }), _jsx(motion.div, { className: `relative w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`, whileHover: { rotate: 360, scale: 1.1 }, transition: { duration: 0.6 }, children: _jsx(service.icon, { className: "w-8 h-8 text-white" }) }), _jsx("h3", { className: "text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors", children: service.title }), _jsx("div", { className: "text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4", children: service.price }), _jsx("p", { className: "text-gray-400 text-sm mb-6 leading-relaxed", children: service.description }), _jsx("ul", { className: "space-y-3 mb-8", children: service.features.map((feature, i) => (_jsxs(motion.li, { className: "flex items-center gap-3 text-gray-300 text-sm", initial: { opacity: 0, x: -10 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { delay: 0.1 * i }, children: [_jsx("div", { className: "w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0", children: _jsx(Check, { className: "w-3 h-3 text-green-400" }) }), _jsx("span", { children: feature })] }, i))) }), _jsxs(motion.button, { className: `relative w-full py-3 bg-gradient-to-r ${service.gradient} text-white text-sm font-semibold rounded-xl overflow-hidden group/btn`, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: [_jsxs("span", { className: "relative z-10 flex items-center justify-center gap-2", children: ["Get Started", _jsx(motion.div, { animate: { x: [0, 5, 0] }, transition: { duration: 1.5, repeat: Infinity }, children: _jsx(ArrowRight, { className: "w-4 h-4" }) })] }), _jsx(motion.div, { className: "absolute inset-0 bg-white/20", initial: { x: '-100%' }, whileHover: { x: '100%' }, transition: { duration: 0.6 } })] })] }) }, idx))) })] })] }));
};
// ============================================================================
// PROCESS SECTION (Timeline)
// ============================================================================
const ProcessSection = () => {
    const steps = [
        {
            number: "1",
            title: "Discovery & Planning",
            description: "We analyze your requirements and create a detailed project roadmap with timelines and milestones",
            icon: Target,
            color: "from-blue-500 to-cyan-500",
        },
        {
            number: "2",
            title: "Design & Development",
            description: "Our expert team designs and develops your solution using cutting-edge technologies and best practices",
            icon: Code,
            color: "from-purple-500 to-pink-500",
        },
        {
            number: "3",
            title: "Testing & Optimization",
            description: "Rigorous testing and optimization to ensure quality, security, and peak performance",
            icon: Shield,
            color: "from-green-500 to-emerald-500",
        },
        {
            number: "4",
            title: "Launch & Support",
            description: "Successful deployment with ongoing support, maintenance, and growth assistance",
            icon: Rocket,
            color: "from-orange-500 to-red-500",
        },
    ];
    return (_jsxs("section", { id: "process", className: "relative py-20 md:py-32 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-20", children: _jsx("div", { className: "absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" }) }), _jsxs("div", { className: "relative z-10 container mx-auto px-4 sm:px-6", children: [_jsxs(motion.div, { className: "text-center mb-20", initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-500/10 border border-purple-400/30 rounded-full", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 0.2, type: "spring" }, children: [_jsx(Zap, { className: "w-4 h-4 text-purple-400" }), _jsx("span", { className: "text-purple-300 text-sm font-medium", children: "Our Process" })] }), _jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6", children: "How We Work" }), _jsx("p", { className: "text-lg md:text-xl text-gray-400 max-w-3xl mx-auto", children: "A proven 4-step process to transform your vision into reality" })] }), _jsxs("div", { className: "relative max-w-6xl mx-auto", children: [_jsx("div", { className: "hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transform -translate-y-1/2" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4", children: steps.map((step, idx) => (_jsxs(motion.div, { className: "relative", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" }, transition: { duration: 0.6, delay: idx * 0.15 }, children: [_jsxs(motion.div, { className: "relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-purple-500/50 transition-all duration-500 h-full", whileHover: { y: -10, scale: 1.03 }, children: [_jsx(motion.div, { className: `absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl border-4 border-slate-900`, whileHover: { scale: 1.2, rotate: 360 }, transition: { duration: 0.6 }, children: step.number }), _jsx(motion.div, { className: `w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 mt-6 shadow-lg`, whileHover: { rotate: 360 }, transition: { duration: 0.6 }, children: _jsx(step.icon, { className: "w-8 h-8 text-white" }) }), _jsx("h3", { className: "text-xl font-bold text-white mb-3 text-center", children: step.title }), _jsx("p", { className: "text-gray-400 text-sm text-center leading-relaxed", children: step.description }), _jsx(motion.div, { className: `absolute -inset-1 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-3xl` })] }), idx < steps.length - 1 && (_jsx("div", { className: "lg:hidden flex justify-center my-4", children: _jsx(motion.div, { className: "w-1 h-12 bg-gradient-to-b from-purple-500 to-blue-500", initial: { height: 0 }, whileInView: { height: 48 }, viewport: { once: true }, transition: { delay: 0.3 + idx * 0.15 } }) }))] }, idx))) })] })] })] }));
};
// ============================================================================
// WHY CHOOSE US SECTION
// ============================================================================
const WhyChooseSection = () => {
    const reasons = [
        {
            icon: Users,
            title: "Expert Team",
            stat: "200+",
            subtitle: "Projects Delivered",
            description: "5+ years of experience with top-tier developers and designers committed to excellence",
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: Zap,
            title: "Fast Delivery",
            stat: "1-2",
            subtitle: "Weeks Average",
            description: "Rapid development cycles without compromising quality, ensuring on-time project delivery",
            color: "from-purple-500 to-pink-500",
        },
        {
            icon: TrendingUp,
            title: "Proven Results",
            stat: "$50M+",
            subtitle: "Combined Market Cap",
            description: "Our clients' projects have achieved remarkable success with sustainable growth",
            color: "from-green-500 to-emerald-500",
        },
        {
            icon: Shield,
            title: "24/7 Support",
            stat: "24/7",
            subtitle: "Always Available",
            description: "Round-the-clock technical support with comprehensive maintenance and updates",
            color: "from-orange-500 to-red-500",
        },
    ];
    return (_jsxs("section", { id: "why-choose", className: "relative py-20 md:py-32 bg-gradient-to-b from-blue-950 via-indigo-950 to-slate-900 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 opacity-20", children: [_jsx("div", { className: "absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" }), _jsx("div", { className: "absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" })] }), _jsxs("div", { className: "relative z-10 container mx-auto px-4 sm:px-6", children: [_jsxs(motion.div, { className: "text-center mb-16", initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-4 px-4 py-2 bg-green-500/10 border border-green-400/30 rounded-full", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 0.2, type: "spring" }, children: [_jsx(Award, { className: "w-4 h-4 text-green-400" }), _jsx("span", { className: "text-green-300 text-sm font-medium", children: "Why Choose Us" })] }), _jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6", children: "Why DigiLinex Stands Out" }), _jsx("p", { className: "text-lg md:text-xl text-gray-400 max-w-3xl mx-auto", children: "We combine expertise, innovation, and dedication to deliver exceptional results" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: reasons.map((reason, idx) => (_jsx(motion.div, { className: "group relative", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" }, transition: { duration: 0.6, delay: idx * 0.1 }, children: _jsxs(motion.div, { className: "relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden", whileHover: { y: -10, scale: 1.03 }, children: [_jsx(motion.div, { className: `absolute -inset-1 bg-gradient-to-r ${reason.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500` }), _jsx(motion.div, { className: `relative w-16 h-16 bg-gradient-to-br ${reason.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`, whileHover: { rotate: 360, scale: 1.1 }, transition: { duration: 0.6 }, children: _jsx(reason.icon, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { className: "text-center mb-4", children: [_jsx(motion.div, { className: "text-4xl font-bold text-white mb-1", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 0.3 + idx * 0.1, type: "spring" }, children: reason.stat }), _jsx("div", { className: `text-sm font-semibold bg-gradient-to-r ${reason.color} bg-clip-text text-transparent`, children: reason.subtitle })] }), _jsx("h3", { className: "text-xl font-bold text-white mb-3 text-center", children: reason.title }), _jsx("p", { className: "text-gray-400 text-sm text-center leading-relaxed", children: reason.description })] }) }, idx))) })] })] }));
};
// ============================================================================
// AFFILIATE PROGRAM SECTION
// ============================================================================
const AffiliateSection = () => {
    const [referrals, setReferrals] = useState(20);
    const calculateEarnings = () => {
        const avgOrderValue = 1000;
        let commissionRate = 0.20;
        if (referrals >= 31)
            commissionRate = 0.30;
        else if (referrals >= 16)
            commissionRate = 0.28;
        else if (referrals >= 6)
            commissionRate = 0.25;
        return Math.round(referrals * avgOrderValue * commissionRate);
    };
    const getTier = () => {
        if (referrals >= 31)
            return { name: "Platinum", icon: "💎", rate: "30%", color: "from-purple-600 to-pink-600" };
        if (referrals >= 16)
            return { name: "Gold", icon: "🥇", rate: "28%", color: "from-yellow-600 to-orange-600" };
        if (referrals >= 6)
            return { name: "Silver", icon: "🥈", rate: "25%", color: "from-gray-400 to-gray-600" };
        return { name: "Bronze", icon: "🥉", rate: "20%", color: "from-orange-700 to-red-700" };
    };
    const tier = getTier();
    const earnings = calculateEarnings();
    return (_jsxs("section", { id: "affiliate", className: "relative py-20 md:py-32 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 opacity-20", children: [_jsx("div", { className: "absolute top-1/3 left-1/3 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl" }), _jsx("div", { className: "absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" })] }), _jsxs("div", { className: "relative z-10 container mx-auto px-4 sm:px-6", children: [_jsxs(motion.div, { className: "text-center mb-16", initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-4 px-4 py-2 bg-pink-500/10 border border-pink-400/30 rounded-full", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 0.2, type: "spring" }, children: [_jsx(Gift, { className: "w-4 h-4 text-pink-400" }), _jsx("span", { className: "text-pink-300 text-sm font-medium", children: "Affiliate Program" })] }), _jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6", children: "Earn 20\u201330% Commission" }), _jsx("p", { className: "text-lg md:text-xl text-gray-400 max-w-3xl mx-auto", children: "Invite friends and businesses to DigiLinex and earn generous commissions on every service they purchase" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12", children: [_jsxs(motion.div, { className: "bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 shadow-2xl", initial: { opacity: 0, x: -50 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs("h3", { className: "text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3", children: [_jsx(Rocket, { className: "w-8 h-8 text-blue-400" }), "How It Works"] }), _jsx("div", { className: "space-y-6", children: [
                                            { step: "1", icon: "👤", title: "Sign Up", desc: "Create your free affiliate account and get your unique referral link instantly" },
                                            { step: "2", icon: "🔗", title: "Share", desc: "Share your link with friends, family, and business networks through social media or email" },
                                            { step: "3", icon: "💰", title: "Earn", desc: "Get 20-30% commission automatically when someone purchases services through your link" },
                                        ].map((item, idx) => (_jsxs(motion.div, { className: "flex gap-4 items-start group", initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { delay: idx * 0.2 }, children: [_jsx(motion.div, { className: "flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform", whileHover: { rotate: 360 }, transition: { duration: 0.6 }, children: item.icon }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsxs("span", { className: "text-sm font-bold text-blue-400", children: ["STEP ", item.step] }), _jsx("h4", { className: "text-lg font-bold text-white", children: item.title })] }), _jsx("p", { className: "text-gray-400 text-sm leading-relaxed", children: item.desc })] })] }, idx))) })] }), _jsxs(motion.div, { className: "bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl", initial: { opacity: 0, x: 50 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs("h3", { className: "text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3", children: [_jsx(DollarSign, { className: "w-8 h-8 text-purple-400" }), "Earnings Calculator"] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("label", { className: "text-white font-semibold text-lg", children: "Number of Referrals" }), _jsx(motion.span, { className: "text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", initial: { scale: 1.2 }, animate: { scale: 1 }, children: referrals }, referrals)] }), _jsx("input", { type: "range", min: "1", max: "50", value: referrals, onChange: (e) => setReferrals(parseInt(e.target.value)), className: "w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500", style: {
                                                    background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(referrals / 50) * 100}%, rgb(51, 65, 85) ${(referrals / 50) * 100}%, rgb(51, 65, 85) 100%)`
                                                } })] }), _jsxs(motion.div, { className: "bg-black/30 rounded-2xl p-6 mb-6 border border-white/10", initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 }, children: [_jsxs(motion.div, { className: `inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r ${tier.color} rounded-full mb-6 shadow-xl`, initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring" }, children: [_jsx("span", { className: "text-2xl", children: tier.icon }), _jsxs("div", { children: [_jsxs("span", { className: "text-white font-bold text-sm", children: [tier.name, " Partner"] }), _jsxs("span", { className: "text-white/80 text-xs ml-2", children: ["(", tier.rate, ")"] })] })] }, tier.name), _jsx("div", { className: "text-gray-400 text-sm mb-2", children: "Your Monthly Earnings" }), _jsxs(motion.div, { className: "text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2", initial: { scale: 1.2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring" }, children: ["$", earnings.toLocaleString()] }, earnings), _jsx("p", { className: "text-gray-500 text-xs", children: "per month (estimated)" })] }), _jsxs(motion.button, { className: "w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-2xl relative overflow-hidden group", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: [_jsxs("span", { className: "relative z-10 flex items-center justify-center gap-2", children: [_jsx(Gift, { className: "w-5 h-5" }), "Join Affiliate Program"] }), _jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600", initial: { x: '100%' }, whileHover: { x: 0 }, transition: { duration: 0.3 } })] })] })] }), _jsxs(motion.div, { className: "bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs("h3", { className: "text-2xl md:text-3xl font-bold text-white mb-4 text-center flex items-center justify-center gap-3", children: [_jsx(Award, { className: "w-8 h-8 text-yellow-400" }), "Partner Tiers"] }), _jsx("p", { className: "text-gray-400 text-center mb-10", children: "Unlock higher commission rates as you grow" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6", children: [
                                    { icon: "🥉", name: "Bronze", rate: "20%", refs: "1-5", color: "from-orange-700 to-red-700" },
                                    { icon: "🥈", name: "Silver", rate: "25%", refs: "6-15", color: "from-gray-400 to-gray-600" },
                                    { icon: "🥇", name: "Gold", rate: "28%", refs: "16-30", color: "from-yellow-600 to-orange-600" },
                                    { icon: "💎", name: "Platinum", rate: "30%", refs: "31+", color: "from-purple-600 to-pink-600" },
                                ].map((tierItem, idx) => (_jsxs(motion.div, { className: `relative bg-gradient-to-br ${tierItem.color} rounded-2xl p-6 text-center cursor-pointer group overflow-hidden`, initial: { opacity: 0, scale: 0.8 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { delay: idx * 0.1, type: "spring" }, whileHover: { scale: 1.05, y: -5 }, children: [_jsx(motion.div, { className: "text-5xl mb-3", whileHover: { scale: 1.2, rotate: 360 }, transition: { duration: 0.6 }, children: tierItem.icon }), _jsx("div", { className: "text-white font-bold text-lg mb-1", children: tierItem.name }), _jsx("div", { className: "text-white text-2xl font-bold mb-2", children: tierItem.rate }), _jsxs("div", { className: "text-white/80 text-sm", children: [tierItem.refs, " referrals"] }), _jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent", initial: { x: '-100%' }, whileHover: { x: '100%' }, transition: { duration: 0.6 } })] }, idx))) })] })] })] }));
};
// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================
const TestimonialsSection = () => {
    const testimonials = [
        {
            name: "Alex Thompson",
            role: "CEO, TechVenture",
            image: "👨‍💼",
            rating: 5,
            text: "DigiLinex delivered an outstanding blockchain solution for our business. Their expertise in smart contracts and security is unmatched! We saw a 300% increase in efficiency.",
            company: "TechVenture Inc.",
        },
        {
            name: "Sarah Johnson",
            role: "Founder, CryptoStart",
            image: "👩‍💼",
            rating: 5,
            text: "Professional team that truly understands the crypto space. They helped us launch our token successfully with exceptional support throughout the entire process.",
            company: "CryptoStart",
        },
        {
            name: "Michael Chen",
            role: "CTO, DeFi Protocol",
            image: "👨‍💻",
            rating: 5,
            text: "Best investment we made! The smart contract audit was thorough and gave us complete confidence in our platform security. Highly recommend their services.",
            company: "DeFi Protocol",
        },
        {
            name: "Emma Williams",
            role: "Marketing Director",
            image: "👩‍💼",
            rating: 5,
            text: "The website they built for us is stunning and performs incredibly well. Our conversion rate increased by 250% in just 2 months!",
            company: "GrowthTech",
        },
        {
            name: "David Martinez",
            role: "Product Manager",
            image: "👨‍💼",
            rating: 5,
            text: "Exceptional mobile app development! They delivered our iOS and Android apps ahead of schedule with quality that exceeded our expectations.",
            company: "AppFlow",
        },
        {
            name: "Lisa Anderson",
            role: "Startup Founder",
            image: "👩‍💻",
            rating: 5,
            text: "DigiLinex transformed our business with their AI automation solutions. We're now saving 40+ hours per week on repetitive tasks!",
            company: "AutomateNow",
        },
    ];
    const [currentIndex, setCurrentIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("section", { id: "testimonials", className: "relative py-20 md:py-32 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 opacity-20", children: [_jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" }), _jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" })] }), _jsxs("div", { className: "relative z-10 container mx-auto px-4 sm:px-6", children: [_jsxs(motion.div, { className: "text-center mb-16", initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-400/30 rounded-full", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 0.2, type: "spring" }, children: [_jsx(Star, { className: "w-4 h-4 text-yellow-400" }), _jsx("span", { className: "text-yellow-300 text-sm font-medium", children: "Testimonials" })] }), _jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6", children: "What Our Clients Say" }), _jsx("p", { className: "text-lg md:text-xl text-gray-400 max-w-3xl mx-auto", children: "Real feedback from satisfied customers worldwide" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto", children: testimonials.map((testimonial, idx) => (_jsx(motion.div, { className: "group", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" }, transition: { duration: 0.6, delay: idx * 0.1 }, children: _jsxs(motion.div, { className: "relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-500", whileHover: { y: -10, scale: 1.02 }, children: [_jsx("div", { className: "absolute top-6 right-6 text-6xl text-blue-500/10 font-serif", children: "\"" }), _jsx("div", { className: "flex items-center gap-1 mb-4", children: [...Array(testimonial.rating)].map((_, i) => (_jsx(motion.div, { initial: { opacity: 0, scale: 0 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { delay: 0.5 + i * 0.1 }, children: _jsx(Star, { className: "w-5 h-5 fill-yellow-400 text-yellow-400" }) }, i))) }), _jsxs("p", { className: "text-gray-300 text-sm md:text-base mb-6 leading-relaxed relative z-10", children: ["\"", testimonial.text, "\""] }), _jsxs("div", { className: "flex items-center gap-4 pt-4 border-t border-white/10", children: [_jsx(motion.div, { className: "w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0", whileHover: { scale: 1.1, rotate: 360 }, transition: { duration: 0.6 }, children: testimonial.image }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-semibold text-white text-sm", children: testimonial.name }), _jsx("div", { className: "text-xs text-gray-400", children: testimonial.role }), _jsx("div", { className: "text-xs text-blue-400", children: testimonial.company })] })] }), _jsx(motion.div, { className: "absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-3xl" })] }) }, idx))) })] })] }));
};
// ============================================================================
// CTA SECTION
// ============================================================================
const CTASection = () => {
    return (_jsxs("section", { id: "contact", className: "relative py-20 md:py-32 bg-gradient-to-b from-blue-950 to-indigo-950 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-30", children: _jsx("div", { className: "absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" }) }), _jsx("div", { className: "relative z-10 container mx-auto px-4 sm:px-6", children: _jsx(motion.div, { className: "max-w-5xl mx-auto", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 }, children: _jsxs("div", { className: "relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 overflow-hidden shadow-2xl", children: [_jsx(motion.div, { className: "absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl", animate: { scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }, transition: { duration: 8, repeat: Infinity } }), _jsx(motion.div, { className: "absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl", animate: { scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, 20, 0] }, transition: { duration: 8, repeat: Infinity } }), _jsxs("div", { className: "relative z-10 text-center", children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full", initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { type: "spring" }, children: [_jsx(Rocket, { className: "w-4 h-4 text-white" }), _jsx("span", { className: "text-white text-sm font-medium", children: "Let's Get Started" })] }), _jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6", children: "Ready to Transform Your Business?" }), _jsx("p", { className: "text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto", children: "Join 200+ successful companies that have already transformed their ideas into digital reality with DigiLinex" }), _jsx("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: _jsxs(motion.button, { className: "group px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-2xl relative overflow-hidden", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsxs("span", { className: "relative z-10 flex items-center justify-center gap-2", children: ["Start Your Project", _jsx(motion.div, { animate: { x: [0, 5, 0] }, transition: { duration: 1.5, repeat: Infinity }, children: _jsx(ArrowRight, { className: "w-5 h-5" }) })] }), _jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500", initial: { x: '-100%' }, whileHover: { x: 0 }, transition: { duration: 0.3 } })] }) }), _jsxs(motion.div, { className: "flex flex-wrap items-center justify-center gap-8 mt-10", initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { delay: 0.4 }, children: [_jsxs("div", { className: "flex items-center gap-2 text-white/90", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm", children: "No Hidden Fees" })] }), _jsxs("div", { className: "flex items-center gap-2 text-white/90", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm", children: "Fast Delivery" })] }), _jsxs("div", { className: "flex items-center gap-2 text-white/90", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm", children: "24/7 Support" })] })] })] })] }) }) })] }));
};
// ============================================================================
// FOOTER
// ============================================================================
const Footer = () => {
    return (_jsx("footer", { className: "relative bg-gradient-to-b from-indigo-950 to-slate-950 border-t border-white/10", children: _jsxs("div", { className: "container mx-auto px-4 sm:px-6 py-12 md:py-16", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12", children: [_jsxs("div", { children: [_jsxs(motion.div, { className: "flex items-center gap-3 mb-6", whileHover: { scale: 1.05 }, children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-white text-xl", children: "DL" }), _jsx("span", { className: "text-white font-bold text-2xl", children: "DigiLinex" })] }), _jsx("p", { className: "text-gray-400 text-sm leading-relaxed mb-6", children: "Transforming ideas into digital reality with blockchain, AI, and cutting-edge technology solutions." }), _jsx("div", { className: "flex items-center gap-3", children: ['💬', '🐦', '📱', '💼'].map((icon, idx) => (_jsx(motion.a, { href: "#", className: "w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-xl transition-colors", whileHover: { scale: 1.1, y: -2 }, whileTap: { scale: 0.9 }, children: icon }, idx))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold text-lg mb-6", children: "Services" }), _jsx("ul", { className: "space-y-3", children: ["Blockchain Development", "Website Development", "Mobile Apps", "AI Solutions", "Business Automation"].map((item) => (_jsx("li", { children: _jsxs(motion.a, { href: "#", className: "text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group", whileHover: { x: 5 }, children: [_jsx(ChevronRight, { className: "w-4 h-4 text-blue-400 group-hover:text-white transition-colors" }), item] }) }, item))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold text-lg mb-6", children: "Company" }), _jsx("ul", { className: "space-y-3", children: ["About Us", "Our Process", "Portfolio", "Careers", "Contact Us"].map((item) => (_jsx("li", { children: _jsxs(motion.a, { href: "#", className: "text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group", whileHover: { x: 5 }, children: [_jsx(ChevronRight, { className: "w-4 h-4 text-purple-400 group-hover:text-white transition-colors" }), item] }) }, item))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold text-lg mb-6", children: "Get In Touch" }), _jsxs("ul", { className: "space-y-4", children: [_jsxs("li", { className: "flex items-start gap-3", children: [_jsx(MessageCircle, { className: "w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-400 text-sm", children: "Email" }), _jsx("a", { href: "mailto:hello@digilinex.com", className: "text-white text-sm hover:text-blue-400 transition-colors", children: "hello@digilinex.com" })] })] }), _jsxs("li", { className: "flex items-start gap-3", children: [_jsx(Globe, { className: "w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-400 text-sm", children: "Website" }), _jsx("a", { href: "https://digilinex.com", className: "text-white text-sm hover:text-purple-400 transition-colors", children: "www.digilinex.com" })] })] })] })] })] }), _jsx("div", { className: "border-t border-white/10 pt-8", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4", children: [_jsx("p", { className: "text-gray-400 text-sm text-center md:text-left", children: "\u00A9 2025 DigiLinex. All rights reserved." }), _jsx("div", { className: "flex items-center gap-6", children: ["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (_jsx(motion.a, { href: "#", className: "text-gray-400 hover:text-white text-sm transition-colors", whileHover: { y: -2 }, children: item }, item))) })] }) })] }) }));
};
// ============================================================================
// MAIN HOME COMPONENT
// ============================================================================
const Home = () => {
    return (_jsxs("div", { className: "min-h-screen bg-slate-900", children: [_jsx(Header, {}), _jsxs("main", { children: [_jsx(ErrorBoundary, { children: _jsx(HeroSection, {}) }), _jsx(ErrorBoundary, { children: _jsx(ServicesSection, {}) }), _jsx(ErrorBoundary, { children: _jsx(ProcessSection, {}) }), _jsx(ErrorBoundary, { children: _jsx(WhyChooseSection, {}) }), _jsx(ErrorBoundary, { children: _jsx(AffiliateSection, {}) }), _jsx(ErrorBoundary, { children: _jsx(TestimonialsSection, {}) }), _jsx(ErrorBoundary, { children: _jsx(CTASection, {}) })] }), _jsx(Footer, {})] }));
};
export default Home;
