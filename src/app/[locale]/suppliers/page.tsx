import type { Metadata } from "next";
import { desc, asc, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { supplierCategories, provinces } from "@/lib/data/suppliers";
import { SuppliersClient, type SerializedSupplier } from "./suppliers-client";
import { JsonLd } from "@/components/json-ld";
import { AskAiButton } from "@/components/ask-ai-button";
import { alternates } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
export const revalidate = 3600;

const PINNED_SUPPLIER_ID = "sup-yaoyi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Suppliers" });
  if (locale === "en") {
    return {
      title: {
        absolute:
          "FRP & Composite Suppliers China — Verified Factory Directory (199+ Factories) | getfrp",
      },
      description:
        "Browse verified China FRP suppliers by grating, pultruded profile, fiberglass sheet, rebar, pipe, SMC/BMC, resin and fiber capability.",
      alternates: alternates("/suppliers"),
    };
  }
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/suppliers"),
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

  // Both domains expose the complete public directory. English rows fall back
  // to the existing Chinese fields until the supplier's English profile is
  // backfilled, so no supplier is hidden from discovery or search.
  const isEn = locale === "en";
  const baseQuery = db.select().from(supplierListings);
  const pinnedRank = sql<number>`CASE WHEN ${supplierListings.id} = ${PINNED_SUPPLIER_ID} THEN 1 ELSE 0 END`;
  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;
  const rows = await baseQuery.orderBy(
    // F1 stays permanently first. Published company profiles follow as one
    // contiguous group, then the remaining directory-only records.
    desc(pinnedRank),
    desc(supplierListings.profilePublished),
    desc(supplierListings.verified),
    desc(supplierListings.brandPriority),
    desc(tierRank),
    desc(supplierListings.viewCount),
    asc(supplierListings.name),
  );

  const inLanguage = isEn ? "en" : "zh-CN";
  const top20Verified = rows.filter((s) => s.verified).slice(0, 20);
  const suppliersItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `${CURRENT_SITE_URL}/suppliers`,
    inLanguage,
    name: t("pageDirectoryTitle"),
    numberOfItems: rows.length,
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
        url:
          s.profilePublished
            ? `${CURRENT_SITE_URL}/suppliers/${s.id}`
            : `${CURRENT_SITE_URL}/suppliers#${s.id}`,
      },
    })),
  };

  const serialized: SerializedSupplier[] = rows.map((s) => ({
    id: s.id,
    name: (isEn ? s.nameEn : s.name) ?? s.name,
    category: s.category ?? "",
    location: (isEn ? s.locationEn : s.location) ?? s.location ?? "",
    established: s.established ?? null,
    description: (isEn ? s.descriptionEn : s.description) ?? s.description ?? "",
    products: ((isEn ? s.productsEn : s.products) ?? s.products ?? []) as string[],
    processList: ((isEn ? s.processListEn : s.processList) ?? s.processList ?? []) as string[],
    certifications: ((isEn ? s.certificationsEn : s.certifications) ?? s.certifications ?? []) as string[],
    verified: Boolean(s.verified),
    profilePublished: Boolean(s.profilePublished),
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
          {/* getfrp（en）侧无会员/收费体系，海外买家走 /rfq 给 sourcing desk；
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
            ? "Email tech support with what you need. First reply within 24 hours, no account required."
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
                href="mailto:f1frp2015@gmail.com"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Email tech support
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
              <a
                href="mailto:f1frp2015@gmail.com?subject=%E4%BE%9B%E5%BA%94%E5%95%86%E5%85%A5%E9%A9%BB%E5%92%A8%E8%AF%A2"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                联系咨询
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
