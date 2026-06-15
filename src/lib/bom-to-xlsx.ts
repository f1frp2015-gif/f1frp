"use client";

// Build an .xlsx from a structured table and trigger a browser download.
// Runs entirely client-side: exceljs is lazy-imported (its package "browser"
// field points Turbopack at the browser build) so it stays out of the main
// bundle and only loads on the first download click. No object storage, no
// server round-trip, no file blob in the chat/model context — the AI tool only
// passes the small table; the bytes are generated here on demand.

export type BomTable = {
  title: string;
  headers: string[];
  rows: string[][];
  sheetName?: string;
  notes?: string[];
};

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Excel sheet names can't contain \ / ? * [ ] : and are capped at 31 chars.
function safeSheetName(name: string | undefined): string {
  const cleaned = (name ?? "").replace(/[\\/?*[\]:]/g, " ").trim();
  return cleaned.slice(0, 31) || "拆解清单";
}

// CJK glyphs are ~1.7× the width of a Latin char in Excel's column-width units.
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 255 ? 1.7 : 1;
  return w;
}

export async function downloadBomXlsx(
  t: BomTable,
  filename: string,
): Promise<void> {
  const mod = await import("exceljs");
  const ExcelJS = (mod as { default?: typeof import("exceljs") }).default ?? mod;

  const wb = new ExcelJS.Workbook();
  wb.creator = "f1frp AI";
  const ws = wb.addWorksheet(safeSheetName(t.sheetName));
  const cols = t.headers.length;

  // Row 1 — title, merged across all columns.
  ws.mergeCells(1, 1, 1, cols);
  const title = ws.getCell(1, 1);
  title.value = t.title;
  title.font = { bold: true, size: 14 };
  title.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 24;

  // Row 2 — headers.
  const headerRow = ws.getRow(2);
  t.headers.forEach((h, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
  });
  headerRow.height = 20;

  // Rows 3+ — data. Pure-number cells become real numbers, but only when they
  // round-trip (so part codes with leading zeros stay text).
  t.rows.forEach((row, r) => {
    const excelRow = ws.getRow(3 + r);
    for (let i = 0; i < cols; i++) {
      const raw = (row[i] ?? "").toString();
      const trimmed = raw.trim();
      const isNum =
        /^-?\d+(\.\d+)?$/.test(trimmed) && String(Number(trimmed)) === trimmed;
      const cell = excelRow.getCell(i + 1);
      cell.value = isNum ? Number(trimmed) : raw;
      cell.alignment = { vertical: "top", wrapText: true };
    }
  });

  // Column widths from max content (header + data), capped.
  for (let i = 0; i < cols; i++) {
    let w = displayWidth(String(t.headers[i] ?? ""));
    for (const row of t.rows) w = Math.max(w, displayWidth(String(row[i] ?? "")));
    ws.getColumn(i + 1).width = Math.min(Math.max(w + 2, 8), 48);
  }

  // Notes below the table.
  if (t.notes?.length) {
    const start = 3 + t.rows.length + 1;
    t.notes.forEach((note, n) => {
      ws.mergeCells(start + n, 1, start + n, cols);
      const c = ws.getCell(start + n, 1);
      c.value = note;
      c.font = { italic: true, size: 9, color: { argb: "FF64748B" } };
      c.alignment = { wrapText: true };
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
