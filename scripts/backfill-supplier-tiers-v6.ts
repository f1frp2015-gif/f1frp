// Backfill scale_tier + brand_priority for v6 rows.

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

type Tier = "XL" | "L" | "M" | "S";

const TIERS: Array<[string, Tier, number]> = [
  // XL: listed 龙头 / 国家级航天科工科技 / 海缆 listed
  ["fin-jiangsu-shenma-insulator", "XL", 26], // 神马电力 listed
  ["fin-jinguan-electric-henan", "XL", 24], // 金冠电气 listed
  ["fin-changzhou-tiansheng-rail", "XL", 24], // 天晟新材 listed
  ["fin-zhongtian-marine-cable", "XL", 26], // 中天科技海缆 listed
  ["fin-hengtong-marine", "XL", 26], // 亨通光电海缆 listed
  ["fin-aerospace-hubei-4ad", "XL", 26], // 航天科工四院
  ["fin-aerospace-shanghai-800", "XL", 28], // 上海航天 800 所
  ["fin-aerospace-xian-rocket", "XL", 28], // 航天科技四院
  ["fin-shandong-ceramic-research", "XL", 24], // 国瓷功能 listed
  ["fin-hunan-dingli-cmc", "XL", 22], // 顶立科技 listed
  ["ad-hangzhou-lft-pp", "XL", 22], // 本松新材 listed
  ["ad-shanghai-thermoplastic-pa", "XL", 24], // 上海普利特 listed
  ["fin-aviation-floor-jiangsu", "XL", 22], // 中复神鹰航空地板

  // L: 头部专业厂 / CMC startup / Tier-2 rail / 海工配套
  ["cf-suzhou-saifei-sic", "L", 22],
  ["fin-xian-xinyao-cmc", "L", 20],
  ["cf-zhongan-sic-jiangxi", "L", 16],
  ["fin-zhuzhou-times-insulation", "L", 22],
  ["fin-shandong-taikai-frp-pole", "L", 18],
  ["fin-xiantao-rubber-insulator", "L", 16],
  ["fin-shanghai-shuhai-insulator", "L", 16],
  ["fin-jiangsu-shenfu-rail", "L", 16],
  ["fin-cimc-container-floor", "L", 22], // CIMC subsidiary
  ["fin-tianjin-marine-frp-pipe", "L", 16],
  ["ad-jiangsu-cfrt-thermoplastic", "L", 16],

  // S: 区域中小厂 / SME mold / SME tank
  ["fin-anhui-wuhu-frp-tank", "S", 5],
  ["fin-jiangxi-nanchang-frp", "S", 5],
  ["fin-fujian-zhangzhou-frp", "S", 5],
  ["fin-guangxi-frp-tank-extra", "S", 4],
  ["fin-yunnan-frp-tank", "S", 4],
  ["fin-hainan-frp-equipment", "S", 4],
  ["bf-hebei-cangzhou-basalt", "S", 5],
  ["bf-fujian-basalt-quanzhou", "S", 5],
  ["fb-zhejiang-prepreg-fiber", "S", 6],
  ["eq-sichuan-cnc-cf", "S", 6],
  ["eq-tianjin-resin-injection", "S", 6],
  ["md-jiangsu-rocket-mold", "S", 8],
  ["md-shaanxi-cmc-mold", "S", 8],
];

async function main() {
  console.log(`Backfilling ${TIERS.length} v6 rows…`);

  for (const [id, tier, prio] of TIERS) {
    const res = await db
      .update(supplierListings)
      .set({ scaleTier: tier, brandPriority: prio, updatedAt: new Date() })
      .where(sql`${supplierListings.id} = ${id}`);
    console.log(`  ✓ ${id}  ${tier}  prio=${prio}  affected=${res.rowCount ?? "?"}`);
  }

  const fallback = await db
    .update(supplierListings)
    .set({ scaleTier: "M", brandPriority: 8, updatedAt: new Date() })
    .where(sql`${supplierListings.scaleTier} IS NULL AND ${supplierListings.verified} = false`);
  console.log(`Fallback M-tier applied to ${fallback.rowCount ?? "?"} remaining rows.`);

  console.log("v6 backfill complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
