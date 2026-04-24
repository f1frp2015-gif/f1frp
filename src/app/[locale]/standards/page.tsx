import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { standards as standardsTable } from "@/lib/db/schema";
import { StandardsClient, type SerializedStandard } from "./standards-client";
import {
  countryFilters,
  standardCategories,
  processTagOptions,
} from "@/lib/data/standards";
import { buildAlternates } from "@/lib/seo";

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
    alternates: buildAlternates("/standards", locale),
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

  const rows = await db
    .select()
    .from(standardsTable)
    .orderBy(asc(standardsTable.countryCode), asc(standardsTable.code));

  const serialized: SerializedStandard[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    titleEn: r.titleEn ?? "",
    country: r.country ?? "",
    countryCode: r.countryCode ?? "",
    category: r.category ?? "",
    process: (r.process ?? []) as string[],
    year: r.year ?? "",
    status: (r.status ?? "现行") as SerializedStandard["status"],
    description: r.description ?? "",
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
