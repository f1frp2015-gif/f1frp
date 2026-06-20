// getfrp Sourcing Desk · D3 — AD/CVD 贸易救济情报库 (v1 静态种子库, 无 DB)。
//
// 为什么存在:`landed.ts` 历史上**明确不含 AD/CVD**,等于给海外买家一个"有毒"的落地价
// —— 玻纤反倾销/反补贴是中国 GFRP 落地成本的头号不确定性(EU 玻纤织物 AD 34–69% 等)。
//
// ⚠️ 最高约束(决定对不对):这些措施**主要咬玻纤本身(HS 7019)与特定成品(如门板)**,
// 不是无差别打所有 FRP 拉挤型材(HS 3916)。一根型材是否在 scope、税率多少,取决于逐单
// HS 归类与原产地裁定。因此本模块**只报"潜在敞口上限 + 该核哪一项 + 逐单核 HS",
// 永不对所有 FRP 断言一个硬税率**(过度断言 = 工具自己变有毒)。对齐 feedback_ai_tool_atomic_data:
// 返回原子 summary + 预算好的派生值 + 权威措施名 + 不臆造。
//
// v1 = 代码内静态种子(下方 rate/日期为编写时口径,以 source 为准);v2 升级为
// `f1frp-trade-remedy-digest` 技能 + `trade_remedy_measures` 表(仿 price_reports 草稿→人工终审)。

import type { ProductCategory } from "@/lib/sourcing/spec";
import { hsForCategory, type TariffRegion } from "@/lib/data/tariff";

export type RemedyKind = "AD" | "CVD" | "AD+CVD" | "section301" | "circumvention" | "safeguard";
export type RemedyStatus = "in_force" | "preliminary" | "sunset_review" | "expiring" | "expired";

export interface TradeRemedyMeasure {
  id: string;
  destination: TariffRegion; // US | EU | CA
  origin: string; // "CN" | "CN-via-EG/BH/TH" ...
  productScope: string; // 人读 scope（中文）
  scopeEn: string;
  hsCodes: string[]; // 主要 7019(玻纤)，部分成品 3925/3926
  appliesTo: ProductCategory[]; // 可能命中的品类（保守宽匹配；型材一般不纳入玻纤织物措施）
  kind: RemedyKind;
  rateMaxPct: number; // 从价税上限，% of customs value（0 = 复审/待终裁，未知）
  basis: string;
  status: RemedyStatus;
  effectiveFrom?: string; // ISO
  expiresOn?: string; // ISO（如 Section 301 排除 2026-11-10）
  sunsetReview?: string; // ISO（到期复审启动日）
  source: { name: string; url?: string; retrievedOn: string };
  caveat: string;
}

// 种子数据 — 源自 vault 2026-06-17-getfrp定位v3（已附权威源）。rate/日期为编写时口径。
export const TRADE_REMEDIES: TradeRemedyMeasure[] = [
  {
    id: "eu-cn-glassfiber-fabric-ad",
    destination: "EU",
    origin: "CN",
    productScope: "欧盟对华玻纤织物（机织/缝编）反倾销",
    scopeEn: "Woven and/or stitched glass fibre fabrics",
    hsCodes: ["7019"],
    appliesTo: ["panel", "custom"],
    kind: "AD",
    rateMaxPct: 69,
    basis: "customs value (CIF)",
    status: "in_force",
    source: { name: "EU Taxation & Customs Union / policy.trade.ec.europa.eu", retrievedOn: "2026-06-17" },
    caveat: "针对玻纤织物输入品（34–69%）；拉挤成品是否含此输入需逐单核 HS 与 scope。",
  },
  {
    id: "eu-cn-glassfiber-anticircumvention",
    destination: "EU",
    origin: "CN-via-EG/BH/TH",
    productScope: "玻纤织物反规避（中资 埃及/巴林/泰国 转口延伸）",
    scopeEn: "Anti-circumvention extension (Egypt/Bahrain/Thailand)",
    hsCodes: ["7019"],
    appliesTo: ["panel", "custom"],
    kind: "circumvention",
    rateMaxPct: 25.4,
    basis: "customs value",
    status: "in_force",
    source: { name: "Global Trade Alert / EU Law Live", retrievedOn: "2026-06-17" },
    caveat: "China+1 第三国转口同样受限（11–25.4%）；落地前必核原产地。",
  },
  {
    id: "eu-cn-continuous-glassfiber-cvd-review",
    destination: "EU",
    origin: "CN",
    productScope: "欧盟对华连续玻纤制品反补贴 到期复审",
    scopeEn: "Continuous filament glass fibre products CVD sunset review",
    hsCodes: ["7019"],
    appliesTo: ["panel", "custom", "rebar"],
    kind: "CVD",
    rateMaxPct: 0,
    basis: "customs value",
    status: "sunset_review",
    sunsetReview: "2026-02-01",
    source: { name: "policy.trade.ec.europa.eu", retrievedOn: "2026-06-17" },
    caveat: "复审中，税率与续期结果待定 → 仅作不确定性预警，不给硬数。",
  },
  {
    id: "us-cn-fiberglass-door-panels-adcvd",
    destination: "US",
    origin: "CN",
    productScope: "美国对华 fiberglass door panels 反倾销/反补贴",
    scopeEn: "Fiberglass door panels AD/CVD",
    hsCodes: ["3925", "3926"],
    appliesTo: ["panel"],
    kind: "AD+CVD",
    rateMaxPct: 0,
    basis: "customs value",
    status: "preliminary",
    effectiveFrom: "2026-06-09",
    source: { name: "Federal Register / USDOC", retrievedOn: "2026-06-17" },
    caveat: "终裁阶段；仅成品门板 scope，型材/格栅一般不在内。税率待终裁填。",
  },
  {
    id: "us-cn-section301-exclusion-expiry",
    destination: "US",
    origin: "CN",
    productScope: "美国 Section 301 排除清单到期（之后部分 HS 可能回到加征）",
    scopeEn: "Section 301 exclusion expiry",
    hsCodes: ["3916", "3925", "7019"],
    appliesTo: ["profile", "grating", "rebar", "rod", "tube", "panel", "custom"],
    kind: "section301",
    rateMaxPct: 25,
    basis: "customs value",
    status: "expiring",
    expiresOn: "2026-11-10",
    source: { name: "USTR", retrievedOn: "2026-06-17" },
    caveat: "排除到期后部分 HS 可能回到 301 加征（最高 25%）；以到期日为预警锚，不预设必加。",
  },
];

export interface RemedyExposure {
  measures: TradeRemedyMeasure[];
  /** 始终 0：scope/归类不确定，永不断言一定适用。 */
  exposureMinPct: number;
  /** 已生效/初裁/到期项的从价税上限（ceiling）。0 = 仅复审/待定。 */
  exposureMaxPct: number;
  hasUncertain: boolean;
  /** 人读预警，含措施名 + 上限 + 到期/复审 + "逐单核 HS 与原产地"。 */
  warning: string;
  /** 权威措施名，供模型引用、防臆造。 */
  authoritativeNames: string[];
}

const ACTIVE: RemedyStatus[] = ["in_force", "preliminary", "expiring"];

// 保守宽匹配:destination 命中 + (品类 ∈ appliesTo 或 HS 前缀 ∈ hsCodes)。
export function lookupTradeRemedy(args: {
  hs?: string;
  destination: TariffRegion;
  origin?: string;
  category?: ProductCategory;
}): RemedyExposure {
  const { destination, category } = args;
  const hs = args.hs ?? (category ? hsForCategory(category) : undefined);
  const measures = TRADE_REMEDIES.filter((m) => {
    if (m.destination !== destination) return false;
    if (m.status === "expired") return false;
    const byCat = category ? m.appliesTo.includes(category) : false;
    const byHs = hs ? m.hsCodes.some((h) => hs.startsWith(h)) : false;
    return byCat || byHs;
  });

  const exposureMaxPct = measures
    .filter((m) => ACTIVE.includes(m.status) && m.rateMaxPct > 0)
    .reduce((mx, m) => Math.max(mx, m.rateMaxPct), 0);
  // scope/归类不确定 → 始终从 0 起;有任一匹配即"不确定"。
  const hasUncertain = measures.length > 0;
  const authoritativeNames = measures.map((m) => m.productScope);

  let warning = "";
  if (measures.length) {
    const bits: string[] = [];
    if (exposureMaxPct > 0) {
      bits.push(`潜在 AD/CVD/301 敞口上限约 ${exposureMaxPct}%（仅当按相关税号归类时才适用）`);
    }
    const review = measures.find((m) => m.status === "sunset_review");
    if (review) bits.push(`另有反补贴到期复审进行中（${review.sunsetReview ?? "日期待定"}）`);
    const expiring = measures.find((m) => m.status === "expiring" && m.expiresOn);
    if (expiring) bits.push(`Section 301 排除将于 ${expiring.expiresOn} 到期`);
    warning =
      `⚠️ 贸易救济敞口（${destination}）：` +
      bits.join("；") +
      `。涉及措施：${authoritativeNames.join("、")}。` +
      `实际是否适用、税率多少取决于逐单 HS 归类 + 原产地裁定 —— 承诺前必由曜一团队核税，本值为指示性上限，非报价。`;
  }

  return { measures, exposureMinPct: 0, exposureMaxPct, hasUncertain, warning, authoritativeNames };
}
