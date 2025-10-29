import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface MenuLinkProps {
  path: string;
  icon: React.ComponentType<any>;
  name: string;
  onClick?: () => void;
  isSubmenu?: boolean;
}

const MenuLink: React.FC<MenuLinkProps> = ({ path, icon: Icon, name, onClick, isSubmenu = false }) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 ${
          isActive
            ? "bg-[#00E5FF]/10 text-[#00E5FF] font-semibold border-b-2 border-[#0096FF] shadow-lg shadow-cyan-500/10"
            : "text-[#F1F5FF] hover:bg-[#00E5FF]/5 hover:text-[#00E5FF] border-b-2 border-transparent hover:border-[#00E5FF]/20"
        }`
      }
    >
      <div className={`p-1.5 rounded-md transition-all duration-200 ${
        isActive 
          ? "bg-[#00E5FF]/20 text-[#00E5FF] shadow-md" 
          : "text-[#F1F5FF]/60 group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10 group-hover:shadow-sm"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium transition-all duration-200 ${
          isActive ? "text-[#00E5FF]" : "text-[#F1F5FF] group-hover:text-[#00E5FF]"
        }`}>
          {name}
        </span>
        {isSubmenu && (
          <div className="text-xs text-[#F1F5FF]/50 mt-0.5 group-hover:text-[#F1F5FF]/70 transition-colors duration-200">
            Professional Tools & Services
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-lg shadow-cyan-500/50" />
      )}
    </NavLink>
  );
};

export default MenuLink;
