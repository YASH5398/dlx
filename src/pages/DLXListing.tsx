import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  RocketLaunchIcon,
  DocumentTextIcon,
  ShareIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  FireIcon,
  TrophyIcon,
  StarIcon
} from '@heroicons/react/24/outline';

// Enhanced Countdown Timer Component with Animations
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 230,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days, color: 'from-blue-500 to-cyan-500' },
    { label: 'Hours', value: timeLeft.hours, color: 'from-purple-500 to-pink-500' },
    { label: 'Minutes', value: timeLeft.minutes, color: 'from-green-500 to-emerald-500' },
    { label: 'Seconds', value: timeLeft.seconds, color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl animate-pulse" />
      <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <ClockIcon className="h-8 w-8 text-blue-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DLX Token Launch Countdown
            </h2>
          </div>
          <p className="text-gray-300 text-lg">
            DLX Token listing coming soon! Stay tuned for official launch and staking updates.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {timeUnits.map((unit, index) => (
            <div key={unit.label} className="text-center group">
              <div className={`relative overflow-hidden bg-gradient-to-br ${unit.color} opacity-20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500`} />
              <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl group-hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <div className={`text-4xl md:text-5xl font-bold text-white mb-3 transition-all duration-500 ${
                  isVisible ? 'animate-bounce' : 'opacity-0'
                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                  {unit.value.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-300 font-medium">{unit.label}</div>
                <div className="mt-2 h-1 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${unit.color} rounded-full transition-all duration-1000`} 
                       style={{ width: unit.label === 'Days' ? '100%' : unit.label === 'Hours' ? '75%' : unit.label === 'Minutes' ? '50%' : '25%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Token Overview Cards with Glassmorphism
const TokenOverview = () => {
  const tokenStats = [
    {
      icon: CurrencyDollarIcon,
      title: 'Token Name',
      value: 'DLX (Digi Linex Token)',
      color: 'from-blue-500 to-cyan-500',
      description: 'Official token symbol'
    },
    {
      icon: ChartBarIcon,
      title: 'Listing Price',
      value: '$0.20',
      color: 'from-green-500 to-emerald-500',
      description: 'Initial listing price'
    },
    {
      icon: FireIcon,
      title: 'Total Supply',
      value: '20,000,000 DLX',
      color: 'from-orange-500 to-red-500',
      description: 'Maximum token supply'
    },
    {
      icon: TrophyIcon,
      title: 'Circulating Supply',
      value: '5,000,000 DLX',
      color: 'from-purple-500 to-pink-500',
      description: 'Currently in circulation'
    },
    {
      icon: GlobeAltIcon,
      title: 'Blockchain Network',
      value: 'Binance Smart Chain',
      color: 'from-yellow-500 to-orange-500',
      description: 'Deployed blockchain'
    },
    {
      icon: CodeBracketIcon,
      title: 'Decimals',
      value: '18',
      color: 'from-indigo-500 to-blue-500',
      description: 'Token decimal places'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Token Overview
        </h2>
        <p className="text-gray-300 text-lg">Key details about the DLX Token</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tokenStats.map((stat, index) => (
          <div key={index} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500`} />
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl group-hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:border-white/30">
              {/* Glassmorphism effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{stat.title}</h3>
                    <p className="text-xs text-gray-400">{stat.description}</p>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {stat.value}
                </div>
                
                {/* Animated progress bar */}
                <div className="h-2 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out group-hover:animate-pulse`} 
                       style={{ width: '100%' }} />
                </div>
                
                {/* Glowing effect on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Tokenomics Section with Proper Pie Chart
const Tokenomics = () => {
  const tokenomicsData = [
    { name: 'Public Sale', percentage: 40, color: 'from-blue-500 to-cyan-500', description: 'Public token sale allocation' },
    { name: 'Team & Advisors', percentage: 15, color: 'from-purple-500 to-pink-500', description: 'Team and advisor allocation' },
    { name: 'Marketing & Partnerships', percentage: 10, color: 'from-green-500 to-emerald-500', description: 'Marketing and partnership funds' },
    { name: 'Staking Rewards', percentage: 20, color: 'from-orange-500 to-red-500', description: 'Staking rewards pool' },
    { name: 'Reserve & Liquidity', percentage: 10, color: 'from-yellow-500 to-orange-500', description: 'Reserve and liquidity pool' },
    { name: 'Development', percentage: 5, color: 'from-indigo-500 to-blue-500', description: 'Development and maintenance' }
  ];

  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  // Calculate cumulative percentages for pie chart
  let cumulativePercentage = 0;
  const segments = tokenomicsData.map((item, index) => {
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
    cumulativePercentage += item.percentage;
    
    return {
      ...item,
      startAngle,
      endAngle,
      index
    };
  });

  const PieChart = () => {
    const radius = 80;
    const centerX = 120;
    const centerY = 120;

    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg width="240" height="240" className="transform -rotate-90">
          {segments.map((segment, index) => {
            const startAngle = segment.startAngle;
            const endAngle = segment.endAngle;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = segment.percentage > 50 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={index}
                d={pathData}
                fill={`url(#gradient-${index})`}
                className={`transition-all duration-500 hover:scale-105 cursor-pointer ${
                  hoveredSegment === index ? 'drop-shadow-2xl' : ''
                }`}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  filter: hoveredSegment === index ? 'brightness(1.2)' : 'brightness(1)',
                  transformOrigin: `${centerX}px ${centerY}px`
                }}
              />
            );
          })}
        </svg>
        
        {/* Gradient definitions */}
        <defs>
          {segments.map((segment, index) => (
            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={segment.color.includes('blue') ? '#3b82f6' : 
                                        segment.color.includes('purple') ? '#8b5cf6' :
                                        segment.color.includes('green') ? '#10b981' :
                                        segment.color.includes('orange') ? '#f97316' :
                                        segment.color.includes('yellow') ? '#eab308' : '#6366f1'} />
              <stop offset="100%" stopColor={segment.color.includes('cyan') ? '#06b6d4' :
                                           segment.color.includes('pink') ? '#ec4899' :
                                           segment.color.includes('emerald') ? '#059669' :
                                           segment.color.includes('red') ? '#ef4444' :
                                           segment.color.includes('orange') ? '#ea580c' : '#3b82f6'} />
            </linearGradient>
          ))}
        </defs>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">DLX</div>
            <div className="text-sm text-gray-300">Tokenomics</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Tokenomics
        </h2>
        <p className="text-gray-300 text-lg">DLX Token distribution and allocation</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interactive Pie Chart */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
          <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Token Distribution</h3>
              <PieChart />
            </div>
          </div>
        </div>

        {/* Tokenomics Breakdown with Enhanced Cards */}
        <div className="space-y-4">
          {tokenomicsData.map((item, index) => (
            <div key={index} className="group relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10 rounded-xl blur-sm group-hover:blur-md transition-all duration-500`} />
              <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-lg group-hover:shadow-xl transition-all duration-500 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-blue-400 font-bold text-lg">{item.percentage}%</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out animate-pulse`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Roadmap Section with Vertical Timeline
const Roadmap = () => {
  const roadmapPhases = [
    {
      phase: 'Phase 1',
      status: 'completed',
      title: 'Foundation',
      items: [
        'DLX Token Mining',
        'Launch affiliate program',
        'Launch 25+ service'
      ],
      color: 'from-green-500 to-emerald-500',
      icon: '🪙',
      description: 'Core infrastructure and token launch'
    },
    {
      phase: 'Phase 2',
      status: 'current',
      title: 'Development',
      items: [
        'DigiLinex App Integration',
        'Referral System & commission',
        'Countdown Launch'
      ],
      color: 'from-blue-500 to-cyan-500',
      icon: '📱',
      description: 'Platform development and integration'
    },
    {
      phase: 'Phase 3',
      status: 'upcoming',
      title: 'Launch',
      items: [
        'Public Sale & Listing ($0.20)',
        'Exchange Partnerships',
        'DLX Staking & Rewards'
      ],
      color: 'from-purple-500 to-pink-500',
      icon: '🚀',
      description: 'Public launch and exchange listings'
    },
    {
      phase: 'Phase 4',
      status: 'future',
      title: 'Expansion',
      items: [
        'DLX Wallet Launch',
        'International Marketing Push',
        'Listing multiple exchange',
        'Web3 Expansion'
      ],
      color: 'from-orange-500 to-red-500',
      icon: '🌐',
      description: 'Global expansion and Web3 integration'
    }
  ];

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Roadmap
        </h2>
        <p className="text-gray-300 text-lg">Our journey to revolutionize digital finance</p>
      </div>
      
      {/* Vertical Timeline */}
      <div className="relative max-w-4xl mx-auto">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 via-purple-500 to-orange-500 opacity-30"></div>
        
        <div className="space-y-12">
          {roadmapPhases.map((phase, index) => (
            <div key={index} className="relative flex items-start gap-8 group">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${phase.color} flex items-center justify-center text-2xl shadow-2xl border-4 border-gray-900 ${
                  phase.status === 'current' ? 'animate-pulse' : ''
                }`}>
                  {phase.icon}
                </div>
                {phase.status === 'current' && (
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${phase.color} animate-ping opacity-30`}></div>
                )}
              </div>
              
              {/* Content card */}
              <div className="flex-1 group-hover:scale-105 transition-all duration-500">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${phase.color} opacity-10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500`} />
                  <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-500">
                    {/* Status badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        phase.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        phase.status === 'current' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        phase.status === 'upcoming' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>
                        {phase.status === 'completed' ? '🟢 COMPLETED' :
                         phase.status === 'current' ? '🟡 CURRENT' :
                         phase.status === 'upcoming' ? '🟠 UPCOMING' :
                         '🔵 FUTURE'}
                      </span>
                    </div>
                    
                    {/* Phase info */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{phase.phase}</h3>
                      <h4 className="text-xl font-semibold text-gray-200 mb-3">{phase.title}</h4>
                      <p className="text-gray-400 text-sm">{phase.description}</p>
                    </div>
                    
                    {/* Milestones */}
                    <div className="space-y-3">
                      {phase.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${phase.color} flex-shrink-0`} />
                          <span className="text-gray-300 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Community Section
const Community = () => {
  const communityLinks = [
    {
      name: 'Telegram',
      icon: ChatBubbleLeftRightIcon,
      color: 'from-blue-500 to-cyan-500',
      href: '#'
    },
    {
      name: 'Twitter/X',
      icon: ShareIcon,
      color: 'from-blue-400 to-blue-600',
      href: '#'
    },
    {
      name: 'Discord',
      icon: ChatBubbleLeftRightIcon,
      color: 'from-purple-500 to-pink-500',
      href: '#'
    },
    {
      name: 'Website',
      icon: GlobeAltIcon,
      color: 'from-green-500 to-emerald-500',
      href: '#'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Join the Community
        </h2>
        <p className="text-gray-300 text-lg">Connect with us and stay updated</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {communityLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="group relative block"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500`} />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl group-hover:shadow-2xl transition-all duration-500 hover:scale-105 text-center">
              <div className={`p-4 rounded-xl bg-gradient-to-r ${link.color} shadow-lg mx-auto mb-4 w-fit`}>
                <link.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{link.name}</h3>
            </div>
          </a>
        ))}
      </div>
      
      {/* Whitepaper Download */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg" />
          <button className="relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 flex items-center gap-3 mx-auto">
            <DocumentTextIcon className="h-6 w-6" />
            Download DLX Whitepaper (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};

// Live Price Section (Future Integration)
const LivePrice = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Live DLX Price
        </h2>
        <p className="text-gray-300 text-lg">Real-time price tracking (Coming Soon)</p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
        <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <ChartBarIcon className="h-12 w-12 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Price Integration Coming Soon</h3>
            <p className="text-gray-300 mb-6">
              We're working on integrating with CoinGecko API to provide real-time DLX token prices.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              <RocketLaunchIcon className="h-4 w-4" />
              Integration in Progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main DLX Listing Page
export default function DLXListing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
        <div className="relative container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <span className="text-white font-bold text-2xl">DLX</span>
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DLX Listing
                </h1>
                <p className="text-xl text-gray-300 mt-2">Digi Linex Token</p>
              </div>
            </div>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              The future of digital finance is here. DLX Token brings revolutionary blockchain technology 
              to the DigiLinex ecosystem with advanced staking, mining, and referral rewards.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 space-y-20 pb-20">
        {/* Countdown Timer */}
        <CountdownTimer />
        
        {/* Token Overview */}
        <TokenOverview />
        
        {/* Tokenomics */}
        <Tokenomics />
        
        {/* Roadmap */}
        <Roadmap />
        
        {/* Live Price */}
        <LivePrice />
        
        {/* Community */}
        <Community />
      </div>
    </div>
  );
}
