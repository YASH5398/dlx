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
      {/* Main Menu Item - Professional */}
      <button
        onClick={handleMainClick}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 w-full ${
          isActive || isSubmenuActive
            ? "bg-gradient-to-r from-[#00E5FF]/12 via-[#0096FF]/8 to-transparent text-[#00E5FF] font-semibold border-l-[3px] border-[#00E5FF] shadow-[0_2px_8px_rgba(0,229,255,0.15)]"
            : "text-[#C9D1D9] hover:bg-[#00E5FF]/6 hover:text-[#00E5FF] border-l-[3px] border-transparent hover:border-[#00E5FF]/25"
        }`}
      >
        <div className={`p-1.5 rounded-md transition-all duration-200 ${
          isActive || isSubmenuActive
            ? "bg-[#00E5FF]/15 text-[#00E5FF] shadow-[0_2px_4px_rgba(0,229,255,0.2)]"
            : "text-[#8B949E] group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10"
        }`}>
          <ChartBarIcon className="h-4 w-4" strokeWidth={isActive || isSubmenuActive ? 2.5 : 2} />
        </div>
        
        <div className="flex-1 text-left">
          <span className="text-sm font-medium leading-tight">Data & Marketing</span>
          <div className="text-[10px] text-[#8B949E] mt-0.5 group-hover:text-[#8B949E]/80 transition-colors duration-200 font-normal">
            Tools & Services
          </div>
        </div>
        
        <div className={`transition-transform duration-200 ease-out ${
          isOpen ? 'rotate-90' : ''
        }`}>
          <ChevronRightIcon className="h-3.5 w-3.5 text-[#8B949E] group-hover:text-[#00E5FF] transition-colors duration-200" />
        </div>
      </button>

      {/* Professional Submenu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-[272px] bg-[rgba(13,17,23,0.98)] border border-[#00E5FF]/12 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/3 via-transparent to-[#00E5FF]/3 rounded-lg" />
          
          {/* Header */}
          <div className="relative px-3.5 py-2.5 border-b border-[#00E5FF]/8 bg-gradient-to-r from-[#0A0E1A]/95 to-[#0D1117]/95">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-[#00E5FF]/15 border border-[#00E5FF]/25">
                <ChartBarIcon className="h-3.5 w-3.5 text-[#00E5FF]" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#C9D1D9]">Data & Marketing</h3>
                <p className="text-[10px] text-[#8B949E] mt-0.5 font-normal">Business tools</p>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="relative py-1">
            {submenuItems.map((item, index) => {
              const Icon = item.icon;
              const isItemActive = location.pathname.startsWith(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSubmenuClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-200 ease-out group ${
                    isItemActive
                      ? 'bg-gradient-to-r from-[#00E5FF]/12 via-[#0096FF]/8 to-transparent text-[#00E5FF] border-l-[3px] border-[#00E5FF] shadow-[0_2px_8px_rgba(0,229,255,0.15)]'
                      : 'text-[#C9D1D9] hover:bg-[#00E5FF]/6 hover:text-[#00E5FF] border-l-[3px] border-transparent hover:border-[#00E5FF]/25'
                  }`}
                >
                  <div className={`p-1.5 rounded-md transition-all duration-200 ${
                    isItemActive 
                      ? 'bg-[#00E5FF]/15 text-[#00E5FF] shadow-[0_2px_4px_rgba(0,229,255,0.2)]' 
                      : 'text-[#8B949E] group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10'
                  }`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={isItemActive ? 2.5 : 2} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate leading-tight">{item.name}</span>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.color === 'blue' ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/25' :
                          item.color === 'purple' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' :
                          'bg-green-500/15 text-green-300 border border-green-500/25'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8B949E] mt-0.5 line-clamp-1 group-hover:text-[#8B949E]/80 transition-colors duration-200 font-normal">
                      {item.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {isItemActive && (
                      <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_6px_rgba(0,229,255,0.8)]" />
                    )}
                    <ArrowRightIcon className="h-3 w-3 text-[#8B949E] group-hover:text-[#00E5FF] transition-colors duration-200" />
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="relative px-3.5 py-2.5 border-t border-[#00E5FF]/8 bg-gradient-to-r from-[#0A0E1A]/95 to-[#0D1117]/95">
            <button
              onClick={() => handleSubmenuClick('/database-marketing')}
              className="w-full text-center text-[10px] text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors font-medium py-1.5 px-3 rounded-md hover:bg-[#00E5FF]/8 border border-[#00E5FF]/20 hover:border-[#00E5FF]/30"
            >
              View All Features →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}