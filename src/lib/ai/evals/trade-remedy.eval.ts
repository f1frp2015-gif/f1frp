import { lookupTradeRemedy } from "@/lib/data/trade-remedy";
import { expect, type EvalSuite } from "./eval-types";

export const tradeRemedySuite: EvalSuite = {
  name: "trade-remedy",
  cases: [
    {
      id: "panel-eu-glassfabric-exposure",
      run: () => {
        const r = lookupTradeRemedy({ destination: "EU", category: "panel" });
        return expect(
          r.exposureMaxPct >= 34 && r.measures.some((m) => m.id.includes("glassfiber-fabric")),
          `panel→EU should surface glass-fabric AD (max≥34), got ${r.exposureMaxPct}`,
        );
      },
    },
    {
      // 反面用例:型材不得被断言玻纤织物硬税率 —— 守住"不过度断言"红线。
      id: "profile-eu-no-overassert",
      run: () => {
        const r = lookupTradeRemedy({ destination: "EU", category: "profile" });
        return expect(
          r.exposureMaxPct === 0 && r.measures.length === 0,
          `profile→EU must NOT assert a glass-fabric hard rate, got max ${r.exposureMaxPct} / ${r.measures.length} measures`,
        );
      },
    },
    {
      id: "profile-us-section301-expiry",
      run: () => {
        const r = lookupTradeRemedy({ destination: "US", category: "profile" });
        return expect(
          r.measures.some((m) => m.kind === "section301" && m.expiresOn === "2026-11-10"),
          "profile→US should surface Section 301 exclusion expiry 2026-11-10",
        );
      },
    },
    {
      id: "exposure-min-always-zero",
      run: () => {
        const r = lookupTradeRemedy({ destination: "EU", category: "panel" });
        return expect(r.exposureMinPct === 0, "exposureMin must be 0 (scope/classification uncertainty)");
      },
    },
  ],
};
