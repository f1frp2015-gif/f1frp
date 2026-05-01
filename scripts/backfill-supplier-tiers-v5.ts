// Backfill scale_tier + brand_priority for v5 rows. Defaults remaining
// rows (verified=false AND scale_tier IS NULL) to M tier with prio=8.

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

type Tier = "XL" | "L" | "M" | "S";

const TIERS: Array<[string, Tier, number]> = [
  // XL: H2 listed players, regional bases of major OEMs, Tier-1 JV
  ["fin-guofu-hydrogen", "XL", 26],
  ["fin-shunhua-hydrogen-shanghai", "XL", 22],
  ["fin-sany-zhangbei-blade", "XL", 22],
  ["fin-envision-jiangyin-blade", "XL", 24],
  ["fin-csic-haizhuang-yangjiang", "XL", 24],
  ["fin-sinoma-funing-blade", "XL", 22],
  ["fin-zhuzhou-times-blade-jx", "XL", 22],
  ["fin-faw-fujie-cf", "XL", 24],
  ["fin-chongqing-changan-composite", "XL", 22],
  ["fin-fujida-bicycle", "XL", 22],
  ["fin-xidesheng-bicycle", "XL", 22],
  ["fin-merida-china-bicycle", "XL", 22],
  ["fin-weihai-fishingrod-cluster", "XL", 22],

  // L: well-known mid-large, established equipment makers, prepreg specialty
  ["fin-haidelisen-h2", "L", 18],
  ["fin-shandong-dongying-blade", "L", 16],
  ["cf-jiangsu-tianniao-xuzhou", "L", 18],
  ["cf-jiangsu-cofco-prepreg", "L", 16],
  ["cf-shanghai-tongkang", "L", 16],
  ["eq-jiangsu-hongkai-pul", "L", 18],
  ["eq-zhejiang-rtm-mixer", "L", 16],
  ["fin-recycled-cf-product", "L", 16],
  ["fin-changzhou-zhongfu-pul", "L", 16],
  ["fb-changshu-noncrimp", "L", 18],
  ["fb-shandong-fiber-fabric", "L", 16],
  ["ad-shandong-runhua-initiator", "L", 16],
  ["ad-jiangsu-toughener-rubber", "L", 16],
  ["ad-jiangsu-sizing-agent", "L", 16],
  ["ad-wuxi-gf-compound", "L", 16],

  // S: regional small/mid plants, SME tooling/mold/yacht
  ["fb-jiangsu-wujiang-fabric", "S", 6],
  ["fb-zhejiang-shaoxing-fabric", "S", 5],
  ["fin-xiamen-yifeng-cf", "S", 5],
  ["fin-nantong-ruifeng-pul", "S", 5],
  ["fin-zhenjiang-huachang-pul", "S", 5],
  ["fin-shandong-linyi-pul", "S", 5],
  ["fin-hubei-pul-bridge-frp", "S", 5],
  ["fin-hebei-baoding-tank", "S", 4],
  ["fin-shandong-zibo-pipe", "S", 5],
  ["fin-jiangsu-yancheng-pipe", "S", 5],
  ["fin-shanghai-yaohua-smc", "S", 6],
  ["fin-ningbo-ehe-composite", "S", 6],
  ["rs-gansu-resin-lanzhou", "S", 4],
  ["rs-yunnan-resin", "S", 4],
  ["rs-shaanxi-xian-resin", "S", 4],
  ["rs-hebei-bismaleimide", "S", 6],
  ["ad-shanghai-pruvent-flame", "S", 6],
  ["eq-shandong-ultrasonic", "S", 6],
  ["md-jiangsu-yancheng-blade-mold", "S", 6],
  ["md-zhejiang-yacht-mold", "S", 5],
  ["md-jiangsu-auto-cf-mold", "S", 6],
  ["tl-jiangsu-sealant-tape", "S", 5],
  ["tl-shanghai-peelply", "S", 5],
];

async function main() {
  console.log(`Backfilling ${TIERS.length} v5 rows…`);

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

  console.log("v5 backfill complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
