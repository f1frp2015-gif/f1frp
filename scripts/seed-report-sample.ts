// Seed a single sample 研报 so /reports has something to render in dev preview.
// Idempotent on slug — safe to re-run after edits.
// Run: pnpm tsx scripts/seed-report-sample.ts

import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";

const sample = {
  slug: "2026-pultrusion-china-market",
  title: "2026 中国拉挤型材市场深度研报：风电叶片大梁、桥梁加固与建筑型材三条增长曲线",
  subtitle: "玻纤拉挤 vs 碳纤拉挤 · 产能 / 价格 / 头部厂商 / 出海机会",
  category: "industry" as const,
  summary: [
    "中国拉挤复材产业 2025 年总产量约 32 万吨，同比增长 14%。本研报基于公开年报、海关数据、24 家头部企业访谈，",
    "对玻纤 / 碳纤拉挤型材的产能格局、价格走势、下游应用三条增长曲线（风电叶片大梁、桥梁加固、建筑型材）",
    "做了系统性梳理。重点回答：哪条曲线适合中小厂家切入？头部企业产能投放节奏如何？2026 年出海窗口在哪些区域市场？",
    "",
    "适合：拉挤厂家战略规划、复材投资决策、上游树脂/玻纤厂家寻找下游、外贸代理选品。",
  ].join("\n"),
  tableOfContents: [
    "Chapter 1 · 拉挤复材定义、工艺与材料体系",
    "Chapter 2 · 中国拉挤产能地图（含 24 家头部企业产线明细）",
    "Chapter 3 · 玻纤 vs 碳纤拉挤价格曲线（2020-2026 月度数据）",
    "Chapter 4 · 增长曲线 A：风电叶片大梁（含金风 / 远景 / 维斯塔斯供应链分析）",
    "Chapter 5 · 增长曲线 B：桥梁加固与索塔（含主要业主单位采购模式）",
    "Chapter 6 · 增长曲线 C：建筑型材（门窗 / 幕墙 / 装饰）",
    "Chapter 7 · 出海机会：欧洲（CE）/ 北美（ASTM）/ 东南亚（基建）三地拆解",
    "Chapter 8 · 2026 年关键风险：原材料价格、欧盟反倾销、产能过剩",
    "附录 · 24 家头部企业一览表 + 数据来源 + 名词解释",
  ],
  pageCount: 64,
  priceCents: 29900,
  proDiscountBps: 7000,
  pdfPath: "reports/2026-pultrusion-china-market.pdf", // OSS 私有 bucket 路径占位
  pdfSizeBytes: null,
  previewPdfPath: null,
  tags: ["拉挤", "风电", "桥梁", "建筑型材", "出海"],
  keywords: [
    "中国拉挤型材市场",
    "玻纤拉挤",
    "碳纤拉挤",
    "风电叶片大梁",
    "桥梁加固",
    "复材出海",
  ],
  isPublished: true,
};

async function main() {
  console.log("Seeding sample report …");

  const [row] = await db
    .insert(reports)
    .values(sample)
    .onConflictDoUpdate({
      target: reports.slug,
      set: { ...sample, updatedAt: new Date() },
    })
    .returning();

  console.log(`✓ ${row.slug}  (${row.id})`);
  console.log(`  → http://localhost:3000/reports/${row.slug}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
