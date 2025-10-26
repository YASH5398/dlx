import React, { useState, useEffect } from "react";
import {
  Shield, Award, TrendingUp, Code, Globe, Smartphone, Bot, Cloud,
  Zap, Users, CheckCircle, Star, ArrowRight, Menu, X, Check, Sparkles,
  Rocket, Target, DollarSign, Gift, MessageCircle, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useAffiliateBannerVisibility } from '../hooks/useAffiliateBannerVisibility';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    return this.state.hasError ? (
      <div className="text-white bg-red-600/20 border border-red-500/30 rounded-lg p-4">
        Something went wrong rendering this section.
      </div>
    ) : (
      this.props.children
    );
  }
}

// ============================================================================
// FLOATING PARTICLES BACKGROUND
// ============================================================================
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );
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

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-white/10'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 md:gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-white text-lg md:text-xl shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              DL
            </motion.div>
            <span className="text-white font-bold text-xl md:text-2xl tracking-tight">DigiLinex</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {["Home", "Services", "Process", "Affiliate", "Testimonials", "Contact"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-300 hover:text-white text-base font-medium transition-colors duration-300 relative group"
                whileHover={{ y: -2 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <motion.button
              className="px-5 py-2.5 text-white text-sm font-medium bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 5px 20px rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              Login
            </motion.button>
            <motion.button
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')}
            >
              <span className="relative z-10">Get Started</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="lg:hidden py-6 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col gap-4 px-4">
                {["Home", "Services", "Process", "Affiliate", "Testimonials", "Contact"].map((item) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-gray-300 hover:text-white text-base font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                    whileHover={{ x: 10, color: "#ffffff" }}
                  >
                    {item}
                  </motion.a>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                  <motion.button
                    className="px-5 py-2.5 text-white text-sm font-medium bg-white/10 rounded-xl"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/signup')}
                  >
                    Get Started
                  </motion.button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
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
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-20">
      {/* Animated Background */}
      <FloatingParticles />
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full backdrop-blur-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm md:text-base font-medium">Premium Digital Solutions</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Transforming Ideas into
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {typedText}
                <motion.span
                  className="inline-block w-1 h-12 md:h-16 bg-purple-400 ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-gray-300 mb-4 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Blockchain | AI | Websites | Mobile Apps | Business Automation
            </motion.p>

            <motion.p
              className="text-base md:text-lg text-gray-400 mb-8 flex items-center justify-center lg:justify-start gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Users className="w-5 h-5" />
              Trusted by 200+ founders & teams globally
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <motion.button
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-semibold rounded-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Project
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              {/* Removed secondary CTA button per request */}
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.div
                className="flex items-center gap-2 text-green-400"
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm md:text-base">100% Verified Smart Contracts</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 text-blue-400"
                whileHover={{ scale: 1.05 }}
              >
                <Award className="w-5 h-5" />
                <span className="text-sm md:text-base">ISO 27001 Certified</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Tech Stack */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              {/* Main Card */}
              <motion.div
                className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-center mb-8"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Code className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Tech Stack</h3>
                  <p className="text-sm text-gray-400">Modern Development Tools</p>
                </motion.div>

                {/* Tech Icons Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon: "⚛️", name: "React", color: "from-cyan-500 to-blue-500" },
                    { icon: "🟢", name: "Node", color: "from-green-500 to-emerald-500" },
                    { icon: "🐍", name: "Python", color: "from-yellow-500 to-green-500" },
                    { icon: "💎", name: "Ruby", color: "from-red-500 to-pink-500" },
                    { icon: "₿", name: "Bitcoin", color: "from-orange-500 to-yellow-500" },
                    { icon: "👻", name: "Solidity", color: "from-gray-500 to-slate-500" },
                    { icon: "🍓", name: "Angular", color: "from-red-500 to-rose-500" },
                    { icon: "☁️", name: "Cloud", color: "from-blue-500 to-indigo-500" },
                  ].map((tech, idx) => (
                    <motion.div
                      key={idx}
                      className={`bg-gradient-to-br ${tech.color} rounded-xl p-4 flex items-center justify-center cursor-pointer shadow-lg relative group`}
                      title={tech.name}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <span className="text-3xl">{tech.icon}</span>
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 bg-pink-500/30 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl"
                animate={{ scale: [1.2, 1, 1.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          {[
            { label: "Projects Completed", value: "200+", icon: Rocket },
            { label: "Token Creation", value: "1-2 Weeks", icon: Zap },
            { label: "Market Cap", value: "$50M+", icon: TrendingUp },
            { label: "Support", value: "24/7", icon: Shield },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all shadow-lg group"
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + idx * 0.1 }}
            >
              <stat.icon className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400 text-xs md:text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            className="w-1.5 h-3 bg-white rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
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

  return (
    <section id="services" className="relative py-20 md:py-32 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Our Services</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Professional Services
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive digital solutions tailored for your business success
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              {/* Card */}
              <motion.div
                className="relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                {/* Glow Effect */}
                <motion.div
                  className={`absolute -inset-1 bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
                />

                {/* Icon */}
                <motion.div
                  className={`relative w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <service.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {service.title}
                </h3>
                
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  {service.price}
                </div>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3 text-gray-300 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  className={`relative w-full py-3 bg-gradient-to-r ${service.gradient} text-white text-sm font-semibold rounded-xl overflow-hidden group/btn`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
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

  return (
    <section id="process" className="relative py-20 md:py-32 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-500/10 border border-purple-400/30 rounded-full"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Our Process</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            How We Work
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            A proven 4-step process to transform your vision into reality
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Desktop Timeline Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transform -translate-y-1/2" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                {/* Card */}
                <motion.div
                  className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-purple-500/50 transition-all duration-500 h-full"
                  whileHover={{ y: -10, scale: 1.03 }}
                >
                  {/* Number Badge */}
                  <motion.div
                    className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl border-4 border-slate-900`}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 mt-6 shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm text-center leading-relaxed">
                    {step.description}
                  </p>

                  {/* Hover Glow */}
                  <motion.div
                    className={`absolute -inset-1 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-3xl`}
                  />
                </motion.div>

                {/* Mobile Connector */}
                {idx < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <motion.div
                      className="w-1 h-12 bg-gradient-to-b from-purple-500 to-blue-500"
                      initial={{ height: 0 }}
                      whileInView={{ height: 48 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + idx * 0.15 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
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

  return (
    <section id="why-choose" className="relative py-20 md:py-32 bg-gradient-to-b from-blue-950 via-indigo-950 to-slate-900 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-green-500/10 border border-green-400/30 rounded-full"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Award className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">Why Choose Us</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Why DigiLinex Stands Out
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            We combine expertise, innovation, and dedication to deliver exceptional results
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, idx) => (
            <motion.div
              key={idx}
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <motion.div
                className="relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
                whileHover={{ y: -10, scale: 1.03 }}
              >
                {/* Glow */}
                <motion.div
                  className={`absolute -inset-1 bg-gradient-to-r ${reason.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
                />

                {/* Icon */}
                <motion.div
                  className={`relative w-16 h-16 bg-gradient-to-br ${reason.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <reason.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Stats */}
                <div className="text-center mb-4">
                  <motion.div
                    className="text-4xl font-bold text-white mb-1"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                  >
                    {reason.stat}
                  </motion.div>
                  <div className={`text-sm font-semibold bg-gradient-to-r ${reason.color} bg-clip-text text-transparent`}>
                    {reason.subtitle}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-white mb-3 text-center">
                  {reason.title}
                </h3>
                <p className="text-gray-400 text-sm text-center leading-relaxed">
                  {reason.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// AFFILIATE PROGRAM SECTION
// ============================================================================
const AffiliateSection = () => {
  const [referrals, setReferrals] = useState(20);

  const calculateEarnings = () => {
    const avgOrderValue = 1000;
    let commissionRate = 0.20;
    if (referrals >= 31) commissionRate = 0.30;
    else if (referrals >= 16) commissionRate = 0.28;
    else if (referrals >= 6) commissionRate = 0.25;
    return Math.round(referrals * avgOrderValue * commissionRate);
  };

  const getTier = () => {
    if (referrals >= 31) return { name: "Platinum", icon: "💎", rate: "30%", color: "from-purple-600 to-pink-600" };
    if (referrals >= 16) return { name: "Gold", icon: "🥇", rate: "28%", color: "from-yellow-600 to-orange-600" };
    if (referrals >= 6) return { name: "Silver", icon: "🥈", rate: "25%", color: "from-gray-400 to-gray-600" };
    return { name: "Bronze", icon: "🥉", rate: "20%", color: "from-orange-700 to-red-700" };
  };

  const tier = getTier();
  const earnings = calculateEarnings();

  return (
    <section id="affiliate" className="relative py-20 md:py-32 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-pink-500/10 border border-pink-400/30 rounded-full"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Gift className="w-4 h-4 text-pink-400" />
            <span className="text-pink-300 text-sm font-medium">Affiliate Program</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Earn 20–30% Commission
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Invite friends and businesses to DigiLinex and earn generous commissions on every service they purchase
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* How It Works */}
          <motion.div
            className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 shadow-2xl"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-blue-400" />
              How It Works
            </h3>
            
            <div className="space-y-6">
              {[
                { step: "1", icon: "👤", title: "Sign Up", desc: "Create your free affiliate account and get your unique referral link instantly" },
                { step: "2", icon: "🔗", title: "Share", desc: "Share your link with friends, family, and business networks through social media or email" },
                { step: "3", icon: "💰", title: "Earn", desc: "Get 20-30% commission automatically when someone purchases services through your link" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="flex gap-4 items-start group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                >
                  <motion.div
                    className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {item.icon}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-blue-400">STEP {item.step}</span>
                      <h4 className="text-lg font-bold text-white">{item.title}</h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Calculator */}
          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-400" />
              Earnings Calculator
            </h3>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-white font-semibold text-lg">
                  Number of Referrals
                </label>
                <motion.span
                  className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                  key={referrals}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {referrals}
                </motion.span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={referrals}
                onChange={(e) => setReferrals(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                style={{
                  background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(referrals / 50) * 100}%, rgb(51, 65, 85) ${(referrals / 50) * 100}%, rgb(51, 65, 85) 100%)`
                }}
              />
            </div>

            {/* Tier Badge & Earnings */}
            <motion.div
              className="bg-black/30 rounded-2xl p-6 mb-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className={`inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r ${tier.color} rounded-full mb-6 shadow-xl`}
                key={tier.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <span className="text-white font-bold text-sm">{tier.name} Partner</span>
                  <span className="text-white/80 text-xs ml-2">({tier.rate})</span>
                </div>
              </motion.div>

              <div className="text-gray-400 text-sm mb-2">Your Monthly Earnings</div>
              <motion.div
                className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                key={earnings}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                ${earnings.toLocaleString()}
              </motion.div>
              <p className="text-gray-500 text-xs">per month (estimated)</p>
            </motion.div>

            {/* CTA */}
            <motion.button
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-2xl relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Gift className="w-5 h-5" />
                Join Affiliate Program
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        </div>

        {/* Tiers */}
        <motion.div
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center flex items-center justify-center gap-3">
            <Award className="w-8 h-8 text-yellow-400" />
            Partner Tiers
          </h3>
          <p className="text-gray-400 text-center mb-10">Unlock higher commission rates as you grow</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🥉", name: "Bronze", rate: "20%", refs: "1-5", color: "from-orange-700 to-red-700" },
              { icon: "🥈", name: "Silver", rate: "25%", refs: "6-15", color: "from-gray-400 to-gray-600" },
              { icon: "🥇", name: "Gold", rate: "28%", refs: "16-30", color: "from-yellow-600 to-orange-600" },
              { icon: "💎", name: "Platinum", rate: "30%", refs: "31+", color: "from-purple-600 to-pink-600" },
            ].map((tierItem, idx) => (
              <motion.div
                key={idx}
                className={`relative bg-gradient-to-br ${tierItem.color} rounded-2xl p-6 text-center cursor-pointer group overflow-hidden`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="text-5xl mb-3"
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {tierItem.icon}
                </motion.div>
                <div className="text-white font-bold text-lg mb-1">{tierItem.name}</div>
                <div className="text-white text-2xl font-bold mb-2">{tierItem.rate}</div>
                <div className="text-white/80 text-sm">{tierItem.refs} referrals</div>

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
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

  return (
    <section id="testimonials" className="relative py-20 md:py-32 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-400/30 rounded-full"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">Testimonials</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            What Our Clients Say
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Real feedback from satisfied customers worldwide
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              className="group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <motion.div
                className="relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-500"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-6xl text-blue-500/10 font-serif">"</div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Text */}
                <p className="text-gray-300 text-sm md:text-base mb-6 leading-relaxed relative z-10">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {testimonial.image}
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-400">{testimonial.role}</div>
                    <div className="text-xs text-blue-400">{testimonial.company}</div>
                  </div>
                </div>

                {/* Glow */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-3xl"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// CTA SECTION
// ============================================================================
const CTASection = () => {
  return (
    <section id="contact" className="relative py-20 md:py-32 bg-gradient-to-b from-blue-950 to-indigo-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 overflow-hidden shadow-2xl">
            {/* Animated Orbs */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
              <motion.div
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring" }}
              >
                <Rocket className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Let's Get Started</span>
              </motion.div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto">
                Join 200+ successful companies that have already transformed their ideas into digital reality with DigiLinex
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="group px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-2xl relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Your Project
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>

                {/* Removed secondary CTA to eliminate right-side circle icon */}
              </div>

              {/* Trust Indicators */}
              <motion.div
                className="flex flex-wrap items-center justify-center gap-8 mt-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">24/7 Support</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// FOOTER
// ============================================================================
const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-indigo-950 to-slate-950 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <motion.div
              className="flex items-center gap-3 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">
                DL
              </div>
              <span className="text-white font-bold text-2xl">DigiLinex</span>
            </motion.div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Transforming ideas into digital reality with blockchain, AI, and cutting-edge technology solutions.
            </p>
            <div className="flex items-center gap-3">
              {['💬', '🐦', '📱', '💼'].map((icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-xl transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Services</h3>
            <ul className="space-y-3">
              {["Blockchain Development", "Website Development", "Mobile Apps", "AI Solutions", "Business Automation"].map((item) => (
                <li key={item}>
                  <motion.a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                    whileHover={{ x: 5 }}
                  >
                    <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                    {item}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Company</h3>
            <ul className="space-y-3">
              {["About Us", "Our Process", "Portfolio", "Careers", "Contact Us"].map((item) => (
                <li key={item}>
                  <motion.a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                    whileHover={{ x: 5 }}
                  >
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                    {item}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Get In Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-gray-400 text-sm">Email</div>
                  <a href="mailto:hello@digilinex.com" className="text-white text-sm hover:text-blue-400 transition-colors">
                    hello@digilinex.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-gray-400 text-sm">Website</div>
                  <a href="https://digilinex.com" className="text-white text-sm hover:text-purple-400 transition-colors">
                    www.digilinex.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2025 DigiLinex. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                  whileHover={{ y: -2 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// MAIN HOME COMPONENT
// ============================================================================
const Home = () => {
  const { shouldHideBanners, loading } = useAffiliateBannerVisibility();

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main>
        <ErrorBoundary>
          <HeroSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <ServicesSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <ProcessSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <WhyChooseSection />
        </ErrorBoundary>
        {!loading && !shouldHideBanners && (
          <ErrorBoundary>
            <AffiliateSection />
          </ErrorBoundary>
        )}
        <ErrorBoundary>
          <TestimonialsSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <CTASection />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default Home;