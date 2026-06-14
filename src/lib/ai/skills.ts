/**
 * AI 技能目录 —— 复材 AI 助手的 slash / 技能选项。
 *
 * f1frp 自有技能集,围绕本站六大库(材料/配方/标准/论文/专利/供应商)+ 工程核算
 * 工具 + 供应商询盘闭环构建。每个技能 = 一段结构化提示词模板:用户在空状态技能卡
 * 或输入框 "/" slash 菜单选中后,模板填入输入框,补全 【____】 占位再发送。后端
 * chat 路由不变(RAG + 行内 [#N] 引用 + window_u_value 等工具已现成)。
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
  { id: "materials", label: { zh: "选材与配方", en: "Selection & Formulation" } },
  { id: "engineering", label: { zh: "工程与供应", en: "Engineering & Sourcing" } },
];

export const AI_SKILLS: readonly AiSkill[] = [
  // ───────────── 选材与配方 ─────────────
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
    keywords: "spec property 性能 反查 选材 指标 拉伸 模量 耐温 耐腐",
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
  // ───────────── 工程与供应 ─────────────
  {
    id: "eng-calc",
    category: "engineering",
    icon: "scale",
    label: { zh: "工程核算", en: "Engineering Calc" },
    desc: { zh: "型材选型 / 挠度校核 / 钢铝替代 / 门窗U值", en: "Profile sizing / deflection / steel-alu replacement / window U-value" },
    keywords: "calc 核算 计算 挠度 校核 选型 替代 钢 铝 u值 传热 门窗",
    template: {
      zh: "【工程核算】帮我做一项复材工程核算:\n- 核算类型:【____】(型材选型 / 梁挠度校核 / 等强度替代钢或铝 / 门窗整窗U值…)\n- 输入条件:【____】(截面 / 跨距 / 载荷 / 许用挠度,或 门窗系列 / 玻璃配置 / 开启方式…)\n\n给出计算过程与结论,注明所依据的标准(如 EN 13706、GB/T 31539、JG/T 571 附录C),并提示可用站内计算器复核。",
      en: "[Engineering Calc] Run a composites engineering calculation:\n- Type: 【____】 (profile sizing / beam deflection check / equal-strength replacement of steel or aluminium / whole-window U-value…)\n- Inputs: 【____】 (section / span / load / allowable deflection, or window series / glass build / opening type…)\n\nShow the working and the result, cite the governing standard (e.g. EN 13706, GB/T 31539, JG/T 571 App. C), and point to the on-site calculator for verification.",
    },
  },
  {
    id: "supplier-rfq",
    category: "engineering",
    icon: "search",
    label: { zh: "供应商匹配与询盘", en: "Supplier Match & RFQ" },
    desc: { zh: "按需求从供应商库匹配厂家 + 整理询盘要点", en: "Match suppliers from the directory + draft an RFQ" },
    keywords: "supplier rfq 供应商 匹配 厂家 询盘 采购 quote sourcing",
    template: {
      zh: "【供应商匹配】按需求匹配复材供应商并准备询盘:\n- 产品 / 工艺:【____】(如 拉挤型材 / 格栅 / 缠绕管…)\n- 规格 / 数量:【____】\n- 目标市场 / 认证要求:【____】\n\n从供应商库筛选匹配厂家(按品类 / 规模 / 认证),逐家给出匹配理由,并整理成一份可直接发送的询盘要点清单。",
      en: "[Supplier Match] Match composites suppliers and prep an RFQ:\n- Product / process: 【____】 (e.g. pultruded profile / grating / wound pipe…)\n- Spec / quantity: 【____】\n- Target market / certifications: 【____】\n\nFilter the supplier directory by category / scale / certification, give the match rationale per supplier, and compile a ready-to-send RFQ checklist.",
    },
  },
  {
    id: "research",
    category: "engineering",
    icon: "telescope",
    label: { zh: "资料调研", en: "Research Digest" },
    desc: { zh: "论文/标准/行业资料多源综合,出带引用的小结", en: "Multi-source synthesis with a cited digest" },
    keywords: "research 调研 综述 综合 趋势 literature 资料 报告",
    template: {
      zh: "【资料调研】围绕主题做多源资料综合:【____】\n\n整合论文库 / 标准库 / 行业资料(必要时联网),输出:研究现状 → 主流技术路线 → 代表性数据或案例 → 趋势与待解问题。每条结论附 [#N] 引用,区分「库内有据」与「通用知识」。",
      en: "[Research Digest] Synthesize multi-source material on: 【____】\n\nIntegrate the paper / standard libraries and industry sources (web if needed), output: state of the art → mainstream technical routes → representative data or cases → trends & open questions. Cite [#N] per claim; separate 'grounded in library' from 'general knowledge'.",
    },
  },
  {
    id: "patent-paper",
    category: "engineering",
    icon: "shield",
    label: { zh: "专利与论文检索", en: "Patent & Paper Lookup" },
    desc: { zh: "从专利/论文库检索解读 + 可借鉴技术要点", en: "Search the patent / paper libraries + extract takeaways" },
    keywords: "patent paper 专利 论文 文献 检索 doi 技术要点",
    template: {
      zh: "【专利与论文】从专利库 / 论文库检索并解读:【____】(技术主题 / 关键词)\n\n输出:相关专利与论文清单 → 技术发展脉络 → 主要来源 / 申请人 → 可借鉴的技术要点。引用专利号 / DOI,不编造。",
      en: "[Patent & Paper] Search and interpret the patent / paper libraries on: 【____】 (topic / keywords)\n\nOutput: relevant patents & papers → technical evolution → key sources / assignees → takeaways worth adopting. Cite patent numbers / DOIs, no fabrication.",
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
