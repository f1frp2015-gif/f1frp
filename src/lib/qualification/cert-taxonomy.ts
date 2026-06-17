/**
 * 复材行业「资质 / 认证 / 标准」受控词表(controlled vocabulary)。
 *
 * 这是整套「供应商资质上传 → AI 结构化 → 自动打标」体系的**真相源之一**:
 * 它只回答一个问题 ——「世界上存在哪些 tag」。封闭、人工治理、版本化。
 *
 * 三层分离(勿混淆):
 *   1. 受控词表(本文件)        —— 存在哪些 tag。封闭枚举。
 *   2. 标签实例(supplier_document_tags 表) —— 某供应商「声称」拥有某 tag,带来源/信任/有效期。
 *   3. 信任分(实例上的 trust)   —— 这个声称有多可信(取决于怎么验来的,不取决于 tag 本身)。
 *
 * 硬规则:**AI 永远不能发明新 tag**。它只能 ① 抽原文字段,② 从我们喂给它的
 * 封闭枚举(facetEnum())里「提议」。最终落哪个 canonical id 由确定性映射层
 * (见 map-tags.ts,基于本文件的 aliases)裁决;匹配不上的进「待治理」队列。
 *
 * 纯数据模块:无 React / 无 Next.js API / 零外部依赖。供上传、抽取、映射、前端筛选共用。
 *
 * 与 enterprise/doc-schema.ts 的关系:doc-schema 描述「从一份文档抽出哪些原文字段」
 * (CertSchema.certType / scope 等);本文件描述「那些原文该归到哪个 canonical tag」。
 */

// ─────────────────────────────────────────────────────────────────────────────
// 类型
// ─────────────────────────────────────────────────────────────────────────────

/** 标签维度(命名空间前缀)。所有 canonical id 形如 `${facet}:${slug}`。 */
export type Facet =
  | "cert" // 管理体系 / 产品认证(ISO、CE、DNV、UL…)
  | "std" // 产品 / 测试标准(EN 13706、ASTM、GB/T…)
  | "cat" // 产品品类(拉挤型材、格栅、筋材…)
  | "mat" // 材料 / 树脂体系(玻纤、乙烯基酯…)
  | "process" // 成型工艺(拉挤、缠绕…)
  | "prop" // 关键性能 claim(阻燃、耐腐蚀…;信任权重低)
  | "industry" // 应用行业(水处理、油气…)
  | "region"; // 产地(从营业执照地址派生)

/** 信任分:这个标签实例有多可信。取决于来源,不取决于 tag 本身。 */
export type TrustLevel = 0 | 1 | 2 | 3;

export const TRUST_LABELS: Record<TrustLevel, { zh: string; en: string }> = {
  3: { zh: "已审核", en: "Reviewed" }, // 人工后台批准
  2: { zh: "可查验", en: "Verifiable" }, // 有证书号 + 机构可识别(+ 可选官网查验)
  1: { zh: "有凭证", en: "Documented" }, // 从上传的证书/检测报告抽出
  0: { zh: "自述", en: "Self-declared" }, // 从产品手册/自填抽出,无独立凭证
};

export interface TagDef {
  /** 稳定 canonical id,如 "cert:iso9001"。一旦发布不可改(改了等于换标签)。 */
  id: string;
  facet: Facet;
  label: { zh: string; en: string };
  /**
   * 确定性映射用的别名。归一化(normalize)后命中即判定。
   * 应覆盖:中文名、英文名、纯编号、常见 OCR / 书写变体、旧标准号。
   */
  aliases: string[];
  /** 发证 / 标准机构(cert、std)。 */
  issuer?: string;
  /** 官网查验链接模板,{certNo} 占位。命中且有 certNo → 可抬 trust 到 T2 并在 UI 给「查验」。 */
  verifyUrlPattern?: string;
  /** 是否带有效期(体系认证一般 3 年)。驱动到期监控与展示置灰。 */
  hasExpiry?: boolean;
  /** 备注:适用范围 / 歧义提示,仅供人工治理参考。 */
  note?: string;
}

/** facet 的展示元数据:顺序 + 中英标题 + UI 配色 tone(Tailwind 类片段)。 */
export const FACET_META: Record<
  Facet,
  { order: number; label: { zh: string; en: string }; tone: string }
> = {
  cert: { order: 1, label: { zh: "认证", en: "Certifications" }, tone: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  std: { order: 2, label: { zh: "标准", en: "Standards" }, tone: "border-sky-300 text-sky-700 bg-sky-50" },
  cat: { order: 3, label: { zh: "品类", en: "Categories" }, tone: "border-zinc-300 text-zinc-700 bg-zinc-50" },
  mat: { order: 4, label: { zh: "材料", en: "Materials" }, tone: "border-violet-300 text-violet-700 bg-violet-50" },
  process: { order: 5, label: { zh: "工艺", en: "Processes" }, tone: "border-amber-300 text-amber-700 bg-amber-50" },
  prop: { order: 6, label: { zh: "性能", en: "Properties" }, tone: "border-rose-300 text-rose-700 bg-rose-50" },
  industry: { order: 7, label: { zh: "应用行业", en: "Industries" }, tone: "border-teal-300 text-teal-700 bg-teal-50" },
  region: { order: 8, label: { zh: "产地", en: "Region" }, tone: "border-slate-300 text-slate-600 bg-slate-50" },
};

// ─────────────────────────────────────────────────────────────────────────────
// 受控词表本体
//   扩展须知:① id 永不复用/不改;② aliases 宁多勿少(覆盖 OCR 变体);
//   ③ 新 facet 项加进来后,FACET_META 已含该 facet 即可,无需改别处。
// ─────────────────────────────────────────────────────────────────────────────

export const TAGS: TagDef[] = [
  // ═══════════════════════ cert — 管理体系 / 产品认证 ═══════════════════════
  {
    id: "cert:iso9001",
    facet: "cert",
    hasExpiry: true,
    label: { zh: "ISO 9001 质量管理体系", en: "ISO 9001 QMS" },
    aliases: ["iso9001", "iso 9001", "9001", "质量管理体系认证", "质量管理体系", "quality management system", "qms"],
  },
  {
    id: "cert:iso14001",
    facet: "cert",
    hasExpiry: true,
    label: { zh: "ISO 14001 环境管理体系", en: "ISO 14001 EMS" },
    aliases: ["iso14001", "iso 14001", "14001", "环境管理体系认证", "环境管理体系", "environmental management system"],
  },
  {
    id: "cert:iso45001",
    facet: "cert",
    hasExpiry: true,
    label: { zh: "ISO 45001 职业健康安全", en: "ISO 45001 OH&S" },
    aliases: ["iso45001", "iso 45001", "45001", "ohsas18001", "ohsas 18001", "18001", "职业健康安全管理体系", "职业健康安全"],
  },
  {
    id: "cert:iatf16949",
    facet: "cert",
    hasExpiry: true,
    label: { zh: "IATF 16949 汽车质量体系", en: "IATF 16949" },
    aliases: ["iatf16949", "iatf 16949", "16949", "ts16949", "ts 16949", "汽车质量管理体系", "汽车行业质量"],
  },
  {
    id: "cert:iso50001",
    facet: "cert",
    hasExpiry: true,
    label: { zh: "ISO 50001 能源管理体系", en: "ISO 50001 EnMS" },
    aliases: ["iso50001", "iso 50001", "50001", "能源管理体系"],
  },
  {
    id: "cert:ce",
    facet: "cert",
    issuer: "EU Notified Body",
    label: { zh: "CE 认证", en: "CE Marking" },
    aliases: ["ce", "ce认证", "ce marking", "ce mark", "ce-kennzeichnung", "符合性声明 ce", "doc ce"],
    note: "复材结构件多走 EN 13706 + CPR(建材法规)路径;留意是自我声明还是公告机构出证。",
  },
  {
    id: "cert:ukca",
    facet: "cert",
    label: { zh: "UKCA 认证", en: "UKCA Marking" },
    aliases: ["ukca", "ukca marking", "ukca mark"],
  },
  {
    id: "cert:dnv",
    facet: "cert",
    hasExpiry: true,
    issuer: "DNV",
    label: { zh: "DNV 型式认可", en: "DNV Type Approval" },
    aliases: ["dnv", "dnv-gl", "dnvgl", "dnv gl", "det norske veritas", "挪威船级社", "type approval dnv"],
  },
  {
    id: "cert:abs",
    facet: "cert",
    hasExpiry: true,
    issuer: "ABS",
    label: { zh: "ABS 美国船级社", en: "ABS Type Approval" },
    aliases: ["abs", "abs type approval", "美国船级社", "american bureau of shipping"],
  },
  {
    id: "cert:lr",
    facet: "cert",
    hasExpiry: true,
    issuer: "Lloyd's Register",
    label: { zh: "LR 英国劳氏", en: "Lloyd's Register" },
    aliases: ["lloyd's register", "lloyds register", "lr type approval", "英国劳氏", "劳氏船级社"],
  },
  {
    id: "cert:bv",
    facet: "cert",
    hasExpiry: true,
    issuer: "Bureau Veritas",
    label: { zh: "BV 法国船级社", en: "Bureau Veritas" },
    aliases: ["bureau veritas", "bv type approval", "法国船级社", "必维"],
  },
  {
    id: "cert:tuv",
    facet: "cert",
    issuer: "TÜV",
    label: { zh: "TÜV 认证", en: "TÜV Certified" },
    aliases: ["tuv", "tüv", "tuv rheinland", "tuv sud", "tüv süd", "莱茵", "南德"],
  },
  {
    id: "cert:ul",
    facet: "cert",
    issuer: "UL Solutions",
    label: { zh: "UL 认证", en: "UL Listed / Certified" },
    verifyUrlPattern: "https://productiq.ulprospector.com/en?q={certNo}",
    aliases: ["ul", "ul listed", "ul certified", "ul认证", "ul listing", "underwriters laboratories", "ul file"],
  },
  {
    id: "cert:fm",
    facet: "cert",
    issuer: "FM Approvals",
    label: { zh: "FM 认可", en: "FM Approved" },
    aliases: ["fm approved", "fm approvals", "fm global", "factory mutual"],
    note: "电缆桥架 / 格栅在北美工业项目常被要求。",
  },
  {
    id: "cert:intertek",
    facet: "cert",
    issuer: "Intertek",
    label: { zh: "Intertek / ETL", en: "Intertek / ETL" },
    aliases: ["intertek", "etl", "etl listed", "天祥"],
  },
  {
    id: "cert:sgs-tested",
    facet: "cert",
    issuer: "SGS",
    label: { zh: "SGS 检测", en: "SGS Tested" },
    aliases: ["sgs", "sgs report", "sgs检测", "sgs报告", "sgs test report"],
    note: "第三方检测≠体系认证;trust 不应等同 ISO 体系证书。",
  },
  {
    id: "cert:cnas-lab",
    facet: "cert",
    issuer: "CNAS",
    label: { zh: "CNAS 实验室认可", en: "CNAS Accredited Lab" },
    aliases: ["cnas", "中国合格评定国家认可委员会", "实验室认可", "cnas accredited"],
  },
  {
    id: "cert:cma",
    facet: "cert",
    issuer: "CMA",
    label: { zh: "CMA 检验检测", en: "CMA (China)" },
    aliases: ["cma", "检验检测机构资质认定", "计量认证"],
  },
  {
    id: "cert:ccc",
    facet: "cert",
    label: { zh: "CCC 强制认证", en: "China CCC" },
    aliases: ["ccc", "3c", "3c认证", "中国强制性产品认证", "china compulsory"],
  },
  {
    id: "cert:reach",
    facet: "cert",
    label: { zh: "REACH 合规", en: "REACH Compliant" },
    aliases: ["reach", "reach compliant", "reach 合规", "svhc"],
  },
  {
    id: "cert:rohs",
    facet: "cert",
    label: { zh: "RoHS 合规", en: "RoHS Compliant" },
    aliases: ["rohs", "rohs compliant", "rohs 合规"],
  },
  {
    id: "cert:nsf61",
    facet: "cert",
    issuer: "NSF",
    label: { zh: "NSF/ANSI 61 饮用水", en: "NSF/ANSI 61" },
    aliases: ["nsf", "nsf61", "nsf/ansi 61", "ansi 61", "nsf 饮用水", "drinking water"],
    note: "给水 / 水处理行业 FRP 管罐进北美市场关键。",
  },
  {
    id: "cert:wras",
    facet: "cert",
    label: { zh: "WRAS 英国水标", en: "WRAS (UK Water)" },
    aliases: ["wras", "wras approved", "英国水"],
  },
  {
    id: "cert:fda",
    facet: "cert",
    label: { zh: "FDA 食品接触", en: "FDA Food Contact" },
    aliases: ["fda", "fda food", "食品级 fda", "food contact"],
  },

  // ═══════════════════════ std — 产品 / 测试标准 ═══════════════════════
  // ── 欧标:拉挤复材结构 / 管罐 ──
  {
    id: "std:en13706",
    facet: "std",
    issuer: "CEN",
    label: { zh: "EN 13706 拉挤型材结构规范", en: "EN 13706 Pultruded Profiles" },
    aliases: ["en13706", "en 13706", "en13706-3", "en 13706-3", "拉挤型材规范", "pultruded profiles", "e17", "e23"],
    note: "拉挤结构型材的核心欧标,分 E17 / E23 等级。",
  },
  {
    id: "std:en13121",
    facet: "std",
    issuer: "CEN",
    label: { zh: "EN 13121 GRP 储罐与容器", en: "EN 13121 GRP Tanks" },
    aliases: ["en13121", "en 13121", "grp tanks", "grp 储罐"],
  },
  {
    id: "std:iso14692",
    facet: "std",
    issuer: "ISO",
    label: { zh: "ISO 14692 GRP 油气管道", en: "ISO 14692 GRP Piping" },
    aliases: ["iso14692", "iso 14692", "14692", "grp piping", "grp 管道", "gre piping"],
    note: "油气行业 GRE / GRP 管线核心标准。",
  },
  {
    id: "std:en45545",
    facet: "std",
    issuer: "CEN",
    label: { zh: "EN 45545 轨道车辆防火", en: "EN 45545 Rail Fire" },
    aliases: ["en45545", "en 45545", "45545", "轨道交通防火", "railway fire"],
  },
  // ── ISO 力学测试 ──
  {
    id: "std:iso527",
    facet: "std",
    issuer: "ISO",
    label: { zh: "ISO 527 拉伸性能", en: "ISO 527 Tensile" },
    aliases: ["iso527", "iso 527", "527", "iso527-4", "iso527-5"],
  },
  {
    id: "std:iso14125",
    facet: "std",
    issuer: "ISO",
    label: { zh: "ISO 14125 弯曲性能", en: "ISO 14125 Flexural" },
    aliases: ["iso14125", "iso 14125", "14125"],
  },
  {
    id: "std:iso14130",
    facet: "std",
    issuer: "ISO",
    label: { zh: "ISO 14130 层间剪切 (ILSS)", en: "ISO 14130 ILSS" },
    aliases: ["iso14130", "iso 14130", "14130", "ilss", "短梁剪切"],
  },
  {
    id: "std:iso1172",
    facet: "std",
    issuer: "ISO",
    label: { zh: "ISO 1172 玻纤含量", en: "ISO 1172 Glass Content" },
    aliases: ["iso1172", "iso 1172", "1172", "玻纤含量", "灼烧失重"],
  },
  // ── ASTM 力学 / 拉挤专项 / 防火 ──
  {
    id: "std:astm-d638",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D638 拉伸性能", en: "ASTM D638 Tensile" },
    aliases: ["astm d638", "astmd638", "d638"],
  },
  {
    id: "std:astm-d790",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D790 弯曲性能", en: "ASTM D790 Flexural" },
    aliases: ["astm d790", "astmd790", "d790"],
  },
  {
    id: "std:astm-d695",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D695 压缩性能", en: "ASTM D695 Compressive" },
    aliases: ["astm d695", "astmd695", "d695"],
  },
  {
    id: "std:astm-d2344",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D2344 短梁剪切", en: "ASTM D2344 Short-Beam Shear" },
    aliases: ["astm d2344", "astmd2344", "d2344", "short beam shear"],
  },
  {
    id: "std:astm-d570",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D570 吸水性", en: "ASTM D570 Water Absorption" },
    aliases: ["astm d570", "astmd570", "d570", "吸水率"],
  },
  {
    id: "std:astm-d2583",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D2583 巴氏硬度", en: "ASTM D2583 Barcol Hardness" },
    aliases: ["astm d2583", "astmd2583", "d2583", "巴氏硬度", "barcol"],
  },
  {
    id: "std:astm-d3917",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D3917 拉挤件尺寸公差", en: "ASTM D3917 Pultruded Tolerances" },
    aliases: ["astm d3917", "astmd3917", "d3917", "尺寸公差"],
  },
  {
    id: "std:astm-d4385",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D4385 拉挤件外观缺陷", en: "ASTM D4385 Visual Defects" },
    aliases: ["astm d4385", "astmd4385", "d4385", "外观缺陷"],
  },
  {
    id: "std:astm-d7957",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D7957 GFRP 筋材规范", en: "ASTM D7957 GFRP Rebar" },
    aliases: ["astm d7957", "astmd7957", "d7957", "gfrp rebar", "frp 筋"],
    note: "GFRP 钢筋进北美市场的产品规范。",
  },
  {
    id: "std:astm-e84",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM E84 表面火焰传播", en: "ASTM E84 Flame Spread" },
    aliases: ["astm e84", "astme84", "e84", "flame spread", "class 1 flame", "class a flame", "ul723", " nfpa 255"],
  },
  {
    id: "std:astm-d635",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D635 水平燃烧速率", en: "ASTM D635 Burn Rate" },
    aliases: ["astm d635", "astmd635", "d635"],
  },
  {
    id: "std:astm-d2563",
    facet: "std",
    issuer: "ASTM",
    label: { zh: "ASTM D2563 GRP 外观分级", en: "ASTM D2563 Visual Inspection" },
    aliases: ["astm d2563", "astmd2563", "d2563"],
  },
  {
    id: "std:ul94",
    facet: "std",
    issuer: "UL",
    label: { zh: "UL 94 塑料阻燃等级", en: "UL 94 Flammability" },
    aliases: ["ul94", "ul 94", "v-0", "v0", "94v-0", "94 v0", "hb"],
  },
  // ── 北美 FRP 筋材 / 结构设计 ──
  {
    id: "std:csa-s807",
    facet: "std",
    issuer: "CSA",
    label: { zh: "CSA S807 加拿大 FRP 规范", en: "CSA S807" },
    aliases: ["csa s807", "csas807", "s807"],
  },
  {
    id: "std:csa-s806",
    facet: "std",
    issuer: "CSA",
    label: { zh: "CSA S806 FRP 结构设计", en: "CSA S806" },
    aliases: ["csa s806", "csas806", "s806"],
  },
  {
    id: "std:aci440",
    facet: "std",
    issuer: "ACI",
    label: { zh: "ACI 440 FRP 配筋", en: "ACI 440 FRP" },
    aliases: ["aci440", "aci 440", "440", "aci 440.1r", "aci 440.6"],
  },
  // ── 国标 GB/T ──
  {
    id: "std:gbt31539",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB/T 31539 结构用拉挤型材", en: "GB/T 31539 Pultruded Structural" },
    aliases: ["gb/t 31539", "gbt31539", "gb 31539", "31539", "结构用纤维增强复合材料拉挤型材", "结构用拉挤型材"],
  },
  {
    id: "std:gbt1447",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB/T 1447 拉伸性能", en: "GB/T 1447 Tensile" },
    aliases: ["gb/t 1447", "gbt1447", "gb 1447", "1447", "纤维增强塑料拉伸"],
  },
  {
    id: "std:gbt1448",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB/T 1448 压缩性能", en: "GB/T 1448 Compressive" },
    aliases: ["gb/t 1448", "gbt1448", "gb 1448", "1448"],
  },
  {
    id: "std:gbt1449",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB/T 1449 弯曲性能", en: "GB/T 1449 Flexural" },
    aliases: ["gb/t 1449", "gbt1449", "gb 1449", "1449"],
  },
  {
    id: "std:gbt3854",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB/T 3854 巴氏硬度", en: "GB/T 3854 Barcol" },
    aliases: ["gb/t 3854", "gbt3854", "gb 3854", "3854"],
  },
  {
    id: "std:gbt13096",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB/T 13096 拉挤玻纤杆力学", en: "GB/T 13096 Pultruded Rod" },
    aliases: ["gb/t 13096", "gbt13096", "gb 13096", "13096", "拉挤玻璃纤维增强塑料杆"],
  },
  {
    id: "std:gb8624",
    facet: "std",
    issuer: "SAC",
    label: { zh: "GB 8624 建材燃烧性能分级", en: "GB 8624 Fire Classification" },
    aliases: ["gb 8624", "gb8624", "8624", "燃烧性能等级", "b1 级", "b1级", "难燃"],
  },

  // ═══════════════════════ cat — 产品品类 ═══════════════════════
  {
    id: "cat:pultruded-profile",
    facet: "cat",
    label: { zh: "拉挤型材", en: "Pultruded Profiles" },
    aliases: ["拉挤型材", "型材", "pultruded profile", "pultruded profiles", "工字钢", "槽钢", "角钢", "i-beam", "channel", "angle"],
  },
  {
    id: "cat:grating",
    facet: "cat",
    label: { zh: "格栅", en: "Grating" },
    aliases: ["格栅", "玻璃钢格栅", "frp grating", "grating", "盖板"],
  },
  {
    id: "cat:molded-grating",
    facet: "cat",
    label: { zh: "模塑格栅", en: "Molded Grating" },
    aliases: ["模塑格栅", "molded grating", "moulded grating"],
  },
  {
    id: "cat:pultruded-grating",
    facet: "cat",
    label: { zh: "拉挤格栅", en: "Pultruded Grating" },
    aliases: ["拉挤格栅", "pultruded grating"],
  },
  {
    id: "cat:frp-rebar",
    facet: "cat",
    label: { zh: "FRP 筋材", en: "FRP Rebar" },
    aliases: ["筋材", "玻璃钢筋", "frp 筋", "frp rebar", "gfrp rebar", "frp bar", "复合筋"],
  },
  {
    id: "cat:rod",
    facet: "cat",
    label: { zh: "实心棒 / 拉挤棒", en: "Solid Rod" },
    aliases: ["实心棒", "拉挤棒", "圆棒", "solid rod", "round rod"],
  },
  {
    id: "cat:tube",
    facet: "cat",
    label: { zh: "管材(圆管/方管)", en: "Tube" },
    aliases: ["圆管", "方管", "拉挤管", "frp tube", "square tube", "round tube"],
  },
  {
    id: "cat:wound-pipe",
    facet: "cat",
    label: { zh: "缠绕管 / 夹砂管", en: "Filament-Wound Pipe" },
    aliases: ["缠绕管", "夹砂管", "grp pipe", "gre pipe", "frp pipe", "filament wound pipe", "rtrp"],
  },
  {
    id: "cat:tank-vessel",
    facet: "cat",
    label: { zh: "储罐 / 容器", en: "Tanks & Vessels" },
    aliases: ["储罐", "罐", "容器", "frp tank", "grp tank", "vessel"],
  },
  {
    id: "cat:cable-tray",
    facet: "cat",
    label: { zh: "电缆桥架", en: "Cable Tray" },
    aliases: ["电缆桥架", "桥架", "cable tray", "cable ladder"],
  },
  {
    id: "cat:handrail",
    facet: "cat",
    label: { zh: "护栏 / 栏杆系统", en: "Handrail System" },
    aliases: ["护栏", "栏杆", "扶手", "handrail", "railing", "guardrail"],
  },
  {
    id: "cat:sheet-panel",
    facet: "cat",
    label: { zh: "板材 / 夹芯板", en: "Sheet / Panel" },
    aliases: ["板材", "夹芯板", "frp sheet", "frp panel", "sandwich panel"],
  },
  {
    id: "cat:cross-arm",
    facet: "cat",
    label: { zh: "电力横担 / 杆", en: "Cross-arm / Pole" },
    aliases: ["横担", "电力杆", "复合横担", "cross arm", "crossarm", "utility pole"],
  },
  {
    id: "cat:fence",
    facet: "cat",
    label: { zh: "围栏", en: "Fence" },
    aliases: ["围栏", "护栏网", "frp fence"],
  },

  // ═══════════════════════ mat — 材料 / 树脂体系 ═══════════════════════
  {
    id: "mat:gfrp",
    facet: "mat",
    label: { zh: "玻纤增强 (GFRP)", en: "Glass Fiber (GFRP)" },
    aliases: ["玻纤", "玻璃纤维", "玻璃钢", "gfrp", "grp", "glass fiber", "glass fibre", "fiberglass"],
  },
  {
    id: "mat:cfrp",
    facet: "mat",
    label: { zh: "碳纤增强 (CFRP)", en: "Carbon Fiber (CFRP)" },
    aliases: ["碳纤", "碳纤维", "cfrp", "carbon fiber", "carbon fibre"],
  },
  {
    id: "mat:afrp",
    facet: "mat",
    label: { zh: "芳纶增强 (AFRP)", en: "Aramid (AFRP)" },
    aliases: ["芳纶", "凯夫拉", "afrp", "aramid", "kevlar"],
  },
  {
    id: "mat:ecr-glass",
    facet: "mat",
    label: { zh: "ECR 耐腐玻纤", en: "ECR Glass" },
    aliases: ["ecr", "ecr玻纤", "ecr glass", "耐腐玻纤", "advantex"],
  },
  {
    id: "mat:polyester",
    facet: "mat",
    label: { zh: "不饱和聚酯树脂", en: "Polyester Resin" },
    aliases: ["聚酯", "不饱和聚酯", "up树脂", "polyester", "unsaturated polyester", "upr"],
  },
  {
    id: "mat:vinylester",
    facet: "mat",
    label: { zh: "乙烯基酯树脂", en: "Vinyl Ester Resin" },
    aliases: ["乙烯基酯", "乙烯基树脂", "vinylester", "vinyl ester", "ve树脂"],
  },
  {
    id: "mat:epoxy",
    facet: "mat",
    label: { zh: "环氧树脂", en: "Epoxy Resin" },
    aliases: ["环氧", "环氧树脂", "epoxy", "ep树脂"],
  },
  {
    id: "mat:phenolic",
    facet: "mat",
    label: { zh: "酚醛树脂", en: "Phenolic Resin" },
    aliases: ["酚醛", "酚醛树脂", "phenolic"],
    note: "阻燃 / 低烟场景常用,常与 prop:fire-retardant 同现。",
  },
  {
    id: "mat:polyurethane",
    facet: "mat",
    label: { zh: "聚氨酯树脂 (PU 拉挤)", en: "Polyurethane (PU)" },
    aliases: ["聚氨酯", "pu树脂", "polyurethane", "pu pultrusion"],
  },

  // ═══════════════════════ process — 成型工艺 ═══════════════════════
  {
    id: "process:pultrusion",
    facet: "process",
    label: { zh: "拉挤", en: "Pultrusion" },
    aliases: ["拉挤", "拉挤成型", "pultrusion", "pultruded"],
  },
  {
    id: "process:filament-winding",
    facet: "process",
    label: { zh: "纤维缠绕", en: "Filament Winding" },
    aliases: ["缠绕", "纤维缠绕", "filament winding", "filament wound"],
  },
  {
    id: "process:pull-winding",
    facet: "process",
    label: { zh: "拉绕", en: "Pull-Winding" },
    aliases: ["拉绕", "pull winding", "pullwinding"],
  },
  {
    id: "process:hand-layup",
    facet: "process",
    label: { zh: "手糊", en: "Hand Lay-up" },
    aliases: ["手糊", "手工糊制", "hand layup", "hand lay-up"],
  },
  {
    id: "process:smc-bmc",
    facet: "process",
    label: { zh: "SMC / BMC 模压", en: "SMC / BMC" },
    aliases: ["smc", "bmc", "模压", "片状模塑料", "团状模塑料", "compression molding"],
  },
  {
    id: "process:rtm",
    facet: "process",
    label: { zh: "RTM 树脂传递模塑", en: "RTM" },
    aliases: ["rtm", "树脂传递模塑", "resin transfer molding", "ltm"],
  },
  {
    id: "process:vacuum-infusion",
    facet: "process",
    label: { zh: "真空导入", en: "Vacuum Infusion" },
    aliases: ["真空导入", "真空灌注", "vacuum infusion", "vartm"],
  },

  // ═══════════════════════ prop — 关键性能 claim(信任权重低) ═══════════════════════
  {
    id: "prop:fire-retardant",
    facet: "prop",
    label: { zh: "阻燃", en: "Fire-Retardant" },
    aliases: ["阻燃", "防火", "难燃", "fire retardant", "flame retardant", "fr"],
  },
  {
    id: "prop:anti-corrosion",
    facet: "prop",
    label: { zh: "耐腐蚀", en: "Anti-Corrosion" },
    aliases: ["耐腐蚀", "防腐", "耐酸碱", "anti corrosion", "corrosion resistant"],
  },
  {
    id: "prop:uv-resistant",
    facet: "prop",
    label: { zh: "耐候 / 抗紫外", en: "UV-Resistant" },
    aliases: ["耐候", "抗紫外", "抗uv", "uv resistant", "weather resistant"],
  },
  {
    id: "prop:low-smoke",
    facet: "prop",
    label: { zh: "低烟", en: "Low-Smoke" },
    aliases: ["低烟", "low smoke", "low smoke low toxicity", "lsoh"],
  },
  {
    id: "prop:halogen-free",
    facet: "prop",
    label: { zh: "无卤", en: "Halogen-Free" },
    aliases: ["无卤", "halogen free", "无卤素"],
  },
  {
    id: "prop:non-conductive",
    facet: "prop",
    label: { zh: "电绝缘 / 非导磁", en: "Non-Conductive" },
    aliases: ["电绝缘", "绝缘", "非导磁", "non conductive", "electrically insulating", "non magnetic"],
  },
  {
    id: "prop:high-strength",
    facet: "prop",
    label: { zh: "高强", en: "High-Strength" },
    aliases: ["高强", "高强度", "high strength"],
  },
  {
    id: "prop:lightweight",
    facet: "prop",
    label: { zh: "轻质", en: "Lightweight" },
    aliases: ["轻质", "轻量", "lightweight"],
  },

  // ═══════════════════════ industry — 应用行业 ═══════════════════════
  { id: "industry:water", facet: "industry", label: { zh: "水处理 / 给排水", en: "Water Treatment" }, aliases: ["水处理", "给排水", "污水", "water treatment", "wastewater"] },
  { id: "industry:oil-gas", facet: "industry", label: { zh: "油气", en: "Oil & Gas" }, aliases: ["油气", "石油", "天然气", "oil and gas", "oil & gas", "petrochemical"] },
  { id: "industry:power", facet: "industry", label: { zh: "电力", en: "Power" }, aliases: ["电力", "电网", "输配电", "power", "utility", "electric"] },
  { id: "industry:rail", facet: "industry", label: { zh: "轨道交通", en: "Rail Transit" }, aliases: ["轨道交通", "地铁", "铁路", "rail", "railway", "metro"] },
  { id: "industry:marine", facet: "industry", label: { zh: "海洋 / 船舶", en: "Marine" }, aliases: ["海洋", "船舶", "海工", "marine", "offshore", "shipbuilding"] },
  { id: "industry:construction", facet: "industry", label: { zh: "建筑 / 基建", en: "Construction" }, aliases: ["建筑", "基建", "土木", "construction", "infrastructure", "civil"] },
  { id: "industry:chemical", facet: "industry", label: { zh: "化工防腐", en: "Chemical" }, aliases: ["化工", "防腐", "chemical", "anti corrosion plant"] },
  { id: "industry:cooling-tower", facet: "industry", label: { zh: "冷却塔", en: "Cooling Tower" }, aliases: ["冷却塔", "cooling tower"] },
  { id: "industry:bridge", facet: "industry", label: { zh: "桥梁", en: "Bridge" }, aliases: ["桥梁", "人行桥", "bridge", "footbridge"] },
  { id: "industry:telecom", facet: "industry", label: { zh: "通信", en: "Telecom" }, aliases: ["通信", "通讯", "天线罩", "telecom", "antenna"] },

  // ═══════════════════════ region — 产地(从营业执照地址派生) ═══════════════════════
  // 仅列复材产业较集中的省份;扩展直接照此追加。slug 用拼音,稳定不变。
  { id: "region:cn-hebei", facet: "region", label: { zh: "河北", en: "Hebei" }, aliases: ["河北", "hebei", "衡水", "枣强", "冀州"] },
  { id: "region:cn-jiangsu", facet: "region", label: { zh: "江苏", en: "Jiangsu" }, aliases: ["江苏", "jiangsu", "南京", "常州", "南通"] },
  { id: "region:cn-shandong", facet: "region", label: { zh: "山东", en: "Shandong" }, aliases: ["山东", "shandong", "济南", "潍坊"] },
  { id: "region:cn-zhejiang", facet: "region", label: { zh: "浙江", en: "Zhejiang" }, aliases: ["浙江", "zhejiang", "杭州", "宁波"] },
  { id: "region:cn-guangdong", facet: "region", label: { zh: "广东", en: "Guangdong" }, aliases: ["广东", "guangdong", "广州", "深圳", "佛山"] },
  { id: "region:cn-jiangxi", facet: "region", label: { zh: "江西", en: "Jiangxi" }, aliases: ["江西", "jiangxi", "九江"] },
  { id: "region:cn-henan", facet: "region", label: { zh: "河南", en: "Henan" }, aliases: ["河南", "henan", "郑州"] },
  { id: "region:cn-shanghai", facet: "region", label: { zh: "上海", en: "Shanghai" }, aliases: ["上海", "shanghai"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// 派生索引 + 工具函数(供映射层 / AI 抽取 / 前端筛选共用)
// ─────────────────────────────────────────────────────────────────────────────

/** id → TagDef 快查。 */
export const TAGS_BY_ID: ReadonlyMap<string, TagDef> = new Map(TAGS.map((t) => [t.id, t]));

/** 全部 facet,按 FACET_META.order 排好序。 */
export const FACETS: Facet[] = (Object.keys(FACET_META) as Facet[]).sort(
  (a, b) => FACET_META[a].order - FACET_META[b].order,
);

/** 取某 facet 下的全部 TagDef。 */
export function tagsByFacet(facet: Facet): TagDef[] {
  return TAGS.filter((t) => t.facet === facet);
}

/**
 * 取某 facet 下的封闭 id 枚举(喂给 AI 当「允许提议的标签清单」)。
 * AI 提议的 proposedTagIds 必须是这些 id 的子集,越界即丢弃。
 */
export function facetEnum(facet: Facet): string[] {
  return tagsByFacet(facet).map((t) => t.id);
}

/** 全部 canonical id(校验 AI 输出 / 数据库约束用)。 */
export const ALL_TAG_IDS: ReadonlyArray<string> = TAGS.map((t) => t.id);

/** id 是否在受控词表内。 */
export function isValidTagId(id: string): boolean {
  return TAGS_BY_ID.has(id);
}

/**
 * 归一化:供别名精确匹配。去掉大小写 / 空格 / 常见分隔符 / 标准号尾部版本年。
 * 例:"ISO 9001:2015" / "ISO-9001" / "iso 9001" → "iso9001"
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s:：\-—_/.,、]+/g, "") // 去分隔符
    .replace(/(19|20)\d{2}$/, ""); // 去结尾版本年(2015 / 2018…)
}

/** 别名 → tagId 反查表(归一化后)。模块加载时构建一次。 */
const ALIAS_INDEX: Map<string, string> = (() => {
  const idx = new Map<string, string>();
  for (const t of TAGS) {
    // canonical id 的 slug 部分本身也作为别名(去掉 facet 前缀)
    const slug = t.id.split(":")[1] ?? t.id;
    for (const a of [...t.aliases, slug, t.label.zh, t.label.en]) {
      const key = normalize(a);
      if (key && !idx.has(key)) idx.set(key, t.id);
    }
  }
  return idx;
})();

/**
 * 确定性别名匹配(**不做模糊**,模糊留给 map-tags.ts 并标记需复核)。
 * 命中返回 canonical id,否则 null → 调用方把原文丢进「待治理」队列。
 */
export function lookupAlias(raw: string): string | null {
  if (!raw) return null;
  return ALIAS_INDEX.get(normalize(raw)) ?? null;
}

/** 根据 cert 是否带 certNo / 可查验,给出该 tag 的可查验 URL(无则 null)。 */
export function verifyUrlFor(tagId: string, certNo?: string | null): string | null {
  const def = TAGS_BY_ID.get(tagId);
  if (!def?.verifyUrlPattern || !certNo) return null;
  return def.verifyUrlPattern.replace("{certNo}", encodeURIComponent(certNo));
}
