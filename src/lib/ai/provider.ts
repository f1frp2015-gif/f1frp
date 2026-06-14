// AI provider 分流(2026-05-18 — direct Google for overseas, drop OpenRouter)
//
// 按 *host* 挑 chat model:
//   - f1frp.com (国内站)         → DeepSeek (deepseek-chat)
//   - getfrp.com (海外站) / preview → Google Gemini direct (gemini-2.5-flash)
//
// 历史:海外侧原走 OpenRouter → google/gemini-2.5-flash,加了一层不必要的代理
// (额外 API key + 额外延迟 + OpenRouter 偶发抖动),2026-05-18 切回 @ai-sdk/google
// 直连。OpenRouter 仍保留为显式覆盖路径(CHAT_PROVIDER=openrouter)以备万一。
//
// 必需的 API key:
//   - GOOGLE_GENERATIVE_AI_API_KEY  (getfrp.com / preview 必需,Google AI Studio 申请)
//   - DEEPSEEK_API_KEY              (f1frp.com 必需)
//   - OPENROUTER_API_KEY            (可选 fallback,通过 CHAT_PROVIDER=openrouter 启用)
//
// 显式覆盖:CHAT_PROVIDER=openrouter|google|deepseek 仍然有效,无视 host
// 强制走指定 provider —— 用于 cron / 后端脚本(无 host)和本地调试。
//
// 模型版本:GEMINI_CHAT_MODEL / DEEPSEEK_CHAT_MODEL / OPENROUTER_CHAT_MODEL 三个
// env var 可单独覆盖各 provider 的模型名,不需要代码改动就能切 2.5-pro / 2.0-flash 等。
//
// 嵌入:始终用 Google gemini-embedding-001 (768d) 保持向量一致;
// 国内 ECS 通过 GOOGLE_AI_GATEWAY_URL 走代理。

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel, EmbeddingModel } from "ai";

type Profile = "global" | "domestic";
type ChatProvider = "openrouter" | "google" | "deepseek" | "zhipu" | "qwen";

const profile: Profile =
  process.env.AI_PROFILE === "domestic" ? "domestic" : "global";

export const aiProfile = profile;

const CHAT_PROVIDERS: ChatProvider[] = [
  "openrouter",
  "google",
  "deepseek",
  "zhipu",
  "qwen",
];
const explicitProvider: ChatProvider | null = CHAT_PROVIDERS.includes(
  process.env.CHAT_PROVIDER as ChatProvider,
)
  ? (process.env.CHAT_PROVIDER as ChatProvider)
  : null;

const DOMESTIC_HOSTS = new Set(["f1frp.com", "www.f1frp.com"]);
const OVERSEAS_HOSTS = new Set(["getfrp.com", "www.getfrp.com"]);

function normalizeHost(host?: string | null): string | null {
  if (!host) return null;
  return host.toLowerCase().split(":")[0];
}

function isDomesticHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  return h !== null && DOMESTIC_HOSTS.has(h);
}

function isOverseasHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  return h !== null && OVERSEAS_HOSTS.has(h);
}

// Domestic (f1frp.com) text-chat provider priority, by which API key is set:
//   智谱 GLM (primary) → 通义千问 Qwen (auxiliary) → DeepSeek (legacy fallback)
// 2026-06-14: switched primary DeepSeek → 智谱 GLM, with Qwen as the auxiliary.
// Resolution is key-driven so the domestic side degrades gracefully and the
// switch flips on the moment ZHIPU_API_KEY lands on the ECS box.
function pickDomesticProvider(): ChatProvider {
  if (process.env.ZHIPU_API_KEY) return "zhipu";
  if (process.env.DASHSCOPE_API_KEY) return "qwen";
  return "deepseek";
}

function pickProviderForHost(host?: string | null): ChatProvider {
  // Known production hosts are authoritative — they win even over the
  // CHAT_PROVIDER env var. This prevents a stale escape-hatch env (left
  // over from a debug session) from silently routing prod traffic to the
  // wrong provider, which is exactly the bug we hit 2026-05-18 when
  // CHAT_PROVIDER=openrouter pinned getfrp.com to an out-of-credits
  // OpenRouter account.
  if (isDomesticHost(host)) return pickDomesticProvider();
  if (isOverseasHost(host)) return "google";

  // For non-prod hosts (localhost, preview deploys, cron/scripts with no
  // host header) we still honour CHAT_PROVIDER as a debug-friendly override.
  if (explicitProvider) return explicitProvider;
  if (profile === "domestic") return pickDomesticProvider();
  return "google";
}

const CHAT_MODEL_GLOBAL = "gemini-2.5-flash";
const CHAT_MODEL_DOMESTIC = "deepseek-chat";
const CHAT_MODEL_OPENROUTER = "google/gemini-2.5-flash";
// 智谱 GLM (primary domestic). Override the exact model via ZHIPU_CHAT_MODEL —
// e.g. set it to the GLM-4.6 / GLM-Z1 / latest string from the BigModel
// console without a code change.
const CHAT_MODEL_ZHIPU = "glm-4.6";
// 通义千问 Qwen text (auxiliary domestic), via the DashScope OpenAI-compatible
// endpoint. Override via QWEN_CHAT_MODEL (qwen-plus / qwen-max / qwen-turbo).
const CHAT_MODEL_QWEN = "qwen-plus";

// Vision model for the *domestic* side. deepseek-chat is text-only, so when a
// f1frp.com request carries image/PDF attachments we switch to Alibaba's
// Qwen-VL via the (already-present) DashScope OpenAI-compatible endpoint —
// same Hangzhou region as the ECS box. Override with DASHSCOPE_VL_MODEL
// (e.g. qwen-vl-plus for cheaper, qwen-vl-max for best drawing reading).
// Overseas (Gemini) is already multimodal, so it needs no special model.
const CHAT_MODEL_DOMESTIC_VISION = "qwen-vl-max";

// Embedding provider — picked via EMBEDDING_PROVIDER env. Default 'google'
// preserves historical behaviour; switch to 'dashscope' for国产 + no-gateway
// access (Alibaba's OpenAI-compatible endpoint, same Hangzhou region as ECS
// so domestic latency drops to ~100ms vs Google's 5s timeout).
//
// IMPORTANT: switching providers invalidates the existing vector space —
// must run `pnpm tsx scripts/reindex-embeddings.ts` after flipping this env,
// otherwise RAG retrieval will return semantically garbage matches.
const EMBED_MODEL_GOOGLE = "gemini-embedding-001";
const EMBED_MODEL_DASHSCOPE = "text-embedding-v3";
export const EMBED_DIMS = 768;
type EmbeddingProvider = "google" | "dashscope";
const embeddingProvider: EmbeddingProvider =
  process.env.EMBEDDING_PROVIDER === "dashscope" ? "dashscope" : "google";
export const activeEmbeddingProvider = embeddingProvider;

function buildGoogle(baseURL?: string) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY required for the Google Gemini provider. " +
        "Get one at https://aistudio.google.com/apikey and set it on Vercel " +
        "for the getfrp.com / preview deployment.",
    );
  }
  return createGoogleGenerativeAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

function buildDeepseek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY required for chatProvider=deepseek. " +
        "Get one at https://platform.deepseek.com",
    );
  }
  return createOpenAICompatible({
    name: "deepseek",
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
  });
}

function buildDashscope() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY required for Qwen (chat/vision) or dashscope " +
        "embeddings. Get one at https://bailian.console.aliyun.com (model " +
        "studio → API-KEY). Free quota: 100M tokens / model / 90 days.",
    );
  }
  return createOpenAICompatible({
    name: "dashscope",
    apiKey,
    baseURL:
      process.env.DASHSCOPE_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
}

function buildZhipu() {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ZHIPU_API_KEY required for chatProvider=zhipu (智谱 GLM, primary " +
        "domestic). Get one at https://open.bigmodel.cn (API keys). The " +
        "endpoint is OpenAI-compatible (paas/v4).",
    );
  }
  return createOpenAICompatible({
    name: "zhipu",
    apiKey,
    baseURL:
      process.env.ZHIPU_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4",
  });
}

function buildOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY required for chatProvider=openrouter. " +
        "Get one at https://openrouter.ai",
    );
  }
  return createOpenAICompatible({
    name: "openrouter",
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://f1frp.com",
      "X-Title": "f1frp",
    },
  });
}

export function getChatModel(host?: string | null): LanguageModel {
  const provider = pickProviderForHost(host);
  if (provider === "openrouter") {
    return buildOpenRouter().chatModel(
      process.env.OPENROUTER_CHAT_MODEL ?? CHAT_MODEL_OPENROUTER,
    );
  }
  if (provider === "zhipu") {
    return buildZhipu().chatModel(
      process.env.ZHIPU_CHAT_MODEL ?? CHAT_MODEL_ZHIPU,
    );
  }
  if (provider === "qwen") {
    return buildDashscope().chatModel(
      process.env.QWEN_CHAT_MODEL ?? CHAT_MODEL_QWEN,
    );
  }
  if (provider === "deepseek") {
    return buildDeepseek().chatModel(
      process.env.DEEPSEEK_CHAT_MODEL ?? CHAT_MODEL_DOMESTIC,
    );
  }
  // Google direct. GEMINI_CHAT_MODEL env override lets us swap 2.5-pro /
  // 2.0-flash / experimental builds without a deploy.
  const model = process.env.GEMINI_CHAT_MODEL ?? CHAT_MODEL_GLOBAL;
  return buildGoogle(process.env.GOOGLE_AI_GATEWAY_URL)(model);
}

export function getChatModelForRequest(req: Request): LanguageModel {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return getChatModel(host);
}

export type VisionResolution = {
  /** Multimodal-capable model, or null when the domestic side lacks DashScope. */
  model: LanguageModel | null;
  /** false → vision not provisioned for this host; caller should degrade. */
  ok: boolean;
  provider: ChatProvider;
};

// Pick a *vision-capable* chat model for a request that carries image / PDF
// attachments. The host-split is the same as text chat, but the domestic
// branch diverges: deepseek-chat can't see images, so we route to Qwen-VL via
// DashScope. If DASHSCOPE_API_KEY is absent we return ok:false (model:null)
// rather than throwing, so the chat route can stream a friendly "image
// recognition is being provisioned" message instead of a 500. Overseas/Gemini
// is already multimodal → reuse the normal chat model.
export function getVisionChatModel(host?: string | null): VisionResolution {
  const provider = pickProviderForHost(host);
  // Overseas Gemini (and OpenRouter→Gemini) is already multimodal — reuse it.
  if (provider === "google" || provider === "openrouter") {
    return { model: getChatModel(host), ok: true, provider };
  }
  // All domestic text providers (智谱 GLM / Qwen text / DeepSeek) are routed
  // as text-only here, so vision always goes to Qwen-VL via DashScope — this
  // is Qwen's "auxiliary" role. Needs DASHSCOPE_API_KEY; degrade gracefully
  // (ok:false) when absent so the chat route streams a friendly message.
  if (!process.env.DASHSCOPE_API_KEY) {
    return { model: null, ok: false, provider };
  }
  const model = buildDashscope().chatModel(
    process.env.DASHSCOPE_VL_MODEL ?? CHAT_MODEL_DOMESTIC_VISION,
  );
  return { model, ok: true, provider };
}

export function getVisionChatModelForRequest(req: Request): VisionResolution {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return getVisionChatModel(host);
}

export function getEmbeddingModel(): EmbeddingModel {
  // DashScope branch — selected when EMBEDDING_PROVIDER=dashscope. Lives in
  // the same Aliyun region as our ECS box, so ~100ms vs Google's GFW-induced
  // 5s timeout. text-embedding-v3 supports 768-dim output via the
  // `dimensions` provider option (Matryoshka), matching the existing
  // knowledge_chunks.embedding vector(768) schema — no migration required.
  if (embeddingProvider === "dashscope") {
    return buildDashscope().textEmbeddingModel(EMBED_MODEL_DASHSCOPE);
  }

  // Google branch (default) — historical behaviour. Domestic side STILL
  // needs GOOGLE_AI_GATEWAY_URL since direct Google API is blocked from CN.
  // If both EMBEDDING_PROVIDER and GOOGLE_AI_GATEWAY_URL are unset on ECS
  // this will throw at first embed attempt (the chat route catches this
  // and continues without RAG context).
  const baseURL = process.env.GOOGLE_AI_GATEWAY_URL;
  if (profile === "domestic" && !baseURL) {
    throw new Error(
      "Embedding misconfigured on domestic side: either set " +
        "EMBEDDING_PROVIDER=dashscope (+ DASHSCOPE_API_KEY) or " +
        "GOOGLE_AI_GATEWAY_URL to a reachable Google AI Studio proxy.",
    );
  }
  return buildGoogle(baseURL).textEmbeddingModel(EMBED_MODEL_GOOGLE);
}

export function isChatConfigured(host?: string | null): boolean {
  const provider = pickProviderForHost(host);
  if (provider === "openrouter") {
    return Boolean(process.env.OPENROUTER_API_KEY);
  }
  if (provider === "zhipu") return Boolean(process.env.ZHIPU_API_KEY);
  if (provider === "qwen") return Boolean(process.env.DASHSCOPE_API_KEY);
  if (provider === "deepseek") return Boolean(process.env.DEEPSEEK_API_KEY);
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function isChatConfiguredForRequest(req: Request): boolean {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return isChatConfigured(host);
}
