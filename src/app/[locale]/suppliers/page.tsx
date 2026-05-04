import type { Metadata } from "next";
import { desc, asc, isNotNull, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { supplierCategories, provinces } from "@/lib/data/suppliers";
import { SuppliersClient, type SerializedSupplier } from "./suppliers-client";
import { JsonLd } from "@/components/json-ld";
import { AskAiButton } from "@/components/ask-ai-button";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Suppliers" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Suppliers");

  // On English deployments, hide records that don't have an English name yet.
  // Existing Chinese-only rows stay on f1frp.com (zh) until backfilled.
  const isEn = locale === "en";
  const baseQuery = db.select().from(supplierListings);
  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;
  const rows = await (isEn
    ? baseQuery
        .where(isNotNull(supplierListings.nameEn))
        .orderBy(
          desc(supplierListings.verified),
          desc(supplierListings.brandPriority),
          desc(tierRank),
          desc(supplierListings.viewCount),
          asc(supplierListings.nameEn),
        )
    : baseQuery.orderBy(
        desc(supplierListings.verified),
        desc(supplierListings.brandPriority),
        desc(tierRank),
        desc(supplierListings.viewCount),
        asc(supplierListings.name),
      ));

  const inLanguage = isEn ? "en" : "zh-CN";
  const top20Verified = rows.filter((s) => s.verified).slice(0, 20);
  const suppliersItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `https://f1frp.com/${locale}/suppliers`,
    inLanguage,
    name: t("pageDirectoryTitle"),
    numberOfItems: top20Verified.length,
    itemListElement: top20Verified.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: (isEn ? s.nameEn : s.name) ?? s.name,
        description: (isEn ? s.descriptionEn : s.description) ?? undefined,
        address: (isEn ? s.locationEn : s.location)
          ? {
              "@type": "PostalAddress",
              addressLocality: (isEn ? s.locationEn : s.location) as string,
              addressCountry: "CN",
            }
          : undefined,
        url: `https://f1frp.com/${locale}/suppliers#${s.id}`,
      },
    })),
  };

  const serialized: SerializedSupplier[] = rows.map((s) => ({
    id: s.id,
    name: (isEn ? s.nameEn : s.name) ?? s.name,
    category: s.category ?? "",
    location: (isEn ? s.locationEn : s.location) ?? "",
    established: s.established ?? null,
    description: (isEn ? s.descriptionEn : s.description) ?? "",
    products: ((isEn ? s.productsEn : s.products) ?? []) as string[],
    processList: ((isEn ? s.processListEn : s.processList) ?? []) as string[],
    certifications: ((isEn ? s.certificationsEn : s.certifications) ?? []) as string[],
    verified: Boolean(s.verified),
    enterpriseId: s.enterpriseId ?? null,
    website: s.website ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={suppliersItemListJsonLd} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("pageDirectoryTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AskAiButton
            prompt={
              isEn
                ? `Match me a verified Chinese supplier. I'm looking for [fiber type / product category] with [certification, e.g. CE, ISO 9001, EN 13706] and approximate volume [MOQ]. Suggest 3-5 candidates ranked by scale tier and certification fit.`
                : `按工况帮我匹配 3-5 家国内复材供应商：[纤维/树脂/产品品类]、需要[认证]、年用量[数量]。按规模与匹配度排序。`
            }
            label={isEn ? "Ask AI to match a supplier" : "AI 智能匹配供应商"}
          />
          {/* getfrp（en）侧无会员/收费体系，海外买家走 /rfq 给 Doris；
              dashboard/enterprise 仅对 zh 侧的中国工厂开放 */}
          {isEn ? (
            <Link href={"/rfq" as never} className={buttonVariants()}>
              Submit an RFQ
            </Link>
          ) : (
            <Link
              href={"/dashboard/enterprise" as "/dashboard"}
              className={buttonVariants()}
            >
              {t("ctaFreeList")}
            </Link>
          )}
        </div>
      </div>

      <SuppliersClient
        suppliers={serialized}
        categories={supplierCategories}
        provinces={provinces.slice(0, 12)}
      />

      <div className="mt-10 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">
          {isEn ? "Ready to source?" : t("ctaBoxTitle")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn
            ? "Tell Doris what you need. First reply within 24 hours, no account required."
            : t("ctaBoxSub")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {isEn ? (
            <>
              <Link
                href={"/rfq" as never}
                className={buttonVariants({ size: "lg" })}
              >
                Submit an RFQ
              </Link>
              <a
                href="mailto:doris.li@f1composite.com"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Email Doris
              </a>
            </>
          ) : (
            <>
              <Link
                href={"/dashboard/enterprise" as "/dashboard"}
                className={buttonVariants({ size: "lg" })}
              >
                {t("ctaFreeEnroll")}
              </Link>
              <Link
                href={"/pricing" as "/"}
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {t("ctaMembership")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
