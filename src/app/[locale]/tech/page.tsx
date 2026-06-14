import type { Metadata } from "next";
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
import { processes as processesData } from "@/lib/data/tech";

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
  const isEn = locale === "en";

  // 静态数据 source of truth — DB processes 表是其副本，无额外字段
  const rows = [...processesData].sort((a, b) => a.id.localeCompare(b.id));

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
        name: isEn ? p.nameEn : p.name,
        alternateName: isEn ? p.name : p.nameEn,
        description: isEn ? p.descriptionEn : p.description,
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
            const applications = isEn ? p.applicationsEn : p.applications;
            const primaryName = isEn ? p.nameEn : p.name;
            const altName = isEn ? p.name : p.nameEn;
            const desc = isEn ? p.descriptionEn : p.description;
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{primaryName}</CardTitle>
                  {altName && (
                    <CardDescription className="text-xs">{altName}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  {desc && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {desc}
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
              const advantages = isEn ? p.advantagesEn : p.advantages;
              const disadvantages = isEn ? p.disadvantagesEn : p.disadvantages;
              const applications = isEn ? p.applicationsEn : p.applications;
              const keyParameters = isEn ? p.keyParametersEn : p.keyParameters;
              const primaryName = isEn ? p.nameEn : p.name;
              const altName = isEn ? p.name : p.nameEn;
              const desc = isEn ? p.descriptionEn : p.description;
              return (
                <AccordionItem key={p.id} value={p.id}>
                  <AccordionTrigger className="text-left">
                    <div>
                      <span className="font-semibold">{primaryName}</span>
                      {altName && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {altName}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pb-2">
                      {desc && (
                        <p className="text-sm leading-relaxed">{desc}</p>
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
