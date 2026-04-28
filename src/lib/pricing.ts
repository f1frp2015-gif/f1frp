// Single source of truth for plan pricing. Used by /pricing page,
// /api/checkout, and admin reports.
//
// Prices in cents (CNY). Stripe price IDs read from env at runtime so the same
// code works in test/prod without rebuilding.

import type { MembershipTier } from "./membership";

export type PlanId =
  | "free"
  | "pro_monthly"
  | "pro_yearly"
  // Deprecated 2026-04-27: kept in type so historic subscriptions still
  // resolve, but removed from PLANS array — never offered on /pricing.
  | "student"
  | "team_yearly"
  | "supplier_verified"
  | "supplier_featured";

export type Plan = {
  id: PlanId;
  audience: "personal" | "supplier";
  tier: MembershipTier;
  // Display
  nameZh: string;
  nameEn: string;
  taglineZh: string;
  taglineEn: string;
  // Price
  priceCents: number; // CNY
  period: "month" | "year" | "once" | "free";
  badgeZh?: string;
  badgeEn?: string;
  // Features (Chinese for now; en mirrored on /pricing page)
  featuresZh: string[];
  featuresEn: string[];
  // Stripe (filled at runtime from env)
  stripePriceEnvKey?: string;
  // Trial
  trialDays?: number;
  // Featured 名额限制
  perCategoryLimit?: number;
};

// 2026-04-27 strategy update — f1frp.com 中文站走免费平台路线，仅对高频
// AI 用户保留一档付费（pro 月/年）。供应商端一切年费废除，企业出海变现走
// /overseas 的「按有效 RFQ 付费 + 可选代理分成」路径。Student / Team /
// Supplier verified / Supplier featured 套餐已下架。
export const PLANS: Plan[] = [
  {
    id: "free",
    audience: "personal",
    tier: "free",
    nameZh: "免费版",
    nameEn: "Free",
    taglineZh: "复材站基础访问 — 永久免费",
    taglineEn: "Full base access — free forever",
    priceCents: 0,
    period: "free",
    featuresZh: [
      "全部 DB 浏览（材料 / 配方 / 标准 / 论文 / 专利 / 供应商）",
      "AI 问答 10 次/天",
      "下载 10 次/月",
      "社区问答、新内容订阅",
    ],
    featuresEn: [
      "Full DB browsing",
      "AI Q&A 10/day",
      "Downloads 10/month",
      "Community Q&A and content subscription",
    ],
  },
  {
    id: "pro_monthly",
    audience: "personal",
    tier: "pro",
    nameZh: "AI 高频版（月付）",
    nameEn: "AI Pro (Monthly)",
    taglineZh: "AI 重度用户专享 — 工程师 / 设计师 / 研究员",
    taglineEn: "For heavy AI users — engineers, designers, researchers",
    priceCents: 2900,
    period: "month",
    trialDays: 7,
    featuresZh: [
      "AI 问答无限次",
      "下载无限（PDF / CAD / TDS）",
      "完整论文/专利 AI 中文摘录",
      "选材推荐器 + 替代材料分析",
      "新增论文 / 专利 即时推送",
      "1:1 RFQ 询盘直达供应商",
    ],
    featuresEn: [
      "Unlimited AI Q&A",
      "Unlimited downloads",
      "Full AI commentary on papers/patents",
      "Material recommender + alternatives",
      "Real-time alerts on new papers/patents",
      "1:1 RFQ to suppliers",
    ],
    stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
  {
    id: "pro_yearly",
    audience: "personal",
    tier: "pro",
    nameZh: "AI 高频版（年付）",
    nameEn: "AI Pro (Yearly)",
    taglineZh: "省 17%，一年一次省心",
    taglineEn: "Save 17% with annual billing",
    priceCents: 28800,
    period: "year",
    trialDays: 7,
    badgeZh: "推荐",
    badgeEn: "Recommended",
    featuresZh: [
      "包含 AI 高频版（月付）全部权益",
      "年付立省 ¥60",
      "可随时退订，按比例退款",
    ],
    featuresEn: [
      "All AI Pro Monthly features",
      "Save ¥60/year",
      "Cancel anytime, prorated refund",
    ],
    stripePriceEnvKey: "STRIPE_PRICE_PRO_YEARLY",
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function personalPlans(): Plan[] {
  return PLANS.filter((p) => p.audience === "personal");
}

export function supplierPlans(): Plan[] {
  return PLANS.filter((p) => p.audience === "supplier");
}

export function formatPrice(cents: number, period: Plan["period"], lang: "zh" | "en" = "zh"): string {
  if (cents === 0 || period === "free") return lang === "zh" ? "免费" : "Free";
  const yuan = cents / 100;
  const base = lang === "zh" ? `¥${yuan.toLocaleString("zh-CN")}` : `¥${yuan.toLocaleString("en-US")}`;
  const suffix =
    period === "month"
      ? lang === "zh"
        ? "/月"
        : "/mo"
      : period === "year"
      ? lang === "zh"
        ? "/年"
        : "/yr"
      : "";
  return `${base}${suffix}`;
}
