import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ProfileCalculator from "./profile-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tech" });
  return {
    title: t("calculator.metaTitle"),
    description: t("calculator.metaDescription"),
    alternates: alternates("/tech/calculator"),
  };
}

export default async function CalculatorPage({
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
        <h1 className="text-3xl font-bold">{t("calculator.h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("calculator.subtitle")}</p>
      </div>
      <ProfileCalculator />
    </div>
  );
}
