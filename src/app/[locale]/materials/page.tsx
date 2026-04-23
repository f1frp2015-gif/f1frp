import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { materials as materialsTable } from "@/lib/db/schema";
import { MaterialsClient } from "./materials-client";
import { materialCategories } from "@/lib/data/materials";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Materials" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rows = await db
    .select()
    .from(materialsTable)
    .orderBy(asc(materialsTable.category), asc(materialsTable.name))
    .limit(500);

  const inLanguage = locale === "en" ? "en" : "zh-CN";
  const t = await getTranslations({ locale, namespace: "Materials" });
  const top20 = rows.slice(0, 20);
  const materialsItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `https://f1frp.com/${locale}/materials`,
    inLanguage,
    name: t("metaTitle"),
    numberOfItems: top20.length,
    itemListElement: top20.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: r.name,
        alternateName: r.nameEn ?? undefined,
        description: r.description ?? undefined,
        url: `https://f1frp.com/${locale}/materials/${r.id}`,
        brand: r.brand ? { "@type": "Brand", name: r.brand } : undefined,
      },
    })),
  };

  const serialized = rows.map((r) => ({
    id: r.id,
    name: r.name,
    nameEn: r.nameEn ?? "",
    category: r.category,
    subCategory: r.subCategory ?? "",
    brand: r.brand ?? "",
    model: r.model ?? "",
    properties: (r.properties ?? {}) as Record<string, string>,
    applications: (r.applications ?? []) as string[],
    description: r.description ?? "",
  }));

  return (
    <>
      <JsonLd data={materialsItemListJsonLd} />
      <MaterialsClient materials={serialized} categories={materialCategories} />
    </>
  );
}
