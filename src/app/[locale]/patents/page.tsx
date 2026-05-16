import type { Metadata } from "next";
import { and, desc, isNotNull, ne, sql } from "drizzle-orm";
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
import { alternates } from "@/lib/seo";

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
    alternates: alternates("/patents"),
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
  const isEn = locale === "en";

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
      applicantEn: patentsTable.applicantEn,
      filingDate: patentsTable.filingDate,
      publicationDate: patentsTable.publicationDate,
      grantDate: patentsTable.grantDate,
      classification: patentsTable.classification,
      status: patentsTable.status,
      country: patentsTable.country,
      countryEn: patentsTable.countryEn,
      countryCode: patentsTable.countryCode,
      category: patentsTable.category,
      categoryEn: patentsTable.categoryEn,
      abstract: patentsTable.abstract,
      abstractEn: patentsTable.abstractEn,
      // claims/inventors excluded — only loaded on /patents/[id]
    })
    .from(patentsTable)
    .where(
      // EN 侧仅展示英文标题已存在、且 URL slug 为 ASCII 的专利
      isEn
        ? and(
            isNotNull(patentsTable.titleEn),
            ne(patentsTable.titleEn, ""),
            sql`COALESCE(${patentsTable.slug}, ${patentsTable.id}) ~ '^[\\x00-\\x7F]+$'`,
          )
        : undefined,
    )
    .orderBy(desc(patentsTable.filingDate));

  const serialized: SerializedPatent[] = rows.map((r) => ({
    id: r.slug ?? r.id,
    title: isEn ? r.titleEn ?? "" : r.title,
    titleEn: r.titleEn ?? "",
    applicationNo: r.applicationNo ?? "",
    publicationNo: r.publicationNo ?? "",
    grantNo: r.grantNo ?? "",
    applicant: isEn ? r.applicantEn ?? "" : r.applicant ?? "",
    inventors: [],
    filingDate: r.filingDate ?? "",
    publicationDate: r.publicationDate ?? "",
    grantDate: r.grantDate ?? "",
    classification: (r.classification ?? []) as string[],
    status: (r.status ?? "pending") as SerializedPatent["status"],
    country: isEn ? r.countryEn ?? "" : r.country ?? "",
    countryCode: r.countryCode ?? "",
    category: isEn ? r.categoryEn ?? "" : r.category ?? "",
    abstract: isEn ? r.abstractEn ?? "" : r.abstract ?? "",
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
