import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { JsonLd } from "@/components/json-ld";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { processes as processesTable } from "@/lib/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tech" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export const revalidate = 600;

export default async function TechPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Tech" });

  const rows = await db
    .select()
    .from(processesTable)
    .orderBy(asc(processesTable.id));

  const tools = [
    { nameKey: "tool1Name" as const, descKey: "tool1Desc" as const, statusKey: "live" as const, href: "/tech/calculator" as const },
    { nameKey: "tool2Name" as const, descKey: "tool2Desc" as const, statusKey: "live" as const, href: "/tech/u-value-calculator" as const },
    { nameKey: "tool3Name" as const, descKey: "tool3Desc" as const, statusKey: "soon" as const, href: "#" as const },
    { nameKey: "tool4Name" as const, descKey: "tool4Desc" as const, statusKey: "soon" as const, href: "#" as const },
  ];

  const inLanguage = locale === "en" ? "en" : "zh-CN";
  const techItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `https://f1frp.com/${locale}/tech`,
    inLanguage,
    name: t("h1"),
    numberOfItems: rows.length,
    itemListElement: rows.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Thing",
        name: p.name,
        alternateName: p.nameEn ?? undefined,
        description: p.description ?? undefined,
        url: `https://f1frp.com/${locale}/tech#${p.id}`,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={techItemListJsonLd} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold">{t("processWikiTitle")}</h2>
        <p className="mt-1 text-muted-foreground">
          {t("processWikiSub", { count: rows.length })}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((p) => {
            const applications = (p.applications ?? []) as string[];
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.nameEn && (
                    <CardDescription className="text-xs">{p.nameEn}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {applications.slice(0, 3).map((app) => (
                      <Badge key={app} variant="secondary" className="text-[10px]">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">{t("processDetailTitle")}</h3>
          <Accordion className="w-full">
            {rows.map((p) => {
              const advantages = (p.advantages ?? []) as string[];
              const disadvantages = (p.disadvantages ?? []) as string[];
              const applications = (p.applications ?? []) as string[];
              const keyParameters = (p.keyParameters ?? []) as string[];
              return (
                <AccordionItem key={p.id} value={p.id}>
                  <AccordionTrigger className="text-left">
                    <div>
                      <span className="font-semibold">{p.name}</span>
                      {p.nameEn && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {p.nameEn}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pb-2">
                      {p.description && (
                        <p className="text-sm leading-relaxed">{p.description}</p>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {advantages.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-green-600">{t("advantages")}</h4>
                            <ul className="space-y-1">
                              {advantages.map((adv) => (
                                <li key={adv} className="flex items-start gap-2 text-sm">
                                  <span className="mt-1 text-green-500">✓</span>
                                  {adv}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {disadvantages.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-red-600">{t("limitations")}</h4>
                            <ul className="space-y-1">
                              {disadvantages.map((dis) => (
                                <li key={dis} className="flex items-start gap-2 text-sm">
                                  <span className="mt-1 text-red-500">✗</span>
                                  {dis}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {applications.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">{t("typicalApps")}</h4>
                          <div className="flex flex-wrap gap-1">
                            {applications.map((app) => (
                              <Badge key={app} variant="outline" className="text-xs">{app}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {keyParameters.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">{t("keyParams")}</h4>
                          <div className="flex flex-wrap gap-1">
                            {keyParameters.map((param) => (
                              <Badge key={param} variant="secondary" className="text-xs">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      <Separator />

      <section id="tools" className="my-12">
        <h2 className="text-2xl font-bold">{t("toolsTitle")}</h2>
        <p className="mt-1 text-muted-foreground">{t("toolsSub")}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => {
            const isLive = tool.statusKey === "live";
            return (
              <Link key={tool.nameKey} href={tool.href}>
                <Card
                  className={`h-full transition-colors ${isLive ? "hover:border-primary/50" : "opacity-70"}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t(tool.nameKey)}</CardTitle>
                      <Badge
                        variant={isLive ? "default" : "outline"}
                        className="text-xs"
                      >
                        {t(`toolStatus.${tool.statusKey}`)}
                      </Badge>
                    </div>
                    <CardDescription>{t(tool.descKey)}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="my-12 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">{t("stdDbTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("stdDbSub")}</p>
        <Link
          href="/standards"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          {t("stdDbLink")}
        </Link>
      </section>
    </div>
  );
}
