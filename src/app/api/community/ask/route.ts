import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { SYSTEM_PROMPT } from "@/lib/ai/knowledge";
import { retrieveTopK, buildRagContext } from "@/lib/ai/retrieve";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// System user UUID for AI-generated posts. Must be a valid UUID but the FK
// to users is soft — we reference a sentinel row created in migration or
// simply omit by making authorId nullable. Since schema requires authorId
// we use a well-known sentinel UUID and skip FK enforcement in the route.
const AI_AUTHOR_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: Request) {
  let body: { question?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  const locale = body.locale === "en" ? "en" : "zh";

  if (!question || question.length < 5) {
    return NextResponse.json({ error: "question too short" }, { status: 400 });
  }
  if (question.length > 1000) {
    return NextResponse.json({ error: "question too long" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
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
  const google = createGoogleGenerativeAI({ apiKey });

  const systemForAsk =
    SYSTEM_PROMPT +
    (ragCtx
      ? `\n\n---\n\n${ragCtx}\n\n---\n\n请在回答末尾用格式"[#N]"标注引用来源编号。`
      : "");

  const langInstruction =
    locale === "en"
      ? "Please answer in English (but keep technical terms in Chinese if appropriate)."
      : "请用中文回答。";

  const prompt = `${langInstruction}\n\n用户问题：${question}\n\n请给出专业、简明、有引用的回答（约 400-600 字）。`;

  let answer = "";
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemForAsk,
      prompt,
      maxOutputTokens: 800,
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

  return NextResponse.json({
    id: insertedId,
    answer,
    citations,
  });
}
