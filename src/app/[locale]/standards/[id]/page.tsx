import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import {
  standards as standardsTable,
  standardSections as standardSectionsTable,
} from "@/lib/db/schema";
import { StandardDetailClient } from "./standard-detail-client";
import { AskAiButton } from "@/components/ask-ai-button";
import { alternates, og } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { CURRENT_SITE_URL } from "@/lib/sites";
import { getGbStandardEn } from "@/lib/data/gb-standards-en";
import { SUPPLIER_CATEGORY_PAGES } from "@/lib/data/supplier-category-pages";

export const revalidate = 3600;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function loadStandard(id: string) {
  try {
    const [standard] = await db
      .select()
      .from(standardsTable)
      .where(eq(standardsTable.id, id))
      .limit(1);
    return standard;
  } catch {
    // The curated English GB records are deliberately usable as a static
    // fallback so a transient database outage does not remove them.
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  const id = safeDecode(rawId);
  const std = await loadStandard(id);
  const seed = locale === "en" ? getGbStandardEn(id) : undefined;
  const isEn = locale === "en";
  const titleText = isEn
    ? std?.titleEn?.trim() || seed?.titleEn
    : std?.title;
  if (!titleText || (!std && !seed)) {
    const t = await getTranslations({ locale, namespace: "Standards" });
    return {
      title: t("detail.notFound"),
      robots: { index: false, follow: false },
    };
  }

  const code = std?.code ?? seed?.code ?? id;
  const standardId = std?.id ?? seed?.id ?? id;
  const descText = isEn
    ? std?.descriptionEn?.trim() ||
      seed?.descriptionEn ||
      `${code} — ${titleText}`
    : std?.description ?? `${code} — ${titleText}`;

  // English standards with only a code/title stay noindex. The ten curated GB
  // records have substantive English descriptions and are therefore eligible
  // for indexing even before section-level translations are added.
  let thinContent = false;
  if (isEn && descText.trim().length < 80 && std) {
    const [{ n } = { n: 0 }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(standardSectionsTable)
      .where(
        and(
          eq(standardSectionsTable.standardId, std.id),
          sql`length(coalesce(${standardSectionsTable.bodyEn}, '')) > 0`,
        ),
      );
    thinContent = (n ?? 0) === 0;
  }

  const title = `${code} ${titleText}`;
  return {
    title,
    description: descText,
    alternates: alternates(`/standards/${standardId}`),
    openGraph: og(`/standards/${standardId}`, {
      title,
      description: descText,
    }),
    ...(thinContent ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function StandardDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: rawId } = await params;
  setRequestLocale(locale);
  const id = safeDecode(rawId);
  const t = await getTranslations({ locale, namespace: "Standards" });

  const std = await loadStandard(id);
  const seed = locale === "en" ? getGbStandardEn(id) : undefined;
  if (!std && !seed) notFound();
  if (locale !== "en" && !std) notFound();
  if (locale === "en" && !(std?.titleEn?.trim() || seed?.titleEn)) notFound();

  const sections = std
    ? await db
        .select()
        .from(standardSectionsTable)
        .where(eq(standardSectionsTable.standardId, id))
        .orderBy(asc(standardSectionsTable.sortOrder))
    : [];

  const isEn = locale === "en";
  const standardId = std?.id ?? seed?.id ?? id;
  const code = std?.code ?? seed?.code ?? id;
  const title = isEn
    ? std?.titleEn?.trim() || seed?.titleEn || ""
    : std?.title ?? "";
  const payload = {
    id: standardId,
    code,
    title,
    titleEn: std?.titleEn?.trim() || seed?.titleEn || "",
    country: isEn
      ? std?.countryEn?.trim() || seed?.countryEn || "China"
      : std?.country ?? "",
    countryCode: std?.countryCode ?? seed?.countryCode ?? "",
    category: isEn
      ? std?.categoryEn?.trim() || seed?.categoryEn || ""
      : std?.category ?? "",
    process: (isEn
      ? std?.processEn?.length
        ? std.processEn
        : seed?.processEn ?? []
      : std?.process ?? []) as string[],
    year: std?.year ?? seed?.year ?? "",
    status: isEn
      ? std?.statusEn?.trim() || seed?.statusEn || std?.status || "Active"
      : std?.status ?? "现行",
    description: isEn
      ? std?.descriptionEn?.trim() || seed?.descriptionEn || ""
      : std?.description ?? "",
    sections: sections
      .filter((section) =>
        isEn
          ? (section.titleEn && section.titleEn.trim()) ||
            (section.bodyEn && section.bodyEn.trim())
          : true,
      )
      .map((section) => ({
        id: section.id,
        chapterNo: section.chapterNo,
        title: isEn ? section.titleEn ?? "" : section.title,
        body: isEn ? section.bodyEn ?? "" : section.body,
        keyPoints: (isEn
          ? section.keyPointsEn ?? []
          : section.keyPoints ?? []) as string[],
      })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: locale === "en" ? "Home" : "首页", url: `${CURRENT_SITE_URL}/` },
          { name: t("detail.breadcrumb"), url: `${CURRENT_SITE_URL}/standards` },
          { name: code, url: `${CURRENT_SITE_URL}/standards/${standardId}` },
        ]}
      />
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          <Link href="/standards" className="hover:text-primary hover:underline">
            {t("detail.breadcrumb")}
          </Link>
          <span className="mx-1.5">/</span>
          <span>{code}</span>
        </div>
        <AskAiButton
          prompt={
            locale === "en"
              ? `Explain ${code}${title ? ` — ${title}` : ""}. What ASTM / ISO / EN standards does it map to? Which test methods does it cover? When does an overseas buyer need to ask for it?`
              : `${code}${title ? ` — ${title}` : ""} 的核心要点、对应的国际标准（ASTM/ISO/EN）、测试方法和使用场景。`
          }
        />
      </div>
      <StandardDetailClient standard={payload} />
      {isEn && (
        <section className="mx-auto mt-10 max-w-5xl border-t border-border/70 pt-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            PROCUREMENT CONTEXT
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            How to use {code} in an FRP sourcing specification
          </h2>
          <div className="mt-5 max-w-4xl space-y-4 text-[15px] leading-7 text-muted-foreground">
            <p>
              A standards reference is useful only when the quoted product,
              specimen and report are tied to the same requirement. Before
              accepting a factory certificate, record the edition of {code}, the
              property or test method it covers, specimen geometry, conditioning,
              loading rate, failure mode, laboratory identity and whether the
              reported value is typical, minimum or characteristic. Ask the
              supplier to identify the legal entity and production site named on
              the report, then confirm that the document covers the offered resin,
              reinforcement, profile, panel, bar or pipe—not merely a related
              product family.
            </p>
            <p>
              GB methods can be technically comparable to ASTM, ISO or EN methods
              without being interchangeable. Use the cross-reference as a review
              prompt, then write the governing project standard and acceptance
              value into the RFQ. For safety-critical or regulated work, request a
              current report from an accepted laboratory and define retesting,
              traceability and pre-shipment inspection before production starts.
              The getfrp supplier network links this evidence review to the
              category and material being purchased.
            </p>
          </div>
          <h3 className="mt-8 text-base font-semibold">Browse related FRP supply categories</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUPPLIER_CATEGORY_PAGES.map((category) => (
              <Link
                key={category.slug}
                href={`/suppliers/${category.slug}` as "/suppliers/[id]"}
                className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
              >
                {category.shortName} suppliers
              </Link>
            ))}
            <Link href="/source-from-china" className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">
              China sourcing guide →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
