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
        `group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          isActive
            ? "bg-blue-500/15 text-white font-medium shadow-sm border-l-4 border-blue-400"
            : "text-gray-300 hover:bg-gray-700/50 hover:text-white border-l-4 border-transparent hover:border-gray-600"
        }`
      }
    >
      <div className={`p-1.5 rounded-md transition-all duration-200 ${
        isActive 
          ? "bg-blue-500/20 text-blue-300" 
          : "text-gray-400 group-hover:text-gray-200 group-hover:bg-gray-600/30"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium transition-colors duration-200 ${
          isActive ? "text-white" : "text-gray-300 group-hover:text-white"
        }`}>
          {name}
        </span>
        {isSubmenu && (
          <div className="text-xs text-gray-500 mt-0.5">
            Database & Marketing Tools
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="w-2 h-2 bg-blue-400 rounded-full" />
      )}
    </NavLink>
  );
};

export default MenuLink;
