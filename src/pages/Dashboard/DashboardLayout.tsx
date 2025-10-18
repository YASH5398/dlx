import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { HomeIcon, TrophyIcon, ShoppingCartIcon, WalletIcon, UserGroupIcon, Cog6ToothIcon, LifebuoyIcon, ChartBarIcon, CubeIcon } from '@heroicons/react/24/outline';

// Utility component for the User Avatar
const UserAvatar = ({ initials, size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-md",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-600 to-blue-500 border-2 border-white/30 flex items-center justify-center font-bold shadow-lg`}
    >
      {initials}
    </div>
  );
};

export default function DashboardLayout() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  // We'll use menuOpen to control the mobile sidebar visibility
  const [menuOpen, setMenuOpen] = useState(false);
  // New state for the user profile dropdown in the header
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = (user?.name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { path: "/dashboard", icon: <HomeIcon className="h-5 w-5" />, label: "Dashboard" },
    { path: "/dashboard/commission", icon: <TrophyIcon className="h-5 w-5" />, label: "Commission & Rewards" },
    { path: "/dashboard/orders", icon: <ShoppingCartIcon className="h-5 w-5" />, label: "Orders" },
    { path: "/dashboard/digital-products", icon: <CubeIcon className="h-5 w-5" />, label: "Digital Products" },
    { path: "/dashboard/mining", icon: <ChartBarIcon className="h-5 w-5" />, label: "Mining" },
    { path: "/dashboard/referrals", icon: <UserGroupIcon className="h-5 w-5" />, label: "Referrals" },
    { path: "/dashboard/wallet", icon: <WalletIcon className="h-5 w-5" />, label: "Wallet" },
    { path: "/dashboard/support", icon: <LifebuoyIcon className="h-5 w-5" />, label: "Support" },
    { path: "/dashboard/settings", icon: <Cog6ToothIcon className="h-5 w-5" />, label: "Settings" },
    { path: "/dashboard/affiliate-program", icon: <UserGroupIcon className="h-5 w-5" />, label: "Affiliate Program" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
    setProfileDropdownOpen(false); // Close dropdown on logout
  };

  const closeMobileMenu = () => {
    // Only close the sidebar if it's the mobile view
    if (window.innerWidth < 1024) {
      setMenuOpen(false);
    }
  };

  const handleDropdownItemClick = (path) => {
    if (path) {
      navigate(path);
    }
    setProfileDropdownOpen(false);
  };

  // Helper component for the Menu Items (Sidebar and Dropdown share structure)
  const MenuLink = ({ path, icon, label, onClick }) => (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          isActive
            ? "bg-[#3e1c66]/50 text-white shadow-inner-lg shadow-purple-900/50 scale-[1.02] border-r-4 border-purple-500 font-semibold" // Matches the active state in the image
            : "text-gray-300 hover:text-white hover:bg-white/5 hover:translate-x-0.5"
        }`
      }
    >
      <span className="text-xl transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );

  const MobileLogoutButton = () => (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 shadow-lg hover:shadow-red-500/20 font-semibold"
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
        onClick={() => setProfileDropdownOpen(prev => !prev)}
        className="flex items-center gap-2 p-2 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
      >
        <UserAvatar initials={initials} size="sm" />
        {/* User name on larger screens */}
        <span className="hidden lg:inline text-sm font-medium">{user?.name || "User"}</span>
        <svg className="h-4 w-4 text-gray-400 hidden lg:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - POSITIONED TO MATCH IMAGE */}
      {profileDropdownOpen && (
        <div className="absolute right-0 mt-4 w-64 bg-[#0a0e1f] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <UserAvatar initials={initials} size="lg" />
              <div>
                <div className="text-base font-semibold text-white">{user?.name || "User"}</div>
                <div className="text-xs text-purple-400">{user?.email || ""}</div>
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    Online
                </div>
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleDropdownItemClick("/dashboard/profile")}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Profile
            </button>
            <button
              onClick={() => handleDropdownItemClick("/dashboard/settings")}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border-t border-white/10 mt-2 pt-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      {/* Fixed Header */}
      <header className="topbar lg:left-72 transition-all duration-500">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          {/* Left: Hamburger + Logo (only visible on small screens) */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-300">
                {menuOpen ? (
                  <path d="M6 6L18 18M6 18L18 6" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Header Title (e.g., current page) */}
          <div className="text-xl font-bold text-gray-200">
            {/* You might want to dynamically set this based on the current route */}
            Dashboard Overview
          </div>

          {/* Right: User Info Dropdown */}
          <div className="flex items-center gap-3">
            <HeaderUserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Sidebar - Permanent on Lg, Toggled on Mobile */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-72 transform transition-transform duration-500 ease-in-out lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } ${!menuOpen ? "lg:opacity-100" : ""}`}
      >
        <div className="h-full bg-gradient-to-b from-[#0e0e2e] via-[#0a0e1f] to-[#04060c] border-r border-purple-900 shadow-2xl">
          <div className="h-16 flex items-center justify-start px-4 border-b border-purple-900/50">
            {/* Logo from the image */}
            <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mr-2">
                DigiLinex
            </div>
            <span className="text-purple-400 text-sm font-light">DLX</span>
          </div>
          
          <div className="h-[calc(100vh-4rem)] flex flex-col p-4">
            {/* Sidebar Header (Profile for mobile only - but we'll include it for completeness if needed) */}
            <div className="mb-6 hidden"> {/* Hiding the inline profile to use the dropdown instead */}
              {/* This section matches the structure of the old sidebar profile and the new dropdown */}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <MenuLink 
                    key={item.path} 
                    {...item} 
                    onClick={closeMobileMenu} 
                  />
                ))}
              </div>
            </nav>

            {/* Logout Button (Mobile/Tablet visible, Desktop uses dropdown) */}
            <div className="mt-4 pt-4 border-t border-white/10 lg:hidden">
              <MobileLogoutButton />
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content - Pushes over on desktop, only padded on mobile */}
      <main
        className="pt-20 pb-8 transition-all duration-500 ease-in-out lg:ml-72 px-4 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Main Content / Dashboard Cards will load here via <Outlet /> */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}