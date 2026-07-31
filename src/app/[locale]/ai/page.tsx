import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bot, Database, FileCheck2, SearchCheck, ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import { listAvailableChatModels } from "@/lib/ai/provider";
import { AiAssistantClient } from "./ai-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AI" });
  if (locale === "en") {
    const title = "AI FRP Supplier Matching & Standards Assistant | getfrp";
    const description =
      "Ask getfrp's FRP sourcing assistant to match a specification against verified China factory, material and GB/ASTM/ISO/EN standards data.";
    return {
      title: { absolute: title },
      description,
      alternates: alternates("/ai"),
      openGraph: og("/ai", { title, description }),
    };
  }
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: alternates("/ai"),
  };
}

export default async function AiPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const raw = sp.q;
  const initialQuery = Array.isArray(raw) ? raw[0] : raw;

  // Preserve historical /ai?q= links while moving the interactive,
  // noindex application to the explicit /ai/chat route.
  if (locale === "en" && initialQuery) {
    redirect(`/ai/chat?q=${encodeURIComponent(initialQuery)}`);
  }

  // Domestic f1frp.com keeps its existing AI application at /ai.
  if (locale !== "en") {
    return (
      <AiAssistantClient
        initialQuery={initialQuery ?? undefined}
        availableModels={listAvailableChatModels()}
      />
    );
  }

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "getfrp AI FRP sourcing assistant",
    serviceType:
      "FRP supplier matching, standards crosswalk and sourcing feasibility analysis",
    provider: { "@id": `${CURRENT_SITE_URL}/#organization` },
    url: `${CURRENT_SITE_URL}/ai`,
    areaServed: "Worldwide",
    description:
      "An AI-assisted sourcing workflow grounded in verified China FRP factory, material and standards records, with human RFQ escalation.",
  };

  return (
    <main>
      <JsonLd data={serviceJsonLd} />
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Bot size={12} />
              GROUNDED FRP SOURCING ASSISTANT
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-6xl">
              Match an FRP specification to China&apos;s verified supply network.
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-7 text-muted-foreground">
              Ask about suppliers, materials, standards, engineering constraints
              or landed-cost inputs. The assistant searches getfrp&apos;s
              structured FRP data before composing an answer, then hands a
              qualified request to the human sourcing desk.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={"/ai/chat" as never}
                className={buttonVariants({ size: "lg" })}
              >
                Open the AI assistant <ArrowRight size={16} />
              </Link>
              <Link
                href={"/rfq" as never}
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Submit a structured RFQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                Icon: Database,
                title: "Structured factory matching",
                body: "Product category, process, province, scale tier, certification records, MOQ and export-readiness signals are compared before a shortlist is proposed.",
              },
              {
                Icon: FileCheck2,
                title: "Standards crosswalk",
                body: "The assistant connects Chinese GB methods with relevant ASTM, ISO and EN references while flagging where similar titles do not mean interchangeable procedures.",
              },
              {
                Icon: SearchCheck,
                title: "Evidence and human review",
                body: "Answers cite database records where available. A commercial RFQ triggers document rechecking, sample coordination and pre-shipment acceptance planning.",
              },
            ].map(({ Icon, title, body }) => (
              <article key={title} className="rounded-xl border border-border/70 bg-background p-6">
                <Icon size={20} strokeWidth={1.5} />
                <h2 className="mt-5 text-base font-semibold">{title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              WHAT TO ASK
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Start with a real sourcing constraint.
            </h2>
            <div className="mt-5 space-y-4 text-[14px] leading-7 text-muted-foreground">
              <p>
                Strong questions include the product, resin or fibre family,
                critical dimensions, service environment, target standard,
                quantity, destination and required delivery term. The assistant
                can then extract useful tags instead of guessing what “best FRP
                supplier” means.
              </p>
              <p>
                For example: ask for molded vinyl-ester grating for a defined
                chemical exposure; an EN 13706 E23 pultruded profile with a
                controlled section; GFRP rebar tested to the project&apos;s ACI
                and ASTM basis; or filament-wound pipe with pressure,
                temperature and joining requirements.
              </p>
              <p>
                You can also ask a standards-first question such as how GB/T
                1447 relates to ASTM D3039, or request a first-pass landed-cost
                structure. The answer is a planning aid. Final engineering,
                regulatory and commercial decisions remain tied to the
                governing project documents and current supplier evidence.
              </p>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              HOW THE MATCH WORKS
            </div>
            <ol className="mt-4 space-y-4">
              {[
                ["1", "Extract", "Turn the request into product, process, material, standard, volume and logistics tags."],
                ["2", "Retrieve", "Search material, standard and verified network records for technically plausible matches."],
                ["3", "Cross-check", "Compare certification scope, production cluster, scale, MOQ and export-readiness evidence."],
                ["4", "Escalate", "Send a qualified RFQ to the sourcing desk for identity release, sampling, quotation and QA."],
              ].map(([step, title, body]) => (
                <li key={step} className="flex gap-4 rounded-xl border border-border/70 p-5">
                  <span className="font-mono text-sm font-semibold">{step}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-foreground py-14 text-background">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ask the network, then verify the shortlist.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-background/75">
            The chat application stays out of search results; this page explains
            the service. Your first three questions are free and require no
            account.
          </p>
          <Link
            href={"/ai/chat" as never}
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Start a sourcing question <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
