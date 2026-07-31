import type { Metadata } from "next";
import { and, asc, isNotNull, ne } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { standards as standardsTable } from "@/lib/db/schema";
import { alternates } from "@/lib/seo";
import { StandardsClient, type SerializedStandard } from "./standards-client";
import {
  countryFilters,
  standardCategories,
  processTagOptions,
} from "@/lib/data/standards";
import { GB_STANDARDS_EN } from "@/lib/data/gb-standards-en";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Standards" });
  if (locale === "en") {
    return {
      title: {
        absolute: "FRP Standard Cross Reference — GB ↔ ASTM ↔ ISO ↔ EN | getfrp",
      },
      description:
        "Free database of 95+ FRP standards mapped across GB, ASTM, ISO and EN. Compare Chinese factory test methods and verify certification scope before an RFQ.",
      alternates: alternates("/standards"),
    };
  }
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
  const rows = await (async () => {
    try {
      return await db
        .select()
        .from(standardsTable)
        .where(
          isEn
            ? and(
                isNotNull(standardsTable.titleEn),
                ne(standardsTable.titleEn, ""),
              )
            : undefined,
        )
        .orderBy(asc(standardsTable.countryCode), asc(standardsTable.code));
    } catch {
      // The English site still exposes the curated GB starter set when the
      // live database is temporarily unavailable.
      return [];
    }
  })();

  const serializedFromDb: SerializedStandard[] = rows.map((r) => ({
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
  const serialized: SerializedStandard[] = isEn
    ? Array.from(
        new Map<string, SerializedStandard>([
          ...GB_STANDARDS_EN.map(
            (standard) =>
              [
                standard.id,
                {
                  id: standard.id,
                  code: standard.code,
                  title: standard.titleEn,
                  titleEn: standard.titleEn,
                  country: standard.countryEn,
                  countryCode: standard.countryCode,
                  category: standard.category,
                  process: ["general"] as string[],
                  year: standard.year,
                  status: "现行" as const,
                  description: standard.descriptionEn,
                },
              ] as const,
          ),
          ...serializedFromDb.map((standard) => [standard.id, standard] as const),
        ]).values(),
      ).sort(
        (a, b) =>
          a.countryCode.localeCompare(b.countryCode) ||
          a.code.localeCompare(b.code),
      )
    : serializedFromDb;

  return (
    <>
      {isEn && (
        <section className="border-b border-border/80 bg-muted/15">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              GB ↔ ASTM ↔ ISO ↔ EN
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              FRP &amp; Composite Standards Cross Reference
            </h2>
            <div className="mt-5 max-w-4xl space-y-4 text-[15px] leading-7 text-muted-foreground">
              <p>
                Chinese FRP quotations often name a GB or GB/T test method while
                the buyer’s project specification calls up ASTM, ISO or EN. A
                cross-reference is a starting point for technical discussion, not
                permission to treat two documents as interchangeable. The method,
                specimen geometry, conditioning, loading rate, failure mode and
                reporting basis must be checked before a test result is accepted.
              </p>
              <p>
                This database brings the standards into one searchable surface for
                procurement and engineering teams. Each record identifies the
                country or standards body, product or test category, process tags,
                status and available English description. The English GB starter
                set includes tensile, flexural, compression, shear, winding-tube
                and carbon-fibre methods so a buyer can begin a standards review
                even when the factory’s original documentation is Chinese. Where
                a standard has no one-to-one equivalent, the distinction is stated
                instead of hidden behind a convenient label.
              </p>
              <p>
                Use the crosswalk before releasing an RFQ: write the governing
                standard edition, test laboratory requirement, specimen direction,
                minimum or characteristic value, certificate scope and retest rule
                into the request. Then ask the supplier to identify the exact legal
                entity, product, site and report number behind each claim. A CE or
                ISO logo is not itself evidence that a particular FRP grating,
                profile, rebar or pipe was tested to the required method. getfrp
                uses this standards layer alongside the material and supplier
                network to flag gaps before a commercial shortlist is released.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link href="/suppliers" className="rounded-md border border-border px-4 py-2 hover:bg-background">Browse verified supplier categories →</Link>
              <Link href="/source-from-china" className="rounded-md border border-border px-4 py-2 hover:bg-background">Read the China sourcing guide →</Link>
              <Link href="/rfq" className="rounded-md bg-foreground px-4 py-2 text-background hover:bg-foreground/90">Submit a standards-led RFQ →</Link>
            </div>
          </div>
        </section>
      )}
      <StandardsClient
        standards={serialized}
        countryFilters={countryFilters}
        standardCategories={standardCategories}
        processTagOptions={processTagOptions}
      />
    </>
  );
}
