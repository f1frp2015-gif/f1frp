// Central sitemap data + XML serializers.
//
// Split out of the old monolithic app/sitemap.ts so the sitemap can be served
// as an INDEX (app/sitemap.xml) pointing at per-type child sitemaps
// (app/sitemaps/[type].xml). Next 16's MetadataRoute.Sitemap can only emit a
// flat <urlset> — it has no <sitemapindex> support (see resolveSitemap in
// next/dist/build/.../resolve-route-data.js) — so we render the XML ourselves.
//
// Invariants preserved from the single-file version:
//   - EN deploy (getfrp.com) only lists ASCII paths with English content
//     (non-ASCII /materials/[id] etc. 404 on Vercel and tank index coverage).
//   - Thin papers/patents (abstract < 80 chars) are excluded on EN.
//   - Cross-domain hreflang (zh ⇄ en) on every URL.
// Changed on purpose:
//   - The old 1,000 / 2,000 / 500 row caps are lifted to the 50k sitemap
//     ceiling so the full corpus (≈3.7k papers, 4.3k materials, …) gets crawled.

import type { MetadataRoute } from "next";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articles,
  standards,
  papers,
  patents,
  materials,
  supplierListings,
} from "@/lib/db/schema";
import { CURRENT_SITE_URL, ACTIVE_LOCALE, crossSiteUrls } from "@/lib/sites";
import { sourcingTopicSlugs } from "@/lib/data/sourcing-topics";
import { baikeTopicSlugs } from "@/lib/data/baike-topics";
import { allComboSlugs } from "@/lib/data/matrix";
import { GB_STANDARDS_EN } from "@/lib/data/gb-standards-en";
import { SUPPLIER_CATEGORY_SLUGS } from "@/lib/data/supplier-category-pages";
import { SUPPLIER_REGION_SLUGS } from "@/lib/data/supplier-region-pages";

export type SitemapType =
  | "core"
  | "materials"
  | "papers"
  | "patents"
  | "standards"
  | "articles"
  | "suppliers"
  | "sourcing"
  | "baike";

// A single sitemap file may hold at most 50,000 URLs. Every table is well
// under that, so one child sitemap per type is sufficient.
const MAX_PER_SITEMAP = 50000;
// Google thin-content heuristic; below this an abstract triggers noindex and
// exclusion from the EN sitemap to avoid wasting crawl budget.
const MIN_ABSTRACT_LEN = 80;

const isAsciiPath = (s: string) => /^[\x00-\x7F]+$/.test(s);

async function safeFetch<T>(fn: () => Promise<T>): Promise<T | []> {
  try {
    return await fn();
  } catch {
    return [] as unknown as T;
  }
}

function urlFor(path: string): string {
  return `${CURRENT_SITE_URL}${path === "/" ? "" : path}` || CURRENT_SITE_URL;
}

// Cross-domain hreflang: identical paths exist on f1frp.com (zh) and
// getfrp.com (en). zh-only paths omit the EN alternate (it 404s / redirects).
function alternatesFor(
  path: string,
  zhOnly = false,
): MetadataRoute.Sitemap[number]["alternates"] {
  const { zh, en } = crossSiteUrls(path);
  if (zhOnly) {
    return { languages: { zh, "zh-CN": zh, "x-default": zh } };
  }
  return { languages: { zh, "zh-CN": zh, en, "x-default": en } };
}

function enOnlyAlternatesFor(
  path: string,
): MetadataRoute.Sitemap[number]["alternates"] {
  const en = urlFor(path);
  return { languages: { en, "x-default": en } };
}

type StaticRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  zhOnly?: boolean;
  enOnly?: boolean;
};

const staticRoutes: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/materials", changeFrequency: "daily", priority: 0.9 },
  { path: "/formulas", changeFrequency: "weekly", priority: 0.8, zhOnly: true },
  { path: "/standards", changeFrequency: "weekly", priority: 0.8 },
  { path: "/papers", changeFrequency: "daily", priority: 0.8 },
  { path: "/patents", changeFrequency: "weekly", priority: 0.7 },
  { path: "/suppliers", changeFrequency: "daily", priority: 0.9 },
  { path: "/tech", changeFrequency: "weekly", priority: 0.7 },
  { path: "/articles", changeFrequency: "daily", priority: 0.8, zhOnly: true },
  { path: "/fibers", changeFrequency: "monthly", priority: 0.7 },
  { path: "/matrix", changeFrequency: "monthly", priority: 0.6 },
  { path: "/ai", changeFrequency: "monthly", priority: 0.7 },
  { path: "/news", changeFrequency: "weekly", priority: 0.6 },
  { path: "/community", changeFrequency: "weekly", priority: 0.5 },
  { path: "/trade", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/overseas", changeFrequency: "weekly", priority: 0.9, zhOnly: true },
  { path: "/source-from-china", changeFrequency: "weekly", priority: 0.8, enOnly: true },
  { path: "/data/china-frp-trade-remedies", changeFrequency: "weekly", priority: 0.8, enOnly: true },
  { path: "/tools/buy-america-frp-checker", changeFrequency: "monthly", priority: 0.7, enOnly: true },
];

const toEntry = (
  path: string,
  updatedAt: Date | null,
  priority: number,
  now: Date,
): MetadataRoute.Sitemap[number] => ({
  url: urlFor(path),
  lastModified: updatedAt ?? now,
  changeFrequency: "monthly",
  priority,
  alternates: alternatesFor(path),
});

// ── per-type entry builders ───────────────────────────────────────────────

function coreEntries(now: Date): MetadataRoute.Sitemap {
  const staticEntries = staticRoutes
    .filter(
      (r) =>
        !(r.zhOnly && ACTIVE_LOCALE === "en") &&
        !(r.enOnly && ACTIVE_LOCALE === "zh"),
    )
    .map((r) => ({
      url: urlFor(r.path),
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: r.enOnly
        ? enOnlyAlternatesFor(r.path)
        : alternatesFor(r.path, r.zhOnly),
    }));

  // /matrix/[combo] — 55 canonical fiber×resin pages, bilingual (both deploys).
  // Newly added to the sitemap; previously SSR-only and invisible to crawlers.
  const comboEntries = allComboSlugs().map((combo) => ({
    url: urlFor(`/matrix/${combo}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    alternates: alternatesFor(`/matrix/${combo}`),
  }));

  return [...staticEntries, ...comboEntries];
}

export async function buildSitemapEntries(
  type: SitemapType,
): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const isEn = ACTIVE_LOCALE === "en";

  switch (type) {
    case "core":
      return coreEntries(now);

    case "materials": {
      const rows = (await safeFetch(() =>
        db
          .select({
            id: materials.id,
            nameEn: materials.nameEn,
            updatedAt: materials.updatedAt,
          })
          .from(materials)
          .limit(MAX_PER_SITEMAP),
      )) as Array<{ id: string; nameEn: string | null; updatedAt: Date | null }>;
      return rows
        .filter((r) =>
          isEn ? isAsciiPath(r.id) && (r.nameEn ?? "").trim() !== "" : true,
        )
        .map((r) => toEntry(`/materials/${r.id}`, r.updatedAt, 0.6, now));
    }

    case "papers": {
      const rows = (await safeFetch(() =>
        db
          .select({
            id: papers.id,
            slug: papers.slug,
            titleEn: papers.titleEn,
            abstractEn: papers.abstractEn,
            updatedAt: papers.updatedAt,
          })
          .from(papers)
          .orderBy(desc(papers.updatedAt))
          .limit(MAX_PER_SITEMAP),
      )) as Array<{
        id: string;
        slug: string | null;
        titleEn: string | null;
        abstractEn: string | null;
        updatedAt: Date | null;
      }>;
      return rows
        .map((r) => ({ urlSlug: r.slug ?? r.id, ...r }))
        .filter((r) =>
          isEn
            ? isAsciiPath(r.urlSlug) &&
              (r.titleEn ?? "").trim() !== "" &&
              (r.abstractEn ?? "").trim().length >= MIN_ABSTRACT_LEN
            : true,
        )
        .map((r) => toEntry(`/papers/${r.urlSlug}`, r.updatedAt, 0.6, now));
    }

    case "patents": {
      const rows = (await safeFetch(() =>
        db
          .select({
            id: patents.id,
            slug: patents.slug,
            titleEn: patents.titleEn,
            abstractEn: patents.abstractEn,
            updatedAt: patents.updatedAt,
          })
          .from(patents)
          .orderBy(desc(patents.updatedAt))
          .limit(MAX_PER_SITEMAP),
      )) as Array<{
        id: string;
        slug: string | null;
        titleEn: string | null;
        abstractEn: string | null;
        updatedAt: Date | null;
      }>;
      return rows
        .map((r) => ({ urlSlug: r.slug ?? r.id, ...r }))
        .filter((r) =>
          isEn
            ? isAsciiPath(r.urlSlug) &&
              (r.titleEn ?? "").trim() !== "" &&
              (r.abstractEn ?? "").trim().length >= MIN_ABSTRACT_LEN
            : true,
        )
        .map((r) => toEntry(`/patents/${r.urlSlug}`, r.updatedAt, 0.6, now));
    }

    case "standards": {
      const rows = (await safeFetch(() =>
        db
          .select({
            id: standards.id,
            titleEn: standards.titleEn,
            updatedAt: standards.updatedAt,
          })
          .from(standards)
          .limit(MAX_PER_SITEMAP),
      )) as Array<{ id: string; titleEn: string | null; updatedAt: Date | null }>;
      const entries = rows
        .filter((r) =>
          isEn ? isAsciiPath(r.id) && (r.titleEn ?? "").trim() !== "" : true,
        )
        .map((r) => toEntry(`/standards/${r.id}`, r.updatedAt, 0.7, now));
      if (!isEn) return entries;
      const seen = new Set(entries.map((entry) => entry.url));
      return [
        ...entries,
        ...GB_STANDARDS_EN.map((standard) =>
          toEntry(`/standards/${standard.id}`, now, 0.7, now),
        ).filter((entry) => !seen.has(entry.url)),
      ];
    }

    case "articles": {
      const rows = (await safeFetch(() =>
        db
          .select({ slug: articles.slug, updatedAt: articles.updatedAt })
          .from(articles)
          .where(
            isEn
              ? and(
                  eq(articles.forEn, true),
                  isNotNull(articles.publishedAt),
                  isNotNull(articles.titleEn),
                  ne(articles.titleEn, ""),
                )
              : and(
                  eq(articles.forZh, true),
                  isNotNull(articles.publishedAt),
                ),
          )
          .orderBy(desc(articles.publishedAt))
          .limit(MAX_PER_SITEMAP),
      )) as Array<{ slug: string; updatedAt: Date | null }>;
      if (isEn && rows.length < 3) return [];
      return rows
        .filter((r) => (isEn ? isAsciiPath(r.slug) : true))
        .map((r) => toEntry(`/articles/${r.slug}`, r.updatedAt, 0.6, now));
    }

    case "suppliers": {
      // /suppliers/[id] detail pages are closed on getfrp.com (en) to avoid
      // exposing factory identities — drop them from the EN sitemap entirely.
      // (zh keeps its existing entries; those already 404 and are left as-is so
      // f1frp.com output is unchanged.) The anonymized /suppliers index page
      // itself stays in the core sitemap.
      if (isEn) {
        return [...SUPPLIER_CATEGORY_SLUGS, ...SUPPLIER_REGION_SLUGS].map((slug) => ({
          ...toEntry(`/suppliers/${slug}`, now, 0.85, now),
          alternates: enOnlyAlternatesFor(`/suppliers/${slug}`),
          changeFrequency: "weekly" as const,
        }));
      }
      // Mirror the /suppliers/[id] notFound() gate: verified + English name.
      const rows = (await safeFetch(() =>
        db
          .select({
            id: supplierListings.id,
            nameEn: supplierListings.nameEn,
            updatedAt: supplierListings.updatedAt,
          })
          .from(supplierListings)
          .where(
            and(
              eq(supplierListings.verified, true),
              isNotNull(supplierListings.nameEn),
              ne(supplierListings.nameEn, ""),
            ),
          )
          .limit(MAX_PER_SITEMAP),
      )) as Array<{ id: string; nameEn: string | null; updatedAt: Date | null }>;
      return rows
        .filter((r) => (isEn ? (r.nameEn ?? "").trim() !== "" : true))
        .map((r) => toEntry(`/suppliers/${r.id}`, r.updatedAt, 0.7, now));
    }

    case "sourcing": {
      // Curated English long-tail hubs — EN deploy only.
      if (!isEn) return [];
      return sourcingTopicSlugs.map((slug) => ({
        ...toEntry(`/sourcing/${slug}`, now, 0.75, now),
        alternates: enOnlyAlternatesFor(`/sourcing/${slug}`),
        changeFrequency: "weekly" as const,
      }));
    }

    case "baike": {
      // 复材百科 — Chinese answer layer, zh deploy only. zh-only hreflang
      // (no EN alternate; getfrp has no /baike). Hub + each answer page.
      if (isEn) return [];
      const paths = ["/baike", ...baikeTopicSlugs.map((s) => `/baike/${s}`)];
      return paths.map((path) => ({
        url: urlFor(path),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: path === "/baike" ? 0.7 : 0.6,
        alternates: alternatesFor(path, true),
      }));
    }

    default:
      return [];
  }
}

// Child sitemaps applicable to the current deploy. The index lists exactly
// these; the [type] route prerenders exactly these.
export function childSitemapTypes(): SitemapType[] {
  const base: SitemapType[] = [
    "core",
    "materials",
    "papers",
    "patents",
    "standards",
    "articles",
    "suppliers",
  ];
  return ACTIVE_LOCALE === "en" ? [...base, "sourcing"] : [...base, "baike"];
}

// ── XML serializers (Next can't emit <sitemapindex>; match its <urlset>) ───

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlset(entries: MetadataRoute.Sitemap): string {
  const hasAlternates = entries.some(
    (e) => Object.keys(e.alternates?.languages ?? {}).length > 0,
  );
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  xml += hasAlternates
    ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    : ">\n";
  for (const e of entries) {
    xml += "  <url>\n";
    xml += `    <loc>${xmlEscape(e.url)}</loc>\n`;
    const langs = e.alternates?.languages as Record<string, string> | undefined;
    if (langs) {
      for (const lang of Object.keys(langs)) {
        const href = langs[lang];
        if (href) {
          xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${xmlEscape(href)}" />\n`;
        }
      }
    }
    if (e.lastModified) {
      const d =
        e.lastModified instanceof Date
          ? e.lastModified.toISOString()
          : e.lastModified;
      xml += `    <lastmod>${d}</lastmod>\n`;
    }
    if (e.changeFrequency) xml += `    <changefreq>${e.changeFrequency}</changefreq>\n`;
    if (typeof e.priority === "number") xml += `    <priority>${e.priority}</priority>\n`;
    xml += "  </url>\n";
  }
  xml += "</urlset>\n";
  return xml;
}

export function renderSitemapIndex(
  children: { loc: string; lastmod: string }[],
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const c of children) {
    xml += "  <sitemap>\n";
    xml += `    <loc>${xmlEscape(c.loc)}</loc>\n`;
    xml += `    <lastmod>${c.lastmod}</lastmod>\n`;
    xml += "  </sitemap>\n";
  }
  xml += "</sitemapindex>\n";
  return xml;
}
