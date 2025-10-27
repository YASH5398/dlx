import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAffiliateStatus } from '../hooks/useAffiliateStatus';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  WalletIcon, 
  UserGroupIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  DocumentTextIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  WalletIcon as WalletIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  LifebuoyIcon as LifebuoyIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  UsersIcon as UsersIconSolid
} from '@heroicons/react/24/solid';

interface MobileNavigationProps {
  isAuthenticated: boolean;
  approved?: boolean;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isAuthenticated, approved = false }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const { canJoinAffiliate, canReapply, affiliateStatus } = useAffiliateStatus();

  const navigationItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      color: 'from-blue-500 to-cyan-500',
      show: isAuthenticated
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartIconSolid,
      color: 'from-purple-500 to-pink-500',
      show: isAuthenticated
    },
    {
      name: 'Mining',
      href: '/mining',
      icon: CurrencyDollarIcon,
      activeIcon: CurrencyDollarIconSolid,
      color: 'from-green-500 to-emerald-500',
      show: isAuthenticated
    },
    {
      name: 'Wallet',
      href: '/wallet',
      icon: WalletIcon,
      activeIcon: WalletIconSolid,
      color: 'from-orange-500 to-red-500',
      show: isAuthenticated
    },
    {
      name: affiliateStatus.isApproved ? 'Affiliate Dashboard' : 
            affiliateStatus.isPending ? 'Affiliate (Pending)' :
            affiliateStatus.isRejected ? 'Reapply Affiliate' : 'Join Affiliate',
      href: affiliateStatus.isApproved ? '/affiliate-dashboard' : '/affiliate-program',
      icon: UsersIcon,
      activeIcon: UsersIconSolid,
      color: affiliateStatus.isApproved ? 'from-green-500 to-emerald-500' :
             affiliateStatus.isPending ? 'from-yellow-500 to-orange-500' :
             affiliateStatus.isRejected ? 'from-red-500 to-pink-500' : 'from-indigo-500 to-blue-500',
      show: isAuthenticated && (canJoinAffiliate() || canReapply() || affiliateStatus.isApproved || affiliateStatus.isPending)
    },
    {
      name: 'Products',
      href: '/dashboard/digital-products',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid,
      color: 'from-pink-500 to-rose-500',
      show: isAuthenticated
    },
    {
      name: 'DLX',
      href: '/dlx-listing',
      icon: RocketLaunchIcon,
      activeIcon: RocketLaunchIconSolid,
      color: 'from-yellow-500 to-orange-500',
      show: isAuthenticated
    },
    {
      name: 'Support',
      href: '/support',
      icon: LifebuoyIcon,
      activeIcon: LifebuoyIconSolid,
      color: 'from-teal-500 to-cyan-500',
      show: isAuthenticated
    }
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border-t border-white/10" />
      
      {/* Navigation Container */}
      <div className="relative px-4 py-2">
        <div className="flex items-center justify-around space-x-1">
          {visibleItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="group relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-all duration-300"
                onClick={() => setActiveTab(item.href)}
              >
                {/* Active Background */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 shadow-lg animate-pulse" />
                )}
                
                {/* Icon Container */}
                <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${item.color} shadow-lg shadow-${item.color.split('-')[1]}-500/25 scale-110` 
                    : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-105'
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? 'text-white scale-110' 
                      : 'text-gray-400 group-hover:text-white'
                  }`} />
                  
                  {/* Glow Effect */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-20 animate-ping`} />
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
                  isActive 
                    ? 'text-white font-semibold' 
                    : 'text-gray-400 group-hover:text-white'
                }`}>
                  {item.name}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r ${item.color} animate-pulse`} />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
