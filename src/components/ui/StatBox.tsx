import React from 'react';
import { type ReactElement } from 'react';

interface StatBoxProps {
  title: string;
  value: string | number;
  icon?: ReactElement;
  progress?: number; // 0-100
  footer?: string;
  className?: string;
}

export default function StatBox({ title, value, icon, progress, footer, className = '' }: StatBoxProps) {
  return (
    <div className={`widget ${className}`}>
      <div className="flex items-start gap-4">
        <div className="widget-icon text-white">
          {icon ?? <span className="font-bold">★</span>}
        </div>
        <div className="flex-1">
          <div className="widget-title mb-1">{title}</div>
          <div className="widget-value mb-1">{value}</div>
          {progress !== undefined && (
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0070f3] to-[#00d4ff] transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
          )}
          {footer && <div className="mt-2 text-xs text-gray-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}