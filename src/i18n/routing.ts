import { defineRouting } from "next-intl/routing";

type Lang = "zh" | "en";
const ALL_LOCALES = ["zh", "en"] as const satisfies readonly Lang[];

// NEXT_PUBLIC_LOCALES = "en"        → 仅英文 (getfrp.com)
// NEXT_PUBLIC_LOCALES = "zh,en"     → 双语 (f1frp.com 国内 / Vercel 默认)
// 不设置                            → 双语
const envLocales = process.env.NEXT_PUBLIC_LOCALES;
const parsedLocales = envLocales
  ? (envLocales.split(",").map((s) => s.trim()).filter(
      (s): s is Lang => s === "zh" || s === "en",
    ) as Lang[])
  : [...ALL_LOCALES];
const locales: readonly Lang[] =
  parsedLocales.length > 0 ? parsedLocales : [...ALL_LOCALES];

const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
const defaultLocale: Lang = locales.includes(envDefault as Lang)
  ? (envDefault as Lang)
  : (locales[0] ?? "zh");

export const routing = defineRouting({
  locales: locales as Lang[],
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
