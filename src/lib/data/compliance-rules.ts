// getfrp Sourcing Desk · P0 缺口 B — Compliance Flags(轻量规则,先不做全 CBAM)。
//
// 一张确定性规则表 + 匹配函数,给海外买家在下单前标出"中国 FRP 出口到目的国/用途"
// 的合规红旗。**价值在诚实**:能标"做不了"(Buy America 联邦项目)反而建信任
// (对齐 vault 2026-06-16 定位 v2 §合规硬墙 / 蒸馏 §7 信任优势)。
// P0 不做完整 CBAM 碳核算,只给 doc-needed 旗标。

import type { ProductCategory } from "@/lib/sourcing/spec";
import { normalizeRegion } from "@/lib/data/tariff";

export type FlagSeverity = "block" | "doc-needed" | "check";

export type ComplianceFlag = {
  type: "buy_america" | "cbam" | "fire" | "icc_es";
  severity: FlagSeverity;
  message: string;
};

export type ComplianceInput = {
  destinationCountry?: string;
  application?: string;
  productCategory?: ProductCategory;
};

const FEDERAL_RE = /federal|infrastructure|government|public\s*works|municipal|\bdot\b|state-funded|publicly funded|highway|公共|政府|联邦|基建/i;
const BUILDING_RE = /building|construction|facade|cladding|interior|transit|rail|metro|subway|tunnel|station|walkway|platform|建筑|轨道|地铁|隧道|车站/i;
const STRUCTURAL_RE = /structural|load.?bearing|beam|column|deck|bridge|承重|结构|桥/i;

// Evaluate the deterministic rule table against destination + application.
// Order: hard blocks first, then doc-needed, then checks.
export function evaluateCompliance(input: ComplianceInput): ComplianceFlag[] {
  const region = normalizeRegion(input.destinationCountry);
  const app = input.application ?? "";
  const flags: ComplianceFlag[] = [];

  // Buy America (BABA) — US federally funded → Chinese FRP generally excluded.
  if (region === "US" && FEDERAL_RE.test(app)) {
    flags.push({
      type: "buy_america",
      severity: "block",
      message:
        "Federally funded / public-infrastructure scope in the US: Chinese-origin FRP is generally excluded under Buy America (BABA). We can only serve private/commercial scope — we flag this honestly rather than risk a non-compliant order.",
    });
  }

  // CBAM — any EU import → carbon reporting applies (P0: doc, not carbon calc).
  if (region === "EU") {
    flags.push({
      type: "cbam",
      severity: "doc-needed",
      message:
        "EU import: CBAM reporting applies. FRP/GFRP is largely glass+resin (low embedded carbon vs steel/aluminium), but importers must file. We supply embedded-carbon documentation on shipment.",
    });
  }

  // Fire rating — building / transit interior use.
  if (BUILDING_RE.test(app)) {
    flags.push({
      type: "fire",
      severity: "check",
      message:
        "Building / transit use: a fire rating is usually required (US ASTM E84 flame-spread / EU EN 13501 Euroclass). Confirm the required class before order — fire-retardant resin systems are available but must be specified.",
    });
  }

  // ICC-ES — US structural building → code approval often needs an ESR.
  if (region === "US" && STRUCTURAL_RE.test(app)) {
    flags.push({
      type: "icc_es",
      severity: "check",
      message:
        "US structural/building use: code approval may require an ICC-ES Evaluation Report (ESR). Most Chinese pultruders lack an ESR — we flag this honestly; design-by-test or an alternative-means path may be needed.",
    });
  }

  return flags;
}
