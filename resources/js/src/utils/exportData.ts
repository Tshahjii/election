export type ExportColumn = {
  key: string;
  label: string;
};

const safeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'export';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const exportValue = (row: Record<string, any>, column: ExportColumn) => {
  const value = row[column.key];
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const escapeAttribute = (value: string) => value.replace(/['"<>`&]/g, '');

export function downloadExcelFile(title: string, columns: ExportColumn[], rows: Record<string, any>[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(exportValue(row, column))}</td>`).join('')}</tr>`)
    .join('');
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileName(title)}-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadPdfReport(title: string, columns: ExportColumn[], rows: Record<string, any>[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows
    .map((row, index) => `<tr>${columns.map((column) => `<td>${escapeHtml(column.key === '__sno' ? index + 1 : exportValue(row, column))}</td>`).join('')}</tr>`)
    .join('');
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1120,height=760');
  if (!popup) return;

  const safeTitle = escapeAttribute(title);
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #eef2ff; color: #312e81; text-align: left; }
          th, td { border: 1px solid #d1d5db; padding: 7px 8px; vertical-align: top; }
          tr:nth-child(even) td { background: #f9fafb; }
          @media print { body { margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Generated on ${escapeHtml(new Date().toLocaleString())} | Records: ${escapeHtml(String(rows.length))}</div>
        <table>
          <thead><tr>${header}</tr></thead>
          <tbody>${body || `<tr><td colspan="${columns.length}">No records</td></tr>`}</tbody>
        </table>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}
