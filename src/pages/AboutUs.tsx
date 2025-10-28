import React, { useState } from 'react';
import { 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  WalletIcon, 
  UserGroupIcon, 
  GiftIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  LifebuoyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  CreditCardIcon,
  CloudArrowDownIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  features, 
  isExpanded, 
  onToggle 
}: { 
  icon: React.ComponentType<any>; 
  title: string; 
  description: string; 
  features: string[]; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) => (
  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-[1.02]">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
          <Icon className="h-6 w-6 text-blue-300" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110"
      >
        <ArrowRightIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
    </div>
    
    {isExpanded && (
      <div className="mt-4 space-y-3 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-200">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const FlowStep = ({ 
  step, 
  title, 
  description, 
  icon: Icon 
}: { 
  step: number; 
  title: string; 
  description: string; 
  icon: React.ComponentType<any>; 
}) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/20 hover:shadow-lg transition-all duration-300">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
        {step}
      </div>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-blue-300" />
        <h4 className="text-lg font-semibold text-white">{title}</h4>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

const StatCard = ({ 
  value, 
  label, 
  icon: Icon, 
  color = "blue" 
}: { 
  value: string; 
  label: string; 
  icon: React.ComponentType<any>; 
  color?: string; 
}) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-400/30 text-blue-300",
    green: "from-green-500/20 to-green-600/20 border-green-400/30 text-green-300",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-400/30 text-purple-300",
    orange: "from-orange-500/20 to-orange-600/20 border-orange-400/30 text-orange-300"
  };
  
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-8 w-8" />
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <p className="text-sm font-medium opacity-90">{label}</p>
    </div>
  );
};

export default function AboutUs() {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const features = [
    {
      id: 'signup',
      icon: UserIcon,
      title: 'User Registration & Onboarding',
      description: 'Simple and secure registration process with multiple signup options and instant account activation.',
      features: [
        'Phone number and email verification',
        'Google OAuth integration for quick signup',
        'Referral code integration during registration',
        'Automatic wallet creation (Main, Purchase, Mining)',
        'Profile setup with rank-based commission rates',
        'Instant access to all platform features'
      ]
    },
    {
      id: 'wallets',
      icon: WalletIcon,
      title: 'Multi-Wallet System',
      description: 'Three specialized wallets for different purposes with real-time balance tracking and seamless transfers.',
      features: [
        'Main Wallet: Primary balance for all transactions',
        'Purchase Wallet: Dedicated for product purchases',
        'Mining Wallet: Earns DLX tokens through mining activities',
        'Real-time balance updates across all wallets',
        'Multi-currency support (USDT/INR)',
        'Secure deposit and withdrawal processing'
      ]
    },
    {
      id: 'affiliate',
      icon: UserGroupIcon,
      title: 'Advanced Affiliate Program',
      description: 'Comprehensive referral system with real-time tracking, commission calculations, and performance analytics.',
      features: [
        'Personal referral codes and custom links',
        'Real-time tracking dashboard (impressions, clicks, joins)',
        'Rank-based commission rates (20% to 45%)',
        '2-level referral system with automatic payouts',
        'Referral link management with cooldown periods',
        'Detailed analytics and conversion tracking'
      ]
    },
    {
      id: 'databases',
      icon: ChartBarIcon,
      title: 'Database & Marketing Solutions',
      description: 'Access to 30+ specialized database categories and advanced marketing tools for business growth.',
      features: [
        '30+ database categories (leads, contacts, business data)',
        'WhatsApp Marketing Software with unlimited messages',
        'Custom data ordering with admin review system',
        'Instant download after payment confirmation',
        'Color-coded order status tracking',
        'Bulk data export and management tools'
      ]
    },
    {
      id: 'digital-products',
      icon: ShoppingCartIcon,
      title: 'Digital Products Store',
      description: 'Comprehensive marketplace for digital products with flexible payment options and instant delivery.',
      features: [
        'Wide range of digital products and tools',
        'Flexible payment options (Main wallet, split payments)',
        'Currency choice (USDT/INR) with live conversion',
        'Real-time balance validation before purchase',
        'Instant product delivery after payment',
        'Order history and download management'
      ]
    },
    {
      id: 'mining',
      icon: CurrencyDollarIcon,
      title: 'Mining & Earning System',
      description: 'Earn DLX tokens through mining activities, referral bonuses, and platform engagement with real-time tracking.',
      features: [
        'Real-time mining statistics and progress tracking',
        'Automatic DLX token generation',
        'Referral bonus calculations and payouts',
        'Mining wallet balance management',
        'Earnings displayed in multiple currencies',
        'Performance analytics and growth charts'
      ]
    },
    {
      id: 'withdrawals',
      icon: CreditCardIcon,
      title: 'Withdrawal & Payout System',
      description: 'Secure withdrawal system with multiple payment methods and real-time processing status.',
      features: [
        'Multiple withdrawal methods (Bank, UPI, Crypto)',
        'Real-time withdrawal request tracking',
        'Admin approval and processing system',
        'Transaction history and status updates',
        'Minimum withdrawal limits and processing fees',
        'Secure verification and fraud prevention'
      ]
    },
    {
      id: 'support',
      icon: LifebuoyIcon,
      title: '24/7 Support System',
      description: 'Comprehensive support system with multiple channels for user assistance and platform guidance.',
      features: [
        'Live chat support with instant responses',
        'Ticket-based support for complex issues',
        'FAQ and comprehensive knowledge base',
        'Video tutorials and step-by-step guides',
        'Multi-language support options',
        'Priority support for premium users'
      ]
    }
  ];

  const userJourney = [
    {
      step: 1,
      title: 'Sign Up & Get Started',
      description: 'Register with phone/email or Google OAuth, get your referral code, and access three specialized wallets.',
      icon: UserIcon
    },
    {
      step: 2,
      title: 'Fund Your Wallets',
      description: 'Deposit USDT/INR into your Main, Purchase, and Mining wallets to start using the platform.',
      icon: WalletIcon
    },
    {
      step: 3,
      title: 'Explore & Purchase',
      description: 'Browse 30+ database categories, digital products, and marketing tools with flexible payment options.',
      icon: ShoppingCartIcon
    },
    {
      step: 4,
      title: 'Earn & Refer',
      description: 'Earn through mining, referrals, and affiliate commissions while building your digital business.',
      icon: CurrencyDollarIcon
    },
    {
      step: 5,
      title: 'Withdraw & Grow',
      description: 'Withdraw your earnings through multiple payment methods and scale your business operations.',
      icon: CloudArrowDownIcon
    }
  ];

  const affiliateFlow = [
    {
      step: 1,
      title: 'Join Affiliate Program',
      description: 'Apply to become an affiliate partner and get your personalized referral code and tracking dashboard.',
      icon: UserGroupIcon
    },
    {
      step: 2,
      title: 'Auto-Approval Process',
      description: 'Get automatically approved within 30 minutes and start earning commissions immediately.',
      icon: ClockIcon
    },
    {
      step: 3,
      title: 'Share & Track',
      description: 'Share your referral links, track impressions, clicks, and conversions in real-time.',
      icon: ChartBarIcon
    },
    {
      step: 4,
      title: 'Earn Commissions',
      description: 'Earn 20-45% commissions based on your rank through 2-level referral system.',
      icon: CurrencyDollarIcon
    }
  ];

  const stats = [
    { value: '30+', label: 'Database Categories', icon: ChartBarIcon, color: 'blue' },
    { value: '3', label: 'Wallet Types', icon: WalletIcon, color: 'green' },
    { value: '45%', label: 'Max Commission Rate', icon: CurrencyDollarIcon, color: 'purple' },
    { value: '24/7', label: 'Support Available', icon: LifebuoyIcon, color: 'orange' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <span className="text-white font-bold text-2xl">D</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DigiLinex Platform
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              The ultimate digital ecosystem that empowers users to grow their business through comprehensive 
              database access, advanced marketing tools, multi-wallet systems, and lucrative affiliate programs. 
              Join thousands of entrepreneurs who are building their digital empire with DigiLinex.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-blue-300 font-semibold">🚀 Complete Digital Ecosystem</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-green-300 font-semibold">💰 Multi-Wallet Earning System</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-purple-300 font-semibold">🔗 Advanced Affiliate Program</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-orange-300 font-semibold">📊 30+ Database Categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Complete Platform Overview
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            DigiLinex is a comprehensive digital ecosystem that combines database access, marketing tools, 
            multi-wallet systems, and affiliate programs to help users build and scale their digital businesses. 
            From registration to earning and withdrawal, every aspect is designed for maximum growth and profitability.
          </p>
        </div>
        
        <div className="space-y-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              features={feature.features}
              isExpanded={expandedSections[feature.id] || false}
              onToggle={() => toggleSection(feature.id)}
            />
          ))}
        </div>
      </div>

      {/* User Journey Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Your DigiLinex Journey
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            From registration to earning and withdrawal, follow this complete journey to maximize your success 
            on the DigiLinex platform. Each step is designed to help you grow your digital business and earnings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {userJourney.map((step, index) => (
            <div key={index} className="relative">
              <FlowStep {...step} />
              {index < userJourney.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRightIcon className="h-6 w-6 text-blue-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate Program Flow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Affiliate Program
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Join our advanced affiliate program and start earning 20-45% commissions through our 2-level referral system. 
            Track your performance in real-time and build a sustainable income stream.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {affiliateFlow.map((step, index) => (
            <div key={index} className="relative">
              <FlowStep {...step} />
              {index < affiliateFlow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRightIcon className="h-6 w-6 text-purple-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wallet System & Earning Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Multi-Wallet System & Earning
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            DigiLinex features a sophisticated 3-wallet system that maximizes your earning potential and 
            provides flexible payment options for all your digital business needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Wallet */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <WalletIcon className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">Main Wallet</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Primary balance for all transactions</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Deposit and withdrawal processing</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Multi-currency support (USDT/INR)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Real-time balance updates</span>
              </li>
            </ul>
          </div>

          {/* Purchase Wallet */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-green-500/20">
                <ShoppingCartIcon className="h-8 w-8 text-green-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">Purchase Wallet</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Dedicated for product purchases</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Split payment options (50/50)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Digital products and databases</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Marketing software purchases</span>
              </li>
            </ul>
          </div>

          {/* Mining Wallet */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">Mining Wallet</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Earns DLX tokens automatically</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Referral bonus accumulation</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Real-time mining statistics</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Performance analytics tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Support & Contact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Get Support
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            We're here to help you succeed with multiple support channels
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Live Chat</h3>
            <p className="text-gray-300">Get instant help with our live chat support system</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <DocumentTextIcon className="h-8 w-8 text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Support Tickets</h3>
            <p className="text-gray-300">Submit detailed requests for complex issues</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <LifebuoyIcon className="h-8 w-8 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">FAQ & Help</h3>
            <p className="text-gray-300">Browse our comprehensive knowledge base</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/20 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ready to Build Your Digital Empire?
            </span>
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
            Join thousands of entrepreneurs who are already earning through DigiLinex's comprehensive ecosystem. 
            From database access to affiliate commissions, mining rewards to marketing tools - everything you need 
            to grow your digital business is right here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              Start Earning Today
            </button>
            <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              Explore Features
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
