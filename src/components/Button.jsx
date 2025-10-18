import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className = '',
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md hover:shadow-lg',
    secondary:
      'bg-white/10 text-white border border-white/20 hover:bg-white/20',
    outline:
      'bg-transparent text-white border border-white/30 hover:bg-white/10',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg',
  };
  const styles = `${base} ${variants[variant] || variants.primary} ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}