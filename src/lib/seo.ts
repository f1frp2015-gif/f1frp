// Per-page SEO helpers. Used by every page's generateMetadata so we produce
// path-aware canonical + hreflang instead of the all-pages-point-to-root
// bug the layout had before. Keep these in lock-step with sitemap.ts.

import type { Metadata } from "next";
import {
  CURRENT_SITE_URL,
  SITE_ZH,
  SITE_EN,
  ACTIVE_LOCALE,
  crossSiteUrls,
} from "@/lib/sites";

// Build a canonical absolute URL for the current deploy + path.
export function canonical(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${CURRENT_SITE_URL}${p === "/" ? "" : p}`;
}

// Per-page Open Graph block. The root layout sets ONE og:title (homepage
// brand tagline) and og:url="/" for every route; in this Next build a child
// `openGraph` REPLACES the parent's (resolve-metadata.js), and a page's
// `title` does NOT propagate into og:title. So without this helper every
// paper/material/supplier page ships the homepage's og:title and points
// og:url at the root — the same class of bug as the old all-pages-canonical
// =root issue the layout comment describes.
//
// We re-emit type/siteName/locale (lost on replace); the per-route
// opengraph-image.tsx still auto-attaches og:image, and twitter:* auto-
// inherits from these fields. Pass the page's own title/description.
export function og(
  path: string,
  meta: { title?: string; description?: string } = {},
): Metadata["openGraph"] {
  return {
    type: "website",
    siteName: ACTIVE_LOCALE === "en" ? "getfrp" : "复材站",
    locale: ACTIVE_LOCALE === "en" ? "en_US" : "zh_CN",
    url: canonical(path),
    ...(meta.title ? { title: meta.title } : {}),
    ...(meta.description ? { description: meta.description } : {}),
  };
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
