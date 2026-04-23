import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import UValueCalculator from "./u-value-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tech" });
  return { title: t("uvalue.metaTitle"), description: t("uvalue.metaDescription") };
}

export default async function UValueCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Tech" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("uvalue.h1")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("uvalue.subtitle")}
        </p>
      </div>
      <UValueCalculator />
    </div>
  );
}
