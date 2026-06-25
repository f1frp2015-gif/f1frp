import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

// Brand-neutral, in-code SVG figures for FRP product families. No photography,
// no brand marks, no fabricated claims — just clean cross-section / profile
// schematics that give an overseas buyer something to *see* and orient by, and
// a funnel into the RFQ. Colours inherit from `currentColor` so the figures
// adapt to light/dark and getfrp's theme.

export type FrpShape =
  | "i-beam"
  | "box"
  | "channel"
  | "angle"
  | "tube"
  | "rod"
  | "grating"
  | "rebar";

function ShapePaths({ shape }: { shape: FrpShape }) {
  switch (shape) {
    case "i-beam":
      return (
        <g fill="currentColor" fillOpacity={0.16} stroke="currentColor" strokeWidth={1.4}>
          <rect x={22} y={14} width={52} height={11} rx={1} />
          <rect x={40} y={14} width={16} height={44} rx={1} />
          <rect x={22} y={47} width={52} height={11} rx={1} />
        </g>
      );
    case "box":
      return (
        <rect
          x={26}
          y={14}
          width={44}
          height={44}
          rx={3}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
        />
      );
    case "channel":
      return (
        <path
          d="M64 14 H30 V58 H64"
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinejoin="round"
        />
      );
    case "angle":
      return (
        <path
          d="M30 14 V58 H70"
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    case "tube":
      return (
        <circle cx={48} cy={36} r={20} fill="none" stroke="currentColor" strokeWidth={8} />
      );
    case "rod":
      return (
        <circle
          cx={48}
          cy={36}
          r={18}
          fill="currentColor"
          fillOpacity={0.16}
          stroke="currentColor"
          strokeWidth={1.4}
        />
      );
    case "grating":
      return (
        <g fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
          <rect x={22} y={16} width={52} height={40} rx={2} />
          <line x1={39} y1={16} x2={39} y2={56} />
          <line x1={56} y1={16} x2={56} y2={56} />
          <line x1={22} y1={31} x2={74} y2={31} />
          <line x1={22} y1={42} x2={74} y2={42} />
        </g>
      );
    case "rebar":
      return (
        <g stroke="currentColor" strokeLinecap="round">
          <rect
            x={40}
            y={12}
            width={16}
            height={48}
            rx={8}
            fill="currentColor"
            fillOpacity={0.14}
            strokeWidth={1.4}
          />
          <g strokeWidth={2} opacity={0.7}>
            <line x1={40} y1={20} x2={56} y2={16} />
            <line x1={40} y1={31} x2={56} y2={27} />
            <line x1={40} y1={42} x2={56} y2={38} />
            <line x1={40} y1={53} x2={56} y2={49} />
          </g>
        </g>
      );
  }
}

export function FrpSectionFigure({
  shape,
  className,
}: {
  shape: FrpShape;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 72"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <ShapePaths shape={shape} />
    </svg>
  );
}

type ProductFamily = {
  shape: FrpShape;
  name: string;
  apps: string;
  standard: string;
};

const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    shape: "i-beam",
    name: "Pultruded structural profiles",
    apps: "Platforms · walkways · support frames · stair stringers",
    standard: "EN 13706 E17 / E23",
  },
  {
    shape: "grating",
    name: "Molded & pultruded grating",
    apps: "Walkways · trench covers · mezzanine decks",
    standard: "EN 13706 · ASTM · DNV",
  },
  {
    shape: "rebar",
    name: "FRP rebar (GFRP / BFRP)",
    apps: "Concrete reinforcement · marine · MRI / non-magnetic",
    standard: "ASTM D7957 · ACI 440",
  },
  {
    shape: "tube",
    name: "Round tube · GRP / GRE pipe",
    apps: "Handrails · fluid transfer · cable conduit",
    standard: "ISO 14692 · AWWA C950",
  },
  {
    shape: "channel",
    name: "Channels & angles",
    apps: "Secondary framing · trim · ladder rails",
    standard: "EN 13706",
  },
  {
    shape: "box",
    name: "Box / RHS & rod",
    apps: "Posts · beams · tie rods · electrical standoffs",
    standard: "EN 13706 · ASTM",
  },
];

// Buyer-facing "what you can source" gallery — generated figures + truthful
// application/standard tags, each funnelling to the RFQ. Anonymous by design:
// it shows the PRODUCT, not the factory.
export function ProductFamilyGallery() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PRODUCT_FAMILIES.map((p) => (
        <Link
          key={p.name}
          href={
            `/rfq?product=${encodeURIComponent(p.name)}` as never
          }
          className="group flex items-start gap-4 border border-border/70 bg-background p-4 transition-colors hover:border-foreground"
        >
          <FrpSectionFigure
            shape={p.shape}
            className="h-16 w-20 shrink-0 text-foreground/80"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">{p.name}</div>
            <div className="mt-1 text-[12px] leading-snug text-muted-foreground">
              {p.apps}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {p.standard}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-foreground/70 transition-colors group-hover:text-foreground">
                Quote
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
