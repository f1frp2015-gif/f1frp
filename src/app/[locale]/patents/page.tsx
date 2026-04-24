import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { patents as patentsTable } from "@/lib/db/schema";
import {
  patentCategories,
  patentCountries,
  patentStatusLabels,
  patentStatusLabelsEn,
} from "@/lib/data/patents";
import { PatentsClient, type SerializedPatent } from "./patents-client";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Patents" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/patents", locale),
  };
}

export const revalidate = 600;

export default async function PatentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rows = await db
    .select()
    .from(patentsTable)
    .orderBy(desc(patentsTable.filingDate));

  const serialized: SerializedPatent[] = rows.map((r) => ({
    id: r.slug ?? r.id,
    title: r.title,
    titleEn: r.titleEn ?? "",
    applicationNo: r.applicationNo ?? "",
    publicationNo: r.publicationNo ?? "",
    grantNo: r.grantNo ?? "",
    applicant: r.applicant ?? "",
    inventors: (r.inventors ?? []) as string[],
    filingDate: r.filingDate ?? "",
    publicationDate: r.publicationDate ?? "",
    grantDate: r.grantDate ?? "",
    classification: (r.classification ?? []) as string[],
    status: (r.status ?? "pending") as SerializedPatent["status"],
    country: r.country ?? "",
    countryCode: r.countryCode ?? "",
    category: r.category ?? "",
    abstract: r.abstract ?? "",
  }));

  return (
    <PatentsClient
      patents={serialized}
      categories={patentCategories}
      countries={patentCountries}
      statusLabels={locale === "en" ? patentStatusLabelsEn : patentStatusLabels}
      locale={locale}
    />
  );
}
