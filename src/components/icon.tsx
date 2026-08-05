import type { LucideIcon } from "lucide-react";
import type { SVGProps } from "react";
import {
  LayoutGrid,
  FileText,
  MessageCircle,
  Factory,
  CheckCircle2,
  Shield,
  PenLine,
  HelpCircle,
  ShoppingCart,
  FlaskConical,
  Ruler,
  BookOpen,
  CircleDollarSign,
  Building2,
  Wrench as LWrench,
  Search,
  Plus,
  Download,
  ArrowRight,
  Bookmark,
  UserRound,
  PackageSearch,
} from "lucide-react";

import {
  ResinIcon,
  FiberIcon,
  CoreIcon,
  GelcoatIcon,
  FlaskIcon,
  LayupIcon,
  BrushIcon,
  WindingIcon,
  PultrusionIcon,
  CompressionIcon,
  SyringeIcon,
  VacuumIcon,
  PrinterIcon,
  WrenchIcon,
  CompositeAiIcon,
} from "./frp-icons";

type IconComponent = (props: SVGProps<SVGSVGElement> & { size?: number }) => React.ReactElement;

// Semantic icon registry: data files reference keys, renderer resolves to components.
const REGISTRY: Record<string, IconComponent | LucideIcon> = {
  // ── Material categories
  resin: ResinIcon,
  fiber: FiberIcon,
  "fiber-yarn": FiberIcon,
  "fiber-mat": FiberIcon,
  "fiber-fabric": FiberIcon,
  core: CoreIcon,
  gelcoat: GelcoatIcon,
  auxiliary: FlaskIcon,
  composite: LayupIcon,

  // ── Formula processes
  "hand-layup": BrushIcon,
  "filament-winding": WindingIcon,
  pultrusion: PultrusionIcon,
  compression: CompressionIcon,
  rtm: SyringeIcon,
  "vacuum-infusion": VacuumIcon,
  "roll-wrapping": WindingIcon,
  "3d-printing": PrinterIcon,
  repair: WrenchIcon,
  "all-process": LayoutGrid,

  // ── Dashboard nav
  overview: LayoutGrid,
  profile: UserRound,
  "post-new": PenLine,
  "post-list": FileText,
  messages: MessageCircle,
  enterprise: Factory,
  products: PackageSearch,
  claims: CheckCircle2,
  "admin-claims": Shield,
  bookmark: Bookmark,

  // ── Post types
  buy: ShoppingCart,
  sell: Factory,
  question: HelpCircle,

  // ── AI scenarios
  "ai-select": FlaskConical,
  "ai-formula": LayupIcon,
  "ai-process": Ruler,
  "ai-standard": BookOpen,
  "ai-price": CircleDollarSign,
  "ai-supplier": Building2,

  // ── AI brand mark
  "composite-ai": CompositeAiIcon,

  // ── Generic
  wrench: LWrench,
  search: Search,
  plus: Plus,
  download: Download,
  arrow: ArrowRight,
};

export function Icon({
  name,
  size = 16,
  className,
  ...rest
}: {
  name: string;
  size?: number;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const Comp = REGISTRY[name];
  if (!Comp) return null;
  return <Comp size={size} className={className} {...rest} />;
}
