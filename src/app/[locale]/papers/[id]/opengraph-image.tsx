import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { papers } from "@/lib/db/schema";
import { paperCategories } from "@/lib/data/papers";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "复材站论文库";
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
    .from(papers)
    .where(eq(papers.id, id))
    .limit(1);
  if (!p) {
    return renderOgCard({
      category: "论文库",
      title: "论文未找到",
      subtitle: "f1frp.com",
    });
  }
  const catName =
    paperCategories.find((c) => c.id === p.category)?.name ?? "论文库";
  const authorsLine = (p.authors as string[] | null)?.slice(0, 3).join(", ");
  const meta = [authorsLine, p.journal, p.year].filter(Boolean).join(" · ");
  return renderOgCard({
    category: `论文 · ${catName}`,
    title: p.title,
    subtitle: p.titleEn ?? undefined,
    meta: meta || undefined,
  });
}
