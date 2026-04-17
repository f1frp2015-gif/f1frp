import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "@/lib/ai/knowledge";

function normalizeMessages(raw: unknown[]): UIMessage[] {
  return raw.map((m: any, i: number) => {
    if (m.parts) return m as UIMessage;
    return {
      id: m.id || String(i),
      role: m.role || "user",
      parts: [{ type: "text" as const, text: m.content || "" }],
    };
  });
}

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const body = await req.json();
    const uiMessages = normalizeMessages(body.messages || []);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(uiMessages),
      maxOutputTokens: 2000,
    });

    return result.toUIMessageStreamResponse();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Chat API error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
