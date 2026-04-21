/**
 * Tiny CSV serializer. Not RFC-4180-perfect, but handles the cases we care
 * about: quoted strings, embedded quotes/newlines/commas, ISO dates, numbers.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(
  rows: Array<Record<string, unknown>>,
  columns?: string[],
): string {
  if (rows.length === 0) return "";
  const cols =
    columns && columns.length > 0
      ? columns
      : Array.from(
          rows.reduce<Set<string>>((acc, row) => {
            for (const k of Object.keys(row)) acc.add(k);
            return acc;
          }, new Set()),
        );
  const header = cols.map(escapeCell).join(",");
  const lines = rows.map((row) =>
    cols.map((c) => escapeCell(row[c])).join(","),
  );
  return `${header}\r\n${lines.join("\r\n")}\r\n`;
}

/**
 * Trigger a browser download of the given CSV string. Safe to call in a
 * click handler; the URL is revoked on the next tick.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
