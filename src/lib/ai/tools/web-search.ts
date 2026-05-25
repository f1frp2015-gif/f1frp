import { tool } from "ai";
import { z } from "zod";

// Web search tool — exposed to the chat LLM via ai-sdk tool calling.
//
// Provider is picked by *host*, mirroring lib/ai/provider.ts chat routing:
//   - f1frp.com (国内)  → 博查 Bocha (api.bochaai.com) — 国内可达, 无 GFW
//   - getfrp.com (海外) → Tavily (tavily.com) — Agent-first search, ECS-verified
//   - no host (cron/scripts) → falls back to AI_PROFILE
//
// Why host-based: Tavily is reachable from overseas Vercel but slow/blocked
// from the 阿里云 ECS box; 博查 is the国内 equivalent. Keeping getfrp.com on
// Tavily means the overseas deploy is untouched by the domestic migration.
//
// Graceful degrade: when the active provider's API key is unset,
// isWebSearchConfigured(host) returns false and the route omits the tool from
// the streamText call — the LLM falls back to embedded knowledge + RAG only.
//
// Scope coupling: the SYSTEM_PROMPT tells the model when to (and not to)
// invoke this tool. We don't enforce "composites-only queries" here.

type SearchProvider = "bocha" | "tavily";

const DOMESTIC_HOSTS = new Set(["f1frp.com", "www.f1frp.com"]);

function normalizeHost(host?: string | null): string | null {
  if (!host) return null;
  return host.toLowerCase().split(":")[0];
}

function pickSearchProvider(host?: string | null): SearchProvider {
  const h = normalizeHost(host);
  if (h) return DOMESTIC_HOSTS.has(h) ? "bocha" : "tavily";
  // No host header (cron / backend scripts): follow the deploy profile.
  return process.env.AI_PROFILE === "domestic" ? "bocha" : "tavily";
}

export function isWebSearchConfigured(host?: string | null): boolean {
  return pickSearchProvider(host) === "bocha"
    ? Boolean(process.env.BOCHA_API_KEY)
    : Boolean(process.env.TAVILY_API_KEY);
}

// Normalized result shape both providers map into.
interface SearchResult {
  title: string;
  url: string;
  content: string;
}

// ── Tavily (海外) ──────────────────────────────────────────────────────
// Auth: Authorization: Bearer tvly-xxx · Free tier ~1000 searches/month.
const TAVILY_ENDPOINT = "https://api.tavily.com/search";

async function tavilySearch(
  query: string,
  maxResults: number,
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");
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
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`tavily ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    results?: { title: string; url: string; content: string }[];
  };
  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content ?? "",
  }));
}

// ── 博查 Bocha (国内) ──────────────────────────────────────────────────
// Docs: https://open.bochaai.com · Auth: Authorization: Bearer sk-xxx
// 响应兼容 Bing Search API。实测前请用自有 key 核对响应外层是否带 data 包裹;
// 下面对 data.webPages.value 与 webPages.value 两种形态都做了兜底。
const BOCHA_ENDPOINT = "https://api.bochaai.com/v1/web-search";

interface BochaPage {
  name?: string;
  url?: string;
  snippet?: string;
  summary?: string;
  siteName?: string;
}

async function bochaSearch(
  query: string,
  count: number,
): Promise<SearchResult[]> {
  const apiKey = process.env.BOCHA_API_KEY;
  if (!apiKey) throw new Error("BOCHA_API_KEY not set");
  const res = await fetch(BOCHA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      summary: true, // 返回长摘要,给 LLM 更多上下文
      count,
      freshness: "noLimit",
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`bocha ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    data?: { webPages?: { value?: BochaPage[] } };
    webPages?: { value?: BochaPage[] };
  };
  const value =
    data?.data?.webPages?.value ?? data?.webPages?.value ?? [];
  return value.map((r) => ({
    title: r.name ?? "",
    url: r.url ?? "",
    content: r.summary || r.snippet || "",
  }));
}

export function makeWebSearchTool(host?: string | null) {
  const provider = pickSearchProvider(host);
  return tool({
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
        const results =
          provider === "bocha"
            ? await bochaSearch(query, n)
            : await tavilySearch(query, n);
        return {
          query,
          provider,
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
        console.warn(`[web_search:${provider}] failed:`, msg);
        return { query, error: msg, results: [] };
      }
    },
  });
}
