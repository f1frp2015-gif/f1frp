// 复材百科 (/baike) — 国内中文侧的「答案优先」问答落地页数据源。
//
// 定位:这是 getfrp.com 英文侧 /sourcing/[topic] 的中文对位层(见
// 01-战略/2026-06-13-f1frp国内SEO架构-借鉴Consensus)。每条 = 一个真实中文搜索
// 意图,正面给结论 + 证据兜底 + 转化路径。zh-only:仅在 f1frp.com 渲染。
//
// 内容纪律(对应架构文档 §5):
//   - 需求闸门:只收有真实搜索量的问题(选材/工艺/性能/标准/应用)。
//   - 数据闸门:answer / comparison / sections 必须由真实工程数据支撑,不灌水。
//   - 数值一律给区间 + 限定词(典型/约/常见),并注明随纤维体积分数/树脂体系变化,
//     避免虚假精度。
// evidence/related 只指向已存在的路由:/matrix/[combo](55 个 fiber-resin)、
// /fibers/[slug](glass·carbon·basalt·aramid·bio)、以及枢纽页 /standards /materials
// /pultrusion /hp-rtm /suppliers /papers。

export type BaikeIntent = "选材" | "工艺" | "性能" | "标准" | "应用";

export type BaikeFaq = { question: string; answer: string };
export type BaikeStep = { name: string; text: string };
export type BaikeLink = { label: string; href: string };
export type BaikeComparison = {
  caption: string;
  headers: string[];
  rows: string[][];
};

export type BaikeTopic = {
  /** pinyin / 短英文 slug;中文留给 H1 与正文(URL 编码更稳)。 */
  slug: string;
  intent: BaikeIntent;
  /** H1 —— 自然语言问题,对齐搜索词。 */
  question: string;
  /** 枢纽页卡片用的一句话。 */
  teaser: string;
  metaTitle: string;
  metaDescription: string;
  /** 答案优先段:第一句给结论,后续给关键数据/标准/适用条件。 */
  answer: string;
  /** 结论速览的判定短语(可选),如「优先 GFRP」。 */
  verdict?: string;
  /** 「什么情况下适用」扫读清单。 */
  keyPoints: string[];
  /** GEO 对比表(可选)。 */
  comparison?: BaikeComparison;
  sections: { heading: string; body: string[] }[];
  /** 指向知识库的证据链接(Tier 1 / 枢纽)。 */
  evidence: BaikeLink[];
  faqs: BaikeFaq[];
  /** 工艺步骤(可选)—— 有则页面渲染编号步骤列表 + 发射 HowTo schema。
   *  步骤须与页面可见内容一致(不编造);留空则不发 HowTo。 */
  steps?: BaikeStep[];
  /** 相关问题 —— 同类 baike 兄弟页 + 枢纽,织内链图。 */
  related: BaikeLink[];
  /** 最近编辑复核日期(时效信号)。 */
  reviewedDate: string;
};

export const baikeTopics: BaikeTopic[] = [
  {
    slug: "qiaoliang-boli-vs-tanxian",
    intent: "选材",
    question: "桥梁结构用玻璃纤维还是碳纤维?",
    teaser: "多数桥梁优先玻璃纤维,碳纤维只用在对刚度、自重极敏感或加固既有结构的局部。",
    metaTitle: "桥梁用玻璃纤维还是碳纤维?GFRP 与 CFRP 选型对比 | 复材百科",
    metaDescription:
      "桥梁结构选玻璃纤维(GFRP)还是碳纤维(CFRP)?从强度、模量、成本、耐久和电偶腐蚀给出选型结论,附 GFRP/CFRP/BFRP 对比表与适用场景。",
    answer:
      "大多数桥梁工程优先玻璃纤维(GFRP),碳纤维(CFRP)只用在对刚度或自重极敏感的大跨结构、以及加固既有混凝土的贴片/板材。原因很直接:GFRP 抗拉强度对桥梁够用、成本约为 CFRP 的五分之一到十分之一、耐疲劳和耐碱环境好;CFRP 模量高(约为 GFRP 的三到五倍)、自重更轻,但脆性大、价格高,且与钢直接接触会发生电偶腐蚀,需要隔离。",
    verdict: "新建结构优先 GFRP,加固/大跨用 CFRP",
    keyPoints: [
      "新建人行桥、桥面板、栏杆、电缆桥架、拉挤型材 → 玻璃纤维(GFRP)。",
      "大跨索结构、抗震加固贴片/板材、对自重极敏感的构件 → 碳纤维(CFRP)。",
      "近海、除冰盐等高腐蚀环境 → 优先 ECR 玻纤或玄武岩纤维(BFRP)。",
      "CFRP 与钢连接处必须做电绝缘隔离,避免电偶腐蚀。",
    ],
    comparison: {
      caption: "GFRP / CFRP / BFRP 型材级典型值(随纤维体积分数与树脂体系变化)",
      headers: ["指标", "玻璃纤维 GFRP", "碳纤维 CFRP", "玄武岩 BFRP"],
      rows: [
        ["密度 (g/cm³)", "1.8–2.1", "1.5–1.6", "1.9–2.1"],
        ["纵向抗拉 (MPa)", "400–1000", "1500–3000", "500–1100"],
        ["纵向拉伸模量 (GPa)", "25–45", "120–230", "35–55"],
        ["相对成本", "1×", "5–10×", "1.5–3×"],
        ["典型用途", "桥面板/型材/筋材", "加固/大跨/索", "耐腐蚀筋材/网格"],
      ],
    },
    sections: [
      {
        heading: "怎么选:先看载荷工况和环境",
        body: [
          "桥梁构件大多是受弯、受拉为主,GFRP 的抗拉强度区间已能覆盖人行桥、桥面板、栏杆、拉挤型材等绝大多数场景,刚度不足时靠加大截面或加密布置解决,成本依然远低于碳纤维。",
          "只有当结构对自重或挠度极度敏感(大跨索结构、需要大幅提升既有梁承载力的加固),碳纤维的高模量和轻质才值得它的高单价。加固场景里碳布、碳板是成熟做法。",
        ],
      },
      {
        heading: "成本与寿命",
        body: [
          "玻璃纤维的全寿命优势在于:初始成本低、不锈蚀、在湿热和盐雾环境下维护成本低于钢结构。耐碱玻纤(ARG)或 ECR 玻纤在混凝土碱性环境中长期性能更稳。",
          "碳纤维本身不腐蚀,但与钢的电偶腐蚀、以及环氧基体的紫外老化需要在设计和构造上处理(隔离层、防护涂层)。",
        ],
      },
    ],
    evidence: [
      { label: "玻璃纤维 × 环氧 选型页", href: "/matrix/glass-epoxy" },
      { label: "碳纤维 × 环氧 选型页", href: "/matrix/carbon-epoxy" },
      { label: "玄武岩 × 环氧 选型页", href: "/matrix/basalt-epoxy" },
      { label: "玻璃纤维详情", href: "/fibers/glass" },
      { label: "碳纤维详情", href: "/fibers/carbon" },
    ],
    faqs: [
      {
        question: "碳纤维桥梁能用多少年?",
        answer:
          "碳纤维本体不锈蚀,寿命主要取决于树脂基体的老化和连接构造。设计良好、做了防紫外和电绝缘的 CFRP 加固工程,设计使用年限通常按 30–50 年考虑,具体以工程规范和环境而定。",
      },
      {
        question: "玻璃钢(GFRP)会老化吗?",
        answer:
          "会,主要是树脂在湿热、紫外、碱性环境下的性能衰减。选 ECR/ARG 玻纤 + 乙烯基酯或耐候树脂、做好富树脂表层,可显著放缓老化;设计时对长期强度取折减系数。",
      },
      {
        question: "玄武岩纤维是不是比玻璃纤维更好?",
        answer:
          "玄武岩纤维(BFRP)模量和耐温略高于普通玻纤、耐碱性好,适合做混凝土筋材和耐腐蚀网格,但单价更高、供应链不如玻纤成熟。是否更优取决于具体工况与预算。",
      },
    ],
    related: [
      { label: "玻璃钢的密度、强度、耐温是多少?", href: "/baike/boligang-midu-qiangdu" },
      { label: "FRP 筋能代替钢筋吗?", href: "/baike/frp-jin-ti-dai-gangjin" },
      { label: "储罐、管道用什么纤维和树脂?", href: "/baike/chuguan-guandao-yong-shenme-shuzhi" },
    ],
    reviewedDate: "2026-06",
  },
  {
    slug: "laji-gongyi-nengzuo-shenme",
    intent: "工艺",
    question: "拉挤工艺能做什么?和缠绕、RTM 有什么区别?",
    teaser: "截面不变的连续型材用拉挤,回转体用缠绕,复杂异形的批量闭模件用 RTM。",
    metaTitle: "拉挤工艺能做什么?拉挤 vs 缠绕 vs RTM 区别 | 复材百科",
    metaDescription:
      "拉挤(pultrusion)适合做等截面连续型材,缠绕做回转体,RTM/HP-RTM 做复杂闭模件。一文讲清四种主流复材成型工艺的制品形态、纤维含量、节拍与典型应用。",
    answer:
      "拉挤(pultrusion)做等截面连续型材——工字梁、角钢、圆管、格栅、混凝土筋、电缆桥架,纤维体积分数高(常 60–70%)、纵向强度高、单位成本低、可连续量产;缠绕(filament winding)做管、罐、压力容器等回转体;RTM/HP-RTM 做几何复杂的闭模件(汽车结构件、叶片根部)。一句话判断:截面不变选拉挤,回转体选缠绕,异形批量闭模件选 RTM。",
    keyPoints: [
      "等截面、长尺寸、要量产 → 拉挤。",
      "管、罐、压力容器等回转体 → 缠绕。",
      "复杂三维、两面光、批量中高 → RTM / HP-RTM。",
      "大尺寸单件、打样、小批量 → 手糊 / 真空导入(VARTM)。",
    ],
    comparison: {
      caption: "四种主流成型工艺对比",
      headers: ["工艺", "制品形态", "纤维含量", "节拍/批量", "典型应用"],
      rows: [
        ["拉挤", "等截面连续型材", "高 (60–70%)", "连续/高", "型材、筋材、格栅"],
        ["缠绕", "回转体", "中高", "中", "管道、储罐、气瓶"],
        ["RTM / HP-RTM", "复杂闭模件", "中高", "中高(HP-RTM 快)", "汽车结构件、叶片"],
        ["SMC/BMC 模压", "中小异形件", "中", "高", "汽车覆盖件、电气件"],
      ],
    },
    sections: [
      {
        heading: "拉挤的边界在哪里",
        body: [
          "拉挤的本质是把浸胶纤维连续拉过加热模具固化,所以它只能做截面不变的型材;要变截面、要开孔、要曲率,得靠后加工或换工艺。优点是纤维顺直、纵向力学性能高、材料利用率高、人工少。",
          "拉挤型材的横向和层间性能远低于纵向,设计时要按纵向受力布置,接头和开孔处做局部补强。",
        ],
      },
      {
        heading: "和缠绕、RTM 的分工",
        body: [
          "缠绕通过控制缠绕角把纤维沿主应力方向铺设,最适合内压回转体;RTM 用闭合模具注胶,能做复杂几何、两面光洁、尺寸稳定,HP-RTM 把固化时间压到几分钟,匹配汽车量产节拍。",
          "选工艺先看制品几何,再看批量和成本:几何决定能不能做,批量决定划不划算。",
        ],
      },
    ],
    evidence: [
      { label: "拉挤工艺专题", href: "/pultrusion" },
      { label: "HP-RTM 专题", href: "/hp-rtm" },
      { label: "玻璃纤维 × 不饱和聚酯(拉挤常用)", href: "/matrix/glass-upr" },
      { label: "玻璃纤维 × 乙烯基酯", href: "/matrix/glass-ver" },
    ],
    faqs: [
      {
        question: "拉挤型材能做多大截面?",
        answer:
          "受模具和牵引力限制,常见拉挤截面在数十毫米到几百毫米量级,大型工字梁、桥面板型材可做到数百毫米宽。超大或变截面需评估模具与设备能力。",
      },
      {
        question: "拉挤用什么树脂?",
        answer:
          "通用结构件多用不饱和聚酯(UPR),耐腐蚀用乙烯基酯(VER),高性能和高温用环氧或酚醛。具体见对应的纤维×树脂选型页。",
      },
      {
        question: "拉挤和挤出是一回事吗?",
        answer:
          "不是。塑料挤出是熔体被推出口模;拉挤是连续纤维被拉过模具并在模内固化,纤维是承载主体,两者材料和力学完全不同。",
      },
    ],
    related: [
      { label: "储罐、管道用什么纤维和树脂?", href: "/baike/chuguan-guandao-yong-shenme-shuzhi" },
      { label: "玻璃钢的密度、强度、耐温是多少?", href: "/baike/boligang-midu-qiangdu" },
      { label: "桥梁用玻璃纤维还是碳纤维?", href: "/baike/qiaoliang-boli-vs-tanxian" },
    ],
    reviewedDate: "2026-06",
  },
  {
    slug: "boligang-midu-qiangdu",
    intent: "性能",
    question: "玻璃钢(GFRP)的密度、强度、耐温到底是多少?",
    teaser: "密度约 1.7–2.1 g/cm³(约钢的四分之一),纵向抗拉常 400–1000 MPa,耐温受树脂限制。",
    metaTitle: "玻璃钢(GFRP)密度、强度、耐温是多少?典型参数 | 复材百科",
    metaDescription:
      "玻璃钢密度约 1.7–2.1 g/cm³、纵向抗拉常 400–1000 MPa、纵向模量 25–45 GPa,长期使用温度受树脂限制(UPR 80–120°C、环氧 130–180°C)。附按树脂体系的性能对比表。",
    answer:
      "玻璃钢(GFRP)密度约 1.7–2.1 g/cm³,大约是钢的四分之一;拉挤型材纵向抗拉常在 400–1000 MPa、纵向拉伸模量 25–45 GPa。长期使用温度由树脂决定:通用不饱和聚酯/乙烯基酯约 80–120°C,环氧约 130–180°C,酚醛和双马可到 200°C 以上。要注意强度有明显方向性,横向只有纵向的 10–30%。",
    verdict: "轻、强、不锈,但耐温看树脂、强度看方向",
    keyPoints: [
      "密度约钢的 1/4,比强度高,适合减重和耐腐蚀场景。",
      "性能强方向性:按纤维方向布置受力,横向和层间是短板。",
      "耐温不是看玻纤(可耐数百度),而是看树脂的热变形温度。",
      "对照具体数据时务必注明测试标准(GB/T 1447 或 ASTM D3039)。",
    ],
    comparison: {
      caption: "GFRP 按树脂体系的典型性能(型材/层合板级,随工艺变化)",
      headers: ["树脂体系", "纵向抗拉 (MPa)", "纵向模量 (GPa)", "长期耐温 (°C)", "特点"],
      rows: [
        ["不饱和聚酯 UPR", "400–800", "25–35", "80–120", "通用、性价比高"],
        ["乙烯基酯 VER", "500–900", "28–38", "100–140", "耐腐蚀"],
        ["环氧 EP", "600–1000", "30–45", "130–180", "高强、耐久"],
        ["酚醛 PF", "350–700", "25–35", "200+", "阻燃、耐高温"],
      ],
    },
    sections: [
      {
        heading: "为什么强度区间这么宽",
        body: [
          "玻璃钢不是单一材料,而是「纤维 + 树脂 + 工艺」的组合。纤维种类(E/ECR/S 玻纤)、纤维体积分数、铺层方向、成型工艺都会显著改变力学性能,所以工程数据一定是区间而非定值。",
          "拉挤这种纤维顺直、含量高的工艺,纵向性能处在区间上端;手糊、短切毡复合材料则偏下端。",
        ],
      },
      {
        heading: "耐温的真正瓶颈",
        body: [
          "玻璃纤维本身软化点在 800°C 以上,所以玻璃钢的耐温上限几乎完全由树脂的热变形温度(HDT)和玻璃化转变温度(Tg)决定。选型时先定使用温度,再倒推树脂体系。",
        ],
      },
    ],
    evidence: [
      { label: "玻璃纤维详情(级别与品牌)", href: "/fibers/glass" },
      { label: "玻璃纤维 × 不饱和聚酯", href: "/matrix/glass-upr" },
      { label: "玻璃纤维 × 环氧", href: "/matrix/glass-epoxy" },
      { label: "标准库(性能测试方法)", href: "/standards" },
    ],
    faqs: [
      {
        question: "玻璃钢比钢强吗?",
        answer:
          "按比强度(强度/密度)玻璃钢可以接近甚至超过普通钢,但绝对强度和刚度(模量)通常低于钢。玻璃钢模量只有钢的约 1/4–1/10,所以结构常受刚度而非强度控制。",
      },
      {
        question: "玻璃钢能承受多高温度?",
        answer:
          "取决于树脂:通用 UPR/VER 长期约 80–120°C,环氧 130–180°C,酚醛/双马 200°C 以上。短时耐温可更高,但要看具体牌号的 HDT/Tg。",
      },
      {
        question: "玻璃钢横向强度为什么那么低?",
        answer:
          "因为横向受力主要靠树脂和界面传递,没有连续纤维承载。单向材料横向抗拉通常只有纵向的 10–30%,所以要靠多向铺层或编织来平衡。",
      },
    ],
    related: [
      { label: "桥梁用玻璃纤维还是碳纤维?", href: "/baike/qiaoliang-boli-vs-tanxian" },
      { label: "GB/T 1447 对应哪个 ASTM 标准?", href: "/baike/gb1447-vs-astm-d3039" },
      { label: "拉挤工艺能做什么?", href: "/baike/laji-gongyi-nengzuo-shenme" },
    ],
    reviewedDate: "2026-06",
  },
  {
    slug: "gb1447-vs-astm-d3039",
    intent: "标准",
    question: "GB/T 1447 对应哪个 ASTM 标准?测出来的数据能直接比吗?",
    teaser: "GB/T 1447 对应 ASTM D3039,原理一致但试样和加载条件有差异,数据接近但不能逐位等同。",
    metaTitle: "GB/T 1447 对应 ASTM D3039 吗?拉伸标准互换 | 复材百科",
    metaDescription:
      "GB/T 1447(纤维增强塑料拉伸性能)对应 ASTM D3039、ISO 527。三者原理一致但试样尺寸、加载速率、模量计算区间不同,数据通常接近但不能逐位等同,报告须注明标准号。",
    answer:
      "GB/T 1447(纤维增强塑料拉伸性能试验方法)对应 ASTM D3039,国际上还对应 ISO 527-4/5。三者原理一致——平直试样单轴拉伸,但试样尺寸、加强片要求、加载速率和模量计算区间有差异,所以同一材料用不同标准测出来的值通常接近但不能逐位等同。任何报价单和报告都必须注明用的是哪个标准号和加载速率,否则数据没有可比性。",
    verdict: "可对应,但报告必须标注标准号,不能默认等同",
    keyPoints: [
      "拉伸:GB/T 1447 ↔ ASTM D3039 ↔ ISO 527-4/5。",
      "弯曲:GB/T 1449 ↔ ASTM D790 ↔ ISO 14125。",
      "数据接近但有系统差异,跨标准比对要看测试条件。",
      "出口报告优先给 ASTM/ISO 数据,并保留 GB 原始报告。",
    ],
    comparison: {
      caption: "拉伸性能测试标准对照",
      headers: ["项目", "GB/T 1447", "ASTM D3039", "ISO 527-4/5"],
      rows: [
        ["适用", "纤维增强塑料", "聚合物基复合材料", "纤维增强塑料"],
        ["试样", "平直矩形", "平直矩形 + 加强片", "平直矩形(多型)"],
        ["加载速率", "常 2 mm/min", "常 2 mm/min(范围不同)", "按类型规定"],
        ["主要输出", "抗拉强度、模量、断裂应变", "同左", "同左"],
      ],
    },
    sections: [
      {
        heading: "为什么不能直接画等号",
        body: [
          "标准之间的差异看起来很小(试样宽度、加强片、夹持、速率),但这些会影响应力集中和测得的强度/模量。对脆性、各向异性的复合材料,这种差异比对金属更明显。",
          "实务上把它当作「可对应、需注明」:跨标准比对时优先比同一标准的数据,确实要换算时附测试条件说明,不做无条件等同。",
        ],
      },
      {
        heading: "出口和采购怎么处理",
        body: [
          "对海外买家,直接提供 ASTM 或 ISO 标准下的测试报告最省事;国内生产按 GB 出报告时,保留原始数据并在交付文件里给出标准对照,能减少来回确认。",
        ],
      },
    ],
    evidence: [
      { label: "标准库 / GB↔ASTM↔ISO 对照", href: "/standards" },
      { label: "玻璃钢性能参数(配合标准看)", href: "/baike/boligang-midu-qiangdu" },
      { label: "材料库", href: "/materials" },
    ],
    faqs: [
      {
        question: "GB/T 1447 和 GB/T 3354 有什么区别?",
        answer:
          "GB/T 1447 是通用纤维增强塑料拉伸方法,GB/T 3354 专门针对定向纤维增强聚合物复合材料的拉伸,试样和取向要求更严格,常用于高性能层合板。",
      },
      {
        question: "弯曲强度的标准怎么对应?",
        answer:
          "弯曲对应关系是 GB/T 1449 ↔ ASTM D790 ↔ ISO 14125,同样存在跨度比、加载速率等条件差异,比对时注意测试条件。",
      },
      {
        question: "出口必须用 ASTM 吗?",
        answer:
          "不一定,取决于买家和目标市场要求。欧洲常接受 ISO,北美多要 ASTM。提前确认买家认可的标准,按需出报告。",
      },
    ],
    related: [
      { label: "玻璃钢的密度、强度、耐温是多少?", href: "/baike/boligang-midu-qiangdu" },
      { label: "桥梁用玻璃纤维还是碳纤维?", href: "/baike/qiaoliang-boli-vs-tanxian" },
      { label: "FRP 筋能代替钢筋吗?", href: "/baike/frp-jin-ti-dai-gangjin" },
    ],
    reviewedDate: "2026-06",
  },
  {
    slug: "frp-jin-ti-dai-gangjin",
    intent: "应用",
    question: "FRP 筋(纤维筋)能代替钢筋吗?用在哪些场景?",
    teaser: "在腐蚀环境和需要电磁透明的结构里,FRP 筋是钢筋的成熟替代,但设计逻辑不同。",
    metaTitle: "FRP 筋能代替钢筋吗?适用场景与设计要点 | 复材百科",
    metaDescription:
      "FRP 筋(GFRP/BFRP 筋)在海洋、除冰盐、化工、MRI 室等腐蚀或电磁敏感场景可替代钢筋:抗拉高、不锈、不导磁,但模量低、脆断、不能现场弯折,需按适用性设计。",
    answer:
      "在腐蚀环境和需要电磁透明的结构里,FRP 筋是钢筋的成熟替代——海洋和除冰盐桥面、污水与化工结构、医院 MRI 室、隧道可切削段。它抗拉高(GFRP 筋常 600–1100 MPa)、不锈蚀、不导磁;但弹性模量低(GFRP 约 40–60 GPa,约钢的四分之一到五分之一)、没有屈服平台(脆性断裂)、不能现场弯折。所以设计不是照搬钢筋,而是按裂缝和挠度等「适用性」控制,锚固和最小配筋另有规程。",
    verdict: "能,但限定场景 + 改用适用性设计",
    keyPoints: [
      "适用:海洋/除冰盐、污水化工、MRI/雷达等电磁敏感、隧道盾构可切削段。",
      "优势:不锈蚀、不导磁、比强度高、耐久维护省。",
      "约束:模量低、脆断无屈服、需工厂预弯、温度和长期强度要折减。",
      "设计依据:按裂缝宽度/挠度的适用性极限,而非钢筋的屈服。",
    ],
    comparison: {
      caption: "FRP 筋与钢筋对比",
      headers: ["指标", "GFRP 筋", "BFRP 筋", "普通钢筋"],
      rows: [
        ["抗拉强度 (MPa)", "600–1100", "700–1200", "335–500(屈服)"],
        ["弹性模量 (GPa)", "40–60", "50–65", "200"],
        ["耐腐蚀", "优", "优", "差(需保护层)"],
        ["破坏形式", "脆断", "脆断", "屈服后延性"],
        ["导磁/导电", "否", "否", "是"],
      ],
    },
    sections: [
      {
        heading: "为什么不能照搬钢筋设计",
        body: [
          "FRP 筋没有屈服段,达到极限就脆断,所以不能依赖钢筋那种「屈服后延性」来预警和耗能。规范一般要求按适用性极限状态(裂缝、挠度)控制,并对长期强度、温度、弯折部位取折减系数。",
          "FRP 筋不能在工地现场弯折,弯钩和异形必须在工厂成型,设计和下料要提前规划。",
        ],
      },
      {
        heading: "选 GFRP 还是 BFRP 筋",
        body: [
          "GFRP 筋成本低、供应成熟,是大多数耐腐蚀工程的默认选择;BFRP 筋模量和耐碱略好、耐温稍高,适合对长期耐久要求更高的场景,但单价更高。两者都不导磁、不锈蚀。",
        ],
      },
    ],
    evidence: [
      { label: "玻璃纤维 × 乙烯基酯(耐腐蚀筋材)", href: "/matrix/glass-ver" },
      { label: "玄武岩 × 环氧", href: "/matrix/basalt-epoxy" },
      { label: "玄武岩纤维详情", href: "/fibers/basalt" },
      { label: "玻璃纤维详情", href: "/fibers/glass" },
    ],
    faqs: [
      {
        question: "FRP 筋比钢筋贵吗?",
        answer:
          "单价通常高于普通钢筋,但在强腐蚀环境里,算上钢筋的防腐、保护层和维护/返修成本,FRP 筋的全寿命成本往往更有竞争力。",
      },
      {
        question: "FRP 筋能用在抗震结构吗?",
        answer:
          "要谨慎。FRP 筋脆断、缺乏延性和耗能能力,主要抗震耗能构件一般不直接替代钢筋;可用于非耗能部位或与延性措施配合,具体按相应规程。",
      },
      {
        question: "BFRP 筋和 GFRP 筋怎么选?",
        answer:
          "预算优先、常规耐腐蚀选 GFRP 筋;对耐碱、耐久、耐温要求更高且能接受更高单价时选 BFRP 筋。",
      },
    ],
    related: [
      { label: "桥梁用玻璃纤维还是碳纤维?", href: "/baike/qiaoliang-boli-vs-tanxian" },
      { label: "玻璃钢的密度、强度、耐温是多少?", href: "/baike/boligang-midu-qiangdu" },
      { label: "GB/T 1447 对应哪个 ASTM 标准?", href: "/baike/gb1447-vs-astm-d3039" },
    ],
    reviewedDate: "2026-06",
  },
  {
    slug: "chuguan-guandao-yong-shenme-shuzhi",
    intent: "选材",
    question: "储罐、管道用什么纤维和树脂组合?",
    teaser: "防腐储罐和管道主流是玻璃纤维 + 乙烯基酯或间苯型聚酯,内衬富树脂层耐介质。",
    metaTitle: "储罐管道用什么复合材料和树脂?防腐选型 | 复材百科",
    metaDescription:
      "防腐储罐、管道主流用玻璃纤维 + 乙烯基酯(VER)或间苯型不饱和聚酯;强腐蚀用 VER/双酚 A 型,高温溶剂用环氧/酚醛。附 UPR/VER/EP 储罐场景对比与工艺建议。",
    answer:
      "防腐储罐和管道的主流是玻璃纤维 + 乙烯基酯(VER)或间苯型不饱和聚酯(UPR):内衬一层富树脂的耐腐蚀层接触介质,外面是缠绕或手糊的结构层。强腐蚀介质(强酸、次氯酸盐)用乙烯基酯或双酚 A 型树脂;高温或溶剂工况上环氧或酚醛。碳纤维一般不用于储罐,性价比不合适。",
    verdict: "玻纤 + 乙烯基酯/间苯聚酯为主,按介质升级树脂",
    keyPoints: [
      "通用防腐:玻纤 + 间苯型 UPR 或 VER,内衬富树脂层。",
      "强酸/强氧化介质:乙烯基酯或双酚 A 型,提高耐化学性。",
      "高温/溶剂:环氧或酚醛体系。",
      "成型:回转体储罐/管道用缠绕,大型或异形用手糊/喷射。",
    ],
    comparison: {
      caption: "储罐/管道场景的树脂体系对比",
      headers: ["树脂", "耐腐蚀", "耐温 (°C)", "相对成本", "典型介质"],
      rows: [
        ["间苯型 UPR", "中", "80–110", "低", "一般水/弱腐蚀"],
        ["乙烯基酯 VER", "高", "100–140", "中", "强酸、氧化性介质"],
        ["双酚 A 型 UPR", "较高", "100–130", "中", "中等腐蚀"],
        ["环氧 EP", "高(溶剂)", "130–180", "高", "溶剂、高温"],
      ],
    },
    sections: [
      {
        heading: "为什么内衬层是关键",
        body: [
          "储罐管道的腐蚀失效几乎都从接触介质的内表面开始,所以工程上单独做一层富树脂(高树脂含量、表面毡)的耐腐蚀内衬,把结构层和介质隔开。内衬树脂按介质选,结构层按受力和成本选。",
          "选错树脂的代价是渗漏和开裂,所以介质成分、浓度、温度要先弄清楚,再定树脂体系。",
        ],
      },
      {
        heading: "工艺怎么配",
        body: [
          "回转体的储罐和管道用纤维缠绕最合适,纤维沿环向和轴向按内压方向铺设;非标大型或异形容器用手糊/喷射成型。两者都先做内衬再做结构层。",
        ],
      },
    ],
    evidence: [
      { label: "玻璃纤维 × 乙烯基酯", href: "/matrix/glass-ver" },
      { label: "玻璃纤维 × 不饱和聚酯", href: "/matrix/glass-upr" },
      { label: "玻璃纤维 × 环氧", href: "/matrix/glass-epoxy" },
      { label: "玻璃纤维详情", href: "/fibers/glass" },
    ],
    faqs: [
      {
        question: "储罐为什么不用碳纤维?",
        answer:
          "储罐主要受内压和腐蚀,玻璃纤维的强度和耐腐蚀已经够用,碳纤维的高模量在这里用不上,反而大幅抬高成本。除非有特殊减重或刚度要求,否则不划算。",
      },
      {
        question: "乙烯基酯和聚酯怎么选?",
        answer:
          "弱腐蚀、预算敏感用间苯型聚酯;强酸、氧化性或要求更长寿命用乙烯基酯。乙烯基酯耐腐蚀和韧性更好,成本居中。",
      },
      {
        question: "玻璃钢储罐能用多少年?",
        answer:
          "设计得当、树脂选型匹配介质、内衬合格的玻璃钢储罐,设计寿命常按 15–25 年考虑,实际取决于介质、温度和制造质量。",
      },
    ],
    related: [
      { label: "拉挤工艺能做什么?和缠绕、RTM 区别?", href: "/baike/laji-gongyi-nengzuo-shenme" },
      { label: "桥梁用玻璃纤维还是碳纤维?", href: "/baike/qiaoliang-boli-vs-tanxian" },
      { label: "玻璃钢的密度、强度、耐温是多少?", href: "/baike/boligang-midu-qiangdu" },
    ],
    reviewedDate: "2026-06",
  },
];

export const baikeTopicSlugs = baikeTopics.map((t) => t.slug);

export function findBaikeTopic(slug: string): BaikeTopic | undefined {
  return baikeTopics.find((t) => t.slug === slug);
}

/** Intent display order for the hub. */
export const BAIKE_INTENT_ORDER: BaikeIntent[] = [
  "选材",
  "工艺",
  "性能",
  "标准",
  "应用",
];
