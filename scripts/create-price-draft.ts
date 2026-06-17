// Insert/fill a weekly price report as a DRAFT (status=draft) so it lands in the
// admin 价格行情 (/dashboard/admin/prices) for human final review. Used by the
// f1frp-price-digest skill. NEVER publishes.
//
// Usage: pnpm tsx --env-file=.env.local scripts/create-price-draft.ts <draft.json>
//   draft.json: {
//     weekOf?: "YYYY-MM-DD",            // 默认本周一
//     title?: string, summary?: string,
//     sources?: string[],              // 权威来源(站点/报告)
//     quotes: [ { name, nameEn?, category, price, unit, change?, region, source? } ]
//   }
// change 缺省时由本脚本按「上期已发布」同名材料自动算周环比。
// 行为:本周已有 draft → 填充该 draft;本周已 published → 另建 draft;无 → 新建 draft。

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
import { type PriceQuote, priceReports } from "../src/lib/db/schema";

function thisMonday(): string {
  const d = new Date();
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return d.toISOString().slice(0, 10);
}
const round1 = (n: number) => Math.round(n * 10) / 10;

async function main() {
  const path = process.argv[2];
  if (!path || !existsSync(path)) {
    console.error("usage: create-price-draft.ts <draft.json>");
    process.exit(1);
  }
  const d = JSON.parse(readFileSync(path, "utf-8"));
  const weekOf = d.weekOf ? String(d.weekOf) : thisMonday();
  const incoming: unknown[] = Array.isArray(d.quotes) ? d.quotes : [];
  if (!incoming.length) {
    console.error("quotes required");
    process.exit(1);
  }

  // 上期已发布作为周环比基线
  const [base] = await db
    .select()
    .from(priceReports)
    .where(eq(priceReports.status, "published"))
    .orderBy(desc(priceReports.publishedAt))
    .limit(1);
  const baseMap = new Map<string, number>();
  for (const q of base?.quotes ?? []) baseMap.set(q.name, q.price);

  const quotes: PriceQuote[] = [];
  for (const r of incoming) {
    const q = r as Record<string, unknown>;
    const name = String(q.name ?? "").trim();
    if (!name) continue;
    const price = Number(q.price) || 0;
    let change =
      q.change !== undefined && q.change !== null ? Number(q.change) : NaN;
    if (Number.isNaN(change)) {
      const b = baseMap.get(name);
      change = b && b > 0 ? round1(((price - b) / b) * 100) : 0;
    }
    quotes.push({
      name,
      nameEn: q.nameEn ? String(q.nameEn) : undefined,
      category: String(q.category ?? "auxiliary"),
      price,
      unit: String(q.unit ?? "元/吨"),
      change,
      region: String(q.region ?? "全国"),
      source: q.source ? String(q.source) : undefined,
    });
  }

  const title = d.title ? String(d.title).slice(0, 200) : "复材原材料价格行情";
  const summary = d.summary ? String(d.summary) : "";
  const sources = Array.isArray(d.sources) ? d.sources.map(String) : [];

  const [existing] = await db
    .select()
    .from(priceReports)
    .where(eq(priceReports.weekOf, weekOf))
    .orderBy(desc(priceReports.createdAt))
    .limit(1);

  let id: string;
  if (existing && existing.status === "draft") {
    const [u] = await db
      .update(priceReports)
      .set({
        title,
        summary,
        quotes,
        sources,
        generatedBy: "skill:price-digest",
        updatedAt: new Date(),
      })
      .where(eq(priceReports.id, existing.id))
      .returning({ id: priceReports.id });
    id = u.id;
    console.log(`✅ filled existing weekly draft: ${id}`);
  } else {
    const [c] = await db
      .insert(priceReports)
      .values({
        weekOf,
        title,
        summary,
        quotes,
        sources,
        status: "draft",
        generatedBy: "skill:price-digest",
      })
      .returning({ id: priceReports.id });
    id = c.id;
    console.log(
      `✅ draft created: ${id}${existing ? " (该周已有发布版,另建草稿)" : ""}`,
    );
  }
  console.log(`   weekOf: ${weekOf} · quotes: ${quotes.length}`);
  console.log("   admin: /dashboard/admin/prices （草稿,待人工终审发布）");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ failed:", e);
    process.exit(1);
  });
