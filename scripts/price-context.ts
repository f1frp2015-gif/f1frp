// Print the last PUBLISHED price report (baseline) + a recommended material
// checklist, for the f1frp-price-digest skill: it needs last week's prices to
// compute week-over-week change and to keep material names stable across weeks.
//
// Usage: pnpm tsx --env-file=.env.local scripts/price-context.ts

import { existsSync, readFileSync } from "node:fs";

for (const envPath of [".env.local", ".env"]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    let value = raw.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

import { desc, eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { priceReports } from "../src/lib/db/schema";

// 建议覆盖的材料(命名尽量沿用上期,便于算周环比与前端一致)
const MATERIAL_CHECKLIST = [
  "— 玻纤 —",
  "ECR 无碱粗纱",
  "E 玻纤短切毡",
  "E 玻纤方格布",
  "— 树脂 —",
  "196# 树脂",
  "191# 树脂",
  "乙烯基酯树脂",
  "E-51 环氧树脂",
  "酚醛树脂 PF",
  "风电叶片灌注环氧",
  "— 碳纤维 —",
  "T300 碳纤维 (3K)",
  "T700 碳纤维 (12K)",
  "玄武岩纤维粗纱",
  "— 拉挤成品 / 其他 —",
  "模塑格栅 (38 型)",
  "PVC 泡沫 (H80)",
];

async function main() {
  const [latest] = await db
    .select()
    .from(priceReports)
    .where(eq(priceReports.status, "published"))
    .orderBy(desc(priceReports.publishedAt))
    .limit(1);

  console.log("=== 上期已发布基线(算周环比 + 保持材料命名一致)===");
  if (latest) {
    console.log(`weekOf: ${latest.weekOf}`);
    console.log(JSON.stringify(latest.quotes, null, 2));
  } else {
    console.log("(无已发布基线 — 首期按真实现价填 change=0)");
  }
  console.log("\n=== 建议覆盖的材料清单(命名尽量沿用上期)===");
  console.log(MATERIAL_CHECKLIST.join("\n"));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
