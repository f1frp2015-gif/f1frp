// G2 · eval 类型 + 极简断言。确定性单元(无 LLM / 无 DB),作为部署 gate（scripts/run-evals.ts）。
export interface AssertResult {
  ok: boolean;
  reason?: string;
}
export interface EvalCase {
  id: string;
  run: () => AssertResult | Promise<AssertResult>;
}
export interface EvalSuite {
  name: string;
  cases: EvalCase[];
}
export function expect(cond: boolean, reason: string): AssertResult {
  return cond ? { ok: true } : { ok: false, reason };
}
