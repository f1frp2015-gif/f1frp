import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Topic gate for the daily ingest. The query-based fetch (CrossRef / OpenAlex /
// PatentsView) inevitably returns off-topic hits; this drops anything not
// substantively about FRP / composites BEFORE it enters the KB + RAG index, so
// retrieval stays on-domain. Uses Gemini directly (a US model, same as
// translate.ts) — the cron now runs only on getfrp/Vercel, which reaches Google.
// FAIL-OPEN: on a missing key or classifier error we KEEP the item (the query
// pool is already FRP-targeted), so an LLM blip can't silently halt the flywheel.
export async function isCompositeRelevant(input: {
  title?: string;
  titleEn?: string;
  abstract?: string;
  keywords?: string[];
}): Promise<{ relevant: boolean; reason: string }> {
  const text = [input.titleEn || input.title, input.abstract, (input.keywords ?? []).join(", ")]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1500);
  if (!text.trim()) return { relevant: false, reason: "empty" };
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { relevant: true, reason: "no-key-kept" };
  }
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    const { text: out } = await generateText({
      model: google("gemini-2.5-flash"),
      temperature: 0,
      maxOutputTokens: 40,
      system:
        "You are a strict topic classifier for a fiber-reinforced polymer (FRP) / composite-materials knowledge base. " +
        "An item is RELEVANT only if it is substantively about FRP/composites: glass/carbon/aramid/basalt fiber; " +
        "resin matrices (epoxy/vinyl ester/polyester/polyurethane/phenolic); pultrusion/RTM/filament winding/prepreg/SMC/" +
        "lay-up/laminates; composite structures, manufacturing, testing, durability, or end-use applications. " +
        "Items about pure metals/concrete/biology/medicine/pure electronics with NO composite focus are NOT relevant. " +
        'Answer EXACTLY "YES" or "NO", then a 2-4 word reason.',
      prompt: text,
    });
    const relevant = /^\s*yes\b/i.test(out);
    return { relevant, reason: out.trim().slice(0, 50).replace(/\s+/g, " ") };
  } catch (e) {
    console.warn("[ingest/relevance] classify failed, keeping:", e instanceof Error ? e.message : e);
    return { relevant: true, reason: "classifier-error-kept" };
  }
}
