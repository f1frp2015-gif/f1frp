import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, BookOpenCheck, CheckCircle2, ShieldCheck } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { alternates } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import {
  findSourcingTopic,
  sourcingTopics,
  type SourcingTopic,
} from "@/lib/data/sourcing-topics";

// Hub-and-spoke long-tail landing pages. Each topic is hand-curated content
// in @/lib/data/sourcing-topics; this page is the renderer + schema layer.
// Cached aggressively — the source data only changes on deploy.
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  // EN-only routes — skip pre-rendering on the zh deploy.
  if (process.env.NEXT_PUBLIC_LOCALES === "zh") return [];
  return sourcingTopics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}): Promise<Metadata> {
  const { locale, topic } = await params;
  if (locale !== "en") return {};
  const t = findSourcingTopic(topic);
  if (!t) return { robots: { index: false, follow: false } };
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: alternates(`/sourcing/${t.slug}`),
  };
}

function buildSupplierFilterHref(t: SourcingTopic): string | null {
  if (!t.supplierFilter) return null;
  const params = new URLSearchParams();
  if (t.supplierFilter.category) params.set("category", t.supplierFilter.category);
  if (t.supplierFilter.cert) params.set("cert", t.supplierFilter.cert);
  if (t.supplierFilter.province) params.set("province", t.supplierFilter.province);
  params.set("verified", "1");
  const q = params.toString();
  return q ? `/suppliers?${q}` : "/suppliers?verified=1";
}

export default async function SourcingTopicPage({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}) {
  const { locale, topic } = await params;
  if (locale !== "en") notFound();

  const t = findSourcingTopic(topic);
  if (!t) notFound();

  const url = `${CURRENT_SITE_URL}/sourcing/${t.slug}`;
  const supplierFilterHref = buildSupplierFilterHref(t);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: t.title,
    description: t.metaDescription,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Organization",
      "@id": `${CURRENT_SITE_URL}/#organization`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${CURRENT_SITE_URL}/#organization`,
    },
    isPartOf: { "@type": "CollectionPage", url: `${CURRENT_SITE_URL}/source-from-china` },
  };

  const faqSchema = t.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: t.faqs.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <PageBreadcrumbs
        trail={[
          { label: "Sourcing topics", href: "/source-from-china" },
          { label: t.title, href: `/sourcing/${t.slug}` },
        ]}
      />

      {/* ─────────── Hero ─────────── */}
      <header className="mb-10 border-b border-border/70 pb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t.pillar.toUpperCase()} · SOURCING TOPIC
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          {t.intro}
        </p>

        {/* Editorial attribution — Western readers distrust anonymous content.
            Byline + reviewer + review date is the minimum credibility signal. */}
        {(t.byline || t.reviewedBy) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {t.byline && (
              <span className="inline-flex items-center gap-1">
                <span className="font-mono uppercase tracking-[0.12em] text-muted-foreground/80">
                  By
                </span>
                <span className="text-foreground">{t.byline}</span>
              </span>
            )}
            {t.reviewedBy && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={11} className="text-foreground/60" />
                  {t.reviewedBy}
                </span>
              </>
            )}
            {t.reviewedDate && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>Last verified {t.reviewedDate}</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* ─────────── What you'll learn (scan UX) ─────────── */}
      {t.takeaways.length > 0 && (
        <section className="mb-12 rounded-xl border border-border/70 bg-muted/20 p-6 sm:p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            WHAT YOU&apos;LL LEARN
          </div>
          <ul className="mt-3 space-y-2">
            {t.takeaways.map((k) => (
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

      {/* ─────────── Stat strip ─────────── */}
      {t.stats.length > 0 && (
        <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {t.stats.map((s) => (
            <div
              key={s.label}
              className="border border-border/70 bg-background p-4 text-center"
            >
              <div className="text-xl font-bold tabular-nums">{s.value}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────── Deck ─────────── */}
      <section className="mb-12 max-w-3xl text-[15px] leading-[1.85] text-foreground/90">
        <p>{t.deck}</p>
      </section>

      {/* ─────────── Content sections ─────────── */}
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
            <div className="space-y-4 text-[15px] leading-[1.8] text-foreground/90">
              {sec.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ─────────── Inline CTAs ─────────── */}
      <section className="mt-16 grid gap-3 sm:grid-cols-2">
        {supplierFilterHref && (
          <Link
            href={supplierFilterHref as never}
            className="group flex items-center justify-between gap-4 border border-border/70 bg-background p-5 transition-colors hover:border-foreground"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                BROWSE
              </div>
              <div className="mt-1 text-sm font-semibold tracking-tight">
                Verified suppliers in this category
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
        <Link
          href={
            (`/rfq?topic=${encodeURIComponent(t.slug)}`) as never
          }
          className="group flex items-center justify-between gap-4 border border-border/70 bg-foreground p-5 text-background transition-colors hover:bg-foreground/95"
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">
              RFQ
            </div>
            <div className="mt-1 text-sm font-semibold tracking-tight">
              Submit a structured RFQ for this topic
            </div>
          </div>
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* ─────────── FAQ ─────────── */}
      {t.faqs.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-center gap-2 border-b border-border/70 pb-2">
            <BookOpenCheck size={16} className="text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              FAQ
            </h2>
          </div>
          <div className="divide-y divide-border/70 border-y border-border/70">
            {t.faqs.map((q) => (
              <details
                key={q.question}
                className="group cursor-pointer py-5 [&_summary::-webkit-details-marker]:hidden"
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

      {/* ─────────── Newsletter signup ─────────── */}
      <div className="mt-16">
        <NewsletterSignup topic={t.slug} />
      </div>

      {/* ─────────── Related ─────────── */}
      {t.related.length > 0 && (
        <section className="mt-16 border-t border-border/70 pt-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            KEEP READING
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            {t.related.map((r) => (
              <Link
                key={r.href}
                href={r.href as never}
                className="inline-flex items-center gap-1 text-foreground hover:underline"
              >
                {r.label}
                <ChevronRight size={12} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
