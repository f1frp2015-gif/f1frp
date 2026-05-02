// Server-side locale resolution for API routes.
//
// 不变量：f1frp.com = zh-only, getfrp.com = en-only. Even if the client sends
// body.locale that disagrees with the host (stale cache, direct API call,
// scripted request), the host wins. Falls back to body locale only on
// preview / dev hosts where neither production domain matches.

import { ACTIVE_LOCALE } from "@/lib/sites";

const HOST_LOCALE: Record<string, "zh" | "en"> = {
  "f1frp.com": "zh",
  "www.f1frp.com": "zh",
  "getfrp.com": "en",
  "www.getfrp.com": "en",
};

export function resolveServerLocale(
  req: Request,
  bodyLocale?: string
): "zh" | "en" {
  const rawHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const host = rawHost?.toLowerCase().split(":")[0];
  if (host && HOST_LOCALE[host]) return HOST_LOCALE[host];

  if (bodyLocale === "en" || bodyLocale === "zh") return bodyLocale;
  return ACTIVE_LOCALE;
}
