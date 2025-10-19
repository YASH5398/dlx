import React from 'react';

/**
 * @param {{ label: any, checked: any, onChange: any, helper?: any, className?: string }} props
 */
export default function ToggleSwitch({ label, checked, onChange, helper, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {helper && <div className="text-xs text-gray-400 mt-1">{helper}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-white/20'} border border-white/20`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}