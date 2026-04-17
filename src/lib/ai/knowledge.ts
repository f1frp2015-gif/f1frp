import { materials, materialCategories, priceData } from "@/lib/data/materials";
import {
  FIBER_KNOWLEDGE,
  TROUBLESHOOTING,
  APPLICATION_GUIDES,
  COST_COMPARISON,
  SAFETY_KNOWLEDGE,
} from "./knowledge-extended";
import { formulas } from "@/lib/data/formulas";
import { standards } from "@/lib/data/standards";
import { suppliers } from "@/lib/data/suppliers";
import { processes } from "@/lib/data/tech";
import { newsList } from "@/lib/data/news";

function buildMaterialsContext(): string {
  const cats = materialCategories.map((c) => `${c.name}(${c.count}种)`).join("、");
  const list = materials
    .map(
      (m) =>
        `- ${m.name}(${m.nameEn}): 品牌${m.brand}, 型号${m.model}, 分类${m.subCategory}, 密度${m.properties.density || "-"}, 拉伸强度${m.properties.tensileStrength || "-"}, 弯曲强度${m.properties.flexuralStrength || "-"}, 应用:${m.applications.join("/")}`
    )
    .join("\n");
  const prices = priceData
    .map((p) => `- ${p.name}: ¥${p.price}${p.unit}, ${p.change > 0 ? "↑" : p.change < 0 ? "↓" : "→"}${Math.abs(p.change)}%, ${p.region}`)
    .join("\n");
  return `## 材料数据库\n分类: ${cats}\n\n### 材料列表\n${list}\n\n### 今日价格行情\n${prices}`;
}

function buildFormulasContext(): string {
  return (
    "## 配方数据库\n" +
    formulas
      .map(
        (f) =>
          `### ${f.name}\n工艺:${f.process} | 难度:${f.difficulty} | 应用:${f.application}\n` +
          `树脂体系: ${f.resinSystem.map((r) => `${r.name}(${r.role},${r.amount})`).join("; ")}\n` +
          `增强材料: ${f.reinforcement.map((r) => `${r.name}(${r.role},${r.amount})`).join("; ")}\n` +
          `辅助材料: ${f.auxiliaries.map((a) => `${a.name}(${a.role},${a.amount})`).join("; ")}\n` +
          `工艺参数: ${f.processing.map((p) => `${p.name}:${p.value}`).join("; ")}\n` +
          `预期性能: ${f.properties.map((p) => `${p.name}:${p.value}`).join("; ")}\n` +
          `要点: ${f.tips.join("; ")}`
      )
      .join("\n\n")
  );
}

function buildStandardsContext(): string {
  const cn = standards.filter((s) => s.countryCode === "CN");
  const intl = standards.filter((s) => s.countryCode !== "CN");
  return (
    "## 标准数据库\n### 中国标准\n" +
    cn.map((s) => `- ${s.code}: ${s.title}`).join("\n") +
    "\n### 国际标准(ISO/ASTM/EN/DIN)\n" +
    intl.map((s) => `- ${s.code}: ${s.title}${s.titleEn ? ` (${s.titleEn})` : ""}`).join("\n")
  );
}

function buildSuppliersContext(): string {
  return (
    "## 供应商目录\n" +
    suppliers
      .map(
        (s) =>
          `- ${s.name}: ${s.location}, 类型${s.category}, 产品:${s.products.join("/")}, 工艺:${s.processes.join("/") || "N/A"}, 认证:${s.certifications.join("/")}, ${s.description}`
      )
      .join("\n")
  );
}

function buildProcessesContext(): string {
  return (
    "## 工艺百科(7大成型工艺)\n" +
    processes
      .map(
        (p) =>
          `### ${p.name}(${p.nameEn})\n${p.description}\n优势:${p.advantages.join("; ")}\n局限:${p.disadvantages.join("; ")}\n应用:${p.applications.join("; ")}\n关键参数:${p.keyParameters.join("; ")}`
      )
      .join("\n\n")
  );
}

export function buildFullKnowledgeBase(): string {
  return [
    buildMaterialsContext(),
    buildFormulasContext(),
    buildStandardsContext(),
    buildSuppliersContext(),
    buildProcessesContext(),
  ].join("\n\n---\n\n");
}

export const SYSTEM_PROMPT = `你是"复材AI"——F1FRP.COM纤维复合材料平台的专业AI助手。你拥有复合材料行业20年经验，是业内公认的技术权威。

## 你的能力范围
1. **选材推荐**: 根据工况(介质/温度/载荷/环境)推荐最优纤维+树脂+辅材组合
2. **配方设计**: 给出完整的配方方案，包括每种组分的用量、角色和注意事项
3. **工艺指导**: 诊断工艺问题，给出具体解决方案和参数调整建议
4. **标准查询**: 查找适用的中国/国际标准，给出标准对照关系
5. **价格咨询**: 提供市场参考价格和趋势分析（注明仅供参考）
6. **供应商匹配**: 根据需求推荐合适的供应商

## 回答规则
1. 引用具体数据：材料牌号、配方配比、标准编号、价格区间
2. 推荐时给出对比：至少2个方案，说明各自优劣和适用场景
3. 安全问题零容忍：涉及固化剂混合、有毒物质、阻燃等必须给安全警告
4. 诚实边界：不确定时明确说明"建议咨询专业工程师"
5. 推荐平台页面（用markdown链接）：[材料数据库](/materials) [配方数据库](/formulas) [标准库](/standards) [供应商](/suppliers) [交易市场](/trade) [工艺百科](/tech) [计算器](/tech/calculator)
6. 简洁专业，用列表和表格组织复杂信息
7. 价格数据注明"参考价，实际以供应商报价为准"

## 知识库

${FIBER_KNOWLEDGE}

---

${buildFullKnowledgeBase()}

---

${TROUBLESHOOTING}

---

${APPLICATION_GUIDES}

---

${COST_COMPARISON}

---

${SAFETY_KNOWLEDGE}
`;
