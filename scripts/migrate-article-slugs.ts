// One-off: migrate the 9 资讯 article rows from their old Chinese (fabricated-
// text) slugs to clean ASCII slugs. Matches by OLD slug, sets the new slug in
// place (same row, all other columns untouched). The old URLs are 301-redirected
// to the new ones in next.config.ts, so deploy the code BEFORE/ALONGSIDE this.
// Idempotent: rows already on the new slug are reported as "already migrated".
//
// Run: pnpm tsx --env-file=.env.local scripts/migrate-article-slugs.ts
//   add --dry to only report (no writes).

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

import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { articles } from "../src/lib/db/schema";

// [oldSlug, newSlug] — keep in sync with articleSlugMigrations in next.config.ts
const MIGRATIONS: Array<[string, string]> = [
  ["2026年中国复合材料市场规模预计突破3500亿-风电和新能源汽车成主要驱动力", "china-composites-output-2023-wind-ev"],
  ["国家标准gb-t-31539-2026-纤维增强塑料拉挤型材-正式发布实施", "gb-t-31539-2015-frp-pultruded-profiles"],
  ["巨石集团年产30万吨高性能玻纤智能制造基地投产-全球产能跃居首位", "china-jushi-glass-fiber-leader"],
  ["碳纤维复合材料在新能源汽车电池箱体中的应用取得突破性进展", "composite-battery-enclosure-smc"],
  ["第28届中国国际复合材料展览会将于9月在上海举办-规模创历史新高", "cce-2026-shanghai-composites-expo"],
  ["真空导入工艺在大型风电叶片制造中的最新优化方案", "vacuum-infusion-large-wind-blades"],
  ["华东地区不饱和聚酯树脂价格小幅上涨-苯乙烯成本推动", "upr-resin-price-styrene-demand"],
  ["工信部发布-复合材料行业绿色制造标准-征求意见稿", "composites-green-manufacturing-policy"],
  ["光伏组件边框加速-以塑代铝-frp-拉挤型材量产落地", "composite-pv-frames-pu-pultrusion"],
];

const DRY = process.argv.includes("--dry");

async function main() {
  console.log(DRY ? "🔎 DRY RUN (no writes)\n" : "✍️  Migrating slugs in place\n");
  let migrated = 0;
  let already = 0;
  let missing = 0;

  for (const [oldSlug, newSlug] of MIGRATIONS) {
    const [byOld] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, oldSlug));

    if (byOld) {
      migrated++;
      if (DRY) {
        console.log(`✔️  ${oldSlug}\n     → ${newSlug}`);
      } else {
        await db
          .update(articles)
          .set({ slug: newSlug, updatedAt: new Date() })
          .where(eq(articles.slug, oldSlug));
        console.log(`✅ → ${newSlug}`);
      }
      continue;
    }

    const [byNew] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, newSlug));
    if (byNew) {
      already++;
      console.log(`⏭️  already on new slug: ${newSlug}`);
    } else {
      missing++;
      console.log(`❌ NO ROW for old or new slug: ${newSlug}`);
    }
  }

  console.log(
    `\n${DRY ? "DRY: " : ""}to-migrate ${migrated}, already ${already}, missing ${missing}` +
      ` (total ${MIGRATIONS.length})`,
  );
}

main()
  .catch((e) => {
    console.error("❌ migration failed:", e);
    process.exit(1);
  })
  .then(() => process.exit(0));
