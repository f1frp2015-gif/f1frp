/**
 * AI 技能目录 —— 复材 AI 助手的 slash / 技能选项。
 *
 * 蒸馏自智慧芽 PatSnap Eureka 的「材料研发」与「研发与工程」Agent 体系,
 * 用 f1frp 自家六大库(材料/配方/标准/论文/专利/供应商)在复材域重新实例化。
 *
 * 落地方式:每个技能 = 一段结构化提示词模板。用户在空状态技能卡或输入框 "/"
 * slash 菜单里选中后,模板填入输入框,用户补全 【____】 占位后发送。后端 chat
 * 路由不变(RAG + 行内 [#N] 引用已现成)——技能的"方法论"内嵌在模板文本里。
 *
 * 纯数据模块(无 React),供服务端与客户端共用。
 */

export type SkillCategory = "materials" | "engineering";

export type Bilingual = { zh: string; en: string };

export type AiSkill = {
  id: string;
  category: SkillCategory;
  /** lucide 图标名(在 ai-client 里映射为组件) */
  icon: "flask" | "search" | "scale" | "wrench" | "layers" | "lightbulb" | "telescope" | "shield" | "pen";
  label: Bilingual;
  desc: Bilingual;
  /** 选中后填入输入框的结构化模板,含 【____】 占位 */
  template: Bilingual;
  /** slash 模糊匹配用的关键词(中英混合,空格分隔) */
  keywords: string;
};

export const SKILL_CATEGORIES: { id: SkillCategory; label: Bilingual }[] = [
  { id: "materials", label: { zh: "材料研发", en: "Materials R&D" } },
  { id: "engineering", label: { zh: "研发与工程", en: "R&D & Engineering" } },
];

export const AI_SKILLS: readonly AiSkill[] = [
  // ───────────── 材料研发 ─────────────
  {
    id: "formulation",
    category: "materials",
    icon: "flask",
    label: { zh: "选材配方", en: "Formulation" },
    desc: { zh: "按服役工况推荐树脂体系 + 增强材料 + 助剂", en: "Recommend resin + reinforcement + additives for a service case" },
    keywords: "formulation 配方 选材 树脂 resin 增强 additive",
    template: {
      zh: "【选材配方】请为以下工况推荐 FRP 配方:\n- 服役介质/浓度:【____】\n- 温度:【____】\n- 载荷/受力:【____】\n- 成型工艺(拉挤/缠绕/RTM/手糊/真空导入):【____】\n\n给出树脂体系 + 增强材料 + 主要助剂建议,逐项说明理由,并引用配方库/材料库。",
      en: "[Formulation] Recommend an FRP formulation for:\n- Service medium / concentration: 【____】\n- Temperature: 【____】\n- Load / stress: 【____】\n- Process (pultrusion / winding / RTM / hand layup / infusion): 【____】\n\nGive resin system + reinforcement + key additives with rationale for each, and cite the formula / material library.",
    },
  },
  {
    id: "spec-match",
    category: "materials",
    icon: "search",
    label: { zh: "性能反查选材", en: "Spec-to-Material" },
    desc: { zh: "给性能指标,反查匹配的材料 / 型材并排序", en: "Find & rank materials matching target properties" },
    keywords: "spec property pum 性能 反查 选材 指标 拉伸 模量 耐温 耐腐",
    template: {
      zh: "【性能反查】请反查满足以下性能的材料/型材,并按匹配度排序:\n- 拉伸强度/模量:【____】\n- 耐温:【____】\n- 耐腐蚀(介质):【____】\n- 阻燃等级:【____】\n- 其他(密度/绝缘/疲劳…):【____】\n\n逐条注明指标来源与不确定项,引用材料库。",
      en: "[Spec-to-Material] Find and rank materials / profiles meeting these targets:\n- Tensile strength / modulus: 【____】\n- Temperature rating: 【____】\n- Corrosion resistance (medium): 【____】\n- Flame rating: 【____】\n- Other (density / insulation / fatigue…): 【____】\n\nNote the source and uncertainty for each, cite the material library.",
    },
  },
  {
    id: "standards",
    category: "materials",
    icon: "scale",
    label: { zh: "标准对照解读", en: "Standards Mapping" },
    desc: { zh: "GB↔ASTM↔ISO↔EN 对照 + 章节解读", en: "Map GB↔ASTM↔ISO↔EN and interpret clauses" },
    keywords: "standard 标准 对照 gb astm iso en 解读 试验",
    template: {
      zh: "【标准对照】请对照解读标准:【____】(如 GB/T 1447)。\n- 给出对应的 ASTM / ISO / EN 等效标准\n- 关键试验方法与参数差异\n- 适用范围与注意事项\n\n明确引用标准号与章节,缺信息请提示查原文。",
      en: "[Standards Mapping] Interpret and cross-map standard: 【____】 (e.g. ASTM D3039).\n- Give equivalent GB / ISO / EN standards\n- Key test-method and parameter differences\n- Scope and caveats\n\nCite standard numbers and clauses; flag anything to verify in the original.",
    },
  },
  {
    id: "process-debug",
    category: "materials",
    icon: "wrench",
    label: { zh: "工艺与缺陷排查", en: "Process & Defect" },
    desc: { zh: "成型工艺参数 + 孔隙/分层/浸润缺陷诊断", en: "Diagnose voids / delamination / wet-out defects" },
    keywords: "process defect 工艺 缺陷 孔隙 分层 浸润 拉挤 rtm 导入 排查",
    template: {
      zh: "【工艺排查】成型工艺出问题,请帮我诊断:\n- 工艺:【____】(拉挤/缠绕/RTM/真空导入…)\n- 现象/缺陷:【____】(孔隙/分层/未浸润/翘曲…)\n- 现有参数(温度/速度/树脂黏度/固化制度):【____】\n\n给出可能原因(按概率排序)+ 排查步骤 + 参数调整建议,引用论文/配方库。",
      en: "[Process & Defect] Diagnose a manufacturing problem:\n- Process: 【____】 (pultrusion / winding / RTM / infusion…)\n- Symptom / defect: 【____】 (voids / delamination / dry spots / warpage…)\n- Current parameters (temp / speed / resin viscosity / cure): 【____】\n\nGive likely causes (ranked) + diagnostic steps + parameter fixes, cite papers / formula library.",
    },
  },
  {
    id: "application",
    category: "materials",
    icon: "layers",
    label: { zh: "应用场景选型", en: "Application Selection" },
    desc: { zh: "按行业场景给选材 + 型材 + 参考案例", en: "Material + profile + case picks for an industry use case" },
    keywords: "application 场景 选型 行业 风电 防腐 桥梁 轨交 案例",
    template: {
      zh: "【场景选型】为以下应用场景做 FRP 选型:\n- 行业/场景:【____】(风电/化工防腐/桥梁/轨交/建筑…)\n- 关键诉求:【____】(耐腐/轻量/绝缘/阻燃/成本…)\n- 约束(尺寸/批量/法规):【____】\n\n给出推荐材料 + 型材形式 + 典型工艺 + 参考案例,并引用。",
      en: "[Application Selection] Select FRP for this use case:\n- Industry / scenario: 【____】 (wind / chemical anti-corrosion / bridge / rail / construction…)\n- Key needs: 【____】 (corrosion / light weight / insulation / flame / cost…)\n- Constraints (size / volume / regulation): 【____】\n\nRecommend material + profile form + typical process + reference cases, with citations.",
    },
  },
  // ───────────── 研发与工程 ─────────────
  {
    id: "triz",
    category: "engineering",
    icon: "lightbulb",
    label: { zh: "技术方案探索 · TRIZ", en: "Solution Explorer · TRIZ" },
    desc: { zh: "功能分析 + 因果链 → 可评估的工程方案", en: "Functional + causal-chain analysis → evaluable solutions" },
    keywords: "triz 方案 探索 创新 矛盾 发明原理 solution",
    template: {
      zh: "【TRIZ 解题】用 TRIZ 思路解决工程难题:\n- 问题描述:【____】\n- 现有方案与矛盾(改善什么/恶化什么):【____】\n\n请按 ① 功能分析 ② 因果链 ③ 矛盾矩阵/发明原理 ④ 候选方案(可评估、可落地) 的结构输出,关键判断引用 RAG 结果。",
      en: "[TRIZ] Solve an engineering problem with TRIZ:\n- Problem: 【____】\n- Current approach & contradiction (what improves / what worsens): 【____】\n\nStructure the answer as ① functional analysis ② causal chain ③ contradiction matrix / inventive principles ④ candidate solutions (evaluable, shippable), citing RAG results for key claims.",
    },
  },
  {
    id: "deep-research",
    category: "engineering",
    icon: "telescope",
    label: { zh: "深度技术调研", en: "Deep Research" },
    desc: { zh: "论文/专利/标准/联网多源综合,出带引用报告", en: "Multi-source synthesis with a cited report" },
    keywords: "deep research 调研 综述 综合 趋势 报告 literature",
    template: {
      zh: "【深度调研】围绕主题做多源综合调研:【____】\n\n请整合论文库 / 专利库 / 标准库(必要时联网),输出:研究现状 → 关键技术路线 → 代表性成果 → 趋势与空白。每条结论附 [#N] 引用,区分「库内有据」与「通用知识」。",
      en: "[Deep Research] Synthesize multi-source research on: 【____】\n\nIntegrate the paper / patent / standard libraries (and web if needed), output: state of the art → key technical routes → representative results → trends & gaps. Cite [#N] for each claim; separate 'grounded in library' from 'general knowledge'.",
    },
  },
  {
    id: "patent-intel",
    category: "engineering",
    icon: "shield",
    label: { zh: "专利情报", en: "Patent Intel" },
    desc: { zh: "专利检索 + 解读 + 演进 / 规避设计提示", en: "Patent search + read + evolution / design-around" },
    keywords: "patent 专利 情报 检索 规避 演进 申请人 ip",
    template: {
      zh: "【专利情报】检索并解读相关专利:【____】(技术主题/关键词)\n\n输出:核心专利清单 → 技术演进脉络 → 主要申请人 → 规避设计 / 可借鉴点。引用专利号,不编造。",
      en: "[Patent Intel] Search and interpret patents on: 【____】 (topic / keywords)\n\nOutput: core patent list → technical evolution → key assignees → design-around / takeaways. Cite patent numbers, no fabrication.",
    },
  },
  {
    id: "tech-writeup",
    category: "engineering",
    icon: "pen",
    label: { zh: "技术披露 · 方案撰写", en: "Tech Write-up" },
    desc: { zh: "把想法整理成结构化技术方案 / 披露草稿", en: "Turn an idea into a structured tech disclosure draft" },
    keywords: "writeup disclosure 披露 撰写 方案 立项 实施例",
    template: {
      zh: "【方案撰写】把我的想法整理成结构化技术方案草稿:\n- 想法/创新点:【____】\n- 应用背景:【____】\n\n请输出:技术问题 → 技术方案(结构/配方/工艺)→ 有益效果 → 实施例要点。语言可直接用于技术披露 / 立项。",
      en: "[Tech Write-up] Turn my idea into a structured technical proposal draft:\n- Idea / novelty: 【____】\n- Application background: 【____】\n\nOutput: technical problem → technical solution (structure / formula / process) → advantages → embodiment highlights. Wording usable for a disclosure / project proposal.",
    },
  },
] as const;

/** slash 菜单按关键词过滤(匹配 label/desc/keywords,大小写不敏感) */
export function filterSkills(rawQuery: string, locale: "zh" | "en"): AiSkill[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [...AI_SKILLS];
  return AI_SKILLS.filter((s) =>
    `${s.label[locale]} ${s.label.zh} ${s.label.en} ${s.desc[locale]} ${s.keywords} ${s.id}`
      .toLowerCase()
      .includes(q),
  );
}
