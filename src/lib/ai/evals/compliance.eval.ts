import { evaluateCompliance } from "@/lib/data/compliance-rules";
import { expect, type EvalSuite } from "./eval-types";

export const complianceSuite: EvalSuite = {
  name: "compliance",
  cases: [
    {
      id: "us-federal-buy-america-block",
      run: () => {
        const f = evaluateCompliance({ destinationCountry: "US", application: "federal highway bridge deck" });
        return expect(
          f.some((x) => x.type === "buy_america" && x.severity === "block"),
          "US federal scope → buy_america block",
        );
      },
    },
    {
      id: "eu-panel-trade-remedy-flag",
      run: () => {
        const f = evaluateCompliance({ destinationCountry: "EU", productCategory: "panel" });
        return expect(f.some((x) => x.type === "trade_remedy"), "EU panel → trade_remedy flag present");
      },
    },
  ],
};
