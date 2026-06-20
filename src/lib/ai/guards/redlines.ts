// G2 · 红线质检 harness — 对 agent 最终输出做确定性 lint。
//
// 在"少人 + 深度 AI 协同"的公司里,真正能降编制的不是某个功能,而是**让 agent 输出可信到
// 不需要人逐条复核**的那一层。本模块对一个回合的"最终文本 + 调过的工具名"做高精度红线检查,
// 把"载荷性有毒输出"挡在"承诺 / 成单"之前。
//
// v1 = 回合结束 lint(不在流式中途硬拦,流式难中断)。chat route 在 streamText.onFinish 调用,
// 把违规写服务端日志;高危(force-handoff/block)用于后续转人工。低误报优先:只做 3 条高精度规则。
//
// 已落地(本模块):
//   RL-RATE       文本断言关税/AD-CVD 税率%,但本回合未调 landed_cost_usd / compliance_flags → 未 grounded
//   RL-COMMIT     文本含承诺语(锁价/保证交期/确认下单),但未调 create_sourcing_brief → 应转人工
//   RL-CONFORMITY 文本下"符合/满足标准"的一致性结论,但未调 feasibility_match → 未 grounded
// 暂未在此实现(说明缘由):
//   RL-STD(不臆造标准)  v2 —— 直接按 crosswalk 允许集校验会误伤大量合法但未编入的标准(ISO 9001 等)。
//   RL-EGRESS(数据出境) 由 provider.ts 的 host 路由在上游强制保证(国内 host 永不路由 Google),此处不重复。

export type RedlineSeverity = "warn" | "force-handoff" | "block";

export interface RedlineViolation {
  rule: "RL-RATE" | "RL-COMMIT" | "RL-CONFORMITY";
  severity: RedlineSeverity;
  detail: string;
}

export interface GuardContext {
  /** 部署侧 host(保留给 RL-EGRESS 的上游约束语义,本模块不直接用)。 */
  host?: string | null;
  /** 本回合最终文本(streamText onFinish 的 text)。 */
  finalText: string;
  /** 本回合调用过的工具名(从 steps[].toolCalls[].toolName 聚合)。 */
  toolNames: string[];
}

export interface GuardResult {
  passed: boolean;
  violations: RedlineViolation[];
}

// 任意百分数(税率形态)。
const RATE_RE = /\d{1,3}(\.\d+)?\s*%/;
// 关税/贸易救济语境(出现 % 时才算载荷性税率断言)。
const DUTY_CTX_RE =
  /tariff|duties?|anti-?dumping|countervail|ad\/?cvd|section\s*301|landed|关税|反倾销|反补贴|落地价|到岸/i;
// 承诺语(锁价 / 保证 / 确认下单 / 担保交付)。CJK 段不用 \b(对 CJK 无效)。
const COMMIT_RE =
  /(we\s+(guarantee|commit|promise)|guaranteed?\b|confirm(ed)?\s+(the\s+)?order|lock\s+in\s+(the\s+)?price|锁价|保证(交期|质量|交付)|确认下单|我们(承诺|保证))/i;
// 一致性结论(符合/满足/通过 + 标准体)。
const CONFORMITY_RE =
  /(meets?|complies?\s+with|conforms?\s+to|passes?\b|符合|满足|通过)[^.。!！\n]{0,40}(ASTM|EN\s|ISO|GB|AASHTO|standard|标准|spec\b|验收)/i;

export function applyRedlines(ctx: GuardContext): GuardResult {
  const t = ctx.finalText ?? "";
  const tn = new Set(ctx.toolNames ?? []);
  const v: RedlineViolation[] = [];

  if (RATE_RE.test(t) && DUTY_CTX_RE.test(t) && !tn.has("landed_cost_usd") && !tn.has("compliance_flags")) {
    v.push({
      rule: "RL-RATE",
      severity: "warn",
      detail: "duty / AD-CVD percentage asserted without landed_cost_usd or compliance_flags grounding",
    });
  }

  if (COMMIT_RE.test(t) && !tn.has("create_sourcing_brief")) {
    v.push({
      rule: "RL-COMMIT",
      severity: "force-handoff",
      detail: "commitment language without create_sourcing_brief — must hand off to a human before committing",
    });
  }

  if (CONFORMITY_RE.test(t) && !tn.has("feasibility_match")) {
    v.push({
      rule: "RL-CONFORMITY",
      severity: "warn",
      detail: "conformity verdict (meets/符合 standard) without feasibility_match grounding",
    });
  }

  return { passed: v.length === 0, violations: v };
}
