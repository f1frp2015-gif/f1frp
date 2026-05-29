// POST /api/quote/extract
//
// 入参: { text: string, locale?: "zh" | "en" }
// 出参: ExtractResult({ confidence, partial, missing, followup_question? })
//
// 用途:前端 NL 输入框 → 调本接口 → 拿到结构化部分输入 + 缺字段提示。
//
// 战略口径:quote 是 v4.1 Layer 1 免费引流钩子,**不复用 chat 的匿名 3 次额度门**
// (那个门是 AI 问答的"软引导注册"机制,会把粗测工具的匿名用户挡掉,反战略)。
// 单次 DeepSeek 调用 < ¥0.01,引流价值远大于成本。防刷靠 quote_logs 的
// IP fingerprint 事后审计 + UI 端 loading 态的天然节流。

import { NextResponse } from "next/server";
import { isChatConfiguredForRequest } from "@/lib/ai/provider";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import { extractQuoteInput } from "@/lib/quote/extract";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!isChatConfiguredForRequest(req)) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  let body: { text?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text || text.length < 4) {
    return NextResponse.json({ error: "text too short" }, { status: 400 });
  }
  if (text.length > 1500) {
    return NextResponse.json({ error: "text too long" }, { status: 400 });
  }

  const locale = resolveServerLocale(req, body.locale);

  const extracted = await extractQuoteInput(text, req, locale);
  return NextResponse.json(extracted);
}
