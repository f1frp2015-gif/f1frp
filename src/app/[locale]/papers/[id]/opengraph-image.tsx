import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { papers } from "@/lib/db/schema";
import { paperCategories } from "@/lib/data/papers";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "f1frp papers library";
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
  const fallback = isEn ? "Papers" : "论文库";
  const id = safeDecode(rawId);
  const [p] = await db
    .select()
    .from(papers)
    .where(eq(papers.id, id))
    .limit(1);
  if (!p) {
    return renderOgCard({
      category: fallback,
      title: isEn ? "Paper not found" : "论文未找到",
      subtitle: "f1frp.com",
    });
  }
  const catEntry = paperCategories.find((c) => c.id === p.category);
  const catName = catEntry
    ? (isEn && (catEntry as { nameEn?: string }).nameEn) ||
      (catEntry as { name: string }).name
    : fallback;
  const authorsLine = (p.authors as string[] | null)?.slice(0, 3).join(", ");
  const meta = [authorsLine, p.journal, p.year].filter(Boolean).join(" · ");
  return renderOgCard({
    category: `${isEn ? "Paper" : "论文"} · ${catName}`,
    title: isEn && p.titleEn ? p.titleEn : p.title,
    subtitle: isEn ? p.title : p.titleEn ?? undefined,
    meta: meta || undefined,
  });
}
