import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleStackIcon, ChartBarIcon, ShoppingCartIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function DatabaseMarketing() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const features = [
    {
      id: 'buy-database',
      title: 'Buy Database',
      description: 'Purchase high-quality contact databases for your business needs',
      icon: CircleStackIcon,
      path: '/database-marketing/categories',
      gradient: 'from-blue-500 to-cyan-500',
      features: ['30+ Categories', 'Fresh 2025 Data', 'Email Lists', 'Phone Numbers', 'CSV/Excel Download']
    },
    {
      id: 'marketing-software',
      title: 'Marketing Software',
      description: 'Powerful campaign tools for WhatsApp, SMS, and Email marketing',
      icon: ChartBarIcon,
      path: '/database-marketing/marketing-software',
      gradient: 'from-purple-500 to-pink-500',
      features: ['WhatsApp Campaigns', 'SMS Marketing', 'Email Automation', 'Analytics Dashboard']
    },
    {
      id: 'order-data',
      title: 'Order Data',
      description: 'View and manage your purchased databases and software subscriptions',
      icon: ShoppingCartIcon,
      path: '/database-marketing/order-data',
      gradient: 'from-green-500 to-emerald-500',
      features: ['Order History', 'Download Links', 'Subscription Status', 'Renewal Options']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Database & Marketing
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Boost your business with our comprehensive database and marketing solutions. 
            Purchase quality contacts, run powerful campaigns, and track your success.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                hoveredCard === feature.id ? 'shadow-2xl shadow-blue-500/25' : ''
              }`}
              onMouseEnter={() => setHoveredCard(feature.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(feature.path)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`relative mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                <feature.icon className="w-8 h-8 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-8">
                  {feature.features.map((item, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 font-semibold group-hover:text-blue-300 transition-colors duration-300">
                    Get Started
                  </span>
                  <ArrowRightIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">10K+</div>
            <div className="text-gray-400">Contacts Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">99%</div>
            <div className="text-gray-400">Delivery Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
            <div className="text-gray-400">Support Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
