import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { HomeIcon, ShoppingCartIcon, CurrencyDollarIcon, WalletIcon, UserGroupIcon, Cog6ToothIcon, LifebuoyIcon, ChartBarIcon, UsersIcon, DocumentTextIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../../components/NotificationBell';
import { useAffiliateApproval } from '../../hooks/useAffiliateApproval';
import DatabaseMarketingSubmenu from '../../components/DatabaseMarketingSubmenu';

const UserAvatar = ({ initials, size = "md" }: { initials: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-md",
  };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-600 to-blue-500 border-2 border-white/30 flex items-center justify-center font-bold shadow-lg text-white`}>
      {initials}
    </div>
  );
};

export default function DashboardLayout() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { approved } = useAffiliateApproval();

  const initials = (user?.name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems: { name: string; icon: React.ComponentType<any>; path: string; isSubmenu?: boolean }[] = [
    { name: "Overview", icon: HomeIcon, path: "/dashboard" },
    { name: "Orders", icon: ShoppingCartIcon, path: "/orders" },
    { name: "Mining", icon: CurrencyDollarIcon, path: "/mining" },
    { name: "Wallet", icon: WalletIcon, path: "/wallet" },
    { name: approved ? "Affiliate Dashboard" : "Affiliate Program", icon: UsersIcon, path: approved ? "/affiliate-dashboard" : "/affiliate-program" },
    { name: "Rewards", icon: CurrencyDollarIcon, path: "/commission" },
    { name: "Referrals", icon: UserGroupIcon, path: "/referrals" },
    { name: "Digital Products", icon: ChartBarIcon, path: "/dashboard/digital-products" },
    { name: "Database & Marketing", icon: ChartBarIcon, path: "/database-marketing", isSubmenu: true },
    { name: "DLX Listing", icon: RocketLaunchIcon, path: "/dlx-listing" },
    { name: "Work With Us", icon: UserGroupIcon, path: "/work-with-us" },
    { name: "About Us", icon: DocumentTextIcon, path: "/about" },
    { name: "Support", icon: LifebuoyIcon, path: "/support" },
    { name: "Settings", icon: Cog6ToothIcon, path: "/settings" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      setProfileDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // The logout function will handle the redirect
    }
  };

  const closeMobileMenu = () => {
    if (window.innerWidth < 1024) {
      setMenuOpen(false);
    }
  };

  const handleDropdownItemClick = (path: string) => {
    if (path) navigate(path);
    setProfileDropdownOpen(false);
  };

  const MenuLink = ({ path, icon: Icon, name, onClick }: { path: string; icon: React.ComponentType<any>; name: string; onClick?: () => void }) => {
    const isActive = location.pathname === path;
    
    return (
      <NavLink
        to={path}
        onClick={onClick}
        className={({ isActive }) =>
          `group relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isActive
              ? "bg-gradient-to-r from-blue-500/30 via-purple-500/25 to-pink-500/30 text-white font-semibold shadow-2xl shadow-blue-500/40 border border-blue-400/50 backdrop-blur-sm transform scale-[1.02]"
              : "text-gray-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:text-white hover:shadow-xl hover:shadow-white/15 hover:scale-[1.02] hover:border-white/30 border border-transparent"
          }`
        }
      >
        <>
          <div className={`relative p-3 rounded-xl transition-all duration-500 ${
            isActive 
              ? "bg-gradient-to-br from-blue-500/40 to-purple-500/40 shadow-lg shadow-blue-500/30" 
              : "bg-white/5 group-hover:bg-white/15 group-hover:shadow-lg group-hover:scale-110"
          }`}>
            <Icon className={`h-6 w-6 transition-all duration-500 ${
              isActive 
                ? "text-blue-200 scale-110 drop-shadow-lg" 
                : "text-gray-400 group-hover:text-white group-hover:scale-110 group-hover:drop-shadow-md"
            }`} />
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/30 to-purple-400/30 animate-pulse" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className={`text-base font-medium tracking-wide transition-all duration-500 ${
              isActive ? "text-white drop-shadow-sm" : "text-gray-300 group-hover:text-white"
            }`}>
              {name}
            </span>
          </div>
          
          {isActive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping" />
            </div>
          )}
          
          {/* Enhanced hover effect overlay */}
          <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
            isActive 
              ? "bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-pink-500/15" 
              : "bg-gradient-to-r from-white/0 via-white/0 to-white/0 group-hover:from-white/8 group-hover:via-white/5 group-hover:to-white/8"
          }`} />
        </>
      </NavLink>
    );
  };

  const MobileLogoutButton = () => (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-500/15 to-red-600/10 border border-red-400/40 text-red-300 hover:bg-red-500/25 hover:text-red-200 hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-red-500/30 backdrop-blur-sm"
    >
      <div className="p-2 rounded-xl bg-red-500/20">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-300">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>
      <span className="font-semibold text-base">Logout</span>
    </button>
  );

  const HeaderUserProfileDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setProfileDropdownOpen((prev) => !prev)}
        className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-105"
      >
        <UserAvatar initials={initials} size="sm" />
        <span className="hidden lg:inline text-sm font-medium text-white">{user?.name || "User"}</span>
        <svg className={`h-4 w-4 text-gray-400 hidden lg:inline transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {profileDropdownOpen && (
        <div className="absolute right-0 mt-4 w-72 bg-gradient-to-b from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center gap-4">
              <UserAvatar initials={initials} size="lg" />
              <div>
                <div className="text-lg font-semibold text-white">{user?.name || "User"}</div>
                <div className="text-sm text-blue-300">{user?.email || ""}</div>
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            <button 
              onClick={() => handleDropdownItemClick("/dashboard/profile")} 
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button 
              onClick={() => handleDropdownItemClick("/settings")} 
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 hover:scale-105"
            >
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
  );

  return (
    <div className="dlx-dashboard-root min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white overflow-hidden">
      <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0a0e1f]/95 via-[#0b1230]/90 to-[#0a0e1f]/95 backdrop-blur-xl border-b border-white/20 z-30 lg:left-80 transition-all duration-700 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative h-full flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setMenuOpen((prev) => !prev)} 
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 hover:from-white/30 hover:to-white/15 hover:scale-110 transition-all duration-500 lg:hidden shadow-xl hover:shadow-2xl backdrop-blur-sm"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-500 text-white">
                {menuOpen ? <path d="M6 6L18 18M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-white/20">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent select-none">
                Digi Linex
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <HeaderUserProfileDropdown />
          </div>
        </div>
      </header>

      <aside className={`fixed top-0 left-0 h-full z-40 w-80 transform transition-all duration-700 ease-out lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-[#0a0e1f] border-r border-white/20 shadow-2xl backdrop-blur-xl">
          {/* Enhanced Sidebar Header */}
          <div className="h-24 flex items-center justify-start px-8 border-b border-white/20 bg-gradient-to-r from-blue-600/20 via-purple-600/15 to-pink-600/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/8 to-pink-500/10 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-white/20">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DigiLinex
                </div>
                <div className="text-xs text-blue-300 font-medium">DLX Platform</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="h-[calc(100vh-5rem)] flex flex-col">
            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent p-6">
              <div className="space-y-2">
                {menuItems.map((item) => {
                  if (item.isSubmenu) {
                    return (
                      <DatabaseMarketingSubmenu
                        key={item.path}
                        isActive={location.pathname.startsWith(item.path)}
                        onClick={closeMobileMenu}
                      />
                    );
                  }
                  return (
                    <MenuLink key={item.path} {...item} onClick={closeMobileMenu} />
                  );
                })}
              </div>
            </nav>
            
            {/* Mobile Logout */}
            <div className="p-6 border-t border-white/15 bg-gradient-to-r from-white/5 to-white/2 lg:hidden">
              <MobileLogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <main className="pt-16 pb-20 md:pb-6 transition-all duration-700 ease-out lg:ml-80 px-0">
        <div className="w-full h-full mx-0 px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
