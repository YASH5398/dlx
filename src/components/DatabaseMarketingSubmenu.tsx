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
      {/* Main Menu Item - Compact Cyber Theme */}
      <button
        onClick={handleMainClick}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 w-full ${
          isActive || isSubmenuActive
            ? "bg-[#00E5FF]/10 text-[#00E5FF] font-semibold border-b-2 border-[#0096FF] shadow-lg shadow-cyan-500/10"
            : "text-[#F1F5FF] hover:bg-[#00E5FF]/5 hover:text-[#00E5FF] border-b-2 border-transparent hover:border-[#00E5FF]/20"
        }`}
      >
        <div className={`p-1.5 rounded-md transition-all duration-200 ${
          isActive || isSubmenuActive
            ? "bg-[#00E5FF]/20 text-[#00E5FF] shadow-md"
            : "text-[#F1F5FF]/60 group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10 group-hover:shadow-sm"
        }`}>
          <ChartBarIcon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 text-left">
          <span className="text-sm font-medium">Data & Marketing</span>
          <div className="text-xs text-[#F1F5FF]/50 mt-0.5 group-hover:text-[#F1F5FF]/70 transition-colors duration-200">
            Professional Tools & Services
          </div>
        </div>
        
        <div className={`transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}>
          <ChevronRightIcon className="h-3 w-3 text-[#F1F5FF]/60 group-hover:text-[#00E5FF] transition-colors duration-200" />
        </div>
      </button>

      {/* Cyber Theme Submenu Dropdown - Smooth Fade/Slide */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-[rgba(20,28,50,0.95)] border border-[#00E5FF]/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/5 via-transparent to-[#00E5FF]/5 rounded-xl" />
          
          {/* Header */}
          <div className="relative px-4 py-3 border-b border-[#00E5FF]/10 bg-gradient-to-r from-[#0A0E1A] to-[#101830]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00E5FF]/20 border border-[#00E5FF]/30">
                <ChartBarIcon className="h-4 w-4 text-[#00E5FF]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F1F5FF]">Data & Marketing</h3>
                <p className="text-xs text-[#F1F5FF]/60 mt-0.5">Professional tools for business growth</p>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="relative py-2">
            {submenuItems.map((item, index) => {
              const Icon = item.icon;
              const isItemActive = location.pathname.startsWith(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSubmenuClick(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 group ${
                    isItemActive
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-b-2 border-[#0096FF] shadow-lg shadow-cyan-500/10'
                      : 'text-[#F1F5FF] hover:bg-[#00E5FF]/5 hover:text-[#00E5FF] border-b-2 border-transparent hover:border-[#00E5FF]/20'
                  }`}
                >
                  <div className={`p-1.5 rounded-md transition-all duration-200 ${
                    isItemActive 
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-md' 
                      : 'text-[#F1F5FF]/60 group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10 group-hover:shadow-sm'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      {item.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.color === 'blue' ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30' :
                          item.color === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#F1F5FF]/50 mt-0.5 line-clamp-2 group-hover:text-[#F1F5FF]/70 transition-colors duration-200">
                      {item.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isItemActive && (
                      <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-lg shadow-cyan-500/50" />
                    )}
                    <ArrowRightIcon className="h-3 w-3 text-[#F1F5FF]/60 group-hover:text-[#00E5FF] transition-colors duration-200" />
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="relative px-4 py-3 border-t border-[#00E5FF]/10 bg-gradient-to-r from-[#0A0E1A] to-[#101830]">
            <button
              onClick={() => handleSubmenuClick('/database-marketing')}
              className="w-full text-center text-xs text-[#00E5FF] hover:text-[#F1F5FF] transition-colors font-medium py-2 px-3 rounded-lg hover:bg-[#00E5FF]/10 border border-[#00E5FF]/20 hover:border-[#00E5FF]/40"
            >
              View All Features →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}