import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * @param {{
 *   label?: any,
 *   value: any,
 *   onChange: any,
 *   type?: string,
 *   placeholder?: string,
 *   readOnly?: boolean,
 *   helper?: any,
 *   icon?: any,
 *   className?: string,
 * }} props
 */
export default function InputField({ label, value, onChange, type = 'text', placeholder = '', readOnly = false, helper, icon, className = '', }) {
    return (_jsxs("div", { className: `flex flex-col ${className}`, children: [label && _jsx("label", { className: "text-sm text-gray-300 mb-1", children: label }), _jsxs("div", { className: "relative", children: [icon && (_jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: icon })), _jsx("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, readOnly: readOnly, className: `w-full bg-white/10 border border-white/15 rounded-lg ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent` })] }), helper && _jsx("small", { className: "text-xs text-gray-400 mt-1", children: helper })] }));
}
