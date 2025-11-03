import React from 'react';
import { useLocation } from 'react-router-dom';
import { HomeIcon, ShoppingCartIcon, CurrencyDollarIcon, WalletIcon, UserGroupIcon, Cog6ToothIcon, LifebuoyIcon, ChartBarIcon, UsersIcon, DocumentTextIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import MenuLink from './MenuLink';
import DatabaseMarketingSubmenu from './DatabaseMarketingSubmenu';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onLogout }) => {
  const location = useLocation();
  const { approved } = useAffiliateApproval();

  const menuItems = [
    { name: "Overview", icon: HomeIcon, path: "/dashboard" },
    { name: "Orders", icon: ShoppingCartIcon, path: "/orders" },
    { name: "Mining", icon: CurrencyDollarIcon, path: "/mining" },
    { name: "Wallet", icon: WalletIcon, path: "/wallet" },
    { name: approved ? "Affiliate Dashboard" : "Affiliate Program", icon: UsersIcon, path: approved ? "/affiliate-dashboard" : "/affiliate-program" },
    { name: "Rewards", icon: CurrencyDollarIcon, path: "/commission" },
    { name: "Referrals", icon: UserGroupIcon, path: "/referrals" },
    { name: "Data & Marketing", icon: ChartBarIcon, path: "/database-marketing", isSubmenu: true },
    { name: "DLX Listing", icon: RocketLaunchIcon, path: "/dlx-listing" },
    { name: "Work With Us", icon: UserGroupIcon, path: "/work-with-us" },
    { name: "About Us", icon: DocumentTextIcon, path: "/about" },
    { name: "Support", icon: LifebuoyIcon, path: "/support" },
    { name: "Settings", icon: Cog6ToothIcon, path: "/settings" },
  ];

  const MobileLogoutButton = () => (
    <button
      onClick={onLogout}
      className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 text-red-400/90 hover:from-red-500/15 hover:to-red-600/10 hover:border-red-500/30 hover:text-red-300 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="text-sm font-medium">Logout</span>
    </button>
  );

  return (
    <>
      <aside className={`fixed top-0 left-0 h-full z-40 w-[272px] transform transition-all duration-300 ease-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full bg-gradient-to-b from-[#0A0E1A] via-[#0D1117] to-[#0F1520] border-r border-[#00E5FF]/8 shadow-[4px_0_24px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* Sidebar Header - Professional */}
          <div className="h-16 flex items-center px-4 border-b border-[#00E5FF]/8 bg-gradient-to-r from-[#0A0E1A]/95 to-[#0D1117]/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00E5FF] via-[#0096FF] to-[#0066CC] flex items-center justify-center shadow-[0_4px_12px_rgba(0,229,255,0.3)] ring-1 ring-[#00E5FF]/30">
                  <span className="text-white font-bold text-[15px] tracking-tight">D</span>
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#00E5FF] to-[#0096FF] rounded-lg opacity-20 blur-sm -z-10"></div>
              </div>
              <div className="flex flex-col -space-y-0.5">
                <div className="text-base font-bold text-[#F1F5FF] tracking-tight leading-tight">DigiLinex</div>
                <div className="text-[10px] text-[#8B949E] font-medium uppercase tracking-wider">Platform</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="h-[calc(100vh-4rem)] flex flex-col">
            <nav className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-thin scrollbar-thumb-[#00E5FF]/10 scrollbar-track-transparent hover:scrollbar-thumb-[#00E5FF]/20">
              <div className="space-y-0.5">
                {menuItems.map((item) => {
                  if (item.isSubmenu) {
                    return (
                      <DatabaseMarketingSubmenu
                        key={item.path}
                        isActive={location.pathname.startsWith(item.path)}
                        onClick={onClose}
                      />
                    );
                  }
                  return (
                    <MenuLink key={item.path} {...item} onClick={onClose} isSubmenu={item.isSubmenu} />
                  );
                })}
              </div>
            </nav>
            
            {/* Mobile Logout */}
            <div className="px-2.5 py-3 border-t border-[#00E5FF]/8 lg:hidden bg-gradient-to-r from-[#0A0E1A]/95 to-[#0D1117]/95 backdrop-blur-sm sticky bottom-0">
              <MobileLogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />}
    </>
  );
};

export default Sidebar;
