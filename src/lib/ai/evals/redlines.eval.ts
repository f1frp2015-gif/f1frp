import { applyRedlines } from "@/lib/ai/guards/redlines";
import { expect, type EvalSuite } from "./eval-types";

export const redlinesSuite: EvalSuite = {
  name: "redlines",
  cases: [
    {
      id: "rate-without-tool-flags",
      run: () => {
        const g = applyRedlines({
          finalText: "The US import duty is about 6.5%, so the landed cost is roughly $5/kg.",
          toolNames: [],
        });
        return expect(g.violations.some((v) => v.rule === "RL-RATE"), "rate without tool should flag RL-RATE");
      },
    },
    {
      id: "rate-with-tool-passes",
      run: () => {
        const g = applyRedlines({
          finalText: "Per the landed-cost tool, duty is ~6.5% and DDP is about $5/kg.",
          toolNames: ["landed_cost_usd"],
        });
        return expect(
          !g.violations.some((v) => v.rule === "RL-RATE"),
          "rate WITH landed_cost_usd should NOT flag RL-RATE",
        );
      },
    },
    {
      id: "commit-without-brief-force-handoff",
      run: () => {
        const g = applyRedlines({
          finalText: "We guarantee delivery in 30 days and confirm the order today.",
          toolNames: [],
        });
        return expect(
          g.violations.some((v) => v.rule === "RL-COMMIT" && v.severity === "force-handoff"),
          "commitment without create_sourcing_brief should force handoff",
        );
      },
    },
    {
      id: "conformity-without-feasibility-flags",
      run: () => {
        const g = applyRedlines({
          finalText: "Yes, this profile meets ASTM D3039 and passes your spec.",
          toolNames: [],
        });
        return expect(
          g.violations.some((v) => v.rule === "RL-CONFORMITY"),
          "conformity verdict without feasibility_match should flag",
        );
      },
    },
    {
      id: "clean-text-passes",
      run: () => {
        const g = applyRedlines({
          finalText: "Share your spec and destination and I'll check what Chinese factories can do.",
          toolNames: [],
        });
        return expect(g.passed, "clean text should pass with no violations");
      },
    },
  ],
};
