import React from 'react';
import Button from '../Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, actionLabel, onAction, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`glass-card text-center p-8 ${className}`}>
      <div className="mx-auto h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center mb-4">
        {icon ?? <span className="text-2xl">🧩</span>}
      </div>
      <h3 className="text-lg font-semibold brand-text">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
      {actionLabel && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}