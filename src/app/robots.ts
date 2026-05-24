import type { MetadataRoute } from "next";
import { ACTIVE_LOCALE, CURRENT_SITE_URL } from "@/lib/sites";

const baseDisallow = ["/api/", "/dashboard/", "/sign-in", "/sign-up"];

// 海外侧(getfrp.com)屏蔽 zh-only 路径,即便 sitemap 不收录,也禁止爬虫从内部
// 链接 / 历史外链抓到这些路径。/pricing 已 redirect /overseas,但仍然显式
// disallow 防止 Google 跟踪重定向链消耗抓取预算。
const enExtraDisallow = ["/pricing", "/overseas", "/factories", "/dashboard"];

// Western search + AI crawlers — primary audience for getfrp.com.
const WESTERN_AGENTS = [
  "*",
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Bingbot",
  "DuckDuckBot",
  "YandexBot",
  // AI / LLM crawlers
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "MistralAI-User",
];

// China-locale crawlers — only meaningful on f1frp.com (zh).
// Letting them crawl getfrp.com wastes Vercel egress and leaks the dual-track
// architecture to Western SEO competitors via WHOIS-style bot fingerprinting.
const CHINA_AGENTS = [
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
  "Kimi-Bot",
  "MoonshotAI",
];

export default function robots(): MetadataRoute.Robots {
  const userAgents =
    ACTIVE_LOCALE === "en"
      ? WESTERN_AGENTS
      : [...WESTERN_AGENTS, ...CHINA_AGENTS];

  const disallow =
    ACTIVE_LOCALE === "en"
      ? [...baseDisallow, ...enExtraDisallow]
      : baseDisallow;

  return {
    rules: userAgents.map((ua) => ({
      userAgent: ua,
      allow: "/",
      disallow,
    })),
    sitemap: `${CURRENT_SITE_URL}/sitemap.xml`,
    host: CURRENT_SITE_URL,
  };
}
