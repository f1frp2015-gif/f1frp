import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function renderOgCard({
  category,
  title,
  subtitle,
  meta,
}: {
  category: string;
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          padding: "68px 80px 56px",
          fontFamily: "ui-sans-serif, system-ui, -apple-system",
          color: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* signal accent top rail */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 8,
            width: "100%",
            background: "#2563eb",
            display: "flex",
          }}
        />

        {/* brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#0a0a0a",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <div style={{ width: 20, height: 3, background: "#ffffff" }} />
            <div
              style={{ width: 20, height: 3, background: "rgba(255,255,255,0.78)" }}
            />
            <div
              style={{ width: 20, height: 3, background: "rgba(255,255,255,0.52)" }}
            />
          </div>
          <div>复材站 · f1frp.com</div>
        </div>

        {/* category pill */}
        <div style={{ display: "flex", marginTop: 36 }}>
          <div
            style={{
              display: "flex",
              padding: "6px 12px",
              border: "1.5px solid #e5e5e5",
              color: "#525252",
              borderRadius: 4,
              fontSize: 18,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            fontSize: 66,
            fontWeight: 600,
            lineHeight: 1.1,
            marginTop: 28,
            letterSpacing: "-0.025em",
          }}
        >
          {truncate(title, 68)}
        </div>

        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              marginTop: 20,
              color: "#737373",
              lineHeight: 1.4,
              letterSpacing: "-0.005em",
            }}
          >
            {truncate(subtitle, 140)}
          </div>
        ) : null}

        <div style={{ flexGrow: 1 }} />

        {/* footer rail */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1.5px solid #e5e5e5",
            paddingTop: 20,
            fontSize: 20,
            color: "#737373",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "0.02em",
          }}
        >
          <div style={{ display: "flex" }}>
            {meta ?? "AI-powered composite materials platform"}
          </div>
          <div style={{ display: "flex", color: "#2563eb" }}>→ f1frp.com</div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
