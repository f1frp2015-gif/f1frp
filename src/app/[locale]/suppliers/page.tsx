import type { Metadata } from "next";
import { desc, asc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { supplierCategories, provinces } from "@/lib/data/suppliers";
import { SuppliersClient, type SerializedSupplier } from "./suppliers-client";
import { JsonLd } from "@/components/json-ld";

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

  // Sort precedence: pinned listings first, then verified, then alphabetical.
  // `pinned` is the platform-curated "top slot" (currently only F1Composite).
  const rows = await db
    .select()
    .from(supplierListings)
    .orderBy(
      desc(supplierListings.pinned),
      desc(supplierListings.verified),
      asc(supplierListings.name)
    );

  const inLanguage = locale === "en" ? "en" : "zh-CN";
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
        name: s.name,
        description: s.description ?? undefined,
        address: s.location
          ? { "@type": "PostalAddress", addressLocality: s.location, addressCountry: "CN" }
          : undefined,
        url: `https://f1frp.com/${locale}/suppliers#${s.id}`,
      },
    })),
  };

  const serialized: SerializedSupplier[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category ?? "",
    location: s.location ?? "",
    established: s.established ?? null,
    description: s.description ?? "",
    products: (s.products ?? []) as string[],
    processList: (s.processList ?? []) as string[],
    certifications: (s.certifications ?? []) as string[],
    verified: Boolean(s.verified),
    pinned: Boolean(s.pinned),
    website: s.website ?? null,
    enterpriseId: s.enterpriseId ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={suppliersItemListJsonLd} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("pageDirectoryTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href={"/dashboard/enterprise" as "/dashboard"}
          className={buttonVariants()}
        >
          {t("ctaFreeList")}
        </Link>
      </div>

      <SuppliersClient
        suppliers={serialized}
        categories={supplierCategories}
        provinces={provinces.slice(0, 12)}
      />

      <div className="mt-10 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">{t("ctaBoxTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("ctaBoxSub")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
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
        </div>
      </div>
    </div>
  );
}
