import type { Metadata } from "next";
import { Mail, MessageCircle, Smartphone } from "lucide-react";
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
import { CONTACT } from "@/lib/contact";

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
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <Mail
                  size={24}
                  strokeWidth={1.5}
                  className="mx-auto text-foreground"
                />
                <div className="mt-3 text-sm font-medium">
                  {t("contactBusiness")}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{CONTACT.name}</div>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="hover:text-foreground"
                  >
                    {CONTACT.email}
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle
                  size={24}
                  strokeWidth={1.5}
                  className="mx-auto text-foreground"
                />
                <div className="mt-3 text-sm font-medium">
                  {t("contactWechat")}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {CONTACT.wechat}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Smartphone
                  size={24}
                  strokeWidth={1.5}
                  className="mx-auto text-foreground"
                />
                <div className="mt-3 text-sm font-medium">
                  {t("contactOfficial")}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <a
                    href={`tel:+86${CONTACT.phoneRaw}`}
                    className="hover:text-foreground"
                  >
                    {CONTACT.phone}
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
