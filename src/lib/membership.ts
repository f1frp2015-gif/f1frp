/**
 * Tier-gating shim — 2026-05-24
 *
 * 当前阶段全站取消收费,所有用户视为同一权限层。本文件保留 type/导出名以维持
 * 历史调用点兼容(避免一次性大改),但所有 gate 检查都直通,benefit 全部解锁,
 * 等级标签固定为「免费」。日后重启商业化时:
 *   1) 恢复 TIER_RANK / TIER_LABEL / TIER_BENEFITS 的分层值
 *   2) 让 gateByTier 真正校验 effectiveTier
 *   3) 在调用点(目前都假定 ok:true)上层补 UI/CTA 引导
 */

import { type User } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export type MembershipTier = "free" | "basic" | "pro" | "enterprise";

export function tierLabel(_tier: MembershipTier, lang: "zh" | "en" = "zh"): string {
  return lang === "en" ? "Free" : "免费";
}

export function isExpired(_expiry: Date | null | undefined): boolean {
  return false;
}

export function isOnTrial(_user: Pick<User, "trialUntil">): boolean {
  return false;
}

export function effectiveTier(
  _user: Pick<User, "membershipTier" | "membershipExpiry" | "trialUntil">,
): MembershipTier {
  return "free";
}

export function meetsTier(_current: MembershipTier, _required: MembershipTier): boolean {
  return true;
}

export type TierBenefits = {
  aiCallsPerDay: number;
  downloadsPerMonth: number;
  hasRfq: boolean;
  hasFullPapers: boolean;
  hasFullPatents: boolean;
  hasMaterialRecommender: boolean;
  hasTeamWorkspace: boolean;
  hasApi: boolean;
};

const UNLIMITED: TierBenefits = {
  aiCallsPerDay: -1,
  downloadsPerMonth: -1,
  hasRfq: true,
  hasFullPapers: true,
  hasFullPatents: true,
  hasMaterialRecommender: true,
  hasTeamWorkspace: true,
  hasApi: true,
};

export const TIER_BENEFITS: Record<MembershipTier, TierBenefits> = {
  free: UNLIMITED,
  basic: UNLIMITED,
  pro: UNLIMITED,
  enterprise: UNLIMITED,
};

export function benefitsFor(_tier: MembershipTier): TierBenefits {
  return UNLIMITED;
}

export type GateResult =
  | { ok: true; user: User; tier: MembershipTier }
  | { ok: false; status: 401 | 403; reason: string };

// 全直通版 gateByTier — 仍然要求登录(401),但不再校验等级。
// 仍读一次 users 行,因为下游调用点会用 user.id / user.email。
export async function gateByTier(_required: MembershipTier): Promise<GateResult> {
  // 认证按 profile 分流(domestic→Auth.js、global→Clerk),见 lib/auth/session.ts。
  const me = await getCurrentUser();
  if (!me) {
    return { ok: false, status: 401, reason: "未登录" };
  }
  return { ok: true, user: me, tier: "free" };
}

const STUDENT_EMAIL_PATTERNS = [
  /\.edu\.cn$/i,
  /\.edu$/i,
  /\.ac\.cn$/i,
  /\.edu\.hk$/i,
  /\.edu\.tw$/i,
];

export function isStudentEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase();
  return STUDENT_EMAIL_PATTERNS.some((re) => re.test(domain));
}
