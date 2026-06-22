import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import { TRADE_REMEDIES, type TradeRemedyMeasure } from "@/lib/data/trade-remedy";
import { loadPublishedRemedies } from "@/lib/data/trade-remedy-db";

// EN-only Dataset page (getfrp.com). Surfaces the AD/CVD/Section-301 data that
// otherwise lives only inside the chat tools as a crawlable, AI-citable table
// with schema.org/Dataset. Renders English-safe fields only (scopeEn, never the
// Chinese productScope/caveat). Source data changes only when the trade-remedy
// digest publishes, so cache a day.
const PATH = "/data/china-frp-trade-remedies";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  const title = "China FRP trade-remedy tracker — EU & US AD/CVD & Section 301";
  const description =
    "A maintained reference of EU and US trade-remedy measures affecting Chinese FRP: glass-fibre anti-dumping (up to 69%), countervailing duties, fiberglass door-panel AD/CVD, and the Section 301 exclusion expiry — with rate ceilings, status, key dates and authoritative sources.";
  return {
    title,
    description,
    alternates: alternates(PATH),
    openGraph: og(PATH, { title, description }),
  };
}

const KIND_LABEL: Record<TradeRemedyMeasure["kind"], string> = {
  AD: "Anti-dumping (AD)",
  CVD: "Countervailing (CVD)",
  "AD+CVD": "AD + CVD",
  section301: "Section 301",
  circumvention: "Anti-circumvention",
  safeguard: "Safeguard",
};

const STATUS_LABEL: Record<TradeRemedyMeasure["status"], string> = {
  in_force: "In force",
  preliminary: "Preliminary",
  sunset_review: "Sunset review",
  expiring: "Expiring",
  expired: "Expired",
};

function keyDate(m: TradeRemedyMeasure): string {
  if (m.expiresOn) return `Expires ${m.expiresOn}`;
  if (m.effectiveFrom) return `Effective ${m.effectiveFrom}`;
  if (m.sunsetReview) return `Review ${m.sunsetReview}`;
  return "—";
}

const rateCeiling = (m: TradeRemedyMeasure): string =>
  m.rateMaxPct > 0 ? `≤ ${m.rateMaxPct}%` : "Under review";

function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default async function ChinaFrpTradeRemediesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale !== "en") notFound();

  // Live published measures when the DB is reachable; static seed otherwise
  // (loadPublishedRemedies swallows DB errors → [] → seed). Build-safe.
  const published = await loadPublishedRemedies();
  const measures = published.length ? published : TRADE_REMEDIES;
  const lastUpdated =
    measures
      .map((m) => m.source?.retrievedOn)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? "";

  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "China FRP trade-remedy measures — EU/US AD, CVD & Section 301",
    description:
      "EU and US anti-dumping, countervailing and Section 301 measures affecting fibre-reinforced polymer (FRP) imports from China, with rate ceilings, status, key dates and authoritative sources. Rates are ceilings on customs value; applicability depends on HS classification and origin.",
    inLanguage: "en",
    url: `${CURRENT_SITE_URL}${PATH}`,
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "getfrp", url: CURRENT_SITE_URL },
    publisher: { "@type": "Organization", name: "getfrp", url: CURRENT_SITE_URL },
    ...(lastUpdated ? { dateModified: lastUpdated } : {}),
    keywords: [
      "China FRP anti-dumping",
      "glass fibre AD CVD",
      "Section 301 FRP",
      "China FRP import duties",
      "GFRP trade remedy",
    ],
    variableMeasured: measures.map((m) => ({
      "@type": "PropertyValue",
      name: m.scopeEn || m.id,
      value: `${KIND_LABEL[m.kind]} — ${rateCeiling(m)} (${STATUS_LABEL[m.status]})`,
    })),
    citation: measures
      .map((m) => m.source?.url)
      .filter((u): u is string => Boolean(u)),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <JsonLd data={dataset} />
      <PageBreadcrumbs
        trail={[{ label: "China FRP trade-remedy tracker", href: PATH }]}
      />

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          China FRP trade-remedy tracker
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The EU and US anti-dumping (AD), countervailing (CVD) and Section 301
          measures that actually move the landed cost of fibre-reinforced
          polymer from China — rate ceilings, status and key dates, each tied to
          its authoritative source.
        </p>
        {lastUpdated && (
          <p className="mt-2 text-xs text-muted-foreground">
            Last verified {lastUpdated} · maintained by the getfrp sourcing desk
          </p>
        )}
      </header>

      <div className="mb-8 border border-amber-500/40 bg-amber-500/5 p-4 text-sm leading-relaxed">
        <strong className="font-semibold">Scope note.</strong> These measures
        primarily target glass fibre itself (HS 7019) and specific finished
        goods (e.g. door panels) — <strong>not</strong> all FRP profiles. The
        rates shown are ceilings on customs value, not quotes; whether a measure
        applies to your product depends on its HS classification and origin
        ruling, verified per shipment.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Destination</th>
              <th className="py-2 pr-3 font-medium">Product scope</th>
              <th className="py-2 pr-3 font-medium">HS</th>
              <th className="py-2 pr-3 font-medium">Measure</th>
              <th className="py-2 pr-3 font-medium">Rate ceiling</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Key date</th>
              <th className="py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {measures.map((m) => (
              <tr key={m.id} className="border-b border-border/60 align-top">
                <td className="py-3 pr-3 font-medium">{m.destination}</td>
                <td className="py-3 pr-3">{m.scopeEn || m.id}</td>
                <td className="py-3 pr-3 tabular-nums text-muted-foreground">
                  {m.hsCodes.join(", ")}
                </td>
                <td className="py-3 pr-3">{KIND_LABEL[m.kind]}</td>
                <td className="py-3 pr-3 tabular-nums">{rateCeiling(m)}</td>
                <td className="py-3 pr-3">{STATUS_LABEL[m.status]}</td>
                <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                  {keyDate(m)}
                </td>
                <td className="py-3">
                  {m.source?.url ? (
                    <a
                      href={m.source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      {hostOf(m.source.url)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Source pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-semibold tracking-tight">Keep reading</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            {
              label:
                "China FRP import tariffs, AD/CVD & Section 301 — full guide",
              href: "/sourcing/china-frp-import-tariffs",
            },
            {
              label: "FRP & Build America, Buy America (BABA)",
              href: "/sourcing/frp-baba-buy-america",
            },
            {
              label: "CBAM & FRP — what actually applies",
              href: "/sourcing/cbam-frp-china",
            },
            {
              label: "Source FRP from China — directory & playbook",
              href: "/source-from-china",
            },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href as never}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
