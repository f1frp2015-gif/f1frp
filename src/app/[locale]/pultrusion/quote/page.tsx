// AI 粗测拉挤型材报价工具 — 入口页
//
// 路径:f1frp.com/pultrusion/quote (zh) / getfrp.com/pultrusion/quote (en)
// 战略定位:v4.1 Layer 1 免费引流钩子(详见 ~/.claude memory project_f1frp_agency.md)
//
// 页面分两层:
//   - server component(本文件):SEO metadata / 面包屑 / 静态文案 / JSON-LD
//   - client component(quote-tool.tsx):交互(对话 + 表单 + 结果)

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { alternates } from "@/lib/seo";
import { QuoteTool } from "./quote-tool";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PultrusionQuote.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates("/pultrusion/quote"),
  };
}

export default async function PultrusionQuotePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PultrusionQuote");

  // SoftwareApplication JSON-LD — 让 Google AI Overview / 必应能识别为工具类页面
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("page.title"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: t("meta.description"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={softwareSchema} />

      <PageBreadcrumbs
        homeLabel={t("breadcrumb.home")}
        trail={[
          { label: t("breadcrumb.pultrusion"), href: "/pultrusion" },
          { label: t("breadcrumb.quote"), href: "/pultrusion/quote" },
        ]}
      />

      <div className="mt-6 border-b border-border/70 pb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("page.eyebrow")}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("page.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("page.description")}
        </p>
      </div>

      <div className="mt-8">
        <QuoteTool />
      </div>

      <div className="mt-12 border-t border-border/70 pt-6 text-sm text-muted-foreground">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
          {t("disclaimer.eyebrow")}
        </div>
        <p className="mt-2 leading-relaxed">{t("disclaimer.body")}</p>
      </div>
    </main>
  );
}
