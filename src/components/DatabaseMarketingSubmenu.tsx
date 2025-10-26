import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CircleStackIcon, 
  ChartBarIcon, 
  ShoppingCartIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SubmenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  path: string;
  description: string;
}

const submenuItems: SubmenuItem[] = [
  {
    id: 'buy-database',
    name: 'Buy Database',
    icon: CircleStackIcon,
    path: '/database-marketing/categories',
    description: 'Purchase contact databases'
  },
  {
    id: 'marketing-software',
    name: 'Marketing Software',
    icon: ChartBarIcon,
    path: '/database-marketing/marketing-software',
    description: 'Campaign management tools'
  },
  {
    id: 'order-data',
    name: 'Order Data',
    icon: ShoppingCartIcon,
    path: '/database-marketing/order-data',
    description: 'View your orders'
  }
];

interface DatabaseMarketingSubmenuProps {
  isActive: boolean;
  onClick: () => void;
}

export default function DatabaseMarketingSubmenu({ isActive, onClick }: DatabaseMarketingSubmenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if any submenu item is active
  const isSubmenuActive = submenuItems.some(item => 
    location.pathname.startsWith(item.path)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmenuClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onClick();
  };

  const handleMainClick = () => {
    if (isSubmenuActive) {
      // If a submenu item is active, navigate to the main page
      navigate('/database-marketing');
    } else {
      // Otherwise, toggle the dropdown
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Menu Item */}
      <button
        onClick={handleMainClick}
        className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          isActive || isSubmenuActive
            ? "bg-gradient-to-r from-blue-500/25 via-purple-500/20 to-pink-500/25 text-white font-semibold shadow-2xl shadow-blue-500/30 border border-blue-400/40 backdrop-blur-sm transform scale-[1.02]"
            : "text-gray-300 hover:bg-gradient-to-r hover:from-white/8 hover:to-white/4 hover:text-white hover:shadow-xl hover:shadow-white/10 hover:scale-[1.01] hover:border-white/20 border border-transparent"
        }`}
      >
        <div className={`relative p-2 rounded-xl transition-all duration-500 ${
          isActive || isSubmenuActive 
            ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-lg shadow-blue-500/25" 
            : "bg-white/5 group-hover:bg-white/10 group-hover:shadow-md"
        }`}>
          <CircleStackIcon className={`h-5 w-5 transition-all duration-500 ${
            isActive || isSubmenuActive 
              ? "text-blue-300 scale-110 drop-shadow-lg" 
              : "text-gray-400 group-hover:text-white group-hover:scale-105 group-hover:drop-shadow-md"
          }`} />
          {(isActive || isSubmenuActive) && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <span className={`text-base font-medium tracking-wide transition-all duration-500 ${
            isActive || isSubmenuActive ? "text-white drop-shadow-sm" : "text-gray-300 group-hover:text-white"
          }`}>
            Database & Marketing
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          )}
          {(isActive || isSubmenuActive) && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping" />
            </div>
          )}
        </div>
        
        {/* Hover effect overlay */}
        <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
          isActive || isSubmenuActive 
            ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" 
            : "bg-gradient-to-r from-white/0 via-white/0 to-white/0 group-hover:from-white/5 group-hover:via-white/3 group-hover:to-white/5"
        }`} />
      </button>

      {/* Submenu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-gradient-to-b from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          <div className="p-2">
            {submenuItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = location.pathname.startsWith(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSubmenuClick(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                    isItemActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/40'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isItemActive 
                      ? 'bg-blue-500/30' 
                      : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                  </div>
                  {isItemActive && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
