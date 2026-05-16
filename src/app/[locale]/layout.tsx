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

import { CURRENT_SITE_URL, SITE_ZH, SITE_EN } from "@/lib/sites";
import {
  CONTACT,
  CONTACT_TECH,
  SHOW_SALES_CONTACT,
} from "@/lib/contact";

const siteUrl = CURRENT_SITE_URL;
const brandOverride = process.env.NEXT_PUBLIC_SITE_NAME;
const taglineOverride = process.env.NEXT_PUBLIC_SITE_TAGLINE;
const descOverride = process.env.NEXT_PUBLIC_SITE_DESCRIPTION;

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

  const brand = brandOverride ?? t("name");
  const tagline = taglineOverride ?? t("tagline");
  const description = descOverride ?? t("description");

  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? siteUrl : `${siteUrl}/${locale}`;

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
      url: canonical,
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
    alternates: {
      canonical,
      // Cross-domain hreflang: zh content is canonical on f1frp.com, en
      // content on getfrp.com. Regional en variants (US/GB/AU/CA) all
      // point at the single en deploy — the Service schema's areaServed
      // covers the rest. Without these, Google's regional SERPs (google.de
      // for English, google.co.uk, etc.) often default to less-localized
      // alternates.
      languages: {
        zh: SITE_ZH,
        "zh-CN": SITE_ZH,
        en: SITE_EN,
        "en-US": SITE_EN,
        "en-GB": SITE_EN,
        "en-AU": SITE_EN,
        "en-CA": SITE_EN,
        "x-default": SITE_EN,
      },
    },
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
  const brand = brandOverride ?? t("name");
  const description = descOverride ?? t("description");
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
                legalName: "Chongqing Yaoyi Advanced Materials Technology Co., Ltd.",
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
                // Anonymous team alias — no personal name, no phone.
                // EN side surfaces sourcing-desk email; ZH side tech mailbox only.
                contactPoint: SHOW_SALES_CONTACT
                  ? {
                      "@type": "ContactPoint",
                      contactType: "customer support",
                      email: CONTACT.email,
                      availableLanguage: ["en", "zh-CN"],
                      areaServed: ["US", "DE", "FR", "GB", "IT", "ES", "NL", "PL", "AU", "CA"],
                    }
                  : {
                      "@type": "ContactPoint",
                      contactType: "technical support",
                      email: CONTACT_TECH.email,
                      availableLanguage: ["zh-CN"],
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
