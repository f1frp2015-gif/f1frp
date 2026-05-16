import type { Metadata } from "next";
import {
  Mail,
  ShieldCheck,
  Building2,
  Globe2,
  FileCheck2,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { JsonLd } from "@/components/json-ld";
import { CONTACT } from "@/lib/contact";
import { alternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/about"),
  };
}

type RoadmapItem = { date: string; event: string };

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("About");
  const timeline = t.raw("roadmap") as RoadmapItem[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {locale === "en" && <EnglishTrustBlock />}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          {t("lead")}
        </p>
      </div>

      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <section className="mb-10">
          <h2 className="text-2xl font-bold">{t("missionTitle")}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("missionP1")}
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("missionP2")}
          </p>
        </section>

        <Separator className="my-8" />

        <section className="mb-10">
          <h2 className="text-2xl font-bold">{t("advTitle")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adv1Title")}</CardTitle>
                <CardDescription>{t("adv1Desc")}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adv2Title")}</CardTitle>
                <CardDescription>{t("adv2Desc")}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adv3Title")}</CardTitle>
                <CardDescription>{t("adv3Desc")}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adv4Title")}</CardTitle>
                <CardDescription>{t("adv4Desc")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-10">
          <h2 className="text-2xl font-bold">{t("roadmapTitle")}</h2>
          <div className="mt-6 space-y-4">
            {timeline.map((item, i) => (
              <div key={item.date} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="mt-1 h-full w-px bg-border" />
                  )}
                </div>
                <div className="pb-6">
                  <div className="text-sm font-semibold">{item.date}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.event}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        <section id="contact" className="mb-10">
          <h2 className="text-2xl font-bold">{t("contactTitle")}</h2>
          <div className="mt-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Mail
                  size={24}
                  strokeWidth={1.5}
                  className="mx-auto text-foreground"
                />
                <div className="mt-3 text-sm font-medium">
                  {t("contactTech")}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="hover:text-foreground"
                  >
                    {CONTACT.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="ad"
          className="rounded-lg border bg-muted/30 p-8 text-center"
        >
          <h3 className="text-xl font-bold">{t("adTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("adDesc")}</p>
          <Button className="mt-4">{t("adCta")}</Button>
        </section>
      </div>
    </div>
  );
}

// EN-side trust block: who you're buying from, registered identity, banking,
// QA approach, contact. Inserted above the (auto-translated) generic body so
// overseas buyers see proof of identity within the first viewport.
//
// TODO(user): supply ① company unified social credit code (USCC) for full
// proof of identity ② a 12-15 sec factory walk-through video URL ③ 2-3
// customer testimonial quotes (anonymized OK). Until then, fields read
// "available on request".
function EnglishTrustBlock() {
  return (
    <section className="mb-12 overflow-hidden rounded-xl border border-border/70">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Chongqing Yaoyi Advanced Materials Technology Co., Ltd.",
          alternateName: ["F1 Composite", "getfrp"],
          url: "https://getfrp.com",
          foundingDate: "2015",
          address: {
            "@type": "PostalAddress",
            addressCountry: "CN",
            addressRegion: "Chongqing",
          },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email: "f1frp2015@gmail.com",
            availableLanguage: ["English", "Mandarin"],
            areaServed: ["US", "DE", "FR", "GB", "IT", "ES", "NL", "PL", "AU", "CA"],
          },
        }}
      />
      <div className="border-b border-border/70 bg-muted/30 px-6 py-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          WHO YOU&apos;RE BUYING FROM
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          F1 Composite — China-based composites sourcing desk
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Operated by{" "}
          <strong>
            Chongqing Yaoyi Advanced Materials Technology Co., Ltd.
          </strong>{" "}
          (founded 2015), a Chongqing-registered exporter that has been
          visiting Chinese FRP / GFRP / CFRP plants in person for a decade.
          Our bilingual sourcing desk handles every overseas RFQ end-to-end —
          composites engineers fluent in English and Mandarin, on the ground
          in China.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/70 sm:grid-cols-4">
        <TrustBlock
          Icon={Building2}
          label="Legal entity"
          value="Chongqing Yaoyi"
          sub="USCC available on request"
        />
        <TrustBlock
          Icon={Globe2}
          label="Founded"
          value="2015"
          sub="10 years operating"
        />
        <TrustBlock
          Icon={ShieldCheck}
          label="Bank routing"
          value="China Merchants Bank"
          sub="USD T/T · L/C accepted"
        />
        <TrustBlock
          Icon={FileCheck2}
          label="Compliance pack"
          value="CBAM · REACH · MTC"
          sub="Generated per shipment"
        />
      </div>

      <div className="border-t border-border/70 bg-background px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              TECHNICAL SERVICE HOTLINE
            </div>
            <div className="mt-2 text-base font-semibold">{CONTACT.email}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              One channel for everything: pre-sales questions, RFQ, tech
              spec discussion, post-shipment issues. Replies within 24h on
              business days, English and Mandarin both fine.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-background transition-colors hover:bg-foreground/90"
              >
                <Mail size={12} /> Email tech support
              </a>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              HOW WE VERIFY SUPPLIERS
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>· Business license &amp; USCC cross-checked against PRC registry</li>
              <li>· Production scale tier (Major / Large / Mid / Small) field-validated</li>
              <li>· Certifications (ISO 9001, CE, FDA, …) original copies on file</li>
              <li>· Plant visit photos / video — available before PO</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBlock({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: typeof Mail;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-background p-4">
      <div className="flex items-start gap-2">
        <Icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-foreground" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-sm font-semibold">{value}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
        </div>
      </div>
    </div>
  );
}
