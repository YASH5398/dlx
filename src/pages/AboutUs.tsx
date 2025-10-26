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
      id: 'orders',
      icon: ShoppingCartIcon,
      title: 'Orders & Digital Products',
      description: 'Browse, select, and purchase digital products, databases, and services with seamless payment processing.',
      features: [
        '30+ database categories available',
        'WhatsApp Marketing Software with unlimited messages',
        'Custom data ordering with admin review',
        'Real-time order tracking and history',
        'Instant download links after payment',
        'Secure payment via main wallet'
      ]
    },
    {
      id: 'mining',
      icon: CurrencyDollarIcon,
      title: 'Mining & Earnings',
      description: 'Earn DLX tokens through mining activities, referral bonuses, and platform engagement.',
      features: [
        'Real-time mining statistics and tracking',
        'Referral bonus calculations',
        'Earnings displayed in USDT/INR',
        'Automatic reward distribution',
        'Mining growth charts and analytics',
        'Wallet balance impact tracking'
      ]
    },
    {
      id: 'wallet',
      icon: WalletIcon,
      title: 'Main Wallet System',
      description: 'Centralized wallet for all transactions including deposits, payments, and balance management.',
      features: [
        'Real-time balance updates',
        'Transaction history and records',
        'Deposit and withdrawal requests',
        'Payment processing for all services',
        'Multi-currency support (USDT/INR)',
        'Secure transaction verification'
      ]
    },
    {
      id: 'affiliate',
      icon: UserGroupIcon,
      title: 'Affiliate Program',
      description: 'Comprehensive referral system with tracking, rewards, and performance analytics.',
      features: [
        'Personal referral codes and links',
        'Referral tracking dashboard',
        'Commission calculations and payouts',
        'Referral banners and marketing materials',
        'Performance statistics and analytics',
        'Multi-level referral rewards'
      ]
    },
    {
      id: 'rewards',
      icon: GiftIcon,
      title: 'Rewards & Bonuses',
      description: 'Earn reward points through various activities and redeem them for platform benefits.',
      features: [
        'Points from referrals and purchases',
        'Campaign bonuses and promotions',
        'Reward redemption system',
        'Bonus tracking and history',
        'Special achievement rewards',
        'Loyalty program benefits'
      ]
    },
    {
      id: 'database',
      icon: ChartBarIcon,
      title: 'Database & Marketing Tools',
      description: 'Access to premium databases and marketing software for business growth.',
      features: [
        '30+ specialized database categories',
        'WhatsApp Marketing Software (unlimited messages)',
        'Telegram and Facebook tools (coming soon)',
        'Custom data ordering service',
        'Admin review and approval system',
        'Color-coded status tracking'
      ]
    },
    {
      id: 'support',
      icon: LifebuoyIcon,
      title: 'Support & Help',
      description: 'Comprehensive support system with multiple channels for user assistance.',
      features: [
        'Live chat support system',
        'Ticket-based support requests',
        'FAQ and knowledge base',
        'Quick response times',
        'Multi-language support',
        '24/7 customer service'
      ]
    },
    {
      id: 'settings',
      icon: Cog6ToothIcon,
      title: 'Settings & Profile',
      description: 'Complete user profile management and platform customization options.',
      features: [
        'Profile information management',
        'Password and security settings',
        'Wallet information display',
        'Notification preferences',
        'Privacy and data settings',
        'Account verification status'
      ]
    }
  ];

  const orderFlow = [
    {
      step: 1,
      title: 'Browse Products',
      description: 'Explore our extensive catalog of digital products, databases, and marketing software.',
      icon: ComputerDesktopIcon
    },
    {
      step: 2,
      title: 'Select Package',
      description: 'Choose the perfect package that fits your needs and budget requirements.',
      icon: CheckCircleIcon
    },
    {
      step: 3,
      title: 'Pay via Wallet',
      description: 'Complete your purchase using your main wallet balance with secure processing.',
      icon: CreditCardIcon
    },
    {
      step: 4,
      title: 'Get Access',
      description: 'Receive instant download links and access to your purchased products.',
      icon: CloudArrowDownIcon
    }
  ];

  const workWithUsFlow = [
    {
      step: 1,
      title: 'Submit Application',
      description: 'Fill out our comprehensive 30+ field application form with your details.',
      icon: DocumentTextIcon
    },
    {
      step: 2,
      title: 'Admin Review',
      description: 'Our team reviews your application and credentials thoroughly.',
      icon: ShieldCheckIcon
    },
    {
      step: 3,
      title: 'Pay Trust Fee',
      description: 'Complete the $12 trust fee payment to proceed with verification.',
      icon: CurrencyDollarIcon
    },
    {
      step: 4,
      title: 'Get Verified',
      description: 'Provide WhatsApp and Telegram details for final verification and onboarding.',
      icon: CheckBadgeIcon
    }
  ];

  const stats = [
    { value: '30+', label: 'Database Categories', icon: ChartBarIcon, color: 'blue' },
    { value: 'Unlimited', label: 'WhatsApp Messages', icon: ChatBubbleLeftRightIcon, color: 'green' },
    { value: '200', label: 'Free Contacts', icon: UserIcon, color: 'purple' },
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
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your comprehensive digital ecosystem for databases, marketing tools, mining rewards, 
              and affiliate programs. Experience the future of digital business solutions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-blue-300 font-semibold">🚀 All-in-One Platform</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-green-300 font-semibold">💰 Earn While You Learn</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl backdrop-blur-sm">
                <span className="text-purple-300 font-semibold">🔒 Secure & Reliable</span>
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
              Platform Features
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Discover all the powerful features that make DigiLinex the ultimate digital business platform
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

      {/* Order Flow Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              How Orders Work
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Simple 4-step process to get your digital products and services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {orderFlow.map((step, index) => (
            <div key={index} className="relative">
              <FlowStep {...step} />
              {index < orderFlow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRightIcon className="h-6 w-6 text-blue-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work With Us Flow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Join Our Team
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Become part of our developer and freelancer network
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workWithUsFlow.map((step, index) => (
            <div key={index} className="relative">
              <FlowStep {...step} />
              {index < workWithUsFlow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRightIcon className="h-6 w-6 text-purple-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Database & Marketing Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Database & Marketing Solutions
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Comprehensive tools for your business growth and marketing needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Buy Database */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <ChartBarIcon className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">Buy Database</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>30+ specialized database categories</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Flexible package options and pricing</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Instant download after payment</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Complete order history tracking</span>
              </li>
            </ul>
          </div>

          {/* Marketing Software */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-green-500/20">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">Marketing Software</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>WhatsApp Marketing (unlimited messages)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>200 free contacts included</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Telegram & Facebook (coming soon)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Advanced campaign management</span>
              </li>
            </ul>
          </div>

          {/* Order Data */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <DocumentTextIcon className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">Order Data</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Custom data requests</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Admin review and approval</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Color-coded status tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Flexible pricing options</span>
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
              Ready to Get Started?
            </span>
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already growing their business with DigiLinex
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              Start Your Journey
            </button>
            <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
