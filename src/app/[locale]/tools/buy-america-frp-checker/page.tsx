import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import BuyAmericaChecker from "./checker";

// EN-only buyer tool (getfrp.com). Self-screens whether imported FRP can be
// used on a US project under Build America, Buy America — a lead-gen wedge that
// feeds the BABA guide and /rfq. Static content; cache a day.
const PATH = "/tools/buy-america-frp-checker";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  const title = "Buy America (BABA) checker for FRP — can you use imported FRP?";
  const description =
    "Free 2-question checker: find out whether Chinese / imported FRP can be used on your US project under Build America, Buy America (BABA), or whether federal funding excludes it. Plus the waiver routes and what to do next.";
  return {
    title,
    description,
    alternates: alternates(PATH),
    openGraph: og(PATH, { title, description }),
  };
}

export default async function BuyAmericaCheckerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale !== "en") notFound();

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Buy America (BABA) checker for FRP",
    description:
      "A 2-question tool that tells overseas buyers whether imported FRP can be used on a US project under Build America, Buy America, or whether federal funding excludes it.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    url: `${CURRENT_SITE_URL}${PATH}`,
    provider: { "@type": "Organization", name: "getfrp", url: CURRENT_SITE_URL },
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <JsonLd data={appLd} />
      <PageBreadcrumbs
        trail={[{ label: "Buy America (BABA) checker for FRP", href: PATH }]}
      />

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Can you use imported FRP on a US project?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Build America, Buy America (BABA) decides whether Chinese-origin FRP is
          even eligible on US federally funded infrastructure — usually before
          price or lead time matter. Answer two questions to find out where you
          stand.
        </p>
      </header>

      <BuyAmericaChecker />

      <section className="mt-10 border-t border-border pt-6 text-sm">
        <h2 className="font-semibold tracking-tight">Related</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            {
              label: "FRP & Build America, Buy America — full guide",
              href: "/sourcing/frp-baba-buy-america",
            },
            {
              label: "China FRP trade-remedy tracker (AD/CVD/301)",
              href: "/data/china-frp-trade-remedies",
            },
            {
              label: "China FRP import tariffs & anti-dumping",
              href: "/sourcing/china-frp-import-tariffs",
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
