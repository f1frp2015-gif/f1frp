// POST /api/quote/extract
//
// 入参: { text: string, locale?: "zh" | "en" }
// 出参: ExtractResult({ confidence, partial, missing, followup_question? })
//
// 用途:前端 NL 输入框 → 调本接口 → 拿到结构化部分输入 + 缺字段提示。
// 不计成本,但走 consumeAnonChatCredit 防刷(跟 chat / community-ask 共享)。

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/session";
import {
  isChatConfiguredForRequest,
} from "@/lib/ai/provider";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import {
  consumeAnonChatCredit,
  ANON_LIMIT_RESPONSE_BODY,
} from "@/lib/auth-gate";
import { extractQuoteInput } from "@/lib/quote/extract";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!isChatConfiguredForRequest(req)) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // 匿名额度门 — 跟 chat 共享 cookie 计数器
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
  const res = NextResponse.json(extracted);
  if (anonCookieToSet) res.headers.append("Set-Cookie", anonCookieToSet);
  return res;
}
