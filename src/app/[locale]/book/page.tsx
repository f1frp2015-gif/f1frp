import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock, Globe, Mail, MessagesSquare } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { alternates } from "@/lib/seo";
import { CONTACT } from "@/lib/contact";

// Booking page — currently a placeholder that routes interest into the
// sourcing inbox. Wire to Cal.com / SavvyCal once the account is set up by
// pointing CAL_EMBED_URL at the schedule and uncommenting the iframe below.
//
// Western B2B buyers strongly prefer "Book a 15-min call" over "Email us"
// because it removes the ambiguity of response time and timezone. Even
// without a live calendar widget, naming explicit windows + an email SLA
// closes most of the gap.

const CAL_EMBED_URL = process.env.NEXT_PUBLIC_CAL_EMBED_URL ?? "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return { robots: { index: false, follow: false } };
  return {
    title: "Book a sourcing call — getfrp",
    description:
      "Book a 15-minute call with the getfrp sourcing desk to walk through your FRP sourcing-from-China project. US / EU / APAC windows available, no obligation.",
    alternates: alternates("/book"),
  };
}

const SLOTS = [
  {
    region: "Americas",
    tz: "Mon-Fri · 19:00-23:00 CST = 07:00-11:00 ET / 04:00-08:00 PT",
    note: "Best for US East Coast morning standups, US West Coast pre-9am",
  },
  {
    region: "Europe & UK",
    tz: "Mon-Fri · 15:00-19:00 CST = 08:00-12:00 CET / 07:00-11:00 GMT",
    note: "Best for EU late morning, UK morning",
  },
  {
    region: "APAC & ME",
    tz: "Mon-Fri · 09:00-14:00 CST = 11:00-16:00 AEDT / 06:30-11:30 IST / 04:00-09:00 GST",
    note: "Best for Australia, India, Gulf",
  },
];

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Book a sourcing call",
          inLanguage: "en",
          description:
            "Schedule a 15-minute consult with the getfrp sourcing desk.",
        }}
      />
      <PageBreadcrumbs trail={[{ label: "Book a call", href: "/book" }]} />

      <header className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          NO OBLIGATION · NO SALES PITCH
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Book a 15-min sourcing call.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Bring your spec, your target country, and one question. A bilingual
          sourcing engineer walks through whether we can shortlist verified
          Chinese FRP plants for your project, and tells you straight if we
          can&apos;t. If we can, you leave with a list of 3–5 candidates plus
          rough FOB pricing.
        </p>
      </header>

      {CAL_EMBED_URL ? (
        <div className="mb-10 overflow-hidden rounded-xl border border-border/70">
          <iframe
            src={CAL_EMBED_URL}
            title="Book a sourcing call"
            className="h-[620px] w-full"
            loading="lazy"
          />
        </div>
      ) : (
        <section className="mb-10 rounded-xl border border-dashed border-border/70 bg-muted/30 p-6">
          <div className="flex items-start gap-3">
            <Calendar
              size={18}
              strokeWidth={1.5}
              className="mt-0.5 text-foreground"
            />
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Live calendar coming online shortly.
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                For now, email{" "}
                <a
                  href={`mailto:${CONTACT.email}?subject=Sourcing call request`}
                  className="font-medium text-foreground hover:underline"
                >
                  {CONTACT.email}
                </a>{" "}
                with your preferred region + one of the windows below. Reply
                within 24h US/EU business time.
              </p>
              <a
                href={`mailto:${CONTACT.email}?subject=Sourcing call request&body=Region:%20%0APreferred window:%20%0AProject:%20%0AQuestion:%20`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <Mail size={14} />
                Email to book
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
          <Globe size={14} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Available windows
          </h2>
        </div>
        <div className="divide-y divide-border/70 border-y border-border/70">
          {SLOTS.map((s) => (
            <div key={s.region} className="py-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-base font-semibold tracking-tight">
                  {s.region}
                </h3>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Clock size={11} />
                  {s.tz}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
          <MessagesSquare size={14} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Prefer not to talk?
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={"/rfq" as never}
            className="group flex items-start justify-between gap-3 border border-border/70 bg-background p-4 transition-colors hover:border-foreground"
          >
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Submit a structured RFQ
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                15 fields, 5 minutes — we reply with a shortlist + FOB range.
              </div>
            </div>
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={"/ai" as never}
            className="group flex items-start justify-between gap-3 border border-border/70 bg-background p-4 transition-colors hover:border-foreground"
          >
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Ask the AI first
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Free — our sourcing assistant cites a verified plant for each
                claim. Hand off to a human when needed.
              </div>
            </div>
            <ArrowRight size={14} className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
