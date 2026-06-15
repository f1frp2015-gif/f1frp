import { tool } from "ai";
import { z } from "zod";

// Expose an "export to Excel" capability to the chat LLM. The model passes a
// structured table; this tool just validates it (Zod) and echoes it back with a
// filename. The actual .xlsx is built in the browser (src/lib/bom-to-xlsx.ts)
// when the user clicks the download button the UI renders from this tool result.
//
// Why no server-side file / object storage: the chat already streams the table
// back to the client, so generating the bytes on demand in the browser avoids an
// OSS dependency entirely and keeps the tool result tiny (no base64 blob bloating
// the model context on this or later turns).
//
// Typical flow: the model reads a drawing and lists the parts as a table in chat,
// then — on a later (attachment-free) turn — the user asks to export and the model
// calls this with the SAME headers/rows.
export function makeExportExcelTool() {
  return tool({
    description:
      "Export a structured table to a downloadable Excel (.xlsx) file. " +
      "Call this when the user wants to EXPORT a parts list / bill of materials (BOM) / 拆解清单 / 物料清单 / 配件清单 / spec or quote table to Excel (导出 Excel / 导出表格 / 生成表格文件 / 下载 .xlsx). " +
      "It usually follows a drawing breakdown: first present the parts as a table in chat; when the user asks to export, call this with the SAME data. " +
      "Provide `headers` (column names) and `rows` (each row an array of cell strings aligned to headers, same length as headers). Pure-number cells become real numbers in the sheet. " +
      "The UI renders the result as a download button — just confirm the file is ready (e.g. 已生成 Excel,点下方按钮下载). Do NOT dump the table again in your reply.",
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
      const safeTitle =
        (title || "拆解清单")
          .replace(/[\\/:*?"<>|\n\r\t]/g, "_")
          .trim()
          .slice(0, 60) || "拆解清单";
      return {
        ok: true as const,
        filename: `${safeTitle}.xlsx`,
        rowCount: rows.length,
        table: { title, headers, rows, sheetName, notes },
      };
    },
  });
}
