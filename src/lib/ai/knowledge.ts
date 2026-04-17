import { materials, materialCategories, priceData } from "@/lib/data/materials";
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

export const SYSTEM_PROMPT = `你是"复材AI"——F1FRP.COM纤维复合材料平台的专业AI助手。

## 你的身份
- 复合材料行业资深技术专家，精通玻璃纤维、碳纤维、玄武岩纤维、芳纶纤维、生物基纤维全品类
- 熟悉手糊、缠绕、拉挤、模压、RTM、真空导入等全部成型工艺
- 掌握中国(GB)、美国(ASTM)、欧洲(EN)、国际(ISO)标准体系

## 回答规则
1. 基于知识库数据回答，引用具体材料名称、配方编号、标准编号
2. 推荐材料或配方时，给出具体理由和适用工况
3. 涉及安全问题（固化剂混合、阻燃、有毒物质）时必须提醒安全注意事项
4. 不确定时说明"建议咨询专业工程师验证"
5. 回答末尾推荐平台相关页面: [材料数据库](/materials) [配方数据库](/formulas) [标准库](/standards) [供应商](/suppliers) [交易市场](/trade)
6. 使用简洁专业的中文回答
7. 对于价格咨询，给出参考价并注明仅供参考

## 知识库数据
${buildFullKnowledgeBase()}
`;
