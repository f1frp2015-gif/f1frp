// Single source of truth for plan pricing. Used by /pricing page,
// /api/checkout, and admin reports.
//
// Prices in cents (CNY). Stripe price IDs read from env at runtime so the same
// code works in test/prod without rebuilding.

import type { MembershipTier } from "./membership";

export type PlanId =
  | "free"
  | "student"
  | "pro_monthly"
  | "pro_yearly"
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

export const PLANS: Plan[] = [
  {
    id: "free",
    audience: "personal",
    tier: "free",
    nameZh: "免费版",
    nameEn: "Free",
    taglineZh: "试一试，不要钱",
    taglineEn: "Try it, no payment needed",
    priceCents: 0,
    period: "free",
    featuresZh: [
      "全部 DB 浏览（材料 / 配方 / 标准 / 论文 / 专利 / 供应商）",
      "AI 问答 5 次/天",
      "下载 5 次/月",
      "论文/专利只看翻译标题，不看 AI 中文摘录",
    ],
    featuresEn: [
      "Full DB browsing",
      "AI Q&A 5/day",
      "Downloads 5/month",
      "Papers/patents: titles only, no AI commentary",
    ],
  },
  {
    id: "student",
    audience: "personal",
    tier: "basic",
    nameZh: "学生版",
    nameEn: "Student",
    taglineZh: "在校生免费用",
    taglineEn: "Free for verified students",
    priceCents: 0,
    period: "free",
    badgeZh: "学校邮箱验证",
    badgeEn: "School email required",
    featuresZh: [
      "AI 问答 30 次/天",
      "下载 50 次/月",
      "论文/专利完整 AI 中文摘录",
      "选材推荐器",
      "毕业论文友好：CCS/MLA 一键引用",
    ],
    featuresEn: [
      "AI Q&A 30/day",
      "Downloads 50/month",
      "Full AI Chinese commentary",
      "Material recommender",
      "Citation export (CCS/MLA)",
    ],
  },
  {
    id: "pro_monthly",
    audience: "personal",
    tier: "pro",
    nameZh: "专业版（月付）",
    nameEn: "Pro (Monthly)",
    taglineZh: "工程师 / 设计师专享",
    taglineEn: "For engineers & designers",
    priceCents: 2900,
    period: "month",
    trialDays: 7,
    featuresZh: [
      "AI 问答无限",
      "下载无限（PDF / CAD / TDS）",
      "1:1 RFQ 询盘（直达供应商）",
      "选材推荐器 + 替代材料分析",
      "完整 AI 中文摘录 + 工程落地建议",
      "新增论文 / 专利 即时推送",
    ],
    featuresEn: [
      "Unlimited AI",
      "Unlimited downloads",
      "1:1 RFQ to suppliers",
      "Material recommender + alternatives",
      "Full AI Chinese commentary",
      "Real-time alerts on new papers/patents",
    ],
    stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
  {
    id: "pro_yearly",
    audience: "personal",
    tier: "pro",
    nameZh: "专业版（年付）",
    nameEn: "Pro (Yearly)",
    taglineZh: "省 17%，一年一次省心",
    taglineEn: "Save 17% with annual billing",
    priceCents: 28800,
    period: "year",
    trialDays: 7,
    badgeZh: "推荐",
    badgeEn: "Recommended",
    featuresZh: [
      "包含专业版（月付）全部权益",
      "年付立省 ¥60",
      "可随时退订，按比例退款",
    ],
    featuresEn: [
      "All Pro Monthly features",
      "Save ¥60/year",
      "Cancel anytime, prorated refund",
    ],
    stripePriceEnvKey: "STRIPE_PRICE_PRO_YEARLY",
  },
  {
    id: "team_yearly",
    audience: "personal",
    tier: "enterprise",
    nameZh: "团队版（年付/席位）",
    nameEn: "Team (Yearly/Seat)",
    taglineZh: "≥3 席，设计院 / 工程公司团队",
    taglineEn: "≥3 seats, for engineering teams",
    priceCents: 128800,
    period: "year",
    featuresZh: [
      "包含专业版全部权益",
      "团队工作区（共享 RFQ / 收藏 / 比对）",
      "私有材料库（上传内部 spec）",
      "REST API 调用",
      "月度行业报告（团队版独家）",
      "管理员后台 + 席位管理",
    ],
    featuresEn: [
      "All Pro features",
      "Team workspace (shared RFQ/saves/compare)",
      "Private material library",
      "REST API access",
      "Monthly industry report",
      "Admin dashboard + seat management",
    ],
    stripePriceEnvKey: "STRIPE_PRICE_TEAM_YEARLY",
  },
  // ── Supplier ──
  {
    id: "supplier_verified",
    audience: "supplier",
    tier: "basic",
    nameZh: "Verified 蓝标版",
    nameEn: "Verified",
    taglineZh: "中小企业首选",
    taglineEn: "For SMB suppliers",
    priceCents: 380000,
    period: "year",
    featuresZh: [
      "蓝标认证（页面 + 列表均显示）",
      "查看完整询盘 + 联系方式",
      "自然搜索排名加权",
      "月度数据洞察（曝光 / 点击 / 询盘）",
      "认证商家 PDF 证书",
    ],
    featuresEn: [
      "Verified blue badge",
      "Full inquiry details + contacts",
      "Boosted search ranking",
      "Monthly insights dashboard",
      "Certified supplier PDF",
    ],
  },
  {
    id: "supplier_featured",
    audience: "supplier",
    tier: "pro",
    nameZh: "Featured 头部版",
    nameEn: "Featured",
    taglineZh: "行业头部，每品类前 10 名",
    taglineEn: "Top 10 per category, capped",
    priceCents: 1880000,
    period: "year",
    perCategoryLimit: 10,
    badgeZh: "限名额",
    badgeEn: "Limited",
    featuresZh: [
      "包含 Verified 全部权益",
      "品类顶部曝光位（首屏前 10 名）",
      "1:N RFQ 优先派发（先得潜在订单）",
      "横幅广告位（材料 / 标准 / 论文页）",
      "专属客户经理 + 半年度行业报告",
      "Featured 标识 + 品类徽章",
    ],
    featuresEn: [
      "All Verified benefits",
      "Top-of-category placement (first 10)",
      "1:N RFQ priority routing",
      "Banner placements",
      "Dedicated success manager + bi-annual report",
      "Featured badge + category emblem",
    ],
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
