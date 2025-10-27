import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CircleStackIcon, 
  ChartBarIcon, 
  ShoppingCartIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface SubmenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  path: string;
  description: string;
  badge?: string;
  color: string;
}

const submenuItems: SubmenuItem[] = [
  {
    id: 'buy-database',
    name: 'Buy Database',
    icon: CircleStackIcon,
    path: '/database-marketing/categories',
    description: 'Purchase high-quality contact databases',
    badge: '30+ Categories',
    color: 'blue'
  },
  {
    id: 'marketing-software',
    name: 'Marketing Software',
    icon: ChartBarIcon,
    path: '/database-marketing/marketing-software',
    description: 'Campaign management & automation tools',
    badge: 'New',
    color: 'purple'
  },
  {
    id: 'order-data',
    name: 'Order Data',
    icon: ShoppingCartIcon,
    path: '/database-marketing/order-data',
    description: 'View and manage your orders',
    color: 'green'
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
      navigate('/database-marketing');
    } else {
      setIsOpen(!isOpen);
    }
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'text-blue-400 group-hover:bg-blue-500/10',
      purple: isActive ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' : 'text-purple-400 group-hover:bg-purple-500/10',
      green: isActive ? 'bg-green-500/20 text-green-300 border-green-400/30' : 'text-green-400 group-hover:bg-green-500/10'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Menu Item */}
      <button
        onClick={handleMainClick}
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full ${
          isActive || isSubmenuActive
            ? "bg-blue-500/15 text-white font-medium shadow-sm border-l-4 border-blue-400"
            : "text-gray-300 hover:bg-gray-700/50 hover:text-white border-l-4 border-transparent hover:border-gray-600"
        }`}
      >
        <div className={`p-1.5 rounded-md transition-all duration-200 ${
          isActive || isSubmenuActive
            ? "bg-blue-500/20 text-blue-300"
            : "text-gray-400 group-hover:text-gray-200 group-hover:bg-gray-600/30"
        }`}>
          <ChartBarIcon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 text-left">
          <span className="text-sm font-medium">Database & Marketing</span>
          <div className="text-xs text-gray-500 mt-0.5">
            Professional Tools & Services
          </div>
        </div>
        
        <div className={`transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}>
          <ChevronRightIcon className="h-4 w-4" />
        </div>
      </button>

      {/* Professional Submenu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-80 bg-gray-800/95 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-sm font-semibold text-white">Database & Marketing</h3>
            <p className="text-xs text-gray-400 mt-1">Professional tools for your business growth</p>
          </div>
          
          {/* Menu Items */}
          <div className="p-1.5">
            {submenuItems.map((item, index) => {
              const Icon = item.icon;
              const isItemActive = location.pathname.startsWith(item.path);
              const colorClasses = getColorClasses(item.color, isItemActive);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSubmenuClick(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isItemActive
                      ? 'bg-blue-500/15 text-white border border-blue-400/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-md transition-all duration-200 ${colorClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      {item.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                          item.color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {item.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isItemActive && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    )}
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-200 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="px-3 py-2.5 border-t border-gray-700 bg-gray-800/30">
            <button
              onClick={() => handleSubmenuClick('/database-marketing')}
              className="w-full text-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All Features →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}