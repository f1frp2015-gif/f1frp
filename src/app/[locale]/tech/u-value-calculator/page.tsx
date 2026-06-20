import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import UValueCalculator from "./u-value-calculator";
import UValueCalculatorIntl from "./u-value-calculator-intl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tech" });
  // getfrp.com(en)用国际标准版(uvalueIntl);f1frp.com(zh)用 JG/T 571 版(uvalue)
  const k = locale === "en" ? "uvalueIntl" : "uvalue";
  return {
    title: t(`${k}.metaTitle`),
    description: t(`${k}.metaDescription`),
    alternates: alternates("/tech/u-value-calculator"),
  };
}

export default async function UValueCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Tech" });
  // 引用标准不同:getfrp.com(en)国际标准版 / f1frp.com(zh)JG/T 571 版
  const isEn = locale === "en";
  const k = isEn ? "uvalueIntl" : "uvalue";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t(`${k}.h1`)}</h1>
        <p className="mt-2 text-muted-foreground">
          {t(`${k}.subtitle`)}
        </p>
      </div>
      {isEn ? <UValueCalculatorIntl /> : <UValueCalculator />}
    </div>
  );
}
