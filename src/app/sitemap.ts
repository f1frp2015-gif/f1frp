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
import { CURRENT_SITE_URL, ACTIVE_LOCALE, crossSiteUrls } from "@/lib/sites";

export const revalidate = 3600;

type StaticRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  // 仅 zh 站收录的路径（getfrp.com 海外侧已取消会员/收费体系）
  zhOnly?: boolean;
};

const staticRoutes: StaticRoute[] = [
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
  { path: "/overseas", changeFrequency: "weekly", priority: 0.8, zhOnly: true },
  { path: "/source-from-china", changeFrequency: "weekly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.6, zhOnly: true },
];

async function safeFetch<T>(fn: () => Promise<T>): Promise<T | []> {
  try {
    return await fn();
  } catch {
    return [] as unknown as T;
  }
}

// Each host serves a single locale (f1frp.com→zh, getfrp.com→en).
// For getfrp.com we emit /<path> (since en is the default on that host with
// localePrefix=as-needed). For f1frp.com we emit /<path> too (zh-default).
function urlFor(path: string): string {
  return `${CURRENT_SITE_URL}${path === "/" ? "" : path}` || CURRENT_SITE_URL;
}

// Cross-domain hreflang: each path has a zh version on f1frp.com and an en
// version on getfrp.com. This is the key signal to Google that they are
// alternate language versions, not duplicates competing for ranking.
function alternatesFor(path: string, zhOnly = false) {
  const { zh, en } = crossSiteUrls(path);
  // zh-only 路径（pricing / overseas）海外侧已 404/redirect，
  // 不发 EN hreflang，避免 Google 抓到失效跨域 alternate
  if (zhOnly) {
    return { languages: { zh, "zh-CN": zh, "x-default": zh } };
  }
  return {
    languages: {
      zh,
      "zh-CN": zh,
      en,
      "x-default": en, // 海外默认引导到英文站
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes
    .filter((r) => !(r.zhOnly && ACTIVE_LOCALE === "en"))
    .map((r) => ({
      url: urlFor(r.path),
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: alternatesFor(r.path, r.zhOnly),
    }));

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
        .limit(1000),
    ),
    safeFetch(() =>
      db
        .select({ id: standards.id, updatedAt: standards.updatedAt })
        .from(standards)
        .limit(1000),
    ),
    safeFetch(() =>
      db
        .select({ id: papers.id, slug: papers.slug, updatedAt: papers.updatedAt })
        .from(papers)
        .orderBy(desc(papers.updatedAt))
        .limit(2000),
    ),
    safeFetch(() =>
      db
        .select({ id: patents.id, slug: patents.slug, updatedAt: patents.updatedAt })
        .from(patents)
        .orderBy(desc(patents.updatedAt))
        .limit(2000),
    ),
    safeFetch(() =>
      db
        .select({ id: materials.id, updatedAt: materials.updatedAt })
        .from(materials)
        .limit(2000),
    ),
    safeFetch(() =>
      db
        .select({ id: supplierListings.id, updatedAt: supplierListings.updatedAt })
        .from(supplierListings)
        .limit(500),
    ),
  ]);

  function dynamicEntries<T>(
    rows: T[],
    getPath: (r: T) => string,
    getUpdatedAt: (r: T) => Date | null,
    priority: number,
  ): MetadataRoute.Sitemap {
    return rows.map((r) => {
      const path = getPath(r);
      return {
        url: urlFor(path),
        lastModified: getUpdatedAt(r) ?? now,
        changeFrequency: "monthly" as const,
        priority,
        alternates: alternatesFor(path),
      };
    });
  }

  // Suppress unused warning for ACTIVE_LOCALE (kept exported for future
  // locale-conditional content; URL paths themselves are locale-agnostic).
  void ACTIVE_LOCALE;

  return [
    ...staticEntries,
    ...dynamicEntries(
      articleRows as Array<{ slug: string; updatedAt: Date | null }>,
      (r) => `/articles/${r.slug}`,
      (r) => r.updatedAt,
      0.6,
    ),
    ...dynamicEntries(
      standardRows as Array<{ id: string; updatedAt: Date | null }>,
      (r) => `/standards/${r.id}`,
      (r) => r.updatedAt,
      0.7,
    ),
    ...dynamicEntries(
      paperRows as Array<{ id: string; slug: string | null; updatedAt: Date | null }>,
      (r) => `/papers/${r.slug ?? r.id}`,
      (r) => r.updatedAt,
      0.6,
    ),
    ...dynamicEntries(
      patentRows as Array<{ id: string; slug: string | null; updatedAt: Date | null }>,
      (r) => `/patents/${r.slug ?? r.id}`,
      (r) => r.updatedAt,
      0.6,
    ),
    ...dynamicEntries(
      materialRows as Array<{ id: string; updatedAt: Date | null }>,
      (r) => `/materials/${r.id}`,
      (r) => r.updatedAt,
      0.6,
    ),
    ...dynamicEntries(
      supplierRows as Array<{ id: string; updatedAt: Date | null }>,
      // Supplier listing pages live at /suppliers (anchor #id used by UI).
      // For sitemap purposes Google only takes the URL part, so emit clean /suppliers.
      () => `/suppliers`,
      (r) => r.updatedAt,
      0.5,
    ),
  ];
}
