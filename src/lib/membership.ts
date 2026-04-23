import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

export type MembershipTier = "free" | "basic" | "pro" | "enterprise";

const TIER_RANK: Record<MembershipTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

const TIER_LABEL: Record<MembershipTier, string> = {
  free: "免费版",
  basic: "学生版",
  pro: "专业版",
  enterprise: "团队版",
};

const TIER_LABEL_EN: Record<MembershipTier, string> = {
  free: "Free",
  basic: "Student",
  pro: "Pro",
  enterprise: "Team",
};

export function tierLabel(tier: MembershipTier, lang: "zh" | "en" = "zh"): string {
  return (lang === "en" ? TIER_LABEL_EN : TIER_LABEL)[tier] ?? "Free";
}

export function isExpired(expiry: Date | null | undefined): boolean {
  if (!expiry) return false;
  return expiry.getTime() < Date.now();
}

export function isOnTrial(user: Pick<User, "trialUntil">): boolean {
  if (!user.trialUntil) return false;
  return user.trialUntil.getTime() > Date.now();
}

export function effectiveTier(
  user: Pick<User, "membershipTier" | "membershipExpiry" | "trialUntil">
): MembershipTier {
  // 试用期内享 pro 权益
  if (isOnTrial(user)) return "pro";
  // 过期则降回 free（学生白名单除外，由 studentVerified 升回 basic）
  if (isExpired(user.membershipExpiry)) return "free";
  return user.membershipTier;
}

export function meetsTier(current: MembershipTier, required: MembershipTier): boolean {
  return TIER_RANK[current] >= TIER_RANK[required];
}

// ─── Tier-based benefit limits ──────────────────────────────────────

export type TierBenefits = {
  aiCallsPerDay: number; // -1 = unlimited
  downloadsPerMonth: number; // -1 = unlimited
  hasRfq: boolean;
  hasFullPapers: boolean;
  hasFullPatents: boolean;
  hasMaterialRecommender: boolean;
  hasTeamWorkspace: boolean;
  hasApi: boolean;
};

export const TIER_BENEFITS: Record<MembershipTier, TierBenefits> = {
  free: {
    aiCallsPerDay: 5,
    downloadsPerMonth: 5,
    hasRfq: false,
    hasFullPapers: false,
    hasFullPatents: false,
    hasMaterialRecommender: false,
    hasTeamWorkspace: false,
    hasApi: false,
  },
  basic: {
    aiCallsPerDay: 30,
    downloadsPerMonth: 50,
    hasRfq: false,
    hasFullPapers: true,
    hasFullPatents: true,
    hasMaterialRecommender: true,
    hasTeamWorkspace: false,
    hasApi: false,
  },
  pro: {
    aiCallsPerDay: -1,
    downloadsPerMonth: -1,
    hasRfq: true,
    hasFullPapers: true,
    hasFullPatents: true,
    hasMaterialRecommender: true,
    hasTeamWorkspace: false,
    hasApi: false,
  },
  enterprise: {
    aiCallsPerDay: -1,
    downloadsPerMonth: -1,
    hasRfq: true,
    hasFullPapers: true,
    hasFullPatents: true,
    hasMaterialRecommender: true,
    hasTeamWorkspace: true,
    hasApi: true,
  },
};

export function benefitsFor(tier: MembershipTier): TierBenefits {
  return TIER_BENEFITS[tier];
}

// ─── Auth-gated tier check ──────────────────────────────────────────

export type GateResult =
  | { ok: true; user: User; tier: MembershipTier }
  | { ok: false; status: 401 | 403; reason: string };

export async function gateByTier(required: MembershipTier): Promise<GateResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, status: 401, reason: "未登录" };
  }

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!row) {
    return { ok: false, status: 401, reason: "用户资料未同步，请稍后重试" };
  }

  const tier = effectiveTier(row);
  if (!meetsTier(tier, required)) {
    return {
      ok: false,
      status: 403,
      reason: `此功能需要 ${tierLabel(required)} 及以上会员`,
    };
  }

  return { ok: true, user: row, tier };
}

// ─── Student email detection ────────────────────────────────────────

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
