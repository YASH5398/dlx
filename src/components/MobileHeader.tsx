import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const { user, logout, initialized } = useUser();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const initials = (user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 md:hidden">
      {/* Gradient Background with Blur */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl" />
      
      {/* Header Content */}
      <div className="relative h-16 flex items-center justify-between px-4">
        {/* Menu Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="relative p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 hover:scale-110 group"
        >
          <div className="relative">
            <Bars3Icon className={`w-6 h-6 text-white transition-all duration-300 ${isMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
            <XMarkIcon className={`w-6 h-6 text-white absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`} />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* App Logo/Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-500 flex items-center justify-center group-hover:scale-110">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-500">
            DigiLinex
          </span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-3 rounded-2xl bg-gradient-to-r from-gray-700/50 to-gray-600/50 border border-white/10 hover:from-gray-600/70 hover:to-gray-500/70 transition-all duration-300 hover:scale-110 group">
            <BellIcon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-300" />
            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="relative p-2 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 hover:scale-110 group"
            >
              {initialized ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 animate-pulse" />
              )}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                  <div className="flex items-center gap-3">
                    {initialized ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{initials}</span>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-white">{user?.name || 'User'}</div>
                          <div className="text-sm text-blue-300">{user?.email || ''}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 animate-pulse" />
                        <div>
                          <div className="h-5 w-40 rounded bg-white/20 animate-pulse mb-2" />
                          <div className="h-3 w-28 rounded bg-white/10 animate-pulse" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 hover:scale-105">
                    <UserCircleIcon className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 hover:scale-105">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <div className="border-t border-white/10 my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
