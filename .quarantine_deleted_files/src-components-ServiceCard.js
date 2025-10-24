import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Button from './Button';
export default function ServiceCard({ title, price, description, onGetService }) {
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: title }), price && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: price })] }) }), description && _jsx("p", { className: "text-sm text-gray-700 mt-3", children: description }), _jsx("div", { className: "mt-4 flex gap-3", children: _jsx(Button, { onClick: onGetService, children: "Get Service" }) })] }));
}
