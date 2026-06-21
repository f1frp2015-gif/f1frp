import { ImageResponse } from "next/og";

// Locale-aware 1200×630 OG image. Replaces the old 512×512 /og-icon.png
// reference — too small for LinkedIn / Twitter / Slack large cards, which
// rely on minimum 1.91:1 aspect ratio for the rich preview.
//
// Static at build time (no Request-time APIs, no DB calls), so this is
// generated once per deploy and cached by the platform.

export const alt = "getfrp — China's FRP supply chain, AI-native and export-ready";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COPY = {
  en: {
    eyebrow: "AI-NATIVE · CHINA'S FRP SUPPLY CHAIN",
    h1Top: "China's FRP supply chain —",
    h1Bottom: "AI-native, exported.",
    sub: "200+ audited plants · GB ⇄ ASTM ⇄ EN mapped · English RFQ",
    domain: "getfrp.com",
    brand: "getfrp",
  },
  zh: {
    eyebrow: "AI 复材工作台",
    h1Top: "选材 · 配方 · 标准",
    h1Bottom: "AI 一站搞定。",
    sub: "材料库 · 配方库 · 标准库 · 论文专利 · 供应商",
    domain: "f1frp.com",
    brand: "f1frp",
  },
} as const;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "zh" ? "zh" : "en";
  const copy = COPY[locale];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #1a1a1a 100%)",
          color: "#ffffff",
          padding: "72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top row: eyebrow + brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <span>{copy.eyebrow}</span>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>
            {copy.brand}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 86,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          <div>{copy.h1Top}</div>
          <div style={{ color: "rgba(255,255,255,0.55)" }}>
            {copy.h1Bottom}
          </div>
        </div>

        {/* Bottom row: sub + domain */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span>{copy.sub}</span>
          <span style={{ fontWeight: 500, color: "#ffffff" }}>
            {copy.domain}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
