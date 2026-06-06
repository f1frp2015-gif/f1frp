import { NextResponse } from "next/server";
import { generateText, stepCountIs } from "ai";
import { getSessionUid } from "@/lib/auth/current-user";
import {
  getChatModelForRequest,
  isChatConfiguredForRequest,
} from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/knowledge";
import { retrieveTopK, buildRagContext } from "@/lib/ai/retrieve";
import { makeWebSearchTool, isWebSearchConfigured } from "@/lib/ai/tools/web-search";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { resolveServerLocale } from "@/lib/i18n/server-locale";
import {
  consumeAnonChatCredit,
  ANON_LIMIT_RESPONSE_BODY,
} from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// System user UUID for AI-generated posts. Must be a valid UUID but the FK
// to users is soft — we reference a sentinel row created in migration or
// simply omit by making authorId nullable. Since schema requires authorId
// we use a well-known sentinel UUID and skip FK enforcement in the route.
const AI_AUTHOR_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: Request) {
  // 匿名访客超过 3 条 AI 提问后引导注册;登录用户跳过。
  // 注:这里和 /api/chat 共享同一个 cookie 计数器,跨端口/路径累计。
  let anonCookieToSet: string | null = null;
  try {
    const uid = await getSessionUid();
    if (!uid) {
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

  let body: { question?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  // Host wins: getfrp.com → en, f1frp.com → zh, ignoring stale client locale.
  const locale = resolveServerLocale(req, body.locale);

  if (!question || question.length < 5) {
    return NextResponse.json({ error: "question too short" }, { status: 400 });
  }
  if (question.length > 1000) {
    return NextResponse.json({ error: "question too long" }, { status: 400 });
  }

  if (!isChatConfiguredForRequest(req)) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // ── RAG retrieval ──────────────────────────────────────────
  const chunks = await retrieveTopK(question, 6).catch(() => []);
  const ragCtx = chunks.length ? buildRagContext(chunks) : "";

  // ── Build citations list ───────────────────────────────────
  const citations = chunks
    .filter((c) => c.url)
    .slice(0, 5)
    .map((c, i) => ({ index: i + 1, title: c.title, url: c.url as string }));

  // ── Generate answer ────────────────────────────────────────
  const citationCue =
    locale === "en"
      ? `Cite retrieved sources with the inline marker [#N] where N is the source index.`
      : `请在回答末尾用格式"[#N]"标注引用来源编号。`;

  const systemForAsk =
    SYSTEM_PROMPT + (ragCtx ? `\n\n---\n\n${ragCtx}\n\n---\n\n${citationCue}` : "");

  const langInstruction =
    locale === "en"
      ? "You MUST respond entirely in English regardless of the language of retrieved sources. Translate Chinese source material to English. Keep standard numbers (e.g. ASTM D3039), proper nouns, and technical acronyms unchanged."
      : "请用中文回答。";

  const prompt =
    locale === "en"
      ? `${langInstruction}\n\nUser question: ${question}\n\nProvide a professional, concise, well-cited answer (≈ 400-600 words).`
      : `${langInstruction}\n\n用户问题：${question}\n\n请给出专业、简明、有引用的回答（约 400-600 字）。`;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const toolsConfig = isWebSearchConfigured(host)
    ? {
        tools: { web_search: makeWebSearchTool(host) },
        stopWhen: stepCountIs(3),
      }
    : {};

  let answer = "";
  try {
    const { text } = await generateText({
      model: getChatModelForRequest(req),
      system: systemForAsk,
      prompt,
      maxOutputTokens: 800,
      ...toolsConfig,
    });
    answer = text.trim();
  } catch (e) {
    console.error("[community/ask] generateText failed:", e);
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  // ── Persist to posts table ─────────────────────────────────
  // Concatenate question + AI answer into content with a separator marker.
  const content = `${question}\n\n---AI ANSWER---\n\n${answer}`;

  let insertedId: string | null = null;
  try {
    const rows = await db
      .insert(posts)
      .values({
        authorId: AI_AUTHOR_ID,
        type: "question",
        status: "published",
        title: question.slice(0, 299),
        content,
        category: "AI问答",
      })
      .returning({ id: posts.id });
    insertedId = rows[0]?.id ?? null;
  } catch (e) {
    // Non-fatal: persist failure should not block returning the answer.
    console.error("[community/ask] db insert failed:", e);
  }

  const response = NextResponse.json({
    id: insertedId,
    answer,
    citations,
  });
  if (anonCookieToSet) {
    response.headers.append("Set-Cookie", anonCookieToSet);
  }
  return response;
}
