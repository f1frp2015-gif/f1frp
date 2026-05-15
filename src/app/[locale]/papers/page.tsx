import type { Metadata } from "next";
import { and, desc, isNotNull, ne, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { papers as papersTable } from "@/lib/db/schema";
import { paperCategories } from "@/lib/data/papers";
import { PapersClient, type SerializedPaper } from "./papers-client";

// 2026-04-27: list query now skips the heavy `abstract` field (only loaded
// on detail pages). Pre-fix the page was force-dynamic with full-row select,
// shipping ~20MB of JSON for 3.5k papers. Post-fix the response is ~2MB
// gzipped — fast enough to restore 10-min ISR.
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Papers" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PapersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const rows = await db
    .select({
      id: papersTable.id,
      slug: papersTable.slug,
      title: papersTable.title,
      titleEn: papersTable.titleEn,
      authors: papersTable.authors,
      affiliation: papersTable.affiliation,
      affiliationEn: papersTable.affiliationEn,
      journal: papersTable.journal,
      journalEn: papersTable.journalEn,
      year: papersTable.year,
      doi: papersTable.doi,
      keywords: papersTable.keywords,
      keywordsEn: papersTable.keywordsEn,
      category: papersTable.category,
      categoryEn: papersTable.categoryEn,
      language: papersTable.language,
      citationCount: papersTable.citationCount,
      sourceUrl: papersTable.sourceUrl,
      // abstract excluded — heavy field, only loaded on /papers/[id]
    })
    .from(papersTable)
    .where(
      // EN 侧仅展示英文标题已存在、且 URL slug 为 ASCII 的论文,
      // 否则页面回退到中文 → 整站语言信号紊乱, GSC 收录率受损
      isEn
        ? and(
            isNotNull(papersTable.titleEn),
            ne(papersTable.titleEn, ""),
            sql`COALESCE(${papersTable.slug}, ${papersTable.id}) ~ '^[\\x00-\\x7F]+$'`,
          )
        : undefined,
    )
    .orderBy(desc(papersTable.year), desc(papersTable.citationCount));

  const serialized: SerializedPaper[] = rows.map((r) => ({
    id: r.slug ?? r.id,
    title: isEn ? r.titleEn ?? "" : r.title,
    titleEn: r.titleEn ?? "",
    authors: (r.authors ?? []) as string[],
    affiliation: isEn ? r.affiliationEn ?? "" : r.affiliation ?? "",
    journal: isEn ? r.journalEn ?? "" : r.journal ?? "",
    year: r.year ?? null,
    doi: r.doi ?? "",
    keywords: (isEn ? r.keywordsEn ?? [] : r.keywords ?? []) as string[],
    category: isEn ? r.categoryEn ?? "" : r.category ?? "",
    language: (r.language as "zh" | "en" | null) ?? null,
    citationCount: r.citationCount ?? 0,
    sourceUrl: r.sourceUrl ?? "",
  }));

  return (
    <PapersClient papers={serialized} categories={paperCategories} />
  );
}
