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

export const revalidate = 3600;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  const id = safeDecode(rawId);
  const [std] = await db
    .select()
    .from(standardsTable)
    .where(eq(standardsTable.id, id))
    .limit(1);
  const isEn = locale === "en";
  if (!std || (isEn && !(std.titleEn && std.titleEn.trim()))) {
    const t = await getTranslations({ locale, namespace: "Standards" });
    return {
      title: t("detail.notFound"),
      robots: { index: false, follow: false },
    };
  }
  const titleText = isEn ? std.titleEn ?? "" : std.title;
  const descText = isEn
    ? std.descriptionEn ?? `${std.code} — ${titleText}`
    : std.description ?? `${std.code} — ${titleText}`;
  // EN 侧若 description + sections.bodyEn 全空 → 页面仅有 code+title, 极薄
  // 内容; 给 noindex 防止 Google 把它当 thin content 拉低整站质量分。
  let thinContent = false;
  if (isEn) {
    const descLen = (std.descriptionEn ?? "").trim().length;
    if (descLen < 80) {
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
  }
  return {
    title: `${std.code} ${titleText}`,
    description: descText,
    alternates: alternates(`/standards/${std.id}`),
    openGraph: og(`/standards/${std.id}`, {
      title: `${std.code} ${titleText}`,
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

  const [std] = await db
    .select()
    .from(standardsTable)
    .where(eq(standardsTable.id, id))
    .limit(1);
  if (!std) notFound();
  // EN 侧缺英文标题一律 404, 不展示中文内容
  if (locale === "en" && !(std.titleEn && std.titleEn.trim())) notFound();

  const sections = await db
    .select()
    .from(standardSectionsTable)
    .where(eq(standardSectionsTable.standardId, id))
    .orderBy(asc(standardSectionsTable.sortOrder));

  const isEn = locale === "en";
  // EN 侧不向中文 fallback (上方已保证 titleEn 必存在)
  const payload = {
    id: std.id,
    code: std.code,
    title: isEn ? std.titleEn ?? "" : std.title,
    titleEn: std.titleEn ?? "",
    country: isEn ? std.countryEn ?? "" : std.country ?? "",
    countryCode: std.countryCode ?? "",
    category: isEn ? std.categoryEn ?? "" : std.category ?? "",
    process: (isEn ? std.processEn ?? [] : std.process ?? []) as string[],
    year: std.year ?? "",
    status: (isEn ? std.statusEn ?? std.status : std.status) ?? "现行",
    description: isEn ? std.descriptionEn ?? "" : std.description ?? "",
    sections: sections
      .filter((s) =>
        isEn ? (s.titleEn && s.titleEn.trim()) || (s.bodyEn && s.bodyEn.trim()) : true,
      )
      .map((s) => ({
        id: s.id,
        chapterNo: s.chapterNo,
        title: isEn ? s.titleEn ?? "" : s.title,
        body: isEn ? s.bodyEn ?? "" : s.body,
        keyPoints: (isEn ? s.keyPointsEn ?? [] : s.keyPoints ?? []) as string[],
      })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: locale === "en" ? "Home" : "首页", url: `${CURRENT_SITE_URL}/` },
          { name: t("detail.breadcrumb"), url: `${CURRENT_SITE_URL}/standards` },
          { name: std.code, url: `${CURRENT_SITE_URL}/standards/${std.id}` },
        ]}
      />
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          <Link href="/standards" className="hover:text-primary hover:underline">
            {t("detail.breadcrumb")}
          </Link>
          <span className="mx-1.5">/</span>
          <span>{std.code}</span>
        </div>
        <AskAiButton
          prompt={
            locale === "en"
              ? `Explain ${std.code}${std.titleEn ? ` — ${std.titleEn}` : std.title ? ` — ${std.title}` : ""}. What ASTM / ISO / EN standards does it map to? Which test methods does it cover? When does an overseas buyer need to ask for it?`
              : `${std.code}${std.title ? ` — ${std.title}` : ""} 的核心要点、对应的国际标准（ASTM/ISO/EN）、测试方法和使用场景。`
          }
        />
      </div>
      <StandardDetailClient standard={payload} />
    </div>
  );
}
