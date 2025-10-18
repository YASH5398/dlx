import React from 'react';

export type ColumnDef<T> = {
  id: keyof T | string;
  header: string;
  className?: string;
  cell?: (row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function DataTable<T>({ columns, data, emptyTitle = 'No data found', emptyDescription = 'Try adjusting filters or adding new items.' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="glass-card">
        <div className="text-center py-12 text-sm text-gray-400">
          <div className="mx-auto h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center mb-4">📭</div>
          <div className="brand-text text-base font-semibold">{emptyTitle}</div>
          <div className="mt-1">{emptyDescription}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table className="min-w-full text-sm">
        <thead className="table-head">
          <tr>
            {columns.map((c) => (
              <th key={String(c.id)} className={`table-cell text-left ${c.className ?? ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {data.map((row, idx) => (
            <tr key={idx} className="table-row">
              {columns.map((c) => (
                <td key={String(c.id)} className="table-cell text-white/90">
                  {c.cell ? c.cell(row) : (row as any)[c.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}