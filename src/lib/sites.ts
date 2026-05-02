// 单一来源：双轨网站配对 + 当前部署侧识别。
// 用途：robots.txt / sitemap.xml / hreflang / canonical 都从这里读。
//
// 关键不变量：
//   f1frp.com  —— zh-only，部署在阿里云 ECS（国内）
//   getfrp.com —— en-only，部署在 Vercel（海外）
//
// 同一份代码，按 NEXT_PUBLIC_SITE_URL 区分当前部署在哪一侧。

export const SITE_ZH = "https://f1frp.com";
export const SITE_EN = "https://getfrp.com";

const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? SITE_ZH;
// 去尾斜线
const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;

export const CURRENT_SITE_URL = normalized;

export const ACTIVE_LOCALE: "zh" | "en" =
  CURRENT_SITE_URL === SITE_EN ? "en" : "zh";

export const PEER_SITE_URL = ACTIVE_LOCALE === "zh" ? SITE_EN : SITE_ZH;

/**
 * 给定一个无 locale 前缀的 path，返回该 path 在中文站和英文站对应的绝对 URL。
 * 用于 hreflang 跨域 alternate。
 *   path "/suppliers"  → { zh: "https://f1frp.com/suppliers", en: "https://getfrp.com/suppliers" }
 */
export function crossSiteUrls(path: string): { zh: string; en: string } {
  const p = path === "/" ? "" : path;
  return {
    zh: `${SITE_ZH}${p}`,
    en: `${SITE_EN}${p}`,
  };
}
