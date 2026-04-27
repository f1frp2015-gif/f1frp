// AI provider 分流：根据 AI_PROFILE 在国内/海外两套部署间切换
// - global   (Vercel / getfrp.com): 直连 Anthropic/Google
// - domestic (阿里云 ECS / f1frp.com): chat 走 DeepSeek，embedding 走 AI Gateway 代理 Google
//
// embedding 必须始终用 Google gemini-embedding-001 (768d) 与历史向量保持一致；
// 国内侧通过 baseURL 切到 AI Gateway。

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel, EmbeddingModel } from "ai";

type Profile = "global" | "domestic";

const profile: Profile =
  process.env.AI_PROFILE === "domestic" ? "domestic" : "global";

export const aiProfile = profile;

const CHAT_MODEL_GLOBAL = "gemini-2.5-flash";
const CHAT_MODEL_DOMESTIC = "deepseek-chat";
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
      "DEEPSEEK_API_KEY is required when AI_PROFILE=domestic. Get one at https://platform.deepseek.com"
    );
  }
  return createOpenAICompatible({
    name: "deepseek",
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
  });
}

export function getChatModel(): LanguageModel {
  if (profile === "domestic") {
    return buildDeepseek().chatModel(
      process.env.DEEPSEEK_CHAT_MODEL ?? CHAT_MODEL_DOMESTIC
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
        "Set up a Vercel AI Gateway endpoint and put its URL here."
    );
  }
  return buildGoogle(baseURL).textEmbeddingModel(EMBED_MODEL);
}

export function isChatConfigured(): boolean {
  if (profile === "domestic") return Boolean(process.env.DEEPSEEK_API_KEY);
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}
