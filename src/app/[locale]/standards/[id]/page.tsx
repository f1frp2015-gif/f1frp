import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import {
  standards as standardsTable,
  standardSections as standardSectionsTable,
} from "@/lib/db/schema";
import { StandardDetailClient } from "./standard-detail-client";

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
  if (!std) {
    const t = await getTranslations({ locale, namespace: "Standards" });
    return { title: t("detail.notFound") };
  }
  return {
    title: `${std.code} ${std.title}`,
    description: std.description ?? `${std.code} — ${std.title}`,
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

  const sections = await db
    .select()
    .from(standardSectionsTable)
    .where(eq(standardSectionsTable.standardId, id))
    .orderBy(asc(standardSectionsTable.sortOrder));

  const payload = {
    id: std.id,
    code: std.code,
    title: std.title,
    titleEn: std.titleEn ?? "",
    country: std.country ?? "",
    countryCode: std.countryCode ?? "",
    category: std.category ?? "",
    process: (std.process ?? []) as string[],
    year: std.year ?? "",
    status: std.status ?? "现行",
    description: std.description ?? "",
    sections: sections.map((s) => ({
      id: s.id,
      chapterNo: s.chapterNo,
      title: s.title,
      body: s.body,
      keyPoints: (s.keyPoints ?? []) as string[],
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 text-xs text-muted-foreground">
        <Link href="/standards" className="hover:text-primary hover:underline">
          {t("detail.breadcrumb")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{std.code}</span>
      </div>
      <StandardDetailClient standard={payload} />
    </div>
  );
}
