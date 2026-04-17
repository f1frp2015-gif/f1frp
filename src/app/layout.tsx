import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { AiChatWidget } from "@/components/ai-chat";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://f1frp.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "F1FRP — AI赋能的纤维复合材料数字平台",
    template: "%s | F1FRP",
  },
  description:
    "F1FRP是中国领先的AI赋能纤维复合材料平台，覆盖玻纤/碳纤/玄武岩/芳纶/生物基纤维全品类。AI选材推荐、配方设计、标准查询、价格行情、供应商匹配——一个平台解决复材全链路需求。",
  keywords: [
    "复合材料",
    "纤维复合材料",
    "FRP",
    "CFRP",
    "GFRP",
    "玻璃纤维",
    "碳纤维",
    "玄武岩纤维",
    "芳纶纤维",
    "凯夫拉",
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
    locale: "zh_CN",
    url: siteUrl,
    siteName: "F1FRP",
    title: "F1FRP — AI赋能的纤维复合材料数字平台",
    description:
      "AI选材推荐 · 配方设计 · 材料数据库 · 标准查询 · 价格行情 · 供应商匹配",
    images: [{ url: "/og-icon.png", width: 512, height: 512, alt: "F1FRP" }],
  },
  twitter: {
    card: "summary",
    title: "F1FRP — AI赋能的纤维复合材料数字平台",
    description: "AI选材 · 配方 · 材料库 · 标准 · 行情 · 供应商",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: siteUrl },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <AiChatWidget />
        </Providers>
      </body>
    </html>
  );
}
