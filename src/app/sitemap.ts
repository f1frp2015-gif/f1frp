import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articles,
  standards,
  papers,
  patents,
  materials,
  supplierListings,
} from "@/lib/db/schema";
import { routing } from "@/i18n/routing";

const BASE = "https://f1frp.com";

export const revalidate = 3600;

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/materials", changeFrequency: "daily", priority: 0.9 },
  { path: "/formulas", changeFrequency: "weekly", priority: 0.8 },
  { path: "/standards", changeFrequency: "weekly", priority: 0.8 },
  { path: "/papers", changeFrequency: "daily", priority: 0.8 },
  { path: "/patents", changeFrequency: "weekly", priority: 0.7 },
  { path: "/suppliers", changeFrequency: "daily", priority: 0.9 },
  { path: "/tech", changeFrequency: "weekly", priority: 0.7 },
  { path: "/articles", changeFrequency: "daily", priority: 0.8 },
  { path: "/downloads", changeFrequency: "weekly", priority: 0.7 },
  { path: "/ai", changeFrequency: "monthly", priority: 0.7 },
  { path: "/news", changeFrequency: "weekly", priority: 0.6 },
  { path: "/community", changeFrequency: "weekly", priority: 0.5 },
  { path: "/trade", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
];

async function safeFetch<T>(fn: () => Promise<T>): Promise<T | []> {
  try {
    return await fn();
  } catch {
    return [] as unknown as T;
  }
}

// Build a URL for a given locale; default locale has no prefix because
// routing.ts uses `localePrefix: "as-needed"`.
function localeUrl(locale: string, path: string): string {
  if (locale === routing.defaultLocale) {
    return `${BASE}${path === "/" ? "" : path}` || BASE;
  }
  return `${BASE}/${locale}${path === "/" ? "" : path}`;
}

function withAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localeUrl(l, path);
  }
  languages["x-default"] = localeUrl(routing.defaultLocale, path);
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const r of staticRoutes) {
    for (const l of routing.locales) {
      staticEntries.push({
        url: localeUrl(l, r.path),
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
        alternates: { languages: withAlternates(r.path) },
      });
    }
  }

  const [
    articleRows,
    standardRows,
    paperRows,
    patentRows,
    materialRows,
    supplierRows,
  ] = await Promise.all([
    safeFetch(() =>
      db
        .select({ slug: articles.slug, updatedAt: articles.updatedAt })
        .from(articles)
        .orderBy(desc(articles.publishedAt))
        .limit(1000)
    ),
    safeFetch(() =>
      db
        .select({ id: standards.id, updatedAt: standards.updatedAt })
        .from(standards)
        .limit(1000)
    ),
    safeFetch(() =>
      db
        .select({ id: papers.id, slug: papers.slug, updatedAt: papers.updatedAt })
        .from(papers)
        .orderBy(desc(papers.updatedAt))
        .limit(2000)
    ),
    safeFetch(() =>
      db
        .select({ id: patents.id, slug: patents.slug, updatedAt: patents.updatedAt })
        .from(patents)
        .orderBy(desc(patents.updatedAt))
        .limit(2000)
    ),
    safeFetch(() =>
      db
        .select({ id: materials.id, updatedAt: materials.updatedAt })
        .from(materials)
        .limit(2000)
    ),
    safeFetch(() =>
      db
        .select({ id: supplierListings.id, updatedAt: supplierListings.updatedAt })
        .from(supplierListings)
        .limit(500)
    ),
  ]);

  function dynamicEntries<T>(
    rows: T[],
    getPath: (r: T) => string,
    getUpdatedAt: (r: T) => Date | null,
    priority: number
  ): MetadataRoute.Sitemap {
    const out: MetadataRoute.Sitemap = [];
    for (const r of rows) {
      const path = getPath(r);
      for (const l of routing.locales) {
        out.push({
          url: localeUrl(l, path),
          lastModified: getUpdatedAt(r) ?? now,
          changeFrequency: "monthly",
          priority,
          alternates: { languages: withAlternates(path) },
        });
      }
    }
    return out;
  }

  return [
    ...staticEntries,
    ...dynamicEntries(
      articleRows as Array<{ slug: string; updatedAt: Date | null }>,
      (r) => `/articles/${r.slug}`,
      (r) => r.updatedAt,
      0.6
    ),
    ...dynamicEntries(
      standardRows as Array<{ id: string; updatedAt: Date | null }>,
      (r) => `/standards/${r.id}`,
      (r) => r.updatedAt,
      0.7
    ),
    ...dynamicEntries(
      paperRows as Array<{ id: string; slug: string | null; updatedAt: Date | null }>,
      (r) => `/papers/${r.slug ?? r.id}`,
      (r) => r.updatedAt,
      0.6
    ),
    ...dynamicEntries(
      patentRows as Array<{ id: string; slug: string | null; updatedAt: Date | null }>,
      (r) => `/patents/${r.slug ?? r.id}`,
      (r) => r.updatedAt,
      0.6
    ),
    ...dynamicEntries(
      materialRows as Array<{ id: string; updatedAt: Date | null }>,
      (r) => `/materials/${r.id}`,
      (r) => r.updatedAt,
      0.6
    ),
    ...dynamicEntries(
      supplierRows as Array<{ id: string; updatedAt: Date | null }>,
      (r) => `/suppliers#${r.id}`,
      (r) => r.updatedAt,
      0.5
    ),
  ];
}
