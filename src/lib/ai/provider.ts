// AI provider 分流(2026-06-16 — 国内侧三大国产模型并接,GLM-5.2 为主)
//
// 按 *host* 挑 chat model:
//   - f1frp.com (国内站)         → 国产模型(智谱 GLM-5.2 主 / 通义 Qwen 辅 / DeepSeek 兜底)
//   - getfrp.com (海外站) / preview → Google Gemini direct (gemini-2.5-flash)
//
// 国内侧的三个国产 provider 全部走各自的 OpenAI-compatible 端点(见 build* 函数),
// 由 pickDomesticProvider() 按"哪个 key 配了"自动择优:ZHIPU → DASHSCOPE(Qwen) →
// DEEPSEEK。这样在 ECS 上加/换一个 key 就能切主模型,无需改代码、无需重新部署。
// 国产 API 均在境内可直连,不经 GFW —— 海外 Google 直连仅限 getfrp.com / Vercel。
//
// 历史:海外侧原走 OpenRouter → google/gemini-2.5-flash,加了一层不必要的代理
// (额外 API key + 额外延迟 + OpenRouter 偶发抖动),2026-05-18 切回 @ai-sdk/google
// 直连。OpenRouter 仍保留为显式覆盖路径(CHAT_PROVIDER=openrouter)以备万一。
//
// 必需的 API key:
//   - GOOGLE_GENERATIVE_AI_API_KEY  (getfrp.com / preview 必需,Google AI Studio 申请)
//   - ZHIPU_API_KEY                 (f1frp.com 主模型 GLM-5.2,open.bigmodel.cn)
//   - DASHSCOPE_API_KEY             (f1frp.com 辅模型 Qwen + 图纸/PDF 视觉 Qwen-VL,百炼)
//   - DEEPSEEK_API_KEY              (f1frp.com 兜底,platform.deepseek.com)
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

// The domestic (f1frp.com) text-chat provider set, in default priority order:
//   智谱 GLM (primary) → 通义千问 Qwen (auxiliary) → DeepSeek (legacy fallback)
// The client model-picker lets a visitor override *within this set*; the host
// invariant in pickProviderForHost guarantees a domestic request can never be
// steered to Google (GFW-blocked) nor an overseas request to a 国产 API.
const DOMESTIC_PROVIDERS: ChatProvider[] = ["zhipu", "qwen", "deepseek"];

// Whether a provider's API key is present on *this* deployment. Read at call
// time (env is stable per process) so the picker reflects what the ECS box
// actually has keyed up.
function isProviderConfigured(p: ChatProvider): boolean {
  const keyEnv: Record<ChatProvider, string | undefined> = {
    zhipu: process.env.ZHIPU_API_KEY,
    qwen: process.env.DASHSCOPE_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  };
  return Boolean(keyEnv[p]);
}

// Domestic default: highest-priority provider whose key is set.
// 2026-06-14: switched primary DeepSeek → 智谱 GLM, with Qwen as the auxiliary.
// Resolution is key-driven so the domestic side degrades gracefully and the
// switch flips on the moment ZHIPU_API_KEY lands on the ECS box.
function pickDomesticProvider(): ChatProvider {
  return DOMESTIC_PROVIDERS.find((p) => isProviderConfigured(p)) ?? "deepseek";
}

function pickProviderForHost(
  host?: string | null,
  requested?: ChatProvider | null,
): ChatProvider {
  // Known production hosts are authoritative — they win even over the
  // CHAT_PROVIDER env var. This prevents a stale escape-hatch env (left
  // over from a debug session) from silently routing prod traffic to the
  // wrong provider, which is exactly the bug we hit 2026-05-18 when
  // CHAT_PROVIDER=openrouter pinned getfrp.com to an out-of-credits
  // OpenRouter account.
  if (isDomesticHost(host)) {
    // Honour a client-picked model ONLY within the domestic set, and only if
    // its key is configured — so the picker can switch GLM ↔ Qwen ↔ DeepSeek
    // but can NEVER route f1frp.com to Google (GFW). Anything else → the
    // key-priority default.
    if (
      requested &&
      DOMESTIC_PROVIDERS.includes(requested) &&
      isProviderConfigured(requested)
    ) {
      return requested;
    }
    return pickDomesticProvider();
  }
  // Overseas is always Gemini — the picker isn't offered there, and even a
  // crafted body.model can't pull getfrp.com onto a 国产 provider.
  if (isOverseasHost(host)) return "google";

  // For non-prod hosts (localhost, preview deploys, cron/scripts with no
  // host header) honour an explicit per-request pick first (debug-friendly),
  // then CHAT_PROVIDER, then the profile default.
  if (requested && isProviderConfigured(requested)) return requested;
  if (explicitProvider) return explicitProvider;
  if (profile === "domestic") return pickDomesticProvider();
  return "google";
}

const CHAT_MODEL_GLOBAL = "gemini-2.5-flash";
const CHAT_MODEL_DOMESTIC = "deepseek-chat";
const CHAT_MODEL_OPENROUTER = "google/gemini-2.5-flash";
// 智谱 GLM (primary domestic). Override the exact model via ZHIPU_CHAT_MODEL —
// e.g. set it to glm-5 / glm-5-turbo / glm-4.7 or a newer dated string from the
// BigModel console without a code change. Default tracks the latest GLM-5.2.
// (端点 OpenAI-compatible, https://open.bigmodel.cn/api/paas/v4 — 见 buildZhipu。
//  GLM-5 系列是 reasoning model,thinking 默认由 zhipuFetch 关闭,见下。)
const CHAT_MODEL_ZHIPU = "glm-5.2";
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

// GLM-4.5+ / GLM-5 are reasoning models: by default they stream chain-of-
// thought into `reasoning_content`, which the OpenAI-compatible provider
// surfaces as visible answer text — leaking "用户问的是…让我调用工具…" into the
// reply. This chat persona wants clean, concise answers (see SYSTEM_PROMPT
// 排版规则), so we inject 智谱's body param `thinking:{type:"disabled"}` via a
// fetch middleware (the only reliable hook for a provider-specific body field).
// Override by setting ZHIPU_THINKING=enabled.
const zhipuFetch = async (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> => {
  if (
    process.env.ZHIPU_THINKING !== "enabled" &&
    init?.body &&
    typeof init.body === "string"
  ) {
    try {
      const body = JSON.parse(init.body);
      if (body && typeof body === "object" && !("thinking" in body)) {
        body.thinking = { type: "disabled" };
        init = { ...init, body: JSON.stringify(body) };
      }
    } catch {
      // body isn't JSON we can touch — forward unchanged
    }
  }
  return fetch(input, init);
};

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
    fetch: zhipuFetch,
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

// Resolve the model-name string for a provider (env override or default).
// Single source of truth shared by getChatModel and listAvailableChatModels.
function modelNameFor(p: ChatProvider): string {
  const m: Record<ChatProvider, string> = {
    zhipu: process.env.ZHIPU_CHAT_MODEL ?? CHAT_MODEL_ZHIPU,
    qwen: process.env.QWEN_CHAT_MODEL ?? CHAT_MODEL_QWEN,
    deepseek: process.env.DEEPSEEK_CHAT_MODEL ?? CHAT_MODEL_DOMESTIC,
    openrouter: process.env.OPENROUTER_CHAT_MODEL ?? CHAT_MODEL_OPENROUTER,
    google: process.env.GEMINI_CHAT_MODEL ?? CHAT_MODEL_GLOBAL,
  };
  return m[p];
}

export function getChatModel(
  host?: string | null,
  requested?: ChatProvider | null,
): LanguageModel {
  const provider = pickProviderForHost(host, requested);
  const model = modelNameFor(provider);
  if (provider === "openrouter") return buildOpenRouter().chatModel(model);
  if (provider === "zhipu") return buildZhipu().chatModel(model);
  if (provider === "qwen") return buildDashscope().chatModel(model);
  if (provider === "deepseek") return buildDeepseek().chatModel(model);
  // Google direct. GOOGLE_AI_GATEWAY_URL proxies the domestic side past GFW;
  // GEMINI_CHAT_MODEL (via modelNameFor) swaps 2.5-pro / 2.0-flash without a deploy.
  return buildGoogle(process.env.GOOGLE_AI_GATEWAY_URL)(model);
}

export function getChatModelForRequest(
  req: Request,
  requested?: ChatProvider | null,
): LanguageModel {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return getChatModel(host, requested);
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
  return isProviderConfigured(pickProviderForHost(host));
}

// ── Client model-picker support ────────────────────────────────────────────
export type ChatModelOption = {
  /** provider id; the client echoes this back as body.model on each request */
  id: ChatProvider;
  /** brand label for the picker (proper noun, locale-agnostic) */
  label: string;
  /** resolved model string (env override or default), shown as a sub-label */
  model: string;
  /** whether this provider's API key is present on this deployment */
  configured: boolean;
};

const PROVIDER_LABELS: Record<ChatProvider, string> = {
  zhipu: "智谱 GLM",
  qwen: "通义千问",
  deepseek: "DeepSeek",
  google: "Google Gemini",
  openrouter: "OpenRouter",
};

// Validate a client-supplied body.model into a known ChatProvider (or null).
// Returning null means "no override" — getChatModel then uses host resolution.
export function parseRequestedProvider(value: unknown): ChatProvider | null {
  return typeof value === "string" &&
    CHAT_PROVIDERS.includes(value as ChatProvider)
    ? (value as ChatProvider)
    : null;
}

// Model options to surface in the client picker for THIS deployment. Driven by
// AI_PROFILE (the two sites are separate builds) rather than host:
//   - domestic (ECS / f1frp.com)   → the 3 国产 providers, each with a `configured` flag
//   - global   (Vercel / getfrp.com) → [] (single Gemini → no picker)
// The chat route still enforces the host invariant at request time, so this is
// purely what the UI offers. Pass a host to force domestic detection in tests.
export function listAvailableChatModels(
  host?: string | null,
): ChatModelOption[] {
  const domestic =
    isDomesticHost(host) || (!isOverseasHost(host) && profile === "domestic");
  if (!domestic) return [];
  return DOMESTIC_PROVIDERS.map((id) => ({
    id,
    label: PROVIDER_LABELS[id],
    model: modelNameFor(id),
    configured: isProviderConfigured(id),
  }));
}

export function isChatConfiguredForRequest(req: Request): boolean {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return isChatConfigured(host);
}
