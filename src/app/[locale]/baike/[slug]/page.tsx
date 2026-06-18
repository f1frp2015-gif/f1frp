import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  BookOpenCheck,
  Database,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import { findBaikeTopic, baikeTopicSlugs } from "@/lib/data/baike-topics";

// 复材百科答案页。zh-only(国内中文答案层;海外英文侧走 /sourcing/[topic])。
// 内容只在部署时改变,激进缓存。
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  // 海外(en)部署不暴露 /baike — 不预渲染。
  if (process.env.NEXT_PUBLIC_LOCALES === "en") return [];
  return baikeTopicSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const noindex = { robots: { index: false, follow: false } };
  if (locale !== "zh") return noindex;
  const t = findBaikeTopic(slug);
  if (!t) return { title: "未找到", ...noindex };
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    // zh-only 路由:hreflang 不发 EN alternate(getfrp 无 /baike)。
    alternates: alternates(`/baike/${t.slug}`, { zhOnly: true }),
    openGraph: og(`/baike/${t.slug}`, {
      title: t.metaTitle,
      description: t.metaDescription,
    }),
  };
}

export default async function BaikeTopicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (locale !== "zh") notFound();
  setRequestLocale(locale);

  const t = findBaikeTopic(slug);
  if (!t) notFound();

  const url = `${CURRENT_SITE_URL}/baike/${t.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: t.question,
    description: t.metaDescription,
    inLanguage: "zh-CN",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", "@id": `${CURRENT_SITE_URL}/#organization` },
    publisher: { "@type": "Organization", "@id": `${CURRENT_SITE_URL}/#organization` },
    dateModified: t.reviewedDate,
    isPartOf: { "@type": "CollectionPage", url: `${CURRENT_SITE_URL}/baike` },
  };

  // 答案优先:把主问题+答案放进 FAQPage 第一条,再接 FAQ —— schema 内容均可见。
  const faqEntities = [{ question: t.question, answer: t.answer }, ...t.faqs];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faqEntities.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <BreadcrumbJsonLd
        items={[
          { name: "复材百科", url: `${CURRENT_SITE_URL}/baike` },
          { name: t.question, url },
        ]}
      />
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />

      {/* ── 面包屑 ── */}
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          首页
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={"/baike" as never} className="hover:text-foreground">
          复材百科
        </Link>
        <span className="mx-1.5">/</span>
        <span>{t.intent}</span>
      </nav>

      {/* ── 标题 ── */}
      <header className="mb-8 border-b border-border/70 pb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t.intent} · 复材百科
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
          {t.question}
        </h1>
      </header>

      {/* ── 直接答案(answer-first) ── */}
      <section className="mb-10 rounded-xl border border-border/70 bg-muted/20 p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            直接答案
          </span>
          {t.verdict && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-xs font-semibold text-background">
              <CheckCircle2 size={12} />
              {t.verdict}
            </span>
          )}
        </div>
        <p className="mt-3 text-[15px] leading-[1.85] text-foreground/90">
          {t.answer}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={11} className="text-foreground/60" />
            复材站编辑复核
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>更新 {t.reviewedDate}</span>
        </div>
      </section>

      {/* ── 适用判断(扫读清单) ── */}
      {t.keyPoints.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            什么情况下适用
          </div>
          <ul className="space-y-2">
            {t.keyPoints.map((k) => (
              <li
                key={k}
                className="flex items-start gap-2 text-[14px] leading-relaxed text-foreground/90"
              >
                <CheckCircle2
                  size={14}
                  strokeWidth={2}
                  className="mt-1 shrink-0 text-foreground/70"
                />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 对比表 ── */}
      {t.comparison && (
        <section className="mb-12">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            对比
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40">
                  {t.comparison.headers.map((h) => (
                    <th
                      key={h}
                      className="border-b border-border/70 px-3 py-2.5 text-left font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.comparison.rows.map((row, ri) => (
                  <tr key={ri} className="even:bg-muted/20">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`border-b border-border/50 px-3 py-2.5 align-top ${
                          ci === 0 ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t.comparison.caption}</p>
        </section>
      )}

      {/* ── 详解 ── */}
      <div className="space-y-12">
        {t.sections.map((sec, idx) => (
          <section key={sec.heading} className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3 border-b border-border/70 pb-2">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                §{String(idx + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {sec.heading}
              </h2>
            </div>
            <div className="space-y-4 text-[15px] leading-[1.85] text-foreground/90">
              {sec.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── 证据 / 相关数据 ── */}
      {t.evidence.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
            <Database size={16} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">相关数据与证据</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {t.evidence.map((e) => (
              <Link
                key={e.href}
                href={e.href as never}
                className="group flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <span>{e.label}</span>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 下一步(B2B 转化) ── */}
      <section className="mt-12">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          下一步
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={`/ai?q=${encodeURIComponent(t.question)}` as never}
            className="group flex items-center justify-between gap-3 rounded-md border bg-foreground p-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            就这个问题问 AI
            <ArrowRight size={15} className="shrink-0" />
          </Link>
          <Link
            href={"/rfq" as never}
            className="group flex items-center justify-between gap-3 rounded-md border bg-background p-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            发起 RFQ 询价
            <ChevronRight
              size={15}
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href={"/suppliers?verified=1" as never}
            className="group flex items-center justify-between gap-3 rounded-md border bg-background p-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            查看验证供应商
            <ChevronRight
              size={15}
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* ── 常见问题 ── */}
      {t.faqs.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-center gap-2 border-b border-border/70 pb-2">
            <BookOpenCheck size={16} className="text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">常见问题</h2>
          </div>
          <div className="divide-y divide-border/70 border-y border-border/70">
            {t.faqs.map((q) => (
              <details
                key={q.question}
                className="group cursor-pointer py-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-start justify-between gap-3">
                  <span className="text-[15px] font-semibold leading-snug tracking-tight">
                    {q.question}
                  </span>
                  <ChevronRight
                    size={14}
                    className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                  />
                </summary>
                <p className="mt-3 max-w-3xl text-[14px] leading-[1.8] text-muted-foreground">
                  {q.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── 相关问题 ── */}
      {t.related.length > 0 && (
        <section className="mt-16 border-t border-border/70 pt-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            相关问题
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {t.related.map((r) => (
              <Link
                key={r.href}
                href={r.href as never}
                className="inline-flex items-center gap-1 text-[14px] text-foreground hover:underline"
              >
                <ChevronRight size={13} className="shrink-0 text-muted-foreground" />
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
