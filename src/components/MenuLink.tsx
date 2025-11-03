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
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 ${
          isActive
            ? "bg-gradient-to-r from-[#00E5FF]/12 via-[#0096FF]/8 to-transparent text-[#00E5FF] font-semibold border-l-[3px] border-[#00E5FF] shadow-[0_2px_8px_rgba(0,229,255,0.15)]"
            : "text-[#C9D1D9] hover:bg-[#00E5FF]/6 hover:text-[#00E5FF] border-l-[3px] border-transparent hover:border-[#00E5FF]/25"
        }`
      }
    >
      <div className={`p-1.5 rounded-md transition-all duration-200 ${
        isActive 
          ? "bg-[#00E5FF]/15 text-[#00E5FF] shadow-[0_2px_4px_rgba(0,229,255,0.2)]" 
          : "text-[#8B949E] group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10"
      }`}>
        <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium transition-all duration-200 leading-tight ${
          isActive ? "text-[#00E5FF]" : "text-[#C9D1D9] group-hover:text-[#00E5FF]"
        }`}>
          {name}
        </span>
        {isSubmenu && (
          <div className="text-[10px] text-[#8B949E] mt-0.5 group-hover:text-[#8B949E]/80 transition-colors duration-200 font-normal">
            Tools & Services
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_6px_rgba(0,229,255,0.8)]"></div>
        </div>
      )}
    </NavLink>
  );
};

export default MenuLink;
