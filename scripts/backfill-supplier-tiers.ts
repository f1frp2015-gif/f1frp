// Backfill scale_tier + brand_priority for existing 108 supplier rows.
// scale_tier: XL=巨头(>10亿/上市头部) L=头部 M=中规模 S=区域小厂
// brand_priority: 30=旗舰 25=头部上市 20=知名 15=细分龙头 10=普通品牌 0=其它
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

type Tier = "XL" | "L" | "M" | "S";
const M: Array<[string, Tier, number]> = [
  // ── Fiber ──────────────────────────
  ["sup-jushi", "XL", 30],
  ["sup-cpic", "XL", 28],
  ["sup-taishan", "XL", 28],
  ["sup-shandong-bx", "L", 20],
  ["sup-cih", "L", 20],
  ["sup-weibo", "M", 12],
  ["raw-dongyue-glass", "M", 12],
  ["sup-fiberglass-supplier1", "M", 10],
  ["sup-honghe", "L", 18],
  ["sup-zhongfu", "XL", 30],
  ["s5", "XL", 30],
  ["sup-guangwei", "XL", 30],
  ["sup-zhongjian", "L", 22],
  ["sup-hengshen", "L", 22],
  ["sup-tuozhan", "L", 20],
  ["sup-jilin-chemfiber", "L", 20],
  ["raw-sinopec-shpc", "XL", 25],
  ["raw-bluestar-fibers", "L", 18],
  ["sup-basalt-hangtian", "L", 22],
  ["sup-jiwazhuang", "M", 12],
  ["raw-sichuan-basalt-jzx", "M", 10],
  ["sup-taihe", "XL", 28],
  ["sup-hongyi-aramid", "M", 12],

  // ── Resin ──────────────────────────
  ["sup-wanhua", "XL", 30],
  ["sup-ashland", "XL", 26],
  ["sup-akzonobel-china", "XL", 25],
  ["sup-hexion", "XL", 25],
  ["sup-shangwei", "L", 22],
  ["s3", "M", 15],
  ["sup-yabang", "M", 15],
  ["raw-yabang-vinyl", "M", 12],
  ["sup-deshan", "M", 15],
  ["sup-tianhe", "M", 12],
  ["sup-funing", "M", 10],
  ["raw-jiangsu-sanmu-pan", "M", 12],
  ["raw-zhejiang-wanyuan", "M", 10],
  ["raw-changsha-huaxing", "M", 10],

  // ── Manufacturer (49) ──────────────
  ["sup-sinomatech", "XL", 30],
  ["fin-sinoma-lianzhong", "XL", 28],
  ["sup-jinfeng", "XL", 30],
  ["fin-envision-blade", "XL", 25],
  ["fin-aerolan", "L", 22],
  ["fin-sany-blade", "XL", 25],
  ["sup-tianshunwind", "XL", 25],
  ["sup-timesxc", "XL", 28],
  ["sup-shengyi", "XL", 28],
  ["sup-kingboard", "XL", 25],
  ["fin-comac-supplier", "XL", 28],
  ["fin-avic-composite", "XL", 28],
  ["sup-aerospace", "XL", 26],
  ["fin-rail-crrc-comp", "XL", 25],
  ["sup-crrc-new", "XL", 28],
  ["sup-zhongcai-tank", "L", 20],
  ["sup-jicheng", "L", 18],
  ["sup-jiuding", "L", 18],
  ["s6", "L", 18],
  ["sup-airtech", "L", 18],
  ["sup-armacell-china", "L", 18],
  ["sup-diab-china", "L", 18],
  ["sup-carbontech", "M", 12],
  ["sup-yachts-huayang", "M", 12],
  ["sup-shida-carbon", "M", 12],
  ["sup-hengxin", "M", 12],
  ["fin-jeanneau-jr", "M", 12],
  ["sup-xintai", "L", 15],
  ["fin-pultrude-yifei", "M", 12],
  ["sup-xinlong", "M", 12],
  ["fin-tank-yulong", "M", 10],
  ["sup-yangguan-taian", "M", 10],
  ["sup-tesla-supplier", "M", 12],
  ["fin-pultrude-junlong", "M", 10],
  ["fin-construct-mingxin", "M", 10],
  ["sup-yonglan", "M", 10],
  ["fin-aocheng-auto", "M", 12],
  ["sup-feida", "M", 12],
  ["sup-marine-xinshunde", "M", 10],
  ["s2", "M", 12],
  ["sup-zaoqiang", "M", 10],
  ["sup-jxlanyue", "M", 10],
  ["sup-bgi-sports", "M", 10],
  ["sup-hainan-marine", "M", 10],
  ["sup-greensports", "M", 10],
  ["fin-zhuhai-yacht", "M", 10],

  // ── Equipment ──────────────────────
  ["sup-hrbfuhe", "L", 18],
  ["sup-tianhua", "M", 12],
  ["eq-shanghai-faerstos", "M", 12],
  ["eq-dalian-hengzheng", "M", 10],
  ["eq-jinhe-001", "M", 10],
  ["eq-haitian-003", "M", 12],
  ["eq-rongyu-004", "M", 12],
  ["eq-shengdi-002", "M", 12],

  // ── Mold ───────────────────────────
  ["md-jinghu-202", "M", 12],
  ["md-tianjin-ufp", "M", 10],
  ["md-fenghua-201", "M", 10],
  ["md-haiyang-204", "M", 10],
  ["sup-minghe-mold", "M", 10],
  ["md-suzhou-honghua", "M", 10],
  ["md-changxin-203", "M", 10],

  // ── Tooling ────────────────────────
  ["tl-zhongke-102", "L", 18],
  ["tl-beijing-time-peak", "L", 15],
  ["tl-tianhe-104", "M", 10],
  ["tl-yongchang-103", "M", 10],
  ["tl-sandetai-101", "M", 10],

  // ── Service ────────────────────────
  ["sup-sgs-china", "XL", 26],
  ["sup-cti", "XL", 26],
  ["sup-nfti", "L", 22],
  ["sup-donghua-mold", "L", 18],
  ["sup-chemlease-cn", "L", 15],
];

async function main() {
  let n = 0;
  for (const [id, tier, prio] of M) {
    const r = await db
      .update(supplierListings)
      .set({ scaleTier: tier, brandPriority: prio })
      .where(sql`${supplierListings.id} = ${id}`)
      .returning({ id: supplierListings.id });
    if (r.length) n++;
    else console.warn(`  ! id not found: ${id}`);
  }
  const sum = await db.execute(
    sql`SELECT scale_tier, count(*)::int FROM supplier_listings GROUP BY scale_tier ORDER BY scale_tier`,
  );
  console.log(`Updated ${n}/${M.length} rows.`);
  console.log("Tier distribution:", sum.rows);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
