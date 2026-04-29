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
    .select({
      id: patentsTable.id,
      slug: patentsTable.slug,
      title: patentsTable.title,
      titleEn: patentsTable.titleEn,
      applicationNo: patentsTable.applicationNo,
      publicationNo: patentsTable.publicationNo,
      grantNo: patentsTable.grantNo,
      applicant: patentsTable.applicant,
      filingDate: patentsTable.filingDate,
      publicationDate: patentsTable.publicationDate,
      grantDate: patentsTable.grantDate,
      classification: patentsTable.classification,
      status: patentsTable.status,
      country: patentsTable.country,
      countryCode: patentsTable.countryCode,
      category: patentsTable.category,
      abstract: patentsTable.abstract,
      // claims/inventors excluded — only loaded on /patents/[id]
    })
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
    inventors: [],
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
