import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';
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
  UsersIcon,
  XMarkIcon,
  UserCircleIcon,
  BellIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { approved } = useAffiliateApproval();

  const initials = (user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    try {
      // Close drawer first
      onClose();
      
      // Perform logout (this will handle redirect)
      await logout();
      
      // No need to navigate manually as logout function handles redirect
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, close drawer and let logout function handle redirect
      onClose();
    }
  };

  const menuItems = [
    { name: 'Overview', icon: HomeIcon, path: '/dashboard', color: 'from-blue-500 to-cyan-500' },
    { name: 'Orders', icon: ShoppingCartIcon, path: '/orders', color: 'from-purple-500 to-pink-500' },
    { name: 'Mining', icon: CurrencyDollarIcon, path: '/mining', color: 'from-green-500 to-emerald-500' },
    { name: 'Wallet', icon: WalletIcon, path: '/wallet', color: 'from-orange-500 to-red-500' },
    { name: approved ? 'Affiliate Dashboard' : 'Affiliate Program', icon: UsersIcon, path: approved ? '/affiliate-dashboard' : '/affiliate-program', color: 'from-indigo-500 to-blue-500' },
    { name: 'Commission', icon: CurrencyDollarIcon, path: '/commission', color: 'from-yellow-500 to-orange-500' },
    { name: 'Referrals', icon: UserGroupIcon, path: '/referrals', color: 'from-teal-500 to-cyan-500' },
    { name: 'Database & Marketing', icon: ChartBarIcon, path: '/database-marketing', color: 'from-violet-500 to-purple-500' },
    { name: 'DLX Listing', icon: RocketLaunchIcon, path: '/dlx-listing', color: 'from-amber-500 to-yellow-500' },
    { name: 'Work With Us', icon: UserGroupIcon, path: '/work-with-us', color: 'from-emerald-500 to-green-500' },
    { name: 'About Us', icon: DocumentTextIcon, path: '/about', color: 'from-slate-500 to-gray-500' },
    { name: 'Support', icon: LifebuoyIcon, path: '/support', color: 'from-cyan-500 to-blue-500' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings', color: 'from-gray-500 to-slate-500' }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-white/10 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <div className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DigiLinex
                </div>
                <div className="text-xs text-blue-300 font-medium">DLX Platform</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-gray-700/70 hover:to-gray-600/70 hover:scale-110 transition-all duration-300 relative z-10"
            >
              <XMarkIcon className="w-5 h-5 text-gray-300 hover:text-white transition-colors duration-300" />
            </button>
          </div>

          {/* User Info Section */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-xl">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-white truncate">{user?.name || 'User'}</div>
                <div className="text-sm text-gray-300 truncate">{user?.email || ''}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-400/30">
                    Referral Code: DLX{user?.id?.slice(-6) || 'USER'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <nav className="p-4 space-y-2">
              {menuItems.map((item, index) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} bg-opacity-20 text-white shadow-lg border border-white/20`
                        : 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105'
                    }`
                  }
                >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    'bg-gradient-to-r from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10'
                  }`}>
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="flex-1 font-medium">{item.name}</span>
                  
                  {/* Active Indicator - moved inside NavLink render prop */}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 hover:scale-105 group">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-500/20 group-hover:from-gray-500/30 group-hover:to-gray-400/30 transition-all duration-300">
                  <Cog6ToothIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-300" />
                </div>
                <span className="flex-1 text-left">Settings</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 hover:scale-105 group">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-500/20 group-hover:from-blue-500/30 group-hover:to-blue-400/30 transition-all duration-300">
                  <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Help & Support</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-600/20 to-red-500/20 group-hover:from-red-500/30 group-hover:to-red-400/30 transition-all duration-300">
                  <svg className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
