// Per-type child sitemaps: /sitemaps/core.xml, /sitemaps/materials.xml, …
// Each returns a flat <urlset>. Splitting by type lets Baidu 站长 / Google
// Search Console report index coverage per content type instead of one opaque
// blob. Referenced from the /sitemap.xml index.

import { notFound } from "next/navigation";
import {
  buildSitemapEntries,
  childSitemapTypes,
  renderUrlset,
  type SitemapType,
} from "@/lib/sitemap-data";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return childSitemapTypes().map((type) => ({ type: `${type}.xml` }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const key = type.replace(/\.xml$/, "") as SitemapType;
  if (!childSitemapTypes().includes(key)) notFound();

  const entries = await buildSitemapEntries(key);

  return new Response(renderUrlset(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
