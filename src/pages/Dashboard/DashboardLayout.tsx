import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { HomeIcon, ShoppingCartIcon, CurrencyDollarIcon, WalletIcon, UserGroupIcon, Cog6ToothIcon, LifebuoyIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../../components/NotificationBell';
import { useAffiliateApproval } from '../../hooks/useAffiliateApproval';

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

  const menuItems: { name: string; icon: React.ComponentType<any>; path: string }[] = [
    { name: "Overview", icon: HomeIcon, path: "/dashboard" },
    { name: "Orders", icon: ShoppingCartIcon, path: "/orders" },
    { name: "Mining", icon: CurrencyDollarIcon, path: "/mining" },
    { name: "Wallet", icon: WalletIcon, path: "/wallet" },
    { name: approved ? "Affiliate Dashboard" : "Affiliate Program", icon: UsersIcon, path: approved ? "/affiliate-dashboard" : "/affiliate-program" },
    { name: "Rewards", icon: CurrencyDollarIcon, path: "/commission" },
    { name: "Referrals", icon: UserGroupIcon, path: "/referrals" },
    { name: "Digital Products", icon: ChartBarIcon, path: "/dashboard/digital-products" },
    { name: "Support", icon: LifebuoyIcon, path: "/support" },
    { name: "Settings", icon: Cog6ToothIcon, path: "/settings" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      setMenuOpen(false);
      setProfileDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      navigate("/login");
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

  const MenuLink = ({ path, icon: Icon, name, onClick }: { path: string; icon: React.ComponentType<any>; name: string; onClick?: () => void }) => (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          isActive
            ? "bg-blue-700 text-white font-semibold shadow-md"
            : "text-white hover:bg-gray-800 hover:text-white"
        }`
      }
    >
      <>
        <Icon className="h-5 w-5 text-white shrink-0 transition-colors duration-200" />
        <span className="text-white text-base font-medium tracking-wide">{name}</span>
      </>
    </NavLink>
  );

  const MobileLogoutButton = () => (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 shadow-md"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Logout
    </button>
  );

  const HeaderUserProfileDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setProfileDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 p-2 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
      >
        <UserAvatar initials={initials} size="sm" />
        <span className="hidden lg:inline text-sm font-medium text-white">{user?.name || "User"}</span>
        <svg className="h-4 w-4 text-gray-400 hidden lg:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {profileDropdownOpen && (
        <div className="absolute right-0 mt-4 w-64 bg-[#0a0e1f] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <UserAvatar initials={initials} size="lg" />
              <div>
                <div className="text-base font-semibold text-white">{user?.name || "User"}</div>
                <div className="text-xs text-purple-400">{user?.email || ""}</div>
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            <button onClick={() => handleDropdownItemClick("/dashboard/profile")} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded-lg">
              Profile
            </button>
            <button onClick={() => handleDropdownItemClick("/settings")} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded-lg">
              Settings
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg border-t border-white/10 mt-2 pt-2">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="dlx-dashboard-root min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white overflow-hidden">
      <header className="topbar lg:left-72 transition-all duration-500">
        <div className="h-full flex items-center justify-between px-3 md:px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen((prev) => !prev)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 lg:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {menuOpen ? <path d="M6 6L18 18M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <div className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent select-none">Digi Linex</div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <HeaderUserProfileDropdown />
          </div>
        </div>
      </header>

      <aside className={`fixed top-0 left-0 h-full z-40 w-72 transform transition-transform duration-500 ease-in-out lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full bg-[#0a0e1f] border-r border-gray-700 shadow-xl">
          <div className="h-16 flex items-center justify-start px-4 border-b border-gray-700">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mr-2">
              DigiLinex
            </div>
            <span className="text-white text-sm font-medium">DLX</span>
          </div>
          <div className="h-[calc(100vh-4rem)] flex flex-col p-4">
            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <MenuLink key={item.path} {...item} onClick={closeMobileMenu} />
                ))}
              </div>
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-700 lg:hidden">
              <MobileLogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <main className="pt-16 pb-6 transition-all duration-500 ease-in-out lg:ml-72 px-0">
        <div className="w-full h-full mx-0 px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
