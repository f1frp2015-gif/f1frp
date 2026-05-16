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
  const rows = await db
    .select()
    .from(standardsTable)
    .where(
      isEn
        ? and(isNotNull(standardsTable.titleEn), ne(standardsTable.titleEn, ""))
        : undefined,
    )
    .orderBy(asc(standardsTable.countryCode), asc(standardsTable.code));

  const serialized: SerializedStandard[] = rows.map((r) => ({
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

  return (
    <StandardsClient
      standards={serialized}
      countryFilters={countryFilters}
      standardCategories={standardCategories}
      processTagOptions={processTagOptions}
    />
  );
}
