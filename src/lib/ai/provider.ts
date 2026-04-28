// AI provider 分流（2026-04-27 重构 — OpenRouter 中转 default）
//
// 默认路径：CHAT_PROVIDER=openrouter → 通过 OpenRouter 调 google/gemini-2.5-flash
//   - 国内 ECS 可达（OpenRouter 国内访问性较稳）
//   - 海外 Vercel 也用同一路径，保证两侧生成行为一致
//   - 免费 Gemini 走 OR 的 BYOK 通道（在 OR 后台填 Google API key 用 Google 免费配额）
//
// Fallback：
//   - profile=global    → 直连 Google (Vercel 默认行为，未来兜底用)
//   - profile=domestic  → DeepSeek 直连（OR 不可用时国内最后兜底）
//
// 嵌入：始终用 Google gemini-embedding-001 (768d) 保持向量一致；
// 国内 ECS 通过 GOOGLE_AI_GATEWAY_URL 走代理。

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel, EmbeddingModel } from "ai";

type Profile = "global" | "domestic";

const profile: Profile =
  process.env.AI_PROFILE === "domestic" ? "domestic" : "global";

export const aiProfile = profile;

// CHAT_PROVIDER 取值：
//   "openrouter" — 走 OR + google/gemini-2.5-flash（推荐 default）
//   "google"     — 直连 Google
//   "deepseek"   — 走 DeepSeek（国内备选）
//   未设置时按 profile 推断：domestic→deepseek, global→google
const chatProvider: "openrouter" | "google" | "deepseek" =
  process.env.CHAT_PROVIDER === "openrouter"
    ? "openrouter"
    : process.env.CHAT_PROVIDER === "google"
      ? "google"
      : process.env.CHAT_PROVIDER === "deepseek"
        ? "deepseek"
        : profile === "domestic"
          ? "deepseek"
          : "google";

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

export function getChatModel(): LanguageModel {
  if (chatProvider === "openrouter") {
    return buildOpenRouter().chatModel(
      process.env.OPENROUTER_CHAT_MODEL ?? CHAT_MODEL_OPENROUTER,
    );
  }
  if (chatProvider === "deepseek") {
    return buildDeepseek().chatModel(
      process.env.DEEPSEEK_CHAT_MODEL ?? CHAT_MODEL_DOMESTIC,
    );
  }
  return buildGoogle(process.env.GOOGLE_AI_GATEWAY_URL)(CHAT_MODEL_GLOBAL);
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

export function isChatConfigured(): boolean {
  if (chatProvider === "openrouter") {
    return Boolean(process.env.OPENROUTER_API_KEY);
  }
  if (chatProvider === "deepseek") return Boolean(process.env.DEEPSEEK_API_KEY);
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}
