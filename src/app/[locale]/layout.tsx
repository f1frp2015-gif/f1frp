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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://f1frp.com";
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
    keywords:
      locale === "zh"
        ? [
            "复合材料",
            "纤维复合材料",
            "FRP",
            "CFRP",
            "GFRP",
            "玻璃纤维",
            "碳纤维",
            "玄武岩纤维",
            "芳纶纤维",
            "生物基纤维",
            "玻璃钢",
            "树脂",
            "复合材料AI",
            "AI选材",
            "复合材料数据库",
            "复合材料配方",
            "拉挤成型",
            "缠绕成型",
            "真空导入",
            "RTM",
            "手糊成型",
          ]
        : [
            "composite materials",
            "fiber reinforced polymer",
            "FRP",
            "CFRP",
            "GFRP",
            "glass fiber",
            "carbon fiber",
            "basalt fiber",
            "aramid fiber",
            "bio-based fiber",
            "fiberglass",
            "resin",
            "composite AI",
            "material selection",
            "composite database",
            "composite formulas",
            "pultrusion",
            "filament winding",
            "vacuum infusion",
            "RTM",
            "hand lay-up",
          ],
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
      images: [{ url: "/og-icon.png", width: 512, height: 512, alt: brand }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical,
      languages: {
        zh: siteUrl,
        en: `${siteUrl}/en`,
        "x-default": siteUrl,
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
                alternateName: ["f1frp", "getfrp", t("name")].filter(
                  (v, i, a) => v && a.indexOf(v) === i,
                ),
                url: siteUrl,
                logo: `${siteUrl}/og-icon.png`,
                description,
                sameAs: [],
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  name: "Doris Li",
                  email: "doris.li@f1composite.com",
                  telephone: "+86-138-8333-8993",
                  availableLanguage: ["zh-CN", "en"],
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
          </Providers>
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
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
