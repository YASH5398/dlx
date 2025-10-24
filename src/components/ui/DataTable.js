import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default function DataTable({ columns, data, emptyTitle = 'No data found', emptyDescription = 'Try adjusting filters or adding new items.' }) {
    if (data.length === 0) {
        return (_jsx("div", { className: "glass-card", children: _jsxs("div", { className: "text-center py-12 text-sm text-gray-400", children: [_jsx("div", { className: "mx-auto h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center mb-4", children: "\uD83D\uDCED" }), _jsx("div", { className: "brand-text text-base font-semibold", children: emptyTitle }), _jsx("div", { className: "mt-1", children: emptyDescription })] }) }));
    }
    return (_jsx("div", { className: "table-shell", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "table-head", children: _jsx("tr", { children: columns.map((c) => (_jsx("th", { className: `table-cell text-left ${c.className ?? ''}`, children: c.header }, String(c.id)))) }) }), _jsx("tbody", { className: "divide-y divide-white/10", children: data.map((row, idx) => (_jsx("tr", { className: "table-row", children: columns.map((c) => (_jsx("td", { className: "table-cell text-white/90", children: c.cell ? c.cell(row) : row[c.id] }, String(c.id)))) }, idx))) })] }) }));
}
