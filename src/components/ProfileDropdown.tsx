import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, user, onLogout }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const initials = (user?.name || "User")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleItemClick = (path: string) => {
    if (path) navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-4 w-64 bg-gray-900/95 border border-white/20 rounded-xl shadow-2xl z-50 backdrop-blur-md" ref={dropdownRef}>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <UserAvatar initials={initials} size="md" />
          <div>
            <div className="text-sm font-semibold text-white">{user?.name || "User"}</div>
            <div className="text-xs text-gray-400">{user?.email || ""}</div>
          </div>
        </div>
      </div>
      <div className="p-2 space-y-1">
        <button 
          onClick={() => handleItemClick("/dashboard/profile")} 
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </button>
        <button 
          onClick={() => handleItemClick("/settings")} 
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        <div className="border-t border-white/10 my-2"></div>
        <button 
          onClick={onLogout} 
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
