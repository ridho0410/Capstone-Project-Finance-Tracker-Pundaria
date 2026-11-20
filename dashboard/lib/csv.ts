type Cell = string | number | null | undefined;

function escapeCell(value: Cell) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Cell[][]) {
  const body = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  return `\uFEFF${body}\r\n`;
}

export function csvResponse(filename: string, rows: Cell[][]) {
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
