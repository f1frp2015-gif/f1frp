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

// 2026-06-16: 9 篇资讯文章的 slug 从"含编造字样的中文"迁移到干净 ASCII
// (旧标题被核实改写,见 src/lib/data/news.ts)。旧 URL 必须 301 到新 URL,
// 否则已被收录/收藏的链接会 404。源用旧中文 slug(Next 按解码后的 pathname
// 匹配),目标用新 ASCII slug。默认 locale(zh)无前缀 + 显式 zh/en 前缀两形态。
const articleSlugMigrations: Array<[oldSlug: string, newSlug: string]> = [
  [
    "2026年中国复合材料市场规模预计突破3500亿-风电和新能源汽车成主要驱动力",
    "china-composites-output-2023-wind-ev",
  ],
  [
    "国家标准gb-t-31539-2026-纤维增强塑料拉挤型材-正式发布实施",
    "gb-t-31539-2015-frp-pultruded-profiles",
  ],
  [
    "巨石集团年产30万吨高性能玻纤智能制造基地投产-全球产能跃居首位",
    "china-jushi-glass-fiber-leader",
  ],
  [
    "碳纤维复合材料在新能源汽车电池箱体中的应用取得突破性进展",
    "composite-battery-enclosure-smc",
  ],
  [
    "第28届中国国际复合材料展览会将于9月在上海举办-规模创历史新高",
    "cce-2026-shanghai-composites-expo",
  ],
  [
    "真空导入工艺在大型风电叶片制造中的最新优化方案",
    "vacuum-infusion-large-wind-blades",
  ],
  [
    "华东地区不饱和聚酯树脂价格小幅上涨-苯乙烯成本推动",
    "upr-resin-price-styrene-demand",
  ],
  [
    "工信部发布-复合材料行业绿色制造标准-征求意见稿",
    "composites-green-manufacturing-policy",
  ],
  [
    "光伏组件边框加速-以塑代铝-frp-拉挤型材量产落地",
    "composite-pv-frames-pu-pultrusion",
  ],
];

const articleSlugRedirects = articleSlugMigrations.flatMap(
  ([oldSlug, newSlug]) => {
    // Browsers send the non-ASCII path percent-encoded, and Next matches the
    // redirect source against that raw (encoded) pathname — a literal-CJK
    // source never matches. Encode the source so it matches the wire form.
    // (encodeURIComponent leaves the hyphens/ASCII alone; "%" is a literal in
    // path-to-regexp.) Destination stays clean ASCII.
    const enc = encodeURIComponent(oldSlug);
    return [
      {
        source: `/articles/${enc}`,
        destination: `/articles/${newSlug}`,
        statusCode: 301 as const,
      },
      {
        source: `/:locale(zh|en)/articles/${enc}`,
        destination: `/:locale/articles/${newSlug}`,
        statusCode: 301 as const,
      },
    ];
  },
);

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
      { source: "/factories", destination: "/suppliers", statusCode: 301 },
      {
        source: "/:locale(zh|en)/factories",
        destination: "/:locale/suppliers",
        statusCode: 301,
      },
      // 旧的 /pultrusion/calc(短暂上线)已整合进既有 /tech/calculator
      { source: "/pultrusion/calc", destination: "/tech/calculator", statusCode: 301 },
      {
        source: "/:locale(zh|en)/pultrusion/calc",
        destination: "/:locale/tech/calculator",
        statusCode: 301,
      },
      ...articleSlugRedirects,
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
