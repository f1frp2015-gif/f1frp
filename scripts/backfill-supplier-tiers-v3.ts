// Backfill scale_tier + brand_priority for the 100 v3 rows seeded by
// scripts/seed-china-supply-chain-v3.ts. Defaults the rest to M (8).
//
// scale_tier semantics (same as v1 backfill):
//   XL = 巨头(>10亿/上市头部/国家级旗舰)
//   L  = 头部 / 上市 / 重要研究院 / 央企子公司
//   M  = 中规模
//   S  = 区域小厂 / 工艺辅材小厂

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

type Tier = "XL" | "L" | "M" | "S";

const TIERS: Array<[string, Tier, number]> = [
  // ─────────────── XL (旗舰 / 上市头部 / 国家级机构) ───────────────
  ["svc-ccia-association", "XL", 28],
  ["svc-bv-china", "XL", 26],
  ["svc-tuv-sud-china", "XL", 26],
  ["svc-dnv-china", "XL", 26],
  ["svc-ccs-rules", "XL", 28],
  ["svc-caeri-chongqing", "XL", 25],
  ["fin-tianhai-h2", "XL", 25],
  ["fin-byd-precision-composite", "XL", 28],
  ["fin-yantai-cimc-raffles", "XL", 26],
  ["fin-jiangsu-windblade-yancheng", "XL", 26],
  ["fin-fujian-windblade-fuqing", "XL", 25],
  ["fin-guangdong-windblade-yangjiang", "XL", 26],
  ["fin-xian-aircraft-composite", "XL", 28],
  ["fin-cac-composite", "XL", 28],
  ["fin-hongdu-composite", "XL", 24],
  ["fin-guizhou-aviation", "XL", 24],
  ["fin-hafei-composite-extra", "XL", 23],
  ["fin-hubei-dongfeng-composite", "XL", 25],
  ["fin-changchun-faw-composite", "XL", 25],
  ["gf-hubei-fiberglass", "XL", 25], // 菲利华 listed
  ["rs-zhejiang-huafeng", "XL", 24], // 华峰 group
  ["rs-fujian-haoyuan", "XL", 22], // 海源 listed
  ["rs-anhui-guofeng", "XL", 22], // 国风 listed
  ["ad-jiangsu-yade-flame", "XL", 22], // 雅克 listed

  // ─────────────── L (头部 / 上市 / 重要院所) ───────────────
  ["svc-cgfa-association", "L", 20],
  ["svc-tc39-frp-standards", "L", 20],
  ["svc-buct-cf-lab", "L", 20],
  ["svc-hit-composite", "L", 22],
  ["svc-cas-nimte", "L", 22],
  ["svc-cas-imr", "L", 22],
  ["svc-buaa-materials", "L", 22],
  ["svc-tsinghua-materials", "L", 22],
  ["svc-sjtu-materials", "L", 20],
  ["svc-bit-materials", "L", 20],
  ["svc-tongji-aviation", "L", 18],
  ["svc-nuaa-materials", "L", 20],
  ["svc-nudt-fiber", "L", 22],
  ["svc-tjpu-composite", "L", 18],
  ["svc-bgrimm-research", "L", 20],
  ["svc-fjirsm", "L", 18],
  ["svc-cas-lzihp", "L", 18],
  ["svc-jlu-materials", "L", 18],
  ["svc-whut-composite", "L", 18],
  ["svc-xjtu-composite", "L", 18],
  ["svc-cqu-aerospace", "L", 16],
  ["fin-sinoma-pv", "L", 22],
  ["fin-sinoma-lianzhong-pv", "L", 20],
  ["fin-blue-energy-h2", "L", 18],
  ["cf-yingyou-spinning", "L", 22],
  ["cf-baojing-carbon", "L", 18],
  ["cf-jingbo-precursor", "L", 22], // 金博 listed
  ["cf-tianniao-extra", "L", 18],
  ["gf-anhui-danfeng", "L", 18],
  ["fin-anhui-jianghuai-frp", "L", 20], // JAC listed
  ["ad-jiangsu-pmi-foam", "L", 18], // 兆鋆 listed
  ["af-uhmwpe-zhejiang", "L", 18], // 千禧龙
  ["fin-changzhou-tianma-pul", "L", 16],

  // ─────────────── S (区域小厂 / 工艺辅材小厂) ───────────────
  ["fin-yangzhou-grating", "S", 6],
  ["fin-fosran-grating", "S", 6],
  ["fin-tangshan-frp-tank", "S", 5],
  ["fin-shandong-pipe-frp", "S", 5],
  ["fin-anhui-pul-pipe", "S", 4],
  ["fin-henan-pultrusion-bridge", "S", 5],
  ["fin-henan-frp-rebar", "S", 5],
  ["fin-guangxi-pul-bridge", "S", 4],
  ["fin-shaanxi-pul-frp", "S", 4],
  ["fin-qingdao-hailieren-yacht", "S", 6],
  ["fin-guangdong-marine-frp", "S", 5],
  ["fin-hainan-marine-frp", "S", 4],
  ["fin-xiamen-sport-cf", "S", 6],
  ["fin-quanzhou-fishrod", "S", 5],
  ["fin-dongguan-cf-products", "S", 5],
  ["fin-shenzhen-drone-cf", "S", 5],
  ["md-jiangsu-yongmao-mold", "S", 6],
  ["md-shandong-haiyang-mold", "S", 5],
  ["md-changchun-rail-mold", "S", 6],
  ["md-shenyang-aero-mold", "S", 8],
  ["tl-jiangsu-vacuum-bag", "S", 5],
  ["tl-tianjin-release-agent", "S", 5],
  ["tl-guangzhou-mold-prep", "S", 4],
  ["eq-jiangsu-hejin-rtm", "S", 6],
  ["eq-shandong-autoclave", "S", 8],
  ["eq-changzhou-pul-line", "S", 8],
  ["eq-shenzhen-cnc-cf", "S", 5],
  ["eq-shanghai-prepreg-line", "S", 6],
  ["ad-shandong-tonghui-coupling", "S", 5],
  ["ad-balsa-zhejiang", "S", 6],
  ["ad-shandong-foam-core", "S", 5],
  ["af-sichuan-shenma", "S", 5],
  ["gf-jiangxi-hengyou", "S", 5],
  ["gf-fujian-jianan-glass", "S", 5],
  ["gf-shandong-fiberglass-spc", "S", 6],
  ["gf-shaanxi-jianhua", "S", 5],
  ["rs-hunan-shenghua", "S", 4],
  ["rs-hubei-feilong", "S", 6],
  ["rs-guangdong-flying-elephant", "S", 5],
  ["rs-jiangsu-baichuan-extra", "S", 4],
  ["fin-fuzhou-marine-frp", "M", 8],

  // ─────────────── M (其它默认中规模) ───────────────
  ["cf-shanghai-petro-cf-extra", "M", 12],
  ["fin-ningbo-junhong-auto", "M", 10],
];

async function main() {
  console.log(`Backfilling ${TIERS.length} v3 rows…`);

  for (const [id, tier, prio] of TIERS) {
    const res = await db
      .update(supplierListings)
      .set({ scaleTier: tier, brandPriority: prio, updatedAt: new Date() })
      .where(sql`${supplierListings.id} = ${id}`);
    console.log(`  ✓ ${id}  ${tier}  prio=${prio}  affected=${res.rowCount ?? "?"}`);
  }

  // Default any v3 rows not in the explicit list to M tier with brand_priority=8.
  // We identify v3 rows as `verified=false AND scale_tier IS NULL`.
  const fallback = await db
    .update(supplierListings)
    .set({ scaleTier: "M", brandPriority: 8, updatedAt: new Date() })
    .where(sql`${supplierListings.scaleTier} IS NULL AND ${supplierListings.verified} = false`);
  console.log(`Fallback M-tier applied to ${fallback.rowCount ?? "?"} remaining rows.`);

  console.log("v3 backfill complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
