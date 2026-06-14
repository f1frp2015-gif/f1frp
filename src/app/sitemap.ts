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
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { CURRENT_SITE_URL, ACTIVE_LOCALE, crossSiteUrls } from "@/lib/sites";
import { sourcingTopicSlugs } from "@/lib/data/sourcing-topics";

export const revalidate = 3600;

// getfrp.com 是英文站. 现实约束:
//  1) 物料/专利/论文的 id/slug 大量直接采用中文原文 → URL 含 UTF-8 字符
//  2) 部分中文 id 的 /materials/[id] 路由在线上返回 404 (Vercel 路由 / Next.js
//     编码处理不一致),Sitemap 把这些链接交给 Google 后会被记为"未找到 404",
//     拖累整站的索引覆盖率
//  3) 即便页面 200,标题/正文仍是中文,Google 语言检测会把页面归类为 zh-CN,
//     与 f1frp.com 的中文版形成"重复,Google 选择了不同的规范"
// 所以英文 sitemap 只收录 path 纯 ASCII 的条目;中文站 (f1frp.com) 保持全量.
const isAsciiPath = (s: string) => /^[\x00-\x7F]+$/.test(s);

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
  { path: "/fibers", changeFrequency: "monthly", priority: 0.7 },
  { path: "/matrix", changeFrequency: "monthly", priority: 0.6 },
  { path: "/ai", changeFrequency: "monthly", priority: 0.7 },
  { path: "/news", changeFrequency: "weekly", priority: 0.6 },
  { path: "/community", changeFrequency: "weekly", priority: 0.5 },
  { path: "/trade", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/overseas", changeFrequency: "weekly", priority: 0.9, zhOnly: true },
  { path: "/source-from-china", changeFrequency: "weekly", priority: 0.8 },
  // /pricing 已永久重定向 /overseas,不再单独出 sitemap 条目
  // /downloads → /materials、/factories → / 已 301(next.config.ts),不出 sitemap 条目
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
          .select({
            id: standards.id,
            titleEn: standards.titleEn,
            updatedAt: standards.updatedAt,
          })
          .from(standards)
          .limit(1000),
      ),
      safeFetch(() =>
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
          .limit(2000),
      ),
      safeFetch(() =>
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
          .limit(2000),
      ),
      safeFetch(() =>
        db
          .select({
            id: materials.id,
            nameEn: materials.nameEn,
            updatedAt: materials.updatedAt,
          })
          .from(materials)
          .where(eq(materials.status, "verified"))
          .limit(2000),
      ),
      // /suppliers/[id] programmatic pages — only emit rows with an English
      // name AND verified status, mirroring the page's notFound() gate.
      safeFetch(() =>
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
          .limit(500),
      ),
    ]);

  const isEn = ACTIVE_LOCALE === "en";

  // EN 侧: 只收录 path 纯 ASCII 且有英文内容字段的条目
  // ZH 侧: 全量收录(中文 slug 在 f1frp.com 是合法的本地化 URL)
  const articleEntries = (
    articleRows as Array<{ slug: string; updatedAt: Date | null }>
  )
    .filter((r) => (isEn ? isAsciiPath(r.slug) : true))
    .map((r) => ({ path: `/articles/${r.slug}`, updatedAt: r.updatedAt }));

  const standardEntries = (
    standardRows as Array<{
      id: string;
      titleEn: string | null;
      updatedAt: Date | null;
    }>
  )
    .filter((r) =>
      isEn ? isAsciiPath(r.id) && (r.titleEn ?? "").trim() !== "" : true,
    )
    .map((r) => ({ path: `/standards/${r.id}`, updatedAt: r.updatedAt }));

  // 80 字符是 Google 对 thin content 的经验阈值; 低于此触发 noindex,
  // 同时也从 sitemap 排除避免浪费爬取配额。
  const MIN_ABSTRACT_LEN = 80;

  const paperEntries = (
    paperRows as Array<{
      id: string;
      slug: string | null;
      titleEn: string | null;
      abstractEn: string | null;
      updatedAt: Date | null;
    }>
  )
    .map((r) => ({
      urlSlug: r.slug ?? r.id,
      titleEn: r.titleEn,
      abstractEn: r.abstractEn,
      updatedAt: r.updatedAt,
    }))
    .filter((r) =>
      isEn
        ? isAsciiPath(r.urlSlug) &&
          (r.titleEn ?? "").trim() !== "" &&
          (r.abstractEn ?? "").trim().length >= MIN_ABSTRACT_LEN
        : true,
    )
    .map((r) => ({ path: `/papers/${r.urlSlug}`, updatedAt: r.updatedAt }));

  const patentEntries = (
    patentRows as Array<{
      id: string;
      slug: string | null;
      titleEn: string | null;
      abstractEn: string | null;
      updatedAt: Date | null;
    }>
  )
    .map((r) => ({
      urlSlug: r.slug ?? r.id,
      titleEn: r.titleEn,
      abstractEn: r.abstractEn,
      updatedAt: r.updatedAt,
    }))
    .filter((r) =>
      isEn
        ? isAsciiPath(r.urlSlug) &&
          (r.titleEn ?? "").trim() !== "" &&
          (r.abstractEn ?? "").trim().length >= MIN_ABSTRACT_LEN
        : true,
    )
    .map((r) => ({ path: `/patents/${r.urlSlug}`, updatedAt: r.updatedAt }));

  const materialEntries = (
    materialRows as Array<{
      id: string;
      nameEn: string | null;
      updatedAt: Date | null;
    }>
  )
    .filter((r) =>
      // 关键: 含中文的 material id 在线上 /materials/[id] 直接 404,
      // 把它们留在 sitemap 会被 GSC 统计成大面积"未找到"错误。
      isEn ? isAsciiPath(r.id) && (r.nameEn ?? "").trim() !== "" : true,
    )
    .map((r) => ({ path: `/materials/${r.id}`, updatedAt: r.updatedAt }));

  // Supplier detail pages — verified + English-name only on EN deploy.
  // ID guaranteed ASCII (varchar 50 keyed slugs), so no ASCII filter needed.
  const supplierEntries = (
    supplierRows as Array<{
      id: string;
      nameEn: string | null;
      updatedAt: Date | null;
    }>
  )
    .filter((r) => (isEn ? (r.nameEn ?? "").trim() !== "" : true))
    .map((r) => ({ path: `/suppliers/${r.id}`, updatedAt: r.updatedAt }));

  const toSitemapEntry = (
    e: { path: string; updatedAt: Date | null },
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: urlFor(e.path),
    lastModified: e.updatedAt ?? now,
    changeFrequency: "monthly" as const,
    priority,
    alternates: alternatesFor(e.path),
  });

  // Hub-and-spoke /sourcing/[topic] landing pages. EN-only (curated English
  // long-tail content); the zh deploy doesn't expose these routes.
  const sourcingEntries =
    isEn
      ? sourcingTopicSlugs.map((slug) => ({
          path: `/sourcing/${slug}`,
          updatedAt: now,
        }))
      : [];

  return [
    ...staticEntries,
    ...articleEntries.map((e) => toSitemapEntry(e, 0.6)),
    ...standardEntries.map((e) => toSitemapEntry(e, 0.7)),
    ...paperEntries.map((e) => toSitemapEntry(e, 0.6)),
    ...patentEntries.map((e) => toSitemapEntry(e, 0.6)),
    ...materialEntries.map((e) => toSitemapEntry(e, 0.6)),
    // Each verified supplier now has a dedicated /suppliers/[id] page — emit
    // those distinct URLs (priority 0.7, higher than papers/patents because
    // they're commercial-intent landing pages, not reference content).
    ...supplierEntries.map((e) => toSitemapEntry(e, 0.7)),
    // Sourcing topics — commercial-intent long-tail. Same priority as supplier
    // detail pages, refresh weekly (content authored, not data-driven).
    ...sourcingEntries.map((e) => ({
      ...toSitemapEntry(e, 0.75),
      changeFrequency: "weekly" as const,
    })),
  ];
}
