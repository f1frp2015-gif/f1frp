// Sitemap INDEX. Custom route handler (not the metadata `sitemap.ts`
// convention) because Next 16 cannot emit <sitemapindex> — only <urlset>.
// Lists one child sitemap per content type for the current deploy; the
// children live at /sitemaps/[type].xml. robots.txt points search engines
// (Baidu / Google / Bing / Sogou / 360) here.

import { CURRENT_SITE_URL } from "@/lib/sites";
import { childSitemapTypes, renderSitemapIndex } from "@/lib/sitemap-data";

export const revalidate = 3600;

export async function GET() {
  const lastmod = new Date().toISOString();
  const children = childSitemapTypes().map((type) => ({
    loc: `${CURRENT_SITE_URL}/sitemaps/${type}.xml`,
    lastmod,
  }));

  return new Response(renderSitemapIndex(children), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
