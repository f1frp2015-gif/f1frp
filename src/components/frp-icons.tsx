// Domain-specific FRP icon set — Linear-style 1.5px strokes, 24x24 viewBox,
// stroke="currentColor" so they inherit text color. Match lucide visual density.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ─── 材料类别 ───────────────────────────────── */

// 树脂 — 液滴
export function ResinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3c-4 5-6 8-6 11a6 6 0 0 0 12 0c0-3-2-6-6-11z" />
      <path d="M9 14a3 3 0 0 0 3 3" />
    </Svg>
  );
}

// 增强纤维 — 三缕纤维束
export function FiberIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 4c3 2 6 4 8 8s5 6 8 8" />
      <path d="M7 4c2 2 4 5 5 8s3 6 5 8" />
      <path d="M10 4c1 3 2 6 2 8s0 5-2 8" />
    </Svg>
  );
}

// 芯材 — 蜂窝六边
export function CoreIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3l6 0l3 5l-3 5l-6 0l-3-5z" />
      <path d="M9 13l6 0l3 5l-3 5l-6 0l-3-5z" transform="translate(0 -5)" />
    </Svg>
  );
}

// 胶衣 — 分层 + 点滴
export function GelcoatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 8h18" />
      <path d="M3 14h18" />
      <path d="M7 18l2 3M13 18l2 3M17 18l0 3" />
    </Svg>
  );
}

// 辅助材料 — 烧瓶
export function FlaskIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3h6" />
      <path d="M10 3v5L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3" />
      <path d="M7 15h10" />
    </Svg>
  );
}

// 复合制品 — 层压堆
export function LayupIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="3" rx="0.5" />
      <rect x="3" y="10.5" width="18" height="3" rx="0.5" />
      <rect x="3" y="16" width="18" height="3" rx="0.5" />
    </Svg>
  );
}

/* ─── 成型工艺 ───────────────────────────────── */

// 手糊 — 毛刷
export function BrushIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17 3l4 4l-9 9" />
      <path d="M12 16l-5 5a2 2 0 0 1-3-3l5-5" />
      <path d="M8 10l6 6" />
    </Svg>
  );
}

// 缠绕 — 螺旋
export function WindingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3C6 6 6 18 12 21" />
      <path d="M12 3c6 3 6 15 0 18" />
    </Svg>
  );
}

// 拉挤 — 型材过模
export function PultrusionIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="8" y="7" width="6" height="10" rx="1" />
      <path d="M3 12h4" />
      <path d="M15 12h6" />
      <path d="M18 9l3 3l-3 3" />
    </Svg>
  );
}

// 模压 — 向下压
export function CompressionIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="3" width="16" height="5" rx="1" />
      <rect x="4" y="16" width="16" height="5" rx="1" />
      <path d="M12 9v6" />
      <path d="M9 12l3 3l3-3" />
    </Svg>
  );
}

// RTM — 注射器
export function SyringeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17 3l4 4" />
      <path d="M14 6l4 4" />
      <path d="M13 7L4 16l4 4l9-9" />
      <path d="M8 20l-3 3" />
    </Svg>
  );
}

// 真空导入
export function VacuumIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 8c2-3 16-3 18 0v8c-2 3-16 3-18 0z" />
      <path d="M12 4v16" />
      <path d="M8 12h8" />
    </Svg>
  );
}

// 3D 打印头
export function PrinterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="8" rx="1" />
      <path d="M8 12v4h8v-4" />
      <path d="M10 16l2 4l2-4" />
    </Svg>
  );
}

// 复材 AI — 层压节点 + 三缕信号（呼应 logo 三层叠加）
export function CompositeAiIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M5.5 5.5l2.8 2.8" />
      <path d="M15.7 15.7l2.8 2.8" />
      <path d="M18.5 5.5l-2.8 2.8" />
      <path d="M8.3 15.7l-2.8 2.8" />
    </Svg>
  );
}

// 修补 — 扳手
export function WrenchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M15 3a5 5 0 0 1 5 7l-9 9a3 3 0 0 1-4-4l9-9a5 5 0 0 1-1-3z" />
      <circle cx="7" cy="17" r="0.5" fill="currentColor" />
    </Svg>
  );
}
