import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
    default: "复材在线 - 中国FRP复合材料综合信息平台",
    template: "%s | 复材在线",
  },
  description:
    "复材在线是中国领先的FRP复合材料行业一站式数字平台，提供材料数据库、行业资讯、交易市场、技术中心和供应商目录等服务。",
  keywords: [
    "FRP",
    "复合材料",
    "玻璃钢",
    "碳纤维",
    "玻璃纤维",
    "树脂",
    "拉挤成型",
    "缠绕成型",
    "手糊成型",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
