import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { standards } from "@/lib/db/schema";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "f1frp standards library";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

const STATUS_EN: Record<string, string> = {
  现行: "Active",
  废止: "Withdrawn",
  即将实施: "Upcoming",
};

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
  const fallback = isEn ? "Standards" : "标准库";
  const id = safeDecode(rawId);
  const [s] = await db
    .select()
    .from(standards)
    .where(eq(standards.id, id))
    .limit(1);
  if (!s) {
    return renderOgCard({
      category: fallback,
      title: isEn ? "Standard not found" : "标准未找到",
      subtitle: "f1frp.com",
    });
  }
  const statusDisplay = s.status
    ? isEn
      ? STATUS_EN[s.status] ?? s.status
      : s.status
    : null;
  return renderOgCard({
    category: `${isEn ? "Standard" : "标准"} · ${s.country ?? ""}`.trim(),
    title: isEn && s.titleEn ? s.titleEn : s.title,
    subtitle: s.code,
    meta:
      [s.year, statusDisplay].filter(Boolean).join(" · ") || undefined,
  });
}
