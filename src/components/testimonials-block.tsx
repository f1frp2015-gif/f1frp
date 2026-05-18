import { Quote, MapPin } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { testimonials, type Testimonial } from "@/lib/data/testimonials";

// Renders 1-N buyer testimonials in a compact strip. Empty-array path
// renders absolutely nothing — Western readers parse "Coming soon" /
// empty section as a negative signal, so we'd rather hide than placeholder.
//
// Schema.org Review markup is only emitted once we have 3+ verifiable
// testimonials, matching Google's "Critic / customer review" Rich Results
// eligibility threshold (avoids "low-quality reviews" SERP suppression).

interface Props {
  /** Optional override — defaults to global list. Use this if a topic page
   *  wants to filter to topic-relevant testimonials only. */
  items?: readonly Testimonial[];
  className?: string;
}

export function TestimonialsBlock({ items, className }: Props) {
  const list = (items ?? testimonials).filter((t) => t.verifiable);
  if (list.length === 0) return null;

  const orgId =
    process.env.NEXT_PUBLIC_SITE_HOST === "f1frp.com"
      ? "https://f1frp.com/#organization"
      : "https://getfrp.com/#organization";

  // Only emit aggregate Review schema when we have at least 3 — fewer is
  // both Rich-Results-ineligible and looks weak to a discerning reader.
  const enableSchema = list.length >= 3;

  return (
    <section className={className}>
      {enableSchema && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": orgId,
            review: list.map((t) => ({
              "@type": "Review",
              author: {
                "@type": t.author.name ? "Person" : "Organization",
                name:
                  t.author.name ??
                  `${t.author.role}${t.author.company ? ` at ${t.author.company}` : ""}`,
              },
              reviewBody: t.quote,
              datePublished: t.date,
            })),
          }}
        />
      )}
      <div className="mb-4 flex items-center gap-2">
        <Quote size={14} className="text-muted-foreground" />
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          What buyers say
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col gap-3 border border-border/70 bg-background p-5"
          >
            <Quote
              size={16}
              strokeWidth={1.5}
              className="shrink-0 text-foreground/40"
            />
            <blockquote className="flex-1 text-[14px] leading-relaxed text-foreground/90">
              {t.quote}
            </blockquote>
            <figcaption className="border-t border-border/40 pt-3 text-[12px]">
              <div className="font-semibold text-foreground">
                {t.author.name ?? "Verified buyer"}
              </div>
              <div className="text-muted-foreground">
                {t.author.role}
                {t.author.company ? ` · ${t.author.company}` : ""}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
                {t.author.countryCode && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={9} />
                    {t.author.countryCode}
                  </span>
                )}
                <span>{t.date}</span>
                {t.context && <span>{t.context}</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
