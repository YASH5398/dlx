import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

export default function Card({ children, className = '', title, subtitle, headerRight }: CardProps) {
  return (
    <div className={`glass-card ${className}`}>
      {(title || subtitle || headerRight) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold brand-text">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}