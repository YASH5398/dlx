import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * @param {{ label: any, checked: any, onChange: any, helper?: any, className?: string }} props
 */
export default function ToggleSwitch({ label, checked, onChange, helper, className = '' }) {
    return (_jsxs("div", { className: `flex items-start justify-between gap-4 ${className}`, children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-white", children: label }), helper && _jsx("div", { className: "text-xs text-gray-400 mt-1", children: helper })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": checked, onClick: () => onChange(!checked), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-white/20'} border border-white/20`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}` }) })] }));
}
