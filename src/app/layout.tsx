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

export const metadata: Metadata = {
  title: {
    default: "F1FRP — 中国纤维复合材料一站式数字平台",
    template: "%s | F1FRP",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  },
  description:
    "复材在线是中国领先的纤维复合材料一站式数字平台，覆盖玻璃纤维、碳纤维、玄武岩纤维、芳纶纤维、生物基纤维全品类，提供材料数据库、配方数据库、标准查询、交易市场、工艺技术和供应商目录服务。",
  keywords: [
    "复合材料",
    "纤维复合材料",
    "FRP",
    "CFRP",
    "玻璃纤维",
    "碳纤维",
    "玄武岩纤维",
    "芳纶纤维",
    "凯夫拉",
    "生物基纤维",
    "玻璃钢",
    "树脂基复合材料",
    "拉挤成型",
    "缠绕成型",
    "真空导入",
    "RTM",
    "复合材料数据库",
    "复合材料交易",
  ],
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
