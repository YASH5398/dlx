export function exportToCsv(filename: string, headers: string[], rows: (string | number | boolean)[][]) {
  const headerLine = headers.join(',');
  const body = rows.map((r) => r.map((cell) => {
    const s = String(cell ?? '');
    const needsQuote = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
  }).join(',')).join('\n');
  const csv = `${headerLine}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}