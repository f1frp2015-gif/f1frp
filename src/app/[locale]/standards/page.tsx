import type { Metadata } from "next";
import { and, asc, isNotNull, ne } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { standards as standardsTable } from "@/lib/db/schema";
import { alternates } from "@/lib/seo";
import { StandardsClient, type SerializedStandard } from "./standards-client";
import {
  countryFilters,
  standardCategories,
  processTagOptions,
} from "@/lib/data/standards";
import { GB_STANDARDS_EN } from "@/lib/data/gb-standards-en";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Standards" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/standards"),
  };
}

export const revalidate = 3600;

export default async function StandardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  // EN 侧只展示已有英文标题的标准, 避免页面回退到中文 → Google 把页面归到 zh
  const rows = await (async () => {
    try {
      return await db
        .select()
        .from(standardsTable)
        .where(
          isEn
            ? and(
                isNotNull(standardsTable.titleEn),
                ne(standardsTable.titleEn, ""),
              )
            : undefined,
        )
        .orderBy(asc(standardsTable.countryCode), asc(standardsTable.code));
    } catch {
      // The English site still exposes the curated GB starter set when the
      // live database is temporarily unavailable.
      return [];
    }
  })();

  const serializedFromDb: SerializedStandard[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: isEn ? r.titleEn ?? "" : r.title,
    titleEn: r.titleEn ?? "",
    country: isEn ? r.countryEn ?? "" : r.country ?? "",
    countryCode: r.countryCode ?? "",
    category: isEn ? r.categoryEn ?? "" : r.category ?? "",
    process: (isEn ? r.processEn ?? [] : r.process ?? []) as string[],
    year: r.year ?? "",
    status: ((isEn ? r.statusEn ?? r.status : r.status) ?? "现行") as SerializedStandard["status"],
    description: isEn ? r.descriptionEn ?? "" : r.description ?? "",
  }));
  const serialized: SerializedStandard[] = isEn
    ? Array.from(
        new Map<string, SerializedStandard>([
          ...GB_STANDARDS_EN.map(
            (standard) =>
              [
                standard.id,
                {
                  id: standard.id,
                  code: standard.code,
                  title: standard.titleEn,
                  titleEn: standard.titleEn,
                  country: standard.countryEn,
                  countryCode: standard.countryCode,
                  category: standard.category,
                  process: ["general"] as string[],
                  year: standard.year,
                  status: "现行" as const,
                  description: standard.descriptionEn,
                },
              ] as const,
          ),
          ...serializedFromDb.map((standard) => [standard.id, standard] as const),
        ]).values(),
      ).sort(
        (a, b) =>
          a.countryCode.localeCompare(b.countryCode) ||
          a.code.localeCompare(b.code),
      )
    : serializedFromDb;

  return (
    <StandardsClient
      standards={serialized}
      countryFilters={countryFilters}
      standardCategories={standardCategories}
      processTagOptions={processTagOptions}
    />
  );
}
