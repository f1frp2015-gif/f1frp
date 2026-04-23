import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { patents } from "@/lib/db/schema";
import { patentCategories, patentStatusLabels } from "@/lib/data/patents";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "复材站专利库";
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
  params: { id: string };
}) {
  const id = safeDecode(params.id);
  const [p] = await db
    .select()
    .from(patents)
    .where(eq(patents.id, id))
    .limit(1);
  if (!p) {
    return renderOgCard({
      category: "专利库",
      title: "专利未找到",
      subtitle: "f1frp.com",
    });
  }
  const catName =
    patentCategories.find((c) => c.id === p.category)?.name ?? "专利库";
  const status = (p.status ?? "pending") as keyof typeof patentStatusLabels;
  const meta = [
    p.applicant,
    p.publicationNo || p.grantNo,
    p.filingDate,
  ]
    .filter(Boolean)
    .join(" · ");
  return renderOgCard({
    category: `专利 · ${catName} · ${patentStatusLabels[status]}`,
    title: p.title,
    subtitle: p.titleEn ?? undefined,
    meta: meta || undefined,
  });
}
