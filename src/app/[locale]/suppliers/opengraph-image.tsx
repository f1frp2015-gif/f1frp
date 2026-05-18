import { ImageResponse } from "next/og";

// Per-route OG for /suppliers. Locale-aware: zh deploy serves a different
// pitch (供应商目录) than the en deploy (China supplier directory).

export const alt = "Verified Chinese FRP supplier directory — ranked by scale";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "zh" ? "zh" : "en";
  const isZh = locale === "zh";

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
          <span>{isZh ? "复材企业目录" : "VERIFIED SUPPLIER DIRECTORY"}</span>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>
            {isZh ? "f1frp" : "getfrp"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 80,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          <div>{isZh ? "复材供应商目录" : "China FRP suppliers,"}</div>
          <div style={{ color: "rgba(255,255,255,0.55)" }}>
            {isZh ? "按规模与认证排序。" : "verified, ranked by scale."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span>
            {isZh
              ? "制品 · 纤维 · 树脂 · 设备 · 模具 · 检测"
              : "Manufacturer · Fiber · Resin · Equipment · Mold · Testing"}
          </span>
          <span style={{ fontWeight: 500, color: "#ffffff" }}>
            {isZh ? "f1frp.com/suppliers" : "getfrp.com/suppliers"}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
