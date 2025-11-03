import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import NotificationBell from '../../components/NotificationBell';
import UserAvatar from '../../components/UserAvatar';
import ProfileDropdown from '../../components/ProfileDropdown';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout() {
  const { user, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const initials = (user?.name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    try {
      // Close any open menus first
      setMenuOpen(false);
      setProfileDropdownOpen(false);
      
      // Perform logout
      await logout();
      
      // The logout function will handle redirect, but we can add additional cleanup here if needed
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, close menus and let the logout function handle redirect
      setMenuOpen(false);
      setProfileDropdownOpen(false);
    }
  };

  const closeMobileMenu = () => {
    if (window.innerWidth < 1024) {
      setMenuOpen(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#101830] text-[#F1F5FF]">
      {/* Compact Cyber Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0A0E1A] to-[#101830] backdrop-blur-xl border-b border-[#00E5FF]/10 z-30 lg:left-[272px] shadow-2xl">
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="lg:hidden p-2 rounded-lg hover:bg-[#00E5FF]/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#F1F5FF]">
                {menuOpen ? <path d="M6 6L18 18M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0096FF] flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="text-lg font-bold text-[#F1F5FF]">DigiLinex</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#00E5FF]/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <UserAvatar initials={initials} size="sm" />
                <span className="hidden lg:inline text-sm font-medium text-[#F1F5FF]">{user?.name || "User"}</span>
                <svg className={`h-3 w-3 transition-transform duration-200 text-[#F1F5FF]/60 ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <ProfileDropdown 
                isOpen={profileDropdownOpen}
                onClose={() => setProfileDropdownOpen(false)}
                user={user}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={menuOpen}
        onClose={closeMobileMenu}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="pt-16 lg:ml-[272px]">
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
