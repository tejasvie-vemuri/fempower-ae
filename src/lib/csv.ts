/** Escape one CSV cell and neutralise spreadsheet formulas (=, +, -, @, tab, CR). */
export function csvCell(cell: unknown): string {
  let s = String(cell ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}
