import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { patents } from "@/lib/db/schema";
import {
  patentCategories,
  patentStatusLabels,
  patentStatusLabelsEn,
} from "@/lib/data/patents";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "f1frp patents library";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: rawId } = await params;
  const isEn = locale === "en";
  const fallback = isEn ? "Patents" : "专利库";
  const id = safeDecode(rawId);
  const [p] = await db
    .select()
    .from(patents)
    .where(eq(patents.id, id))
    .limit(1);
  if (!p) {
    return renderOgCard({
      category: fallback,
      title: isEn ? "Patent not found" : "专利未找到",
      subtitle: "f1frp.com",
    });
  }
  const catEntry = patentCategories.find((c) => c.id === p.category);
  const catName = catEntry
    ? (isEn && (catEntry as { nameEn?: string }).nameEn) ||
      (catEntry as { name: string }).name
    : fallback;
  const status = (p.status ?? "pending") as keyof typeof patentStatusLabels;
  const labels = isEn ? patentStatusLabelsEn : patentStatusLabels;
  const meta = [
    p.applicant,
    p.publicationNo || p.grantNo,
    p.filingDate,
  ]
    .filter(Boolean)
    .join(" · ");
  return renderOgCard({
    category: `${isEn ? "Patent" : "专利"} · ${catName} · ${labels[status]}`,
    title: isEn && p.titleEn ? p.titleEn : p.title,
    subtitle: isEn ? p.title : p.titleEn ?? undefined,
    meta: meta || undefined,
  });
}
