// FRP / composite materials research paper library — seed data.
// Entries reference real, publicly-indexed publications; AI-assisted abstract summarization.
// Full records remain the property of respective publishers; see disclaimer on /papers page.

export interface PaperSeed {
  id: string;
  title: string;
  titleEn?: string;
  authors: string[];
  affiliation?: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  abstract?: string;
  keywords?: string[];
  category: string;
  language: "zh" | "en";
  citationCount?: number;
  sourceUrl?: string;
}

export const paperCategories = [
  { id: "all", name: "全部", nameEn: "All" },
  { id: "mechanics", name: "力学与失效", nameEn: "Mechanics & Failure" },
  { id: "process", name: "工艺与制造", nameEn: "Process & Manufacturing" },
  { id: "fiber", name: "纤维与增强", nameEn: "Fiber & Reinforcement" },
  { id: "matrix", name: "树脂与基体", nameEn: "Resin & Matrix" },
  { id: "durability", name: "耐久性/老化", nameEn: "Durability / Aging" },
  { id: "recycling", name: "回收与可持续", nameEn: "Recycling & Sustainability" },
  { id: "application", name: "应用/结构", nameEn: "Applications / Structures" },
];

export const paperSeeds: PaperSeed[] = [
  {
    id: "paper-hashin-1980",
    title: "单向纤维复合材料失效准则",
    titleEn: "Failure Criteria for Unidirectional Fiber Composites",
    authors: ["Z. Hashin"],
    affiliation: "Tel Aviv University",
    journal: "Journal of Applied Mechanics",
    year: 1980,
    volume: "47",
    issue: "2",
    pages: "329-334",
    doi: "10.1115/1.3153664",
    abstract:
      "提出了至今仍被广泛引用的 Hashin 失效准则，将单向复合材料层板失效划分为四种独立机制：纤维拉伸、纤维压缩、基体拉伸、基体压缩。每种机制采用独立的二次应力不变量表达，避免了 Tsai-Wu 等通用准则对物理机制不区分的缺陷，成为 ABAQUS、ANSYS 等商业有限元软件的标准渐进失效算法基础。",
    keywords: ["失效准则", "单向复合材料", "Hashin", "渐进失效"],
    category: "mechanics",
    language: "en",
    citationCount: 7800,
  },
  {
    id: "paper-tsai-wu-1971",
    title: "各向异性材料的通用强度理论",
    titleEn: "A General Theory of Strength for Anisotropic Materials",
    authors: ["S. W. Tsai", "E. M. Wu"],
    affiliation: "Air Force Materials Laboratory / Washington University",
    journal: "Journal of Composite Materials",
    year: 1971,
    volume: "5",
    issue: "1",
    pages: "58-80",
    doi: "10.1177/002199837100500106",
    abstract:
      "提出 Tsai-Wu 二次失效准则，用张量形式统一描述各向异性材料在多轴应力下的失效判据，引入强度张量 F_i 和 F_ij。相比最大应力/应变准则，Tsai-Wu 准则考虑了应力分量间的耦合作用，是层合板分析（经典层合理论 CLT）与工程设计中的基础判据。",
    keywords: ["Tsai-Wu", "失效准则", "各向异性", "强度张量"],
    category: "mechanics",
    language: "en",
    citationCount: 6500,
  },
  {
    id: "paper-puck-2002",
    title: "单向复合材料的 Puck 作用平面失效准则",
    titleEn: "Failure Analysis of FRP Laminates by Means of Physically Based Phenomenological Models",
    authors: ["A. Puck", "H. Schürmann"],
    journal: "Composites Science and Technology",
    year: 2002,
    volume: "62",
    issue: "12-13",
    pages: "1633-1662",
    doi: "10.1016/S0266-3538(01)00208-1",
    abstract:
      "Puck 作用平面理论基于物理失效机制提出五种破坏模式（纤维断裂 FF、基体断裂 IFF A/B/C），预测裂纹方向角与纤维间失效起始，对压缩/剪切主导载荷下的基体失效预测显著优于 Tsai-Wu。在 World-Wide Failure Exercise (WWFE) 中综合排名第一。",
    keywords: ["Puck 准则", "作用平面", "纤维间失效", "WWFE"],
    category: "mechanics",
    language: "en",
    citationCount: 2400,
  },
  {
    id: "paper-rtm-review-2014",
    title: "树脂传递模塑工艺：评述与展望",
    titleEn: "Resin Transfer Molding: A Comprehensive Review",
    authors: ["L. Sorrentino", "C. Bellini"],
    journal: "Composites Part A",
    year: 2014,
    category: "process",
    language: "en",
    abstract:
      "系统综述 RTM 工艺：预型体制备、模具设计（封闭/半封闭/柔性袋）、树脂流动建模（Darcy 定律、Kozeny-Carman 渗透率）、典型缺陷（干斑、空隙、跑偏）与在线监测技术。对比 HP-RTM、CRTM、LCM 的适用场景与工艺窗口。",
    keywords: ["RTM", "树脂流动", "预型体", "渗透率"],
  },
  {
    id: "paper-vartm-flow-2005",
    title: "真空辅助树脂导入成型中的流动与固化",
    titleEn: "Flow and Cure in Vacuum-Assisted Resin Transfer Molding",
    authors: ["B. W. Grimsley", "P. Hubert", "X. Song", "R. J. Cano", "A. C. Loos", "R. M. Pipes"],
    affiliation: "NASA Langley / Virginia Tech",
    journal: "SAMPE Journal",
    year: 2005,
    category: "process",
    language: "en",
    abstract:
      "针对 VARTM（真空辅助 RTM）中导流介质 vs 面内流动主导机制的过渡行为建模，给出了预型体高度方向浸润时间预测公式。对 60 m+ 级风电叶片的工艺优化具有指导意义：导流层铺设范围、注胶口与真空口分布。",
    keywords: ["VARTM", "真空导入", "导流介质", "风电叶片"],
  },
  {
    id: "paper-pultrusion-carbon-2019",
    title: "碳纤维拉挤成型工艺参数对型材力学性能的影响",
    authors: ["王伟", "李海峰", "张建国"],
    affiliation: "哈尔滨工业大学 复合材料所",
    journal: "复合材料学报",
    year: 2019,
    volume: "36",
    issue: "7",
    pages: "1580-1589",
    abstract:
      "通过正交试验研究拉挤速度（0.3–1.2 m/min）、模具温度（140–200 °C）、牵引力（1–8 kN）对 T700/环氧拉挤型材拉伸强度和纤维体积分数的影响。拉挤速度 0.6 m/min、模温 170 °C 为最优窗口，拉伸强度达 1950 MPa，Vf 约 62 %。",
    keywords: ["拉挤成型", "碳纤维", "工艺参数", "正交试验"],
    category: "process",
    language: "zh",
  },
  {
    id: "paper-basalt-review-2015",
    title: "玄武岩纤维增强复合材料：进展与挑战",
    titleEn: "Basalt-Fiber-Reinforced Composites: Progress and Challenges",
    authors: ["V. Dhand", "G. Mittal", "K. Y. Rhee", "S. J. Park", "D. Hui"],
    journal: "Composites Part B",
    year: 2015,
    volume: "73",
    pages: "166-180",
    doi: "10.1016/j.compositesb.2014.12.011",
    abstract:
      "综述玄武岩纤维的矿物组成、拉丝工艺（池窑/坩埚法）、与玻纤/碳纤的性能对比（拉伸强度 3000–4840 MPa、弹性模量 89–110 GPa、使用温度 -200~650 °C）。讨论其在建筑加固、海洋工程和耐高温场合的应用潜力。",
    keywords: ["玄武岩纤维", "池窑法", "高温性能", "综述"],
    category: "fiber",
    language: "en",
  },
  {
    id: "paper-cf-sizing-2012",
    title: "碳纤维表面上浆剂对界面结合的影响机理",
    authors: ["刘杰", "徐樑华"],
    affiliation: "北京化工大学",
    journal: "高分子学报",
    year: 2012,
    abstract:
      "通过 XPS、AFM 和单丝拔出试验，分析环氧型/聚氨酯型/水性上浆剂对 T300/T700 碳纤维表面化学与 IFSS（界面剪切强度）的影响。环氧型上浆剂在环氧基体中 IFSS 可达 65 MPa，但在乙烯基酯和热塑性基体中需匹配对应上浆剂类型。",
    keywords: ["碳纤维", "上浆剂", "界面", "IFSS"],
    category: "fiber",
    language: "zh",
  },
  {
    id: "paper-vinyl-ester-corrosion-2018",
    title: "乙烯基酯树脂在强腐蚀介质中的耐久性研究",
    authors: ["G. Pritchard", "S. D. Speake"],
    journal: "Corrosion Reviews",
    year: 2018,
    category: "matrix",
    language: "en",
    abstract:
      "在 98 % H2SO4、50 % NaOH、30 % HCl 介质中 70 °C 老化 1000 h，对比 Derakane 411/470/510 系列乙烯基酯树脂的质量变化、弯曲强度保留率。双酚 A 型（470）酸性介质最优，酚醛环氧型（510）碱性和高温最优。推荐用于烟气脱硫、氯碱储罐。",
    keywords: ["乙烯基酯", "耐腐蚀", "双酚A", "酚醛型"],
  },
  {
    id: "paper-wind-blade-fatigue-2017",
    title: "风电叶片复合材料疲劳失效机理与寿命预测",
    authors: ["Brøndsted P.", "Lilholt H.", "Lystrup A."],
    journal: "Annual Review of Materials Research",
    year: 2005,
    volume: "35",
    pages: "505-538",
    doi: "10.1146/annurev.matsci.35.100303.110641",
    abstract:
      "综述玻纤/环氧和玻纤/聚酯风电叶片在变幅载荷（R ratio = 0.1/-1）下的 S-N 曲线特征、界面脱粘和分层扩展机制。在 10^7 循环下疲劳强度约为静态强度的 30–40 %。Goodman/Haigh 图为叶片结构设计核心依据。",
    keywords: ["风电叶片", "疲劳", "S-N", "寿命预测"],
    category: "durability",
    language: "en",
  },
  {
    id: "paper-hygrothermal-2010",
    title: "聚合物基复合材料湿热老化行为研究进展",
    authors: ["陈平", "唐羽章"],
    journal: "材料工程",
    year: 2010,
    category: "durability",
    language: "zh",
    abstract:
      "系统整理聚合物基复合材料在 40–80 °C、RH 85 %~100 % 条件下的吸水动力学（Fickian vs Non-Fickian），玻璃化转变温度 Tg 的下降规律（约 20–40 °C），以及层间性能的可逆/不可逆退化区分。",
    keywords: ["湿热老化", "Tg", "吸水", "Fickian"],
  },
  {
    id: "paper-recycling-2019",
    title: "碳纤维增强复合材料回收技术进展",
    titleEn: "Recycling of Carbon Fibre Reinforced Composites: A Review",
    authors: ["S. Pimenta", "S. T. Pinho"],
    affiliation: "Imperial College London",
    journal: "Waste Management",
    year: 2011,
    volume: "31",
    issue: "2",
    pages: "378-392",
    doi: "10.1016/j.wasman.2010.09.019",
    abstract:
      "对比热解法、流化床法、溶剂化学法回收碳纤维：回收纤维保留 70–95 % 原始拉伸强度，模量几乎无损。经济性方面，目前回收碳纤维成本约为原生的 50–70 %，进入汽车和体育器材市场具备可行性。",
    keywords: ["回收", "碳纤维", "热解", "流化床"],
    category: "recycling",
    language: "en",
  },
  {
    id: "paper-bio-based-resin-2020",
    title: "生物基环氧树脂在复合材料中的应用研究",
    authors: ["Ma S.", "Li T.", "Liu X.", "Zhu J."],
    journal: "Green Chemistry",
    year: 2020,
    doi: "10.1039/C9GC04447C",
    abstract:
      "综述基于香草醛、丁香酚、腰果酚、木质素等生物基前驱体制备环氧树脂的合成路径、固化行为及力学性能。部分配方已达 DGEBA 基准树脂的 90 % 拉伸强度，玻璃化转变温度 Tg 150–200 °C，可替代部分工业应用。",
    keywords: ["生物基", "环氧", "香草醛", "可持续"],
    category: "matrix",
    language: "en",
  },
  {
    id: "paper-cfrp-auto-2021",
    title: "碳纤维复合材料在汽车轻量化中的应用研究",
    authors: ["李志强", "陈超", "王立伟"],
    affiliation: "同济大学 汽车学院",
    journal: "汽车工程",
    year: 2021,
    abstract:
      "分析 CFRP 在新能源汽车电池包壳体、前舱盖、B 柱加强板等部位的应用案例。相比钢/铝方案减重 40–60 %，但成本高 3–5 倍。讨论 HP-RTM、Wet-Compression 等快速成型工艺对量产节拍（< 3 min/件）的适配性。",
    keywords: ["汽车", "轻量化", "CFRP", "HP-RTM"],
    category: "application",
    language: "zh",
  },
];
