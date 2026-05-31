import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { AiChatWidget } from "@/components/ai-chat";
import { CookieBanner } from "@/components/cookie-banner";

// Vercel client tracking 请求 vitals.vercel-insights.com，国内 ECS 上会被墙拖慢首屏 →
// 仅在 AI_PROFILE !== 'domestic'（即海外 Vercel 侧）启用
const isDomestic = process.env.AI_PROFILE === "domestic";
import { JsonLd } from "@/components/json-ld";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { CURRENT_SITE_URL } from "@/lib/sites";
import { CONTACT } from "@/lib/contact";

const siteUrl = CURRENT_SITE_URL;
// Site identity is now sourced exclusively from messages/{locale}.json.
// The earlier NEXT_PUBLIC_SITE_{NAME,TAGLINE,DESCRIPTION} env-var overrides
// went stale and silently kept old marketing copy live in <title> / meta /
// JSON-LD even after en.json was updated; deleting them restores the
// translations file as the single source of truth.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });

  const brand = t("name");
  const tagline = t("tagline");
  const description = t("description");

  // canonical / hreflang are NOT set in the layout's default metadata
  // anymore. The old code set canonical to siteUrl (root) for every page,
  // which told Google that /about, /materials/{id}, /papers/{id} etc.
  // were all duplicates of the homepage — devastating for indexing.
  // Each page now sets its own canonical + hreflang via @/lib/seo
  // (path-aware). The layout still owns og:url for the homepage; we
  // explicitly use siteUrl for that one place.
  const title = `${brand} — ${tagline}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${brand}`,
    },
    description,
    // meta keywords intentionally omitted: Google ignores them and dense
    // keyword lists are flagged as over-optimization by some auditors.
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      ],
      apple: "/apple-icon.png",
    },
    openGraph: {
      type: "website",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      url: siteUrl,
      siteName: brand,
      title,
      description,
      // og:image populated by src/app/[locale]/opengraph-image.tsx
      // (1200×630 dynamically generated — beats the old 512×512 logo
      // for social/SERP card CTR).
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    // alternates intentionally NOT set here — see comment above the
    // generateMetadata return. Each page sets path-aware canonical +
    // hreflang via @/lib/seo.alternates(path).
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      ...(process.env.BAIDU_SITE_VERIFICATION
        ? { "baidu-site-verification": process.env.BAIDU_SITE_VERIFICATION }
        : {}),
      ...(process.env.SOGOU_SITE_VERIFICATION
        ? { "sogou-site-verification": process.env.SOGOU_SITE_VERIFICATION }
        : {}),
      ...(process.env.SHENMA_SITE_VERIFICATION
        ? { "shenma-site-verification": process.env.SHENMA_SITE_VERIFICATION }
        : {}),
      ...(process.env.SM_SITE_VERIFICATION
        ? { "360-site-verification": process.env.SM_SITE_VERIFICATION }
        : {}),
      ...(process.env.BYTEDANCE_VERIFICATION
        ? { "bytedance-verification-code": process.env.BYTEDANCE_VERIFICATION }
        : {}),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Site" });
  const brand = t("name");
  const description = t("description");
  const htmlLang = locale === "zh" ? "zh-CN" : "en";

  return (
    <html
      lang={htmlLang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: brand,
                // legalName (operating entity) is disclosed on the overseas
                // side only; the domestic site keeps the platform brand neutral.
                ...(locale === "en"
                  ? {
                      legalName:
                        "Chongqing Yaoyi Advanced Materials Technology Co., Ltd.",
                    }
                  : {}),
                alternateName: ["f1frp", "getfrp", "F1 Composite", t("name")].filter(
                  (v, i, a) => v && a.indexOf(v) === i,
                ),
                url: siteUrl,
                logo: `${siteUrl}/og-icon.png`,
                description,
                foundingDate: "2015",
                address: {
                  "@type": "PostalAddress",
                  addressCountry: "CN",
                  addressRegion: "Chongqing",
                },
                // sameAs intentionally empty until LinkedIn / industry-body
                // profiles are wired up — empty array signals to Google we
                // recognize the slot rather than that we've never thought of it.
                sameAs: [],
                // Single contact: technical service hotline. Same on both
                // deploys. Buyers who want a human go through /rfq first.
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "technical support",
                  email: CONTACT.email,
                  availableLanguage: ["en", "zh-CN"],
                },
              },
              {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: brand,
                publisher: { "@id": `${siteUrl}/#organization` },
                inLanguage: htmlLang,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteUrl}/materials?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
        <NextIntlClientProvider>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <AiChatWidget />
            <CookieBanner />
          </Providers>
        </NextIntlClientProvider>
        {!isDomestic && <SpeedInsights />}
        {!isDomestic && <Analytics />}
        {locale === "zh" && (
          <Script id="baidu-push" strategy="afterInteractive">
            {`(function(){
  var bp=document.createElement('script');
  var curProtocol=window.location.protocol.split(':')[0];
  bp.src = curProtocol==='https'
    ? 'https://zz.bdstatic.com/linksubmit/push.js'
    : 'http://push.zhanzhang.baidu.com/push.js';
  var s=document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(bp,s);
})();`}
          </Script>
        )}
      </body>
    </html>
  );
}
