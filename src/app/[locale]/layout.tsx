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
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = SITE_URL;

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

  // NOTE: Do NOT set `alternates` here. The root layout's metadata is inherited
  // by every descendant page, so any canonical/hreflang set here overrides
  // every page that doesn't explicitly set its own. Per-page alternates are
  // set in each page's generateMetadata via buildAlternates(path, locale).
  // The homepage owns its own alternates in [locale]/page.tsx.

  const title = `${t("name")} — ${t("tagline")}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${t("name")}`,
    },
    description: t("description"),
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
      siteName: t("name"),
      title,
      description: t("description"),
      images: [{ url: "/og-icon.png", width: 512, height: 512, alt: t("name") }],
    },
    twitter: {
      card: "summary",
      title,
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
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
                name: t("name"),
                alternateName: ["f1frp", `${t("name")} f1frp`],
                url: siteUrl,
                logo: `${siteUrl}/og-icon.png`,
                description: t("description"),
                sameAs: [],
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  name: "Doris Li",
                  email: "f1frp2015@gmail.com",
                  telephone: "+86-138-8333-8993",
                  availableLanguage: ["zh-CN", "en"],
                },
              },
              {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: t("name"),
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
