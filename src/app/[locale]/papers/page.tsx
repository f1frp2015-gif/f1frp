import type { Metadata } from "next";
import { desc } from "drizzle-orm";
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
  const rows = await db
    .select({
      id: papersTable.id,
      slug: papersTable.slug,
      title: papersTable.title,
      titleEn: papersTable.titleEn,
      authors: papersTable.authors,
      affiliation: papersTable.affiliation,
      journal: papersTable.journal,
      year: papersTable.year,
      doi: papersTable.doi,
      keywords: papersTable.keywords,
      category: papersTable.category,
      language: papersTable.language,
      citationCount: papersTable.citationCount,
      sourceUrl: papersTable.sourceUrl,
      // abstract excluded — heavy field, only loaded on /papers/[id]
    })
    .from(papersTable)
    .orderBy(desc(papersTable.year), desc(papersTable.citationCount));

  const serialized: SerializedPaper[] = rows.map((r) => ({
    id: r.slug ?? r.id,
    title: r.title,
    titleEn: r.titleEn ?? "",
    authors: (r.authors ?? []) as string[],
    affiliation: r.affiliation ?? "",
    journal: r.journal ?? "",
    year: r.year ?? null,
    doi: r.doi ?? "",
    keywords: (r.keywords ?? []) as string[],
    category: r.category ?? "",
    language: (r.language as "zh" | "en" | null) ?? null,
    citationCount: r.citationCount ?? 0,
    sourceUrl: r.sourceUrl ?? "",
  }));

  return (
    <PapersClient papers={serialized} categories={paperCategories} />
  );
}
