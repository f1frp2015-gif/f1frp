import { computeLanded } from "@/lib/quote/landed";
import { expect, type EvalSuite } from "./eval-types";

export const landedCostSuite: EvalSuite = {
  name: "landed-cost",
  cases: [
    {
      id: "profile-us-ddp-sane",
      run: () => {
        const r = computeLanded({ productCategory: "profile", destinationCountry: "US" });
        return expect(
          r.ddpUsdPerKg.low >= 3.5 && r.ddpUsdPerKg.high <= 8.5,
          `profile→US base DDP $${r.ddpUsdPerKg.low}-${r.ddpUsdPerKg.high}/kg outside sane band`,
        );
      },
    },
    {
      id: "profile-us-remedy-ceiling-ge-base",
      run: () => {
        const r = computeLanded({ productCategory: "profile", destinationCountry: "US" });
        return expect(
          !!r.ddpWithRemedyUsdPerKg && r.ddpWithRemedyUsdPerKg.high >= r.ddpUsdPerKg.high,
          "profile→US with-remedy high should be >= base DDP high (Section 301 exposure)",
        );
      },
    },
    {
      id: "remedy-low-equals-base-low",
      run: () => {
        const r = computeLanded({ productCategory: "panel", destinationCountry: "EU" });
        return expect(
          !!r.ddpWithRemedyUsdPerKg && r.ddpWithRemedyUsdPerKg.low === r.ddpUsdPerKg.low,
          "with-remedy low must equal base DDP low (exposureMin=0 → no over-assertion)",
        );
      },
    },
  ],
};
