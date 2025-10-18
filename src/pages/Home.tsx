import React, { useState } from 'react';
import { 
  Shield, Award, TrendingUp, Code, Globe, Smartphone, Bot, Cloud,
  Zap, Users, DollarSign, CheckCircle, Star, ArrowRight, Menu, X,
  ChevronDown, ExternalLink, Check, TrendingDown
} from 'lucide-react';

// Modern Header Component
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-purple-600 text-sm">
              DL
            </div>
            <span className="text-white font-bold text-lg">DigiLinex</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {['Home', 'Services', 'Process', 'Testimonials', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 text-white text-sm font-medium hover:bg-white/10 rounded-lg transition-all">
              Login
            </button>
            <button className="px-4 py-2 bg-white text-purple-600 text-sm font-semibold rounded-lg hover:shadow-lg transition-all">
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-3">
              {['Home', 'Services', 'Process', 'Testimonials', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-white/90 hover:text-white text-sm font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <button className="px-4 py-2 text-white text-sm font-medium bg-white/10 rounded-lg">
                  Login
                </button>
                <button className="px-4 py-2 bg-white text-purple-600 text-sm font-semibold rounded-lg">
                  Sign Up
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 md:w-96 h-64 md:h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-block mb-4 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm">
              <span className="text-blue-300 text-xs md:text-sm font-medium">Premium Digital Solutions</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Transforming Ideas into
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Reality
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Blockchain | AI | Websites | Mobile Apps | Business Automation
            </p>
            <p className="text-sm md:text-base text-gray-400 mb-8">
              Trusted by 200+ founders & teams globally
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm md:text-base font-semibold rounded-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2">
                Start Your Project
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm md:text-base font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                Get Free Consultation
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 mt-8">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs md:text-sm">100% Verified Smart Contracts</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <Award className="w-4 h-4" />
                <span className="text-xs md:text-sm">ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          {/* Right Content - Tech Stack Display */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">React</h3>
                <p className="text-sm text-gray-400">Modern UI Library</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: '⚛️', name: 'React', color: 'from-cyan-500 to-blue-500' },
                  { icon: '🟢', name: 'Node', color: 'from-green-500 to-emerald-500' },
                  { icon: '🐍', name: 'Python', color: 'from-yellow-500 to-green-500' },
                  { icon: '💎', name: 'Ruby', color: 'from-red-500 to-pink-500' },
                  { icon: '₿', name: 'Bitcoin', color: 'from-orange-500 to-yellow-500' },
                  { icon: '👻', name: 'Solidity', color: 'from-gray-500 to-slate-500' },
                  { icon: '🍓', name: 'Angular', color: 'from-red-500 to-rose-500' },
                  { icon: '☁️', name: 'Cloud', color: 'from-blue-500 to-indigo-500' }
                ].map((tech, idx) => (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${tech.color} rounded-lg p-3 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer`}
                    title={tech.name}
                  >
                    <span className="text-2xl">{tech.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { label: 'Projects Completed', value: '200+' },
            { label: 'Token Creation', value: '1-2 Weeks' },
            { label: 'Market Cap', value: '$50M+' },
            { label: 'Support', value: '24/7' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
              <div className="text-xl md:text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-xs md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Services Section
const ServicesSection = () => {
  const services = [
    {
      title: 'Blockchain Development',
      price: '$2,999',
      description: 'Smart contracts, tokens, and DeFi solutions',
      icon: Code,
      features: ['Token Creation', 'Smart Contracts', 'Security Audit', 'DEX Listing']
    },
    {
      title: 'Website Development',
      price: '$1,499',
      description: 'Modern responsive websites with SEO',
      icon: Globe,
      features: ['Responsive Design', 'SEO Optimized', 'CMS Integration', 'Analytics']
    },
    {
      title: 'Mobile App Development',
      price: '$4,999',
      description: 'Native iOS & Android applications',
      icon: Smartphone,
      features: ['Cross-Platform', 'Push Notifications', 'API Integration', 'App Store Deploy']
    },
    {
      title: 'AI Solutions',
      price: '$1,999',
      description: 'AI chatbots and automation tools',
      icon: Bot,
      features: ['ChatGPT Integration', 'Custom Training', 'Multi-Language', '24/7 Support']
    },
    {
      title: 'Business Automation',
      price: '$1,999',
      description: 'Workflow automation and optimization',
      icon: Zap,
      features: ['Process Automation', 'CRM Integration', 'Reporting', 'Custom Workflows']
    },
    {
      title: 'Cloud Solutions',
      price: '$999',
      description: 'Scalable cloud infrastructure setup',
      icon: Cloud,
      features: ['AWS/Azure Setup', 'Auto Scaling', 'Security Config', 'Monitoring']
    }
  ];

  return (
    <section id="services" className="relative py-12 md:py-20 bg-gradient-to-b from-indigo-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            Our Professional Services
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Comprehensive digital solutions tailored for your business success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <service.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">{service.title}</h3>
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                {service.price}
              </div>
              <p className="text-gray-400 text-sm mb-4">{service.description}</p>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Process Section
const ProcessSection = () => {
  const steps = [
    {
      number: '1',
      title: 'Token Creation',
      description: 'Smart contract development with custom features and security audit',
      icon: Code
    },
    {
      number: '2',
      title: 'Website',
      description: 'Professional landing page with whitepaper and roadmap',
      icon: Globe
    },
    {
      number: '3',
      title: 'Listing',
      description: 'DEX listing on PancakeSwap, Uniswap and other exchanges',
      icon: TrendingUp
    },
    {
      number: '4',
      title: 'Growth Support',
      description: 'Marketing assistance and community building support',
      icon: Zap
    }
  ];

  return (
    <section id="process" className="relative py-12 md:py-20 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            Our Process
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Simple 4-step process to launch your project successfully
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connection Line (desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -z-10"></div>
              )}
              
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/70 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  {step.number}
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Why Choose Section
const WhyChooseSection = () => {
  const reasons = [
    {
      icon: Users,
      title: 'Trusted Experts',
      stat: '200+',
      description: '5+ years of experience with 200+ successful projects delivered globally.'
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      stat: '1-2 Weeks',
      description: 'Rapid development cycles with quality assurance and on-time delivery.'
    },
    {
      icon: TrendingUp,
      title: 'Scalable Solutions',
      stat: '$50M+',
      description: 'Future-proof technology stack that grows with your business needs.'
    },
    {
      icon: Shield,
      title: '24/7 Support',
      stat: '24/7',
      description: 'Round-the-clock technical support with comprehensive maintenance packages.'
    }
  ];

  return (
    <section className="relative py-12 md:py-20 bg-gradient-to-b from-indigo-950 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            Why Choose DigiLinex
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            We combine expertise, innovation, and dedication to deliver exceptional results
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <div className="text-center mb-4">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{reason.stat}</div>
                <div className="text-xs md:text-sm text-blue-400 font-semibold">{reason.title}</div>
              </div>
              
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <reason.icon className="w-6 h-6 text-white" />
              </div>
              
              <p className="text-gray-400 text-sm text-center leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Referral Program Section
const ReferralSection = () => {
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
    if (referrals >= 31) return { name: 'Platinum', icon: '💎', rate: '30%', color: 'from-purple-600 to-pink-600' };
    if (referrals >= 16) return { name: 'Gold', icon: '🥇', rate: '28%', color: 'from-yellow-600 to-orange-600' };
    if (referrals >= 6) return { name: 'Silver', icon: '🥈', rate: '25%', color: 'from-gray-400 to-gray-600' };
    return { name: 'Bronze', icon: '🥉', rate: '20%', color: 'from-orange-700 to-red-700' };
  };

  const tier = getTier();
  const earnings = calculateEarnings();

  return (
    <section className="relative py-12 md:py-20 bg-gradient-to-b from-slate-900 via-indigo-950 to-blue-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Earn 20–30% by Referring Services
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto">
            Invite friends and businesses to DigiLinex and earn 20–30% commission on every service they buy. It's easy, fast, and fully automated.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
          {/* How It Works */}
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6">How It Works</h3>
            
            <div className="space-y-6">
              {[
                { step: '👤', title: 'Step 1', desc: 'Create your referral account and get your unique referral link instantly' },
                { step: '🔗', title: 'Step 2', desc: 'Share your link with friends, family, and business networks through social media' },
                { step: '💰', title: 'Step 3', desc: 'Get 20-30% commission automatically when someone purchases services through your link' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings Calculator */}
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>💡</span> Earnings Calculator
            </h3>

            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                {referrals} Friends
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={referrals}
                onChange={(e) => setReferrals(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="bg-black/30 rounded-xl p-6 mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${tier.color} rounded-full mb-4`}>
                <span className="text-xl">{tier.icon}</span>
                <span className="text-white font-semibold text-sm">{tier.name} Partner</span>
                <span className="text-white/90 text-xs">({tier.rate})</span>
              </div>
              
              <div className="text-gray-400 text-sm mb-2">Your Monthly Earnings</div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ${earnings.toLocaleString()}
              </div>
              <p className="text-gray-400 text-xs mt-2">per month</p>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2">
              💰 Join Referral Program
            </button>
          </div>
        </div>

        {/* Partner Tiers */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">🏆 Partner Tiers</h3>
          <p className="text-gray-400 text-center mb-8 text-sm">Unlock higher commission rates as you grow</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🥉', name: 'Bronze', rate: '20%', refs: '1-5 referrals', color: 'from-orange-700 to-red-700' },
              { icon: '🥈', name: 'Silver', rate: '25%', refs: '6-15 referrals', color: 'from-gray-400 to-gray-600' },
              { icon: '🥇', name: 'Gold', rate: '28%', refs: '16-30 referrals', color: 'from-yellow-600 to-orange-600' },
              { icon: '💎', name: 'Platinum', rate: '30%', refs: '31+ referrals', color: 'from-purple-600 to-pink-600' }
            ].map((tier, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${tier.color} rounded-xl p-4 text-center hover:scale-105 transition-transform`}
              >
                <div className="text-3xl mb-2">{tier.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{tier.name}</div>
                <div className="text-white text-xl font-bold mb-1">{tier.rate}</div>
                <div className="text-white/80 text-xs">{tier.refs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Expertise Section
const ExpertiseSection = () => {
  return (
    <section className="relative py-12 md:py-20 bg-gradient-to-b from-blue-950 via-indigo-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Our Expertise
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Proven capabilities across multiple technology domains with cutting-edge solutions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-10">
          {/* Skills Progress */}
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Technical Skills</h3>
            
            <div className="space-y-6">
              {[
                { skill: 'Blockchain Development', percent: 95, color: 'from-blue-500 to-cyan-500' },
                { skill: 'Mobile App Development', percent: 92, color: 'from-purple-500 to-pink-500' },
                { skill: 'AI & Machine Learning', percent: 88, color: 'from-green-500 to-emerald-500' },
                { skill: 'Cloud Architecture', percent: 90, color: 'from-orange-500 to-red-500' }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white text-sm font-medium">{item.skill}</span>
                    <span className="text-blue-400 text-sm font-semibold">{item.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Awards & Certifications</h3>
            
            <div className="space-y-4">
              {[
                { icon: '🏆', title: 'Best Blockchain Development', org: 'Tech Innovation Awards 2023', badge: 'VERIFIED' },
                { icon: '🎖️', title: 'Excellence in AI Solutions', org: 'Digital Excellence Awards 2023', badge: 'CERTIFIED' },
                { icon: '🥇', title: 'Top Mobile App Developer', org: 'Mobile Innovation Awards 2023', badge: 'WINNER' },
                { icon: '🛡️', title: 'ISO 27001 Certified', org: 'Information Security Management', badge: 'ACCREDITED' }
              ].map((award, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <div className="text-2xl">{award.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-white font-semibold text-sm">{award.title}</h4>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        {award.badge}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{award.org}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Alex Thompson',
      role: 'CEO, TechVenture',
      image: '👨‍💼',
      text: 'DigiLinex delivered an outstanding blockchain solution for our business. Their expertise in smart contracts and security is unmatched!'
    },
    {
      name: 'Sarah Johnson',
      role: 'Founder, CryptoStart',
      image: '👩‍💼',
      text: 'Professional team that understands the crypto space. They helped us launch our token successfully with great support.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO, DeFi Protocol',
      image: '👨‍💻',
      text: 'Best investment we made! The smart contract audit was thorough and gave us confidence in our platform security.'
    }
  ];

  return (
    <section id="testimonials" className="relative py-12 md:py-20 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            What Our Clients Say
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Real feedback from our satisfied customers worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">"{testimonial.text}"</p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Office & Compliance Section
const ComplianceSection = () => {
  const compliance = [
    { icon: '📄', title: 'GST Registered', desc: 'Government Tax Registration' },
    { icon: '🏢', title: 'MSME Registered', desc: 'Micro, Small & Medium Enterprise' },
    { icon: '🔒', title: 'NDA Available', desc: 'Non-Disclosure Agreement' },
    { icon: '📋', title: 'Invoice & Contracts', desc: 'Proper Documentation' },
    { icon: '🏆', title: 'Certifications', desc: 'Verified & Trusted' }
  ];

  return (
    <section className="relative py-12 md:py-16 bg-gradient-to-b from-indigo-950 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Office & Compliance
          </h2>
          <p className="text-sm md:text-base text-gray-400">
            Trusted, verified, and compliant with industry standards
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {compliance.map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 text-center hover:border-blue-500/60 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-gray-400 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  return (
    <section id="contact" className="relative py-16 md:py-20 bg-gradient-to-b from-slate-900 to-indigo-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Work with DigiLinex to Scale Your Business
              </h2>
              <p className="text-base md:text-lg text-white/90 mb-8">
                Ready to transform your ideas into digital reality? Let's build something amazing together.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all">
                  Start Your Project
                </button>
                <button className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold border border-white/30 hover:bg-white/30 transition-all">
                  Get Free Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-indigo-950 to-slate-950 border-t border-white/10">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                DL
              </div>
              <span className="text-white font-bold text-lg">DigiLinex</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Transforming ideas into digital reality with blockchain, AI, and cutting-edge technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Services</h3>
            <ul className="space-y-2">
              {['Blockchain', 'Websites', 'Mobile Apps', 'AI Solutions'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
            <ul className="space-y-2">
              {['About Us', 'Portfolio', 'Contact', 'Careers'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Legal</h3>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 DigiLinex. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {['Twitter', 'LinkedIn', 'Telegram', 'Discord'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
export default function ModernHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <ProcessSection />
        <WhyChooseSection />
        <ReferralSection />
        <ExpertiseSection />
        <TestimonialsSection />
        <ComplianceSection />
        <CTASection />
      </main>
      <Footer />
      
      {/* Add animation styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
