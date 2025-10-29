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
    { name: "Digital Products", icon: ChartBarIcon, path: "/dashboard/digital-products" },
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
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-all duration-200 font-medium"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="text-sm font-medium">Logout</span>
    </button>
  );

  return (
    <>
      <aside className={`fixed top-0 left-0 h-full z-40 w-72 transform transition-all duration-300 ease-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full bg-gradient-to-b from-[#0A0E1A] to-[#101830] border-r border-[#00E5FF]/10 shadow-2xl backdrop-blur-xl">
          {/* Sidebar Header - Compact */}
          <div className="h-16 flex items-center px-6 border-b border-[#00E5FF]/10 bg-gradient-to-r from-[#0A0E1A] to-[#101830] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0096FF] flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <div className="text-lg font-bold text-[#F1F5FF]">DigiLinex</div>
                <div className="text-xs text-[#F1F5FF]/60">Professional Platform</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="h-[calc(100vh-4rem)] flex flex-col">
            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-0">
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
            <div className="p-3 border-t border-[#00E5FF]/10 lg:hidden bg-gradient-to-r from-[#0A0E1A] to-[#101830] backdrop-blur-sm">
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
