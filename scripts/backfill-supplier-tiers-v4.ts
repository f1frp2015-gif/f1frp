// Backfill scale_tier + brand_priority for the 62 v4 rows seeded by
// scripts/seed-china-supply-chain-v4.ts. Defaults the rest to M (8).

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

type Tier = "XL" | "L" | "M" | "S";

const TIERS: Array<[string, Tier, number]> = [
  // ─────────────── XL (旗舰 / 上市 / 国家级 / 头部基地) ───────────────
  ["ad-avic-honeycomb", "XL", 26], // 中航百慕 listed
  ["fin-bgi-smc-beijing", "XL", 25], // 北京玻钢院
  ["fin-taishengfengneng-shanghai", "XL", 22], // 泰胜风能 listed
  ["fin-sany-windblade-shaoshan", "XL", 24], // 三一重能
  ["fin-envision-chifeng", "XL", 24], // 远景能源
  ["fin-xinjiang-windblade-jinfeng", "XL", 22], // Goldwind base
  ["fin-gansu-windblade-jiuquan", "XL", 22], // Sinoma Lianzhong base
  ["cf-zhongfu-shenying-xining", "XL", 26], // 中复神鹰 西宁子公司
  ["fin-tianshun-yancheng", "XL", 22], // 天顺风能 base

  // ─────────────── L (头部 / 重要院所 / 关键设备厂) ───────────────
  ["ad-hit-ruichi-honeycomb", "L", 20],
  ["af-jiangsu-aoshen-pi", "L", 20],
  ["svc-tyut-materials", "L", 18],
  ["svc-tyust-materials", "L", 16],
  ["svc-scu-polymer", "L", 22],
  ["svc-swjtu-materials", "L", 20],
  ["svc-lut-materials", "L", 16],
  ["svc-guet-electronic", "L", 16],
  ["svc-gxu-civil", "L", 16],
  ["svc-gzu-materials", "L", 16],
  ["svc-imut-materials", "L", 16],
  ["svc-xju-materials", "L", 16],
  ["svc-ncu-materials", "L", 18],
  ["svc-yangtze-univ-pe", "L", 16],
  ["svc-stc-shanghai", "L", 22],
  ["svc-cmiit-anhui", "L", 22],
  ["eq-jiangsu-afp-machine", "L", 20],
  ["ad-shandong-aerogel", "L", 18],
  ["fin-changzhou-spar-pultrusion", "L", 18],
  ["af-zhongan-pi-changchun", "L", 18],
  ["cf-jilin-bxs-cf", "L", 18],
  ["cf-neimenggu-baotou-cf", "L", 16],

  // ─────────────── S (区域小厂 / 中小工程承包商) ───────────────
  ["fin-jiangyin-jiacheng-bmc", "S", 6],
  ["fin-shandong-wanshida-smc", "S", 5],
  ["fin-shanghai-yingfei-bmc", "S", 5],
  ["fin-zhejiang-taizhou-yacht", "S", 5],
  ["fin-zhejiang-wenzhou-yacht", "S", 5],
  ["fin-shandong-yantai-yacht", "S", 5],
  ["fin-liaoning-dalian-marine", "S", 5],
  ["fin-shanghai-marine-frp", "S", 6],
  ["fin-jiangsu-yongma-anticorrosion", "S", 6],
  ["fin-shandong-anticorrosion", "S", 6],
  ["fin-hebei-cangzhou-frp", "S", 6],
  ["fin-hebei-baoding-frp", "S", 4],
  ["fin-hebei-xingtai-pul", "S", 4],
  ["fin-sichuan-deyang-frp", "S", 5],
  ["fin-sichuan-mianyang-cf", "S", 5],
  ["fin-sichuan-pul-pole", "S", 4],
  ["eq-harbin-fil-winder", "S", 6],
  ["eq-shanghai-ndt-composite", "S", 6],
  ["rs-jiangxi-shenghua-resin", "S", 4],
  ["rs-shanxi-yuanxing-resin", "S", 4],
  ["rs-guangxi-fragrant", "S", 4],
  ["gf-shanxi-glass-fiber", "S", 5],
  ["gf-yunnan-glass-fiber", "S", 5],
  ["gf-xinjiang-glass-fiber", "S", 5],
  ["bf-jiangsu-haoyu-basalt", "S", 5],
  ["bf-guizhou-basalt", "S", 5],
  ["fin-3dp-continuous-cf", "S", 6],
  ["svc-cf-recycling-jiangsu", "S", 6],

  // ─────────────── M (中型厂) ───────────────
  ["ad-suzhou-dubomai-honeycomb", "M", 10],
  ["ad-anhui-honeycomb", "M", 8],
  ["ad-zhejiang-pp-honeycomb", "M", 8],
];

async function main() {
  console.log(`Backfilling ${TIERS.length} v4 rows…`);

  for (const [id, tier, prio] of TIERS) {
    const res = await db
      .update(supplierListings)
      .set({ scaleTier: tier, brandPriority: prio, updatedAt: new Date() })
      .where(sql`${supplierListings.id} = ${id}`);
    console.log(`  ✓ ${id}  ${tier}  prio=${prio}  affected=${res.rowCount ?? "?"}`);
  }

  // Default any remaining v4 rows (none expected) to M with brand_priority=8.
  const fallback = await db
    .update(supplierListings)
    .set({ scaleTier: "M", brandPriority: 8, updatedAt: new Date() })
    .where(sql`${supplierListings.scaleTier} IS NULL AND ${supplierListings.verified} = false`);
  console.log(`Fallback M-tier applied to ${fallback.rowCount ?? "?"} remaining rows.`);

  console.log("v4 backfill complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
