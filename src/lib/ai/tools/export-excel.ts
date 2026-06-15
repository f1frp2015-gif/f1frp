import { tool } from "ai";
import { z } from "zod";
import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import {
  ossConfigured,
  putObject,
  signedDownloadUrl,
  AI_EXPORT_PREFIX,
} from "@/lib/oss";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type BomTable = {
  title: string;
  headers: string[];
  rows: string[][];
  sheetName?: string;
  notes?: string[];
};

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

async function buildWorkbook(t: BomTable): Promise<Buffer> {
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

  // Rows 3+ — data. Pure-number cells become real numbers (no leading-zero loss
  // for codes: only coerce when it round-trips, i.e. no leading zeros).
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

  return Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

// Expose a "generate Excel" capability to the chat LLM. Typical flow: the model
// reads a drawing and lists the parts as a table in chat, then — on a later
// (attachment-free) turn — the user asks to export, and the model calls this with
// the same headers/rows. The file is uploaded to OSS and the UI renders a
// download button from the tool result (the model must NOT paste the raw URL).
export function makeExportExcelTool() {
  return tool({
    description:
      "Generate a downloadable Excel (.xlsx) workbook from a structured table. " +
      "Call this when the user wants to EXPORT a parts list / bill of materials (BOM) / 拆解清单 / 物料清单 / 配件清单 / spec or quote table to Excel (导出 Excel / 导出表格 / 生成表格文件 / 下载 .xlsx). " +
      "It usually follows a drawing breakdown: first present the parts as a table in chat; when the user asks to export, call this with the SAME data. " +
      "Provide `headers` (column names) and `rows` (each row an array of cell strings aligned to headers, same length as headers). Pure-number cells are written as real numbers. " +
      "The UI renders the result as a download button — DO NOT paste the returned URL into your reply; just confirm the file is ready (e.g. 已生成 Excel,点下方按钮下载). " +
      "If the result is { ok: false }, tell the user Excel export isn't available right now (object storage not configured) and offer the table inline instead.",
    inputSchema: z.object({
      title: z
        .string()
        .min(1)
        .describe(
          "Workbook title shown as the merged first row, e.g. '图纸 ABC-01 复材型材拆解清单'.",
        ),
      headers: z
        .array(z.string().min(1))
        .min(1)
        .max(20)
        .describe(
          "Column headers, e.g. ['序号','零件名称','规格/截面','材质','长度(mm)','数量','单位','备注'].",
        ),
      rows: z
        .array(z.array(z.string()))
        .min(1)
        .max(500)
        .describe(
          "Data rows; each row is an array of cell strings aligned to `headers`. Pure-number cells become real numbers.",
        ),
      sheetName: z
        .string()
        .max(40)
        .optional()
        .describe("Worksheet name; defaults to '拆解清单'. Excel caps it at 31 chars."),
      notes: z
        .array(z.string())
        .max(10)
        .optional()
        .describe(
          "Optional note/footnote lines placed below the table (e.g. standard basis, tolerance remarks).",
        ),
    }),
    execute: async ({ title, headers, rows, sheetName, notes }) => {
      try {
        const safeTitle =
          (title || "拆解清单")
            .replace(/[\\/:*?"<>|\n\r\t]/g, "_")
            .trim()
            .slice(0, 60) || "拆解清单";
        const filename = `${safeTitle}.xlsx`;

        if (!ossConfigured()) {
          return {
            ok: false as const,
            reason:
              "Excel 导出需要对象存储(OSS),当前部署未配置 ALIYUN_OSS_* 环境变量。",
          };
        }

        const buffer = await buildWorkbook({ title, headers, rows, sheetName, notes });
        const key = `${AI_EXPORT_PREFIX}/${randomUUID()}.xlsx`;
        await putObject(key, buffer, XLSX_CONTENT_TYPE);
        const url = signedDownloadUrl(key, filename);

        return {
          ok: true as const,
          url,
          filename,
          sheetName: safeSheetName(sheetName),
          rowCount: rows.length,
        };
      } catch (e) {
        return {
          ok: false as const,
          reason: e instanceof Error ? e.message : "生成 Excel 失败",
        };
      }
    },
  });
}
