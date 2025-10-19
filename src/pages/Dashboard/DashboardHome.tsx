import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useWallet } from '../../hooks/useWallet';
import { useReferral } from '../../hooks/useReferral';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import ServiceRequestModal from '../../components/ServiceRequestModal';
import { getServices, subscribeServices } from '../../utils/services';
import type { ServiceItem } from '../../utils/services';
import { restoreDefaultServiceForms } from '../../utils/services';
import { DEFAULT_SERVICE_FORMS } from '../../utils/serviceFormDefaults';

// Service interface
interface Service {
  id: string;
  name: string;
  description: string;
  startingPrice: string;
  icon: string;
  gradient: string;
  features: string[];
  category: string;
}

interface StaticService {
  id: string;
  name: string;
  description: string;
  startingPrice: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
  category: string;
}

export default function DashboardHome() {
  const { user } = useUser();
  const { wallet } = useWallet();
  const { totalEarnings, activeReferrals, tier } = useReferral();
  const navigate = useNavigate();
  const [ordersCount, setOrdersCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Load services with backend subscription and fallback to static list
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const load = async () => {
      try {
        const list = await getServices();
        if (list && list.length) {
          setServices(list);
        } else {
          setServices(
            staticServices.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              startingPrice: s.startingPrice,
              icon: String(s.icon),
              gradient: s.gradient,
              features: s.features,
              category: s.category,
            }))
          );
        }
        // Restore missing service form configs (idempotent)
        await restoreDefaultServiceForms(DEFAULT_SERVICE_FORMS);
      } catch {}
      unsub = subscribeServices((items) => {
        if (items && items.length) setServices(items);
      });
    };
    load();
    return () => { if (unsub) unsub(); };
  }, []);

  // Fallback static list (used if backend is empty)
  const staticServices: StaticService[] = [
    {
      id: '1',
      name: 'Crypto Token Creation',
      description: 'Launch your own cryptocurrency with smart contracts, custom tokenomics, and secure blockchain integration.',
      startingPrice: '$2,999',
      icon: '🪙',
      gradient: 'from-orange-500 to-yellow-600',
      features: ['Smart Contract Development', 'Token Economics Design', 'Audit & Security'],
      category: 'blockchain'
    },
    {
      id: '2',
      name: 'Website Development',
      description: 'Professional web development services including modern responsive websites and web applications with cutting-edge technologies.',
      startingPrice: '$1,499',
      icon: '🌐',
      gradient: 'from-purple-500 to-indigo-600',
      features: ['Responsive Design', 'SEO Optimization', 'CMS Integration'],
      category: 'web'
    },
    {
      id: '3',
      name: 'Chatbot Development',
      description: 'AI-powered chatbots for customer service, lead generation, and automated support systems.',
      startingPrice: '$999',
      icon: '💬',
      gradient: 'from-cyan-500 to-teal-600',
      features: ['AI Integration', 'Multi-platform Support', 'Natural Language Processing'],
      category: 'ai'
    },
    {
      id: '4',
      name: 'MLM Plan Development',
      description: 'Complete MLM software with multiple compensation plans, genealogy tree, and commission tracking.',
      startingPrice: '$3,999',
      icon: '📊',
      gradient: 'from-pink-500 to-rose-600',
      features: ['Compensation Plans', 'Genealogy System', 'E-wallet Integration'],
      category: 'mlm'
    },
    {
      id: '5',
      name: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications with modern UI/UX and high performance.',
      startingPrice: '$4,999',
      icon: '📱',
      gradient: 'from-blue-500 to-indigo-600',
      features: ['Cross-platform Development', 'Native Performance', 'App Store Optimization'],
      category: 'mobile'
    },
    {
      id: '6',
      name: 'Business Automation',
      description: 'Automate your business processes and workflows with custom integration and smart automation.',
      startingPrice: '$1,999',
      icon: '⚙️',
      gradient: 'from-emerald-500 to-green-600',
      features: ['Process Automation', 'Workflow Design', 'Integration Services'],
      category: 'automation'
    },
    {
      id: '7',
      name: 'Telegram Bot',
      description: 'Custom Telegram bots with advanced features, payment integration, and user management.',
      startingPrice: '$799',
      icon: '🤖',
      gradient: 'from-sky-500 to-blue-600',
      features: ['Custom Commands', 'API Integration', 'User Management'],
      category: 'bot'
    },
    {
      id: '8',
      name: 'Crypto Audit',
      description: 'Comprehensive smart contract security audits with vulnerability assessment and detailed reports.',
      startingPrice: '$2,499',
      icon: '🔍',
      gradient: 'from-red-500 to-orange-600',
      features: ['Smart Contract Audit', 'Security Assessment', 'Vulnerability Testing'],
      category: 'security'
    }
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(db, `users/${user.id}/orders`);
    const unsub = onValue(ordersRef, (snap) => {
      const val = snap.val() || {};
      setOrdersCount(Object.keys(val).length);
    });
    return () => unsub();
  }, [user?.id]);

  // Compute progress towards next level based on referrals and orders
  useEffect(() => {
    const r = activeReferrals || 0;
    const o = ordersCount || 0;

    // Targets vary by tier: Starter -> Silver, Silver -> Gold
    const targets = tier === 1
      ? { referrals: 5, orders: 5 }
      : tier === 2
      ? { referrals: 20, orders: 30 }
      : { referrals: 0, orders: 0 };

    if (tier >= 3) {
      setProgress(100);
      return;
    }

    const rPct = targets.referrals > 0 ? Math.min(1, r / targets.referrals) : 0;
    const oPct = targets.orders > 0 ? Math.min(1, o / targets.orders) : 0;
    const pct = Math.min(100, ((rPct + oPct) / 2) * 100);
    setProgress(Number(pct.toFixed(1)));
  }, [activeReferrals, ordersCount, tier]);

  const levelLabel = tier === 1 ? 'Starter' : tier === 2 ? 'Silver' : 'Gold';

  const handleGetService = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    setSelectedService(svc?.name || '');
    setModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          
          {/* Welcome Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  <span className="text-slate-200">Welcome back, </span>
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {user?.name || 'User'}
                  </span>
                  <span className="inline-block ml-2">👋</span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg">
                  Here's your <span className="font-semibold text-cyan-400">Digilinex</span> dashboard overview
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-slate-800/60 backdrop-blur-sm shadow-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-0.5">Tier Level</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {levelLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            
            {/* DLX Earnings Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-cyan-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-cyan-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    DLX
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Total Earnings</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {wallet?.dlx?.toFixed(2) || '30.00'}
                </p>
                <p className="text-xs text-slate-500 mt-2">DLX Tokens Mined</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            </div>

            {/* USDT Balance Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-emerald-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-emerald-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <span className="text-2xl">💵</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    USDT
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">USDT Balance</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  ${wallet?.usdt?.toFixed(2) || '30.00'}
                </p>
                <p className="text-xs text-slate-500 mt-2">Available in Wallet</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            </div>

            {/* INR Balance Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-orange-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-orange-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/50">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold">
                    INR
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">INR Balance</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  ₹{wallet?.inr?.toFixed(2) || '2,500'}
                </p>
                <p className="text-xs text-slate-500 mt-2">Available in Wallet</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-600"></div>
            </div>

            {/* Active Referrals Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-purple-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-purple-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                    Live
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Active Referrals</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {activeReferrals || 0}
                </p>
                <p className="text-xs text-slate-500 mt-2">Total Referrals</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            </div>
          </div>

          {/* Level Progress Card */}
          <div className="mb-8">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">Level Progress</h3>
                    <p className="text-sm text-slate-400">
                      Complete more referrals or sell services to level up
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {progress.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">Progress</p>
                </div>
              </div>
              <div className="relative">
                <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-lg shadow-indigo-500/50"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Affiliate Partner CTA */}
          <div className="mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl border border-emerald-500/50">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)] animate-pulse"></div>
              </div>
              
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                  
                  {/* Icon Section */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <span className="text-5xl sm:text-6xl">🤝</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                      Become an Affiliate Partner
                    </h2>
                    <div className="space-y-2 mb-4">
                      <p className="text-white/95 text-base sm:text-lg font-medium">
                        🎯 Earn <span className="font-bold text-yellow-300">30-40% commission</span> on each sale!
                      </p>
                      <p className="text-white/90 text-sm sm:text-base">
                        💰 Sell digital services worth <span className="font-semibold">$400/month</span> (just 3 clients)
                      </p>
                      <p className="text-white/90 text-sm sm:text-base">
                        💵 Easily make <span className="font-bold text-yellow-300">$400-$500 monthly</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">✅</span>
                        <span className="text-white text-sm font-medium">High Commission</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">⚡</span>
                        <span className="text-white text-sm font-medium">Fast Payouts</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">🎁</span>
                        <span className="text-white text-sm font-medium">Bonus Rewards</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => navigate('/affiliate-program')}
                      className="group relative px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Join Now
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    </button>
                  </div>

                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Services Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-200 mb-1">
                  Our Services
                </h2>
                <p className="text-slate-400 text-sm sm:text-base">
                  Browse and request premium digital services
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 hover:-translate-y-1"
                >
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-6">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {service.icon}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 text-xs font-semibold bg-slate-700/60 backdrop-blur-sm text-slate-300 rounded-full border border-slate-600/50">
                        {service.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-200 mb-2 leading-tight">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Price */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Starting at</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
                        {service.startingPrice}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {(service.features ?? []).slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleGetService(service.id)}
                      className={`w-full py-3 rounded-xl bg-gradient-to-r ${service.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95`}
                    >
                      Get Service
                    </button>
                  </div>

                  {/* Bottom Accent Line */}
                  <div className={`h-1 bg-gradient-to-r ${service.gradient}`}></div>
                </div>
              ))}
            </div>

            {/* No Results Message */}
            {filteredServices.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
                  <span className="text-5xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  No services found
                </h3>
                <p className="text-slate-400">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Service Request Modal */}
      {selectedService && (
        <ServiceRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          serviceName={selectedService}
        />
      )}

      {/* Add custom animation keyframes to your global CSS or Tailwind config */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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
    </>
  );
}
