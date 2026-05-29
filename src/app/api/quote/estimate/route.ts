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
// 跟 extract 一样走 consumeAnonChatCredit 防刷。

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/session";
import { isChatConfiguredForRequest } from "@/lib/ai/provider";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import {
  consumeAnonChatCredit,
  ANON_LIMIT_RESPONSE_BODY,
} from "@/lib/auth-gate";
import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { quoteLogs } from "@/lib/db/schema";
import { QuoteInputSchema } from "@/lib/quote/types";
import { estimate } from "@/lib/quote/pricing";
import { explainQuote } from "@/lib/quote/explain";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // 价格计算本身不需要 AI;但解释步骤需要。AI 不可用时仍可返回 result + 空解释。
  const aiAvailable = isChatConfiguredForRequest(req);

  // 匿名额度门 — 即使不用 AI,也防止恶意刷价
  let anonCookieToSet: string | null = null;
  try {
    const signedIn = await isAuthenticated();
    if (!signedIn) {
      const gate = consumeAnonChatCredit(req);
      if (!gate.ok) {
        return NextResponse.json(ANON_LIMIT_RESPONSE_BODY, { status: 401 });
      }
      anonCookieToSet = gate.cookieHeader;
    }
  } catch {
    const gate = consumeAnonChatCredit(req);
    if (!gate.ok) {
      return NextResponse.json(ANON_LIMIT_RESPONSE_BODY, { status: 401 });
    }
    anonCookieToSet = gate.cookieHeader;
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
    const userId = await getCurrentUserId().catch(() => null);
    const sourceParam =
      body.source === "nl_chat" || body.source === "api" || body.source === "form"
        ? body.source
        : "form";

    const inserted = await db
      .insert(quoteLogs)
      .values({
        userId: userId ?? undefined,
        anonFingerprint: userId ? null : await getAnonFingerprint(req),
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

  const res = NextResponse.json({ result, explanation, logId });
  if (anonCookieToSet) res.headers.append("Set-Cookie", anonCookieToSet);
  return res;
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
