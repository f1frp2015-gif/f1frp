// AI provider 分流（2026-05-08 — host-aware chat routing）
//
// 现在按 *host* 而不是部署 profile 来挑 chat model：
//   - f1frp.com (国内站)  → DeepSeek (deepseek-chat)
//   - getfrp.com (海外站) / preview → OpenRouter → google/gemini-2.5-flash
//
// 这样同一份代码、同一份 env 部署到双轨 (阿里云 ECS / Vercel) 都自动选对模型,
// 不再依赖 AI_PROFILE / CHAT_PROVIDER 单值开关。两侧的 API key 都得配:
//   - DEEPSEEK_API_KEY    (f1frp.com 必需)
//   - OPENROUTER_API_KEY  (getfrp.com / preview 必需)
//
// 显式覆盖：CHAT_PROVIDER=openrouter|google|deepseek 仍然有效，会无视 host
// 强制走指定 provider —— 用于 cron / 后端脚本（无 host）和本地调试。
//
// 嵌入：始终用 Google gemini-embedding-001 (768d) 保持向量一致；
// 国内 ECS 通过 GOOGLE_AI_GATEWAY_URL 走代理。

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel, EmbeddingModel } from "ai";

type Profile = "global" | "domestic";
type ChatProvider = "openrouter" | "google" | "deepseek";

const profile: Profile =
  process.env.AI_PROFILE === "domestic" ? "domestic" : "global";

export const aiProfile = profile;

const explicitProvider: ChatProvider | null =
  process.env.CHAT_PROVIDER === "openrouter"
    ? "openrouter"
    : process.env.CHAT_PROVIDER === "google"
      ? "google"
      : process.env.CHAT_PROVIDER === "deepseek"
        ? "deepseek"
        : null;

const DOMESTIC_HOSTS = new Set(["f1frp.com", "www.f1frp.com"]);

function isDomesticHost(host?: string | null): boolean {
  if (!host) return false;
  return DOMESTIC_HOSTS.has(host.toLowerCase().split(":")[0]);
}

function pickProviderForHost(host?: string | null): ChatProvider {
  if (explicitProvider) return explicitProvider;
  if (isDomesticHost(host)) return "deepseek";
  // Default for overseas / preview / unknown host: keep existing OpenRouter
  // path (gemini-2.5-flash). On the domestic ECS, host header always carries
  // f1frp.com so we never hit this branch in production.
  if (profile === "domestic") return "deepseek";
  return "openrouter";
}

const CHAT_MODEL_GLOBAL = "gemini-2.5-flash";
const CHAT_MODEL_DOMESTIC = "deepseek-chat";
const CHAT_MODEL_OPENROUTER = "google/gemini-2.5-flash";
const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIMS = 768;

function buildGoogle(baseURL?: string) {
  return createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
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
  if (provider === "deepseek") {
    return buildDeepseek().chatModel(
      process.env.DEEPSEEK_CHAT_MODEL ?? CHAT_MODEL_DOMESTIC,
    );
  }
  return buildGoogle(process.env.GOOGLE_AI_GATEWAY_URL)(CHAT_MODEL_GLOBAL);
}

export function getChatModelForRequest(req: Request): LanguageModel {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return getChatModel(host);
}

export function getEmbeddingModel(): EmbeddingModel {
  // Both profiles use Google embedding for vector consistency.
  // Domestic side MUST set GOOGLE_AI_GATEWAY_URL to a reachable proxy,
  // otherwise embedding requests will fail (Google API blocked in CN).
  const baseURL = process.env.GOOGLE_AI_GATEWAY_URL;
  if (profile === "domestic" && !baseURL) {
    throw new Error(
      "GOOGLE_AI_GATEWAY_URL is required when AI_PROFILE=domestic. " +
        "Set up an AI Gateway proxy and put its URL here.",
    );
  }
  return buildGoogle(baseURL).textEmbeddingModel(EMBED_MODEL);
}

export function isChatConfigured(host?: string | null): boolean {
  const provider = pickProviderForHost(host);
  if (provider === "openrouter") {
    return Boolean(process.env.OPENROUTER_API_KEY);
  }
  if (provider === "deepseek") return Boolean(process.env.DEEPSEEK_API_KEY);
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function isChatConfiguredForRequest(req: Request): boolean {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  return isChatConfigured(host);
}
