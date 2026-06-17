// Seed the first PUBLISHED price report from the legacy static `priceData`,
// so the homepage has DB-backed data immediately (no visual regression).
// Idempotent: skips if a published report already exists.
//
//   tsx --env-file=.env.local scripts/seed-price-report.ts

import { eq } from "drizzle-orm";

import { priceData } from "@/lib/data/materials";
import { db } from "@/lib/db";
import { type PriceQuote, priceReports } from "@/lib/db/schema";

function classify(name: string): string {
  if (/碳纤维/.test(name)) return "carbon";
  if (/树脂|环氧|聚酯|乙烯基|酚醛|BMI|灌注/.test(name)) return "resin";
  if (/毡/.test(name)) return "fiber-mat";
  if (/布|织物/.test(name)) return "fiber-fabric";
  if (/纱|玄武岩/.test(name)) return "fiber-yarn";
  if (/格栅|型材|筋材|拉挤/.test(name)) return "composite";
  if (/泡沫|芯材/.test(name)) return "core";
  return "auxiliary";
}

function thisMonday(): string {
  const d = new Date();
  const wd = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - wd);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const existing = await db
    .select({ id: priceReports.id })
    .from(priceReports)
    .where(eq(priceReports.status, "published"))
    .limit(1);
  if (existing.length) {
    console.log("[seed-price-report] a published report already exists — skip.");
    process.exit(0);
  }

  const quotes: PriceQuote[] = priceData.map((p) => ({
    name: p.name,
    category: classify(p.name),
    price: p.price,
    unit: p.unit,
    change: p.change,
    region: p.region,
  }));

  await db.insert(priceReports).values({
    weekOf: thisMonday(),
    title: "复材原材料价格行情",
    summary: "本期为初始基线数据（迁移自站内静态行情），后续每周一更新。",
    quotes,
    sources: ["初始基线（迁移自站内静态行情）"],
    status: "published",
    generatedBy: "seed",
    publishedAt: new Date(),
  });

  console.log(`[seed-price-report] seeded 1 published report with ${quotes.length} quotes.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
