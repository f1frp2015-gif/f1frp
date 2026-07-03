// POST /api/quote/estimate
//
// 入参: { input: QuoteInput, source?: "nl_chat" | "form", locale?: "zh" | "en", rawUserText?: string, preview?: boolean }
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
//
// preview=true:表单每次改字段就会打一次这个接口(前端做了防抖),只为了让价格
// 跟着输入实时跳动。这条路径必须便宜 —— 跳过 1.2 校准查询 / 2 AI 解释 / 3 日志写入,
// 只留 1)+1.5) 纯同步计算,零 DB、零 AI 调用。正式报价("Get Quote"按钮)仍走完整
// 流程拿校准 + AI 解释 + 落 quote_logs。

import { NextResponse } from "next/server";
import { isChatConfiguredForRequest } from "@/lib/ai/provider";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import { getSessionUid } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { quoteLogs } from "@/lib/db/schema";
import { QuoteInputSchema } from "@/lib/quote/types";
import { estimate } from "@/lib/quote/pricing";
import { buildPriceDisplay, marketForLocale } from "@/lib/quote/display";
import { explainQuote } from "@/lib/quote/explain";
import { calibrateQuote, applyBand, type QuoteCalibration } from "@/lib/quote/calibrate";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // 价格计算本身不需要 AI;但解释步骤需要。AI 不可用时仍可返回 result + 空解释。
  const aiAvailable = isChatConfiguredForRequest(req);

  // 取会话用户 id 仅用于关联 quote_logs.userId(便于"已登录用户的历史粗测"看板)。
  // 会话 cookie 里直接存 users.id;失败 / 匿名都不阻塞,直接走 fingerprint。
  let sessionUserId: string | null = null;
  try {
    sessionUserId = await getSessionUid();
  } catch {
    sessionUserId = null;
  }

  let body: {
    input?: unknown;
    source?: string;
    locale?: string;
    rawUserText?: string;
    extractConfidence?: number;
    extractMissing?: string[];
    preview?: boolean;
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

  // 1) 算价格 — 同步,毫秒级(引擎纯 CNY 基线)
  let result = estimate(input);

  // preview 模式到此为止:只回 1)+1.5) 的确定性结果,不查库不调 AI不写日志。
  if (body.preview) {
    const previewDisplay = buildPriceDisplay(result, marketForLocale(locale));
    return NextResponse.json({ result, display: previewDisplay });
  }

  // 1.2) 数据校准 — 用历史 quote_logs(同截面+纤维, CNY/kg 口径)校准区间带宽并
  //      标记离群。引擎中点不动,只调 ±band 并在离群时加警告。DB 抖动不阻塞。
  let calibration: QuoteCalibration | null = null;
  try {
    calibration = await calibrateQuote(input, result);
    if (calibration.suggested_band !== result.band) {
      result = applyBand(result, calibration.suggested_band);
    }
    if (calibration.outlier) {
      result = {
        ...result,
        warnings: [...result.warnings, locale === "en" ? calibration.note_en : calibration.note_zh],
      };
    }
  } catch (e) {
    console.warn(
      "[quote-estimate] calibration failed:",
      e instanceof Error ? e.message : e,
    );
  }

  // 1.5) 对外展示口径 — 海外(getfrp.com/en)在 CNY 基线上加成 50%+ 并换算 USD,
  //      国内(f1frp.com/zh)原样 CNY。详见 display.ts。
  const display = buildPriceDisplay(result, marketForLocale(locale));

  // 2) AI 解释 — 不阻塞;失败 null。按 display 的币种/数值口径解释。
  const explanation = aiAvailable
    ? await explainQuote(input, result, display, req, locale).catch(() => null)
    : null;

  // 3) 写日志 — try/catch 包好,DB 抖动不能挡用户
  let logId: string | null = null;
  try {
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || null;
    const ua = req.headers.get("user-agent") || null;
    const ipRegion = req.headers.get("x-vercel-ip-country") || null;
    // 会话 uid 即 users.id (UUID);海外侧匿名 → 留 null,靠 fingerprint 兜底。
    const userIdUuid: string | null = sessionUserId;
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

  return NextResponse.json({ result, display, explanation, calibration, logId });
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
