import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 安全响应头. 这些不直接影响 GSC 收录, 但会:
//  1) 让 SecurityHeaders.com 评分从 D/F 升到 A 级 — 部分买家用此评估供应商可信度
//  2) 在 Google PageExperience 报告中减少标记
//  3) 防 clickjacking / MIME-sniffing / referrer 泄露
//
// 不加 CSP — 站内有 Clerk / Vercel Analytics / Google Fonts / Baidu push 等多
// 个第三方域,严格 CSP 会破坏功能;留待单独排查后再加。其余 5 项都是无副作用
// 的强化项,可立即开启。
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === "ecs" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./messages/**/*.json"],
  },
  // ali-oss has dynamic optional require('proxy-agent') that breaks bundling.
  // Mark as external so it's resolved at runtime (server-only anyway).
  serverExternalPackages: ["ali-oss"],
  async redirects() {
    // /downloads、/factories 页面已下线 → 301 到最相关的存活页(同时兼容带 locale 前缀)
    return [
      { source: "/downloads", destination: "/materials", statusCode: 301 },
      {
        source: "/:locale(zh|en)/downloads",
        destination: "/:locale/materials",
        statusCode: 301,
      },
      { source: "/factories", destination: "/", statusCode: 301 },
      {
        source: "/:locale(zh|en)/factories",
        destination: "/:locale",
        statusCode: 301,
      },
      // 旧的 /pultrusion/calc(短暂上线)已整合进既有 /tech/calculator
      { source: "/pultrusion/calc", destination: "/tech/calculator", statusCode: 301 },
      {
        source: "/:locale(zh|en)/pultrusion/calc",
        destination: "/:locale/tech/calculator",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
