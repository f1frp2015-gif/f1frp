import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { papers as papersTable } from "@/lib/db/schema";
import { paperCategories } from "@/lib/data/papers";
import { PapersClient, type SerializedPaper } from "./papers-client";
import { buildAlternates } from "@/lib/seo";

// TODO: papers page generates >19MB ISR fallback (entire papers table serialized).
// Switched to force-dynamic to unblock deploy. Proper fix: paginate + lazy-load
// abstracts client-side, then restore ISR with revalidate.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Papers" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/papers", locale),
  };
}

export default async function PapersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rows = await db
    .select()
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
    abstract: r.abstract ?? "",
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
