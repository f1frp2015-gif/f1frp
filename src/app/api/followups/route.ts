import { generateText, Output } from "ai";
import { z } from "zod";
import { getChatModel, isChatConfigured } from "@/lib/ai/provider";
import { resolveServerLocale } from "@/lib/i18n/server-locale";

export const runtime = "nodejs";
export const maxDuration = 20;

const Body = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(8000),
  locale: z.enum(["zh", "en"]).optional(),
});

const FollowupsSchema = z.object({
  questions: z.array(z.string().min(8).max(180)).min(2).max(4),
});

/**
 * Given the just-streamed Q/A pair, return 3 follow-up questions.
 * Perplexity-style "Related" surface. Cheap second LLM call so the chat
 * route stays focused on the main answer's streaming throughput.
 */
export async function POST(req: Request) {
  if (!isChatConfigured()) {
    return Response.json({ questions: [] }, { status: 200 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const locale = resolveServerLocale(req, body.locale);
  const isEn = locale === "en";

  const system = isEn
    ? `You generate 3 follow-up questions an overseas FRP composites engineer or procurement manager would naturally ask AFTER reading the answer below. The questions must:
- Be concrete and specific (mention a fiber, resin, standard code, country, certification, MOQ, etc).
- Push the conversation forward, not restate what was already answered.
- Stay under 18 words each.
- Be in plain English.
- Cover different angles: e.g. one technical deeper-dive, one supplier / sourcing follow-up, one compliance / standards angle.
Return strictly the JSON shape requested.`
    : `根据下面的问答，生成 3 个国内复材工程师/采购最自然会接着问的后续问题。要求：
- 具体明确（涉及具体纤维/树脂/标准号/认证/工艺等）。
- 推进对话，不要重复已回答的内容。
- 每条 ≤ 30 字。
- 一条偏技术深入，一条偏厂家/采购，一条偏标准/合规。
严格按 JSON schema 返回。`;

  const userBlock = isEn
    ? `User asked:\n${body.question}\n\nAssistant answered:\n${body.answer}\n\nGenerate 3 follow-ups.`
    : `用户问：\n${body.question}\n\n助手回答：\n${body.answer}\n\n生成 3 个后续问题。`;

  try {
    const result = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: FollowupsSchema }),
      system,
      prompt: userBlock,
      temperature: 0.5,
    });
    const obj = result.experimental_output;
    return Response.json({ questions: obj.questions.slice(0, 3) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.warn("[followups] fallback to empty:", msg);
    return Response.json({ questions: [] });
  }
}
