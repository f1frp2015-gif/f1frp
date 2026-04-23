import type { MetadataRoute } from "next";

const disallow = ["/api/", "/dashboard/", "/sign-in", "/sign-up"];

// Explicit allowlist for China-locale search engines + AI crawlers.
// Making them explicit (instead of only "*") helps some engines verify crawl access
// during webmaster registration.
const userAgents = [
  "*",
  // China
  "Baiduspider",
  "Baiduspider-render",
  "Baiduspider-image",
  "Sogou web spider",
  "Sogou inst spider",
  "Sogou News Spider",
  "360Spider",
  "Haosouspider",
  "YisouSpider",
  "Bytespider", // ByteDance / 豆包 / 今日头条
  "toutiaospider",
  "iaskspider", // 讯飞
  // AI / LLM crawlers
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "Bingbot",
  "MistralAI-User",
  "Kimi-Bot",
  "MoonshotAI",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: userAgents.map((ua) => ({
      userAgent: ua,
      allow: "/",
      disallow,
    })),
    sitemap: "https://f1frp.com/sitemap.xml",
    host: "https://f1frp.com",
  };
}
