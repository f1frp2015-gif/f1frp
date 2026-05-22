import { tool } from "ai";
import { z } from "zod";

// Web search tool — exposed to the chat LLM via ai-sdk tool calling.
//
// Provider: Tavily (https://tavily.com) — Agent-first search API.
//   - ECS reachability verified 2026-05-22 (~3s, no GFW blocks).
//   - Auth: Authorization: Bearer tvly-xxx
//   - Free tier: ~1000 searches/month.
//
// Graceful degrade: when TAVILY_API_KEY is unset, isWebSearchConfigured()
// returns false and the route omits the tool from the streamText call —
// LLM falls back to its embedded knowledge + RAG only.
//
// Scope coupling: the SYSTEM_PROMPT tells the model when to (and not to)
// invoke this tool. We don't enforce "composites-only queries" at this
// layer — that's the LLM's job per the scope guard. If we hardcoded a
// prefix here we'd hurt precision (e.g. "Owens Corning Q1 earnings" +
// forced "FRP" prefix would drop relevant hits).

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results?: TavilyResult[];
  query?: string;
}

async function tavilySearch(
  query: string,
  maxResults: number,
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not set");
  }
  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
    }),
    // 8s timeout — Tavily p99 from ECS measured at ~3s; anything beyond
    // 8s is likely a network glitch and we'd rather degrade than block
    // the entire chat response.
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`tavily ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as TavilyResponse;
  return data.results ?? [];
}

export const webSearchTool = tool({
  description:
    "Search the public web for current information NOT covered by the embedded composites knowledge base. " +
    "Use ONLY for: latest prices/market trends, recent news from overseas brands (Owens Corning/Hexcel/Toray/etc), " +
    "regulatory updates (CBAM/REACH/new standards), trade shows, or specific facts you're unsure about. " +
    "DO NOT use for general material chemistry / standards / process questions already in your knowledge base. " +
    "DO NOT use for out-of-scope queries (politics/code/medical/etc) — refuse those via the scope guard instead.",
  inputSchema: z.object({
    query: z
      .string()
      .min(2)
      .max(200)
      .describe(
        "Search query. Include composites-related keywords (FRP / 纤维复合材料 / specific brand / specific standard code) " +
          "to keep results on-topic. Use Chinese for f1frp.com user queries, English for getfrp.com or for overseas brand lookups.",
      ),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(8)
      .optional()
      .describe("How many results to return. Default 5."),
  }),
  execute: async ({ query, maxResults }) => {
    const n = maxResults ?? 5;
    try {
      const results = await tavilySearch(query, n);
      return {
        query,
        resultCount: results.length,
        results: results.slice(0, n).map((r, i) => ({
          n: i + 1,
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 400),
        })),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[web_search] failed:", msg);
      return {
        query,
        error: msg,
        results: [],
      };
    }
  },
});
