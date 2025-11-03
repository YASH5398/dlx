import React from 'react';

/**
 * Responsive table wrapper component that makes tables horizontally scrollable on mobile
 * Use this wrapper around all admin tables for consistent mobile responsiveness
 */
interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
      }}
    >
      <div className="inline-block min-w-full align-middle px-3 sm:px-4 md:px-0">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveTableWrapper;

