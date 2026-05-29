// POST /api/quote/estimate
//
// 入参: { input: QuoteInput, source?: "nl_chat" | "form", locale?: "zh" | "en", rawUserText?: string }
// 出参: { result: QuoteResult, explanation: string | null, logId: string }
//
// 流程:
//   1) Zod 校验 input
//   2) 确定性引擎算价格(同步,快)
//   3) AI 解释(并行,失败不阻塞)
//   4) 写 quote_logs(失败不阻塞返回 —— 日志重要但不能挡用户体验)
//
// 战略口径:quote 是免费引流钩子,**不复用 chat 的 3 次匿名门**(详见 extract/route.ts
// 头部注释)。本路由匿名完全开放;登录用户 quote_logs.userId 会写,匿名走 fingerprint。

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { isChatConfiguredForRequest } from "@/lib/ai/provider";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import { db } from "@/lib/db";
import { quoteLogs, users } from "@/lib/db/schema";
import { QuoteInputSchema } from "@/lib/quote/types";
import { estimate } from "@/lib/quote/pricing";
import { explainQuote } from "@/lib/quote/explain";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // 价格计算本身不需要 AI;但解释步骤需要。AI 不可用时仍可返回 result + 空解释。
  const aiAvailable = isChatConfiguredForRequest(req);

  // 取 Clerk userId 仅用于关联 quote_logs.userId(便于"已登录用户的历史粗测"看板)。
  // 失败 / 匿名都不阻塞,直接走 fingerprint。
  let clerkUserId: string | null = null;
  try {
    const { userId } = await auth();
    clerkUserId = userId ?? null;
  } catch {
    clerkUserId = null;
  }

  let body: {
    input?: unknown;
    source?: string;
    locale?: string;
    rawUserText?: string;
    extractConfidence?: number;
    extractMissing?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = QuoteInputSchema.safeParse(body.input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const locale = resolveServerLocale(req, body.locale);

  // 1) 算价格 — 同步,毫秒级
  const result = estimate(input);

  // 2) AI 解释 — 不阻塞;失败 null
  const explanation = aiAvailable
    ? await explainQuote(input, result, req, locale).catch(() => null)
    : null;

  // 3) 写日志 — try/catch 包好,DB 抖动不能挡用户
  let logId: string | null = null;
  try {
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || null;
    const ua = req.headers.get("user-agent") || null;
    const ipRegion = req.headers.get("x-vercel-ip-country") || null;
    // 把 Clerk ID → users.id (UUID)。Clerk webhook 同步保证 row 存在;
    // 偶发未同步 / 海外侧匿名 → 留 null,靠 fingerprint 兜底。
    let userIdUuid: string | null = null;
    if (clerkUserId) {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1)
        .catch(() => []);
      userIdUuid = rows[0]?.id ?? null;
    }
    const sourceParam =
      body.source === "nl_chat" || body.source === "api" || body.source === "form"
        ? body.source
        : "form";

    const inserted = await db
      .insert(quoteLogs)
      .values({
        userId: userIdUuid ?? undefined,
        anonFingerprint: userIdUuid ? null : await getAnonFingerprint(req),
        source: sourceParam,
        locale,
        host: host ?? undefined,
        ipRegion: ipRegion ?? undefined,
        userAgent: ua ?? undefined,
        rawUserText: body.rawUserText ?? null,
        extractConfidence: body.extractConfidence ?? null,
        extractMissing: body.extractMissing ?? null,
        input: input as unknown as Record<string, unknown>,
        output: result as unknown as Record<string, unknown>,
        engineVersion: result.engine_version,
        aiExplanation: explanation,
      })
      .returning({ id: quoteLogs.id });
    logId = inserted[0]?.id ?? null;
  } catch (e) {
    console.warn(
      "[quote-estimate] log write failed:",
      e instanceof Error ? e.message : e,
    );
  }

  return NextResponse.json({ result, explanation, logId });
}

// 匿名 fingerprint:用 IP + UA hash(粗略,够做"同一访客重复粗测"聚合)
async function getAnonFingerprint(req: Request): Promise<string | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "";
  const data = new TextEncoder().encode(`${ip}|${ua}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
