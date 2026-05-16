import type { Metadata } from "next";
import { and, asc, isNotNull, ne, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { materials as materialsTable } from "@/lib/db/schema";
import { MaterialsClient } from "./materials-client";
import { materialCategories } from "@/lib/data/materials";
import { JsonLd } from "@/components/json-ld";
import { alternates } from "@/lib/seo";

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
    alternates: alternates("/materials"),
  };
}

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  // getfrp.com 是英文站. 缺英文名的物料一律不展示, 否则页面会回退到中文 →
  // Google 把页面归类为 zh-CN, 与 f1frp.com 形成"重复, Google 选择了不同规范"。
  // 含非 ASCII 字符的 id 在线上 /materials/[id] 直接 404, 也一并过滤。
  const rows = await db
    .select()
    .from(materialsTable)
    .where(
      isEn
        ? and(
            isNotNull(materialsTable.nameEn),
            ne(materialsTable.nameEn, ""),
            sql`${materialsTable.id} ~ '^[\\x00-\\x7F]+$'`,
          )
        : undefined,
    )
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

  // EN 侧已经在 SQL 层过滤掉缺英文的行, 此处不再向中文字段 fallback。
  const serialized = rows.map((r) => ({
    id: r.id,
    name: isEn ? r.nameEn ?? "" : r.name,
    nameEn: r.nameEn ?? "",
    category: r.category,
    subCategory: isEn ? r.subCategoryEn ?? "" : r.subCategory ?? "",
    brand: isEn ? r.brandEn ?? "" : r.brand ?? "",
    model: isEn ? r.modelEn ?? "" : r.model ?? "",
    properties: (isEn ? r.propertiesEn ?? {} : r.properties ?? {}) as Record<string, string>,
    applications: (isEn ? r.applicationsEn ?? [] : r.applications ?? []) as string[],
    description: isEn ? r.descriptionEn ?? "" : r.description ?? "",
  }));

  return (
    <>
      <JsonLd data={materialsItemListJsonLd} />
      <MaterialsClient materials={serialized} categories={materialCategories} />
    </>
  );
}
