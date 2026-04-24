import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { newsList, newsCategories } from "@/lib/data/news";
import { NewsClient } from "./news-client";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "News" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/news", locale),
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "News" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <NewsClient newsList={newsList} categories={newsCategories} />

      <div className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-lg font-semibold">{t("subscribeTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("subscribeSub")}</p>
        <div className="mx-auto mt-4 flex max-w-md gap-2">
          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {t("subscribe")}
          </button>
        </div>
      </div>
    </div>
  );
}
