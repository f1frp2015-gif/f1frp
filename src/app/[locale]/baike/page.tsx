import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import {
  baikeTopics,
  BAIKE_INTENT_ORDER,
  type BaikeIntent,
} from "@/lib/data/baike-topics";

// 复材百科枢纽页 (Tier 3)。zh-only。按意图分组分发到答案页 (Tier 2)。
export const revalidate = 86400;
export const dynamicParams = false;

const META_TITLE = "复材百科 — 复合材料选材 / 工艺 / 性能 / 标准 / 应用问答";
const META_DESC =
  "复合材料常见工程问题的答案优先解答:玻璃纤维 vs 碳纤维选型、拉挤/缠绕/RTM 工艺区别、玻璃钢性能参数、GB↔ASTM 标准对照、FRP 筋应用等,每条结论都链接到材料、标准与供应商数据。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "zh") return { robots: { index: false, follow: false } };
  return {
    title: META_TITLE,
    description: META_DESC,
    alternates: alternates("/baike", { zhOnly: true }),
    openGraph: og("/baike", { title: META_TITLE, description: META_DESC }),
  };
}

export default async function BaikeHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();
  setRequestLocale(locale);

  const url = `${CURRENT_SITE_URL}/baike`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: "复材百科",
    description: META_DESC,
    inLanguage: "zh-CN",
    isPartOf: { "@type": "WebSite", "@id": `${CURRENT_SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: baikeTopics.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${CURRENT_SITE_URL}/baike/${t.slug}`,
        name: t.question,
      })),
    },
  };

  const byIntent = BAIKE_INTENT_ORDER.map((intent) => ({
    intent,
    topics: baikeTopics.filter((t) => t.intent === intent),
  })).filter((g) => g.topics.length > 0) as {
    intent: BaikeIntent;
    topics: typeof baikeTopics;
  }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <BreadcrumbJsonLd
        items={[
          { name: "首页", url: `${CURRENT_SITE_URL}/` },
          { name: "复材百科", url },
        ]}
      />
      <JsonLd data={collectionSchema} />

      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          首页
        </Link>
        <span className="mx-1.5">/</span>
        <span>复材百科</span>
      </nav>

      <header className="mb-12 border-b border-border/70 pb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          BAIKE · 复材百科
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
          复合材料工程问答
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          选材、工艺、性能、标准、应用——常见的复材工程问题,这里直接给结论,再用材料库、标准库、论文专利的真实数据兜底,并链接到对应的选型页和供应商。
        </p>
      </header>

      <div className="space-y-12">
        {byIntent.map((group) => (
          <section key={group.intent}>
            <div className="mb-4 flex items-center gap-3 border-b border-border/70 pb-2">
              <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                {group.intent}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {group.topics.length} 篇
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/baike/${t.slug}` as never}
                  className="group flex flex-col rounded-lg border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
                      {t.question}
                    </h2>
                    <ChevronRight
                      size={15}
                      className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {t.teaser}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
