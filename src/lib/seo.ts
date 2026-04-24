import { routing } from "@/i18n/routing";

export const SITE_URL = "https://f1frp.com";

/**
 * Build per-page canonical + hreflang alternates.
 *
 * Respects next-intl's `localePrefix: "as-needed"` — the default locale
 * (zh) has no prefix, non-default locales do (/en/…).
 *
 * Every page MUST call this and spread into its Metadata.alternates,
 * otherwise it inherits the root layout's fallback which points to `/`.
 *
 * @param path Pathname WITHOUT locale prefix, e.g. "/formulas", "/patents/abc".
 * @param locale Current locale from route params.
 */
export function buildAlternates(
  path: string,
  locale: string
): { canonical: string; languages: Record<string, string> } {
  const normalized = path === "/" ? "" : path;

  const urlFor = (l: string): string => {
    const base =
      l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`;
    return normalized ? `${base}${normalized}` : base;
  };

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = urlFor(l);
  languages["x-default"] = urlFor(routing.defaultLocale);

  return { canonical: urlFor(locale), languages };
}
