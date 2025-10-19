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
      description: 'Professional web development services including modern responsive websites and web...',
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
      <div className="relative min-h-screen w-full bg-gradient-to-br from-[#091B4D] via-[#0B235F] to-[#08163C]">
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
          
          {/* Welcome Header Section */}
          <div className="text-center space-y-1 sm:space-y-2 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              <span className="text-cyan-400">Welcome back, </span>
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                {user?.name?.split(' ')[0] || 'sourav'}
              </span>
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                {user?.name?.split(' ').slice(1).join(' ') || 'kumar verma'}!
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base">
              Here's what's happening with your <span className="font-semibold">Digilinex</span> account today.
            </p>
          </div>

          {/* Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            
            {/* Current Level Card */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1429] to-[#0a0e1f] border border-blue-500/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
              <div className="relative p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl">⭐</span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs sm:text-sm">Current Level</p>
                      <p className="text-sm sm:text-base text-slate-300">Higher level = higher service commission %</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm sm:text-base font-bold shadow-lg">
                    {levelLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Earnings Card */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1429] to-[#0a0e1f] border border-cyan-500/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5"></div>
              <div className="relative p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl sm:text-2xl">💎</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Total Earnings (DLX)</p>
                    <p className="text-xs sm:text-sm text-slate-300">Your mined DLX to date</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    {wallet?.dlx?.toFixed(2) || '30.00'} DLX
                  </p>
                </div>
              </div>
            </div>

            {/* Available Wallet Card */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1429] to-[#0a0e1f] border border-pink-500/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5"></div>
              <div className="relative p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl sm:text-2xl">💼</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Available Wallet</p>
                    <p className="text-xs sm:text-sm text-slate-300">Real-time balances from your wallet</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 space-y-1">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                    ${wallet?.usdt?.toFixed(2) || '30.00'} USDT
                  </p>
                  <p className="text-lg sm:text-xl text-slate-400">
                    ₹{wallet?.inr?.toFixed(2) || '2,500'} INR
                  </p>
                </div>
              </div>
            </div>

          {/* Level Progress Card */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1429] to-[#0a0e1f] border border-blue-500/20 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl">📈</span>
                </div>
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Level Progress</p>
                  <p className="text-xs sm:text-sm text-slate-300">Complete more referrals or sell more services to level up.</p>
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="h-2.5 sm:h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 sm:mt-3">
                  <p className="text-slate-400 text-xs sm:text-sm">Progress to next level</p>
                  <p className="text-right text-slate-300 text-xs sm:text-sm">{progress.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          </div>

          {/* Affiliate Program CTA */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1429] to-[#0a0e1f] border border-green-500/20 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5"></div>
            <div className="relative p-4 sm:p-5 lg:p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Affiliate Program</h3>
                <p className="text-sm text-slate-300">Refer users and earn commissions on successful conversions.</p>
              </div>
              <button
                onClick={() => navigate('/affiliate-program')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm sm:text-base font-bold shadow-lg transition-all duration-200"
              >
                Join as Affiliate
              </button>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4 sm:space-y-5 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Our Services</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Browse and request services</p>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-64 lg:w-80">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Services Grid - Card Style from Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0f1535] border-2 border-[#1e2d5f] shadow-2xl hover:border-cyan-500/30 transition-all duration-300"
                >
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Service Content */}
                  <div className="relative p-5 sm:p-6 space-y-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-3xl sm:text-4xl shadow-lg`}>
                      {service.icon}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 min-h-[3.75rem]">
                      {service.description}
                    </p>

                    {/* Price */}
                    <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                      Starting at {service.startingPrice}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {(service.features ?? []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-slate-300 leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="relative px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                    <button
                      onClick={() => handleGetService(service.id)}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm sm:text-base font-bold shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    >
                      Get Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {selectedService && (
        <ServiceRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          serviceName={selectedService}
        />
      )}
    </>
  );
}