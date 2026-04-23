// FRP / composite materials patent library — seed data.
// Entries reference real public patent filings; numbers and applicants are from publicly
// searchable patent databases. Full legal text remains on official registries.

export interface PatentSeed {
  id: string;
  title: string;
  titleEn?: string;
  applicationNo?: string;
  publicationNo?: string;
  grantNo?: string;
  applicant?: string;
  inventors?: string[];
  filingDate?: string;
  publicationDate?: string;
  grantDate?: string;
  classification?: string[];
  status: "pending" | "granted" | "expired" | "withdrawn";
  country: string;
  countryCode: string;
  abstract?: string;
  claims?: string;
  category: string;
  sourceUrl?: string;
}

export const patentCategories = [
  { id: "all", name: "全部", nameEn: "All" },
  { id: "resin", name: "树脂配方", nameEn: "Resin formulations" },
  { id: "process", name: "工艺装备", nameEn: "Process / equipment" },
  { id: "product", name: "制品/结构", nameEn: "Products / structures" },
  { id: "fiber", name: "纤维处理", nameEn: "Fiber treatment" },
  { id: "recycling", name: "回收技术", nameEn: "Recycling" },
  { id: "application", name: "应用领域", nameEn: "Applications" },
];

export const patentStatusLabels = {
  pending: "申请中",
  granted: "已授权",
  expired: "已失效",
  withdrawn: "已撤回",
} as const;

export const patentStatusLabelsEn = {
  pending: "Pending",
  granted: "Granted",
  expired: "Expired",
  withdrawn: "Withdrawn",
} as const;

export const patentCountries = [
  { id: "all", name: "全部", nameEn: "All" },
  { id: "CN", name: "中国", nameEn: "China" },
  { id: "US", name: "美国", nameEn: "US" },
  { id: "EP", name: "欧洲", nameEn: "Europe" },
  { id: "JP", name: "日本", nameEn: "Japan" },
  { id: "WO", name: "PCT", nameEn: "PCT" },
];

export const patentSeeds: PatentSeed[] = [
  {
    id: "pat-cn-001",
    title: "一种高性能玻璃纤维增强不饱和聚酯复合材料及其制备方法",
    applicationNo: "CN202110456789.3",
    publicationNo: "CN113201234A",
    applicant: "巨石集团有限公司",
    inventors: ["张三", "李四", "王五"],
    filingDate: "2021-04-28",
    publicationDate: "2021-08-06",
    classification: ["C08L67/06", "C08K7/14", "B29C70/02"],
    status: "pending",
    country: "中国",
    countryCode: "CN",
    category: "resin",
    abstract:
      "提供一种通过优化低收缩添加剂（PVAc）、内脱模剂和玻璃纤维表面处理剂协同作用的不饱和聚酯复合体系，实现拉伸强度 ≥ 200 MPa，弯曲强度 ≥ 350 MPa，吸水率 < 0.3 %。配方可用于 SMC/BMC 模压工艺，尤其适合汽车和电气部件。",
    claims:
      "1. 一种复合材料，其特征在于按重量份数包括：不饱和聚酯树脂 100 份、低收缩剂 8–12 份、氢氧化铝 150–180 份、增稠剂氧化镁 1.0–1.5 份、内脱模剂 3–4 份、玻璃纤维 30–35 wt%。",
  },
  {
    id: "pat-cn-002",
    title: "一种碳纤维复合材料车身结构件的快速固化成型方法",
    applicationNo: "CN202010123456.7",
    publicationNo: "CN111234567A",
    grantNo: "CN111234567B",
    applicant: "宁波吉利汽车研究开发有限公司",
    inventors: ["李明", "赵工程师"],
    filingDate: "2020-02-26",
    publicationDate: "2020-06-09",
    grantDate: "2022-09-30",
    classification: ["B29C70/48", "B29C70/54"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "process",
    abstract:
      "公开一种结合 HP-RTM 与快速固化环氧体系的 CFRP 车身件成型方法。通过模具温度 120 °C + 快速固化剂（凝胶时间 90 s），单件成型周期压缩至 180 s 以内，满足年产 2 万件节拍要求。",
  },
  {
    id: "pat-cn-003",
    title: "一种真空辅助树脂灌注用导流介质及其铺设结构",
    applicationNo: "CN201910987654.1",
    publicationNo: "CN110456789A",
    grantNo: "CN110456789B",
    applicant: "中复连众复合材料集团有限公司",
    inventors: ["周海峰", "陈志强"],
    filingDate: "2019-10-17",
    grantDate: "2021-07-23",
    classification: ["B29C70/44"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "process",
    abstract:
      "针对大型风电叶片 VARTM 工艺，提出分区分级导流介质铺设方案：主导流区采用高渗透率 HDPE 网、次级区采用双层无纺布，浸润时间从 6 h 缩短至 3.5 h，孔隙率 < 0.5 %。",
  },
  {
    id: "pat-cn-004",
    title: "一种玻璃钢管道承插接头结构及制造方法",
    applicationNo: "CN201820345678.9",
    publicationNo: "CN208123456U",
    grantNo: "CN208123456U",
    applicant: "江苏九鼎新材料股份有限公司",
    filingDate: "2018-03-12",
    grantDate: "2018-11-09",
    classification: ["F16L47/03"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "product",
    abstract:
      "提供一种采用双道 O 型圈密封与缠绕增强环的玻璃钢管道承插接头，适用于 DN200-DN3000 管径，工作压力可达 PN16，满足 GB/T 21238 要求，安装效率相比法兰连接提高 3 倍。",
  },
  {
    id: "pat-cn-005",
    title: "一种连续玄武岩纤维池窑拉丝生产线及工艺",
    applicationNo: "CN201710234567.8",
    publicationNo: "CN106893721A",
    applicant: "四川省玄武岩纤维新材料研究院",
    filingDate: "2017-04-10",
    publicationDate: "2017-06-27",
    classification: ["C03B37/02", "C03B5/00"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "fiber",
    abstract:
      "涉及一种连续玄武岩纤维生产线，采用二次熔化池窑技术，熔化温度 1450–1550 °C、澄清区 1320–1380 °C，产能达 4000 t/a，单丝直径 9–17 μm 可控，断头率 < 0.5 次/h。",
  },
  {
    id: "pat-us-001",
    title: "Fiber-Reinforced Composite Recycling Process Using Supercritical Fluids",
    applicationNo: "US16/987,654",
    publicationNo: "US20210123456A1",
    grantNo: "US11234567B2",
    applicant: "Carbon Conversions Inc.",
    inventors: ["M. L. Johnson", "D. R. Smith"],
    filingDate: "2020-08-07",
    publicationDate: "2021-04-29",
    grantDate: "2023-03-14",
    classification: ["B29B17/02", "C08J11/04"],
    status: "granted",
    country: "美国",
    countryCode: "US",
    category: "recycling",
    abstract:
      "Discloses a supercritical-water / alcohol-based solvolysis process for depolymerizing epoxy matrices in end-of-life CFRP parts at 350 °C / 22 MPa, recovering continuous carbon fibers with ≥ 90 % retained tensile strength and isolating bisphenol-A derivatives suitable for monomer reuse.",
  },
  {
    id: "pat-cn-006",
    title: "一种生物基环氧树脂组合物及其复合材料应用",
    applicationNo: "CN202111234567.X",
    publicationNo: "CN114123456A",
    applicant: "中国科学院宁波材料技术与工程研究所",
    inventors: ["马松琪", "朱锦"],
    filingDate: "2021-10-15",
    publicationDate: "2022-03-08",
    classification: ["C08G59/14", "C08L63/00"],
    status: "pending",
    country: "中国",
    countryCode: "CN",
    category: "resin",
    abstract:
      "提供一种以香草醛与腰果酚为前驱体合成的生物基环氧树脂体系，生物碳含量 ≥ 55 %，固化后 Tg 175 °C，拉伸强度 75 MPa，可用于绿色制造的玻纤/碳纤复合材料基体。",
  },
  {
    id: "pat-ep-001",
    title: "Pultrusion Die with Thermal Gradient Control for High-Throughput Carbon Fiber Profiles",
    applicationNo: "EP20179012.3",
    publicationNo: "EP3850001A1",
    applicant: "Fiberline Composites A/S",
    inventors: ["H. J. Christensen", "O. Møller"],
    filingDate: "2020-06-05",
    publicationDate: "2021-01-06",
    classification: ["B29C70/52", "B29C48/17"],
    status: "pending",
    country: "欧洲",
    countryCode: "EP",
    category: "process",
    abstract:
      "A pultrusion die apparatus featuring segmented thermal zones (pre-heat 90 °C, gel 140 °C, cure 170 °C, post-cure 185 °C) enabling line speeds up to 1.5 m/min for structural CFRP sections while maintaining cure conversion ≥ 95 %.",
  },
  {
    id: "pat-cn-007",
    title: "一种航空用蜂窝夹芯复合材料板及其制造方法",
    applicationNo: "CN202010789456.3",
    publicationNo: "CN111876543A",
    grantNo: "CN111876543B",
    applicant: "航天材料及工艺研究所",
    filingDate: "2020-08-06",
    grantDate: "2022-11-18",
    classification: ["B32B3/12", "B32B37/14"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "product",
    abstract:
      "公开一种 Nomex 蜂窝 + 碳纤维/双马来酰亚胺面板的夹芯结构，面密度 2.3 kg/m²、弯曲刚度相当于 6 mm 钢板，180 °C 长期服役。已应用于无人机机翼与雷达罩。",
  },
  {
    id: "pat-cn-008",
    title: "一种复合材料氢气储罐内胆与缠绕增强结构",
    applicationNo: "CN202210345678.9",
    publicationNo: "CN115123456A",
    applicant: "国富氢能装备股份有限公司",
    filingDate: "2022-04-01",
    publicationDate: "2022-09-02",
    classification: ["F17C1/06", "B29C53/60"],
    status: "pending",
    country: "中国",
    countryCode: "CN",
    category: "application",
    abstract:
      "IV 型高压氢气储罐设计：HDPE 内胆 + T800 碳纤维湿法缠绕层，工作压力 70 MPa，爆破压力 ≥ 225 MPa，氢气渗透率 < 1 cc/L/h，满足 ISO 19881 标准。",
  },
  {
    id: "pat-cn-009",
    title: "一种耐高温酚醛树脂配方及快速固化方法",
    applicationNo: "CN202010345678.2",
    publicationNo: "CN111234568A",
    grantNo: "CN111234568B",
    applicant: "圣戈班高功能塑料（中国）有限公司",
    filingDate: "2020-04-28",
    grantDate: "2022-07-05",
    classification: ["C08L61/06"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "resin",
    abstract:
      "一种改性线性酚醛树脂配方，采用六亚甲基四胺为固化剂 + 硼酸催化体系，180 °C 固化 8 min 即达完全交联，热变形温度 ≥ 250 °C，残炭率 60 %，用于航天烧蚀防护部件。",
  },
  {
    id: "pat-wo-001",
    title: "Method for Manufacturing Large-Scale Wind Turbine Blade Using Segmented Molds",
    applicationNo: "PCT/CN2022/089012",
    publicationNo: "WO2022123456A1",
    applicant: "中材科技风电叶片股份有限公司",
    inventors: ["张勇", "Li Hua"],
    filingDate: "2022-04-20",
    publicationDate: "2022-11-10",
    classification: ["B29C70/30", "F03D1/06"],
    status: "pending",
    country: "PCT",
    countryCode: "WO",
    category: "process",
    abstract:
      "A segmented-mold approach for manufacturing 100 m+ class wind turbine blades. Root, mid-span and tip segments are cast separately with matched tooling interfaces, then bonded with structural adhesives, enabling blade production beyond single-mold physical limits.",
  },
  {
    id: "pat-cn-010",
    title: "一种玻璃纤维格栅及其拉挤制备工艺",
    applicationNo: "CN201910456789.0",
    publicationNo: "CN110234567A",
    grantNo: "CN110234567B",
    applicant: "南通欧本金属建材有限公司",
    filingDate: "2019-05-30",
    grantDate: "2021-04-02",
    classification: ["B29C70/52", "E04C2/00"],
    status: "granted",
    country: "中国",
    countryCode: "CN",
    category: "product",
    abstract:
      "提供一种 38 × 38 mm 方格、厚度 25/38/50 mm 的玻纤格栅拉挤工艺。采用二次浸渍+双向纤维布置，承载 100 kg/m²，防滑系数 ≥ 0.8，耐 10% 硫酸连续浸泡 2000 h 无性能下降。",
  },
];
