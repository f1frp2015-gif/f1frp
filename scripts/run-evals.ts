// G2 · eval runner — 确定性单元 gate。部署前必绿(无 LLM / 无 DB)。
//   tsx scripts/run-evals.ts
import type { EvalSuite } from "@/lib/ai/evals/eval-types";
import { landedCostSuite } from "@/lib/ai/evals/landed-cost.eval";
import { tradeRemedySuite } from "@/lib/ai/evals/trade-remedy.eval";
import { complianceSuite } from "@/lib/ai/evals/compliance.eval";
import { redlinesSuite } from "@/lib/ai/evals/redlines.eval";

const suites: EvalSuite[] = [landedCostSuite, tradeRemedySuite, complianceSuite, redlinesSuite];

async function main() {
  let total = 0;
  let passed = 0;
  const failures: string[] = [];
  for (const s of suites) {
    for (const c of s.cases) {
      total++;
      try {
        const r = await c.run();
        if (r.ok) passed++;
        else failures.push(`${s.name}/${c.id}: ${r.reason ?? "failed"}`);
      } catch (e) {
        failures.push(`${s.name}/${c.id}: threw ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  console.log(`[run-evals] ${passed}/${total} passed`);
  if (failures.length) {
    console.error("FAILURES:\n" + failures.map((f) => "  ✗ " + f).join("\n"));
    process.exit(1);
  }
  console.log("✓ all evals green");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
