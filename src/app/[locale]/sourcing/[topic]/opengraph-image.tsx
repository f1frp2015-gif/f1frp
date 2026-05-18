import { ImageResponse } from "next/og";
import { findSourcingTopic, sourcingTopics } from "@/lib/data/sourcing-topics";

// Per-topic OG. Each sourcing topic gets a card with its own title — much
// higher LinkedIn / X / Slack share CTR than the generic /suppliers OG when
// these long-form guides land in industry feeds.

export const alt = "FRP sourcing from China — topic guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateImageMetadata({
  params: _params,
}: {
  params: { topic: string };
}) {
  return sourcingTopics.map((t) => ({
    id: t.slug,
    alt: t.title,
    size,
    contentType,
  }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const t = findSourcingTopic(topic);

  // Fallback to generic copy if topic is unknown (shouldn't happen with
  // dynamicParams=false on the page, but defensive).
  const title = t?.title ?? "FRP sourcing from China — topic guide";
  const pillar = (t?.pillar ?? "sourcing").toUpperCase();
  const stats = t?.stats?.slice(0, 2) ?? [];

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
          <span>{pillar} · SOURCING TOPIC</span>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>getfrp</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 56 : 64,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 14, opacity: 0.7 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <span style={{ fontWeight: 500, color: "#ffffff" }}>
            getfrp.com/sourcing/{t?.slug ?? "topic"}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
