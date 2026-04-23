import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { standards } from "@/lib/db/schema";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "复材站标准库";
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
  const [s] = await db
    .select()
    .from(standards)
    .where(eq(standards.id, id))
    .limit(1);
  if (!s) {
    return renderOgCard({
      category: "标准库",
      title: "标准未找到",
      subtitle: "f1frp.com",
    });
  }
  return renderOgCard({
    category: `标准 · ${s.country ?? ""}`.trim(),
    title: s.title,
    subtitle: s.code,
    meta: [s.year, s.status].filter(Boolean).join(" · ") || undefined,
  });
}
