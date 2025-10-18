import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useWallet } from '../../hooks/useWallet';
import { useReferral } from '../../hooks/useReferral';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import ServiceRequestModal from '../../components/ServiceRequestModal';

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

export default function DashboardHome() {
  const { user } = useUser();
  const { wallet } = useWallet();
  const { totalEarnings, activeReferrals, tier } = useReferral();
  const navigate = useNavigate();
  const [ordersCount, setOrdersCount] = useState(0);
  const [progress, setProgress] = useState(45); // Mock progress
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const nextRewardDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString();
  })();
  const totalReferrals = activeReferrals || 0;

  // Services data
  const services: Service[] = [
    {
      id: '1',
      name: 'Crypto Token Creation',
      description: 'Launch your own cryptocurrency with smart contracts.',
      startingPrice: '$2,999',
      icon: '🪙',
      gradient: 'from-orange-500 to-yellow-600',
      features: ['Smart Contract Development', 'Token Economics Design', 'Audit & Security'],
      category: 'blockchain'
    },
    {
      id: '2',
      name: 'Website Development',
      description: 'Professional web development services including modern design.',
      startingPrice: '$1,499',
      icon: '🌐',
      gradient: 'from-purple-500 to-indigo-600',
      features: ['Responsive Design', 'SEO Optimization', 'CMS Integration'],
      category: 'web'
    },
    {
      id: '3',
      name: 'Chatbot Development',
      description: 'AI-powered chatbots for customer service, lead generation, and...',
      startingPrice: '$999',
      icon: '💬',
      gradient: 'from-cyan-500 to-teal-600',
      features: ['AI Integration', 'Multi-platform Support', 'Natural Language Processing'],
      category: 'ai'
    },
    {
      id: '4',
      name: 'MLM Plan Development',
      description: 'Complete MLM software with compensation plans.',
      startingPrice: '$3,999',
      icon: '📊',
      gradient: 'from-pink-500 to-rose-600',
      features: ['Compensation Plans', 'Genealogy System', 'E-wallet Integration'],
      category: 'mlm'
    },
    {
      id: '5',
      name: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications.',
      startingPrice: '$4,999',
      icon: '📱',
      gradient: 'from-blue-500 to-indigo-600',
      features: ['Cross-platform Development', 'Native Performance', 'App Store Optimization'],
      category: 'mobile'
    },
    {
      id: '6',
      name: 'Business Automation',
      description: 'Automate your business processes and workflows.',
      startingPrice: '$1,999',
      icon: '⚙️',
      gradient: 'from-emerald-500 to-green-600',
      features: ['Process Automation', 'Workflow Design', 'Integration Services'],
      category: 'automation'
    },
    {
      id: '7',
      name: 'Telegram Bot',
      description: 'Custom Telegram bots with advanced features.',
      startingPrice: '$799',
      icon: '🤖',
      gradient: 'from-sky-500 to-blue-600',
      features: ['Custom Commands', 'API Integration', 'User Management'],
      category: 'bot'
    },
    {
      id: '8',
      name: 'Crypto Audit',
      description: 'Comprehensive smart contract security audits.',
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

  const levelLabel = tier === 1 ? 'Starter' : tier === 2 ? 'Silver' : 'Gold';

  const handleGetService = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    setSelectedService(svc?.name || '');
    setModalOpen(true);
  };

  const handleJoinAffiliate = (serviceId: string) => {
    // Navigate to affiliate registration
    navigate(`/dashboard/affiliate-program?service=${serviceId}`);
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -z-10" />
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome back, {user?.name || 'User'}!
              </span>
            </h1>
            <p className="text-gray-300 text-lg mb-6">Here's what's happening with your DigiLinex account today.</p>
          </div>
        </section>

        {/* Level & Earnings Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Current Level */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-400/20 p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Current Level</div>
                <div className="text-2xl font-bold text-white mb-1">{levelLabel}</div>
                <div className="inline-block px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-medium">
                  Starter
                </div>
                <div className="text-xs text-gray-400 mt-2">Higher level = Higher service commission %</div>
              </div>
            </div>
          </div>

          {/* Total Earnings (DLX) */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-400/20 p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Total Earnings (DLX)</div>
                <div className="text-2xl font-bold text-white mb-1">{wallet?.dlx?.toFixed(2) || '30.00'} DLX</div>
                <div className="text-xs text-gray-400 mt-2">Your mined DLX to date</div>
              </div>
            </div>
          </div>

          {/* Available Wallet */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-400/20 p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <span className="text-2xl">💼</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Available Wallet</div>
                <div className="text-2xl font-bold text-white mb-1">{wallet?.usdt?.toFixed(2) || '30.00'} USDT</div>
                <div className="text-xs text-gray-400 mt-2">₹{wallet?.inr?.toFixed(2) || '80'} INR</div>
                <div className="text-xs text-gray-400">Real-time balances from your wallet</div>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 to-fuchsia-600/10 border border-pink-400/20 p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Level Progress</div>
                <div className="text-2xl font-bold text-white mb-2">{progress}%</div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-600 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">Complete more referrals or sell more services to level up.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Services Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Our Services
              </h2>
              <p className="text-gray-400">Browse our premium services and start earning commissions</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1629] to-[#0a0f1f] border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                {/* Icon Header */}
                <div className="p-6 pb-4">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${service.gradient} shadow-lg mb-4`}>
                    <span className="text-3xl">{service.icon}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all">
                    {service.name}
                  </h3>
                  
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                    {service.startingPrice}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => handleGetService(service.id)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50"
                  >
                    Get Service
                  </button>
                  <button
                    onClick={() => handleJoinAffiliate(service.id)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    Join Affiliate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Referral & Earn Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-red-600/10 border border-purple-400/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-3">Referral & Earn Program</h2>
                <p className="text-gray-300 mb-6">Track your 2-level referrals, service commissions, and daily DLX rewards</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm text-gray-400 mb-1">Active Referrals</div>
                    <div className="text-2xl font-bold text-white">{activeReferrals || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm text-gray-400 mb-1">Total Commissions</div>
                    <div className="text-2xl font-bold text-white">${totalEarnings?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm text-gray-400 mb-1">Daily DLX Rewards</div>
                    <div className="text-2xl font-bold text-white">+2.5 DLX</div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard/referrals')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                >
                  <span>Open Tracking Dashboard</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              <div className="w-full lg:w-auto">
                <img
                  src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop"
                  alt="Referral"
                  className="rounded-2xl shadow-2xl w-full lg:w-80 h-64 object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Affiliate Partner Info Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600/10 via-teal-600/10 to-cyan-600/10 border border-emerald-400/20 p-8">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -z-10" />
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Become an Affiliate Partner</h2>
              <p className="text-gray-300 text-lg">Join our affiliate program and earn up to 30% commission on every sale. Get your unique referral links and start earning today!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">20-30%</div>
                <div className="text-sm text-gray-300">Commission Rate</div>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">$0</div>
                <div className="text-sm text-gray-300">Joining Fee</div>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-sm text-gray-300">Support</div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/dashboard/affiliate-program')}
                className="inline-flex items-center gap-2 w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-base md:text-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50"
              >
                <span>Join Affiliate Program</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
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