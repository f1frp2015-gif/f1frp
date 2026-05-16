// Per-page SEO helpers. Used by every page's generateMetadata so we produce
// path-aware canonical + hreflang instead of the all-pages-point-to-root
// bug the layout had before. Keep these in lock-step with sitemap.ts.

import type { Metadata } from "next";
import { CURRENT_SITE_URL, SITE_ZH, SITE_EN, crossSiteUrls } from "@/lib/sites";

// Build a canonical absolute URL for the current deploy + path.
export function canonical(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${CURRENT_SITE_URL}${p === "/" ? "" : p}`;
}

// Cross-domain hreflang for a given content path.
// Identical paths exist on both deploys (f1frp.com zh, getfrp.com en);
// pages that are zh-only (pricing / overseas) pass zhOnly=true so the
// EN hreflang is omitted (avoids Google chasing a 404).
export function alternates(
  path: string,
  opts: { zhOnly?: boolean } = {},
): Metadata["alternates"] {
  const { zh, en } = crossSiteUrls(path);
  if (opts.zhOnly) {
    return {
      canonical: canonical(path),
      languages: { zh, "zh-CN": zh, "x-default": zh },
    };
  }
  return {
    canonical: canonical(path),
    languages: {
      zh,
      "zh-CN": zh,
      en,
      "en-US": en,
      "en-GB": en,
      "en-AU": en,
      "en-CA": en,
      "x-default": en,
    },
  };
}

// Suppress unused-import warning when callers only need one of the constants
// indirectly via this module's surface.
void SITE_ZH;
void SITE_EN;
