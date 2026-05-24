export interface Process {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  advantages: string[];
  advantagesEn: string[];
  disadvantages: string[];
  disadvantagesEn: string[];
  applications: string[];
  applicationsEn: string[];
  keyParameters: string[];
  keyParametersEn: string[];
  image?: string;
}

export const processes: Process[] = [
  {
    id: "hand-layup",
    name: "手糊成型",
    nameEn: "Hand Lay-up",
    description:
      "手糊成型是最传统、应用最广泛的玻璃钢成型工艺。操作人员将增强材料（玻纤布/毡）铺放在涂有脱模剂的模具表面，用刷子或辊子将树脂浸渍到增强材料中，逐层铺放直至达到设计厚度，然后在常温或加热条件下固化成型。",
    descriptionEn:
      "Hand lay-up is the most traditional and widely used FRP forming process. Operators place reinforcement (glass fabric/mat) on a mold treated with release agent, then impregnate it with resin using brushes or rollers, building up plies until the design thickness is reached and curing at room or elevated temperature.",
    advantages: [
      "设备投资少，模具成本低",
      "对产品形状和尺寸限制小",
      "适合小批量、大尺寸制品",
      "工艺灵活，便于局部加强",
    ],
    advantagesEn: [
      "Low capital and tooling cost",
      "Few constraints on part shape or size",
      "Well suited to low-volume, large parts",
      "Flexible — easy to add local reinforcement",
    ],
    disadvantages: [
      "劳动强度大，生产效率低",
      "产品质量受操作者技能影响大",
      "苯乙烯等挥发物排放",
      "纤维含量较低（30-40%）",
    ],
    disadvantagesEn: [
      "Labor-intensive, low throughput",
      "Quality depends heavily on operator skill",
      "Open-mold styrene/VOC emissions",
      "Lower fiber content (30–40 %)",
    ],
    applications: ["船舶外壳", "储罐", "冷却塔", "卫浴制品", "雕塑模型"],
    applicationsEn: [
      "Boat hulls",
      "Storage tanks",
      "Cooling towers",
      "Sanitary ware",
      "Sculpture / pattern models",
    ],
    keyParameters: ["树脂配比", "固化温度", "铺层设计", "脱模剂选择"],
    keyParametersEn: [
      "Resin formulation ratio",
      "Cure temperature",
      "Lay-up schedule",
      "Release-agent selection",
    ],
  },
  {
    id: "filament-winding",
    name: "缠绕成型",
    nameEn: "Filament Winding",
    description:
      "缠绕成型是将浸渍树脂的连续纤维或布带按照一定规律缠绕在芯模上，然后固化脱模成为制品的工艺方法。缠绕角度、张力和树脂含量可以精确控制，适合制造回转体结构。",
    descriptionEn:
      "Filament winding deposits resin-impregnated continuous fibers or tapes onto a rotating mandrel along a controlled pattern; the part is then cured and demolded. Winding angle, tension, and resin content are precisely tunable, making it ideal for axisymmetric parts.",
    advantages: [
      "纤维含量高（60-80%），强度高",
      "自动化程度高，产品质量稳定",
      "适合大批量生产",
      "原材料利用率高",
    ],
    advantagesEn: [
      "High fiber volume fraction (60–80 %), high strength",
      "Highly automated, consistent quality",
      "Suited to high-volume production",
      "Excellent raw-material utilization",
    ],
    disadvantages: [
      "设备投资较大",
      "主要适合回转体形状",
      "表面质量不如模压制品",
      "芯模设计制造较复杂",
    ],
    disadvantagesEn: [
      "Significant capital investment",
      "Limited to axisymmetric geometries",
      "Surface finish below compression-molded parts",
      "Mandrel design and fabrication can be complex",
    ],
    applications: ["压力容器", "管道", "储罐", "火箭发动机壳体", "传动轴"],
    applicationsEn: [
      "Pressure vessels",
      "Pipes",
      "Storage tanks",
      "Rocket motor cases",
      "Drive shafts",
    ],
    keyParameters: ["缠绕角度", "纤维张力", "树脂含量", "缠绕速度"],
    keyParametersEn: [
      "Winding angle",
      "Fiber tension",
      "Resin content",
      "Winding speed",
    ],
  },
  {
    id: "pultrusion",
    name: "拉挤成型",
    nameEn: "Pultrusion",
    description:
      "拉挤成型是将浸渍树脂的连续纤维、毡材等增强材料在牵引力作用下通过加热模具，经成型固化，连续不断地生产等截面复合材料型材的工艺。",
    descriptionEn:
      "Pultrusion pulls resin-impregnated continuous fibers and mats through a heated die under tension, continuously producing constant-cross-section composite profiles that cure in line.",
    advantages: [
      "连续化生产，效率高",
      "纵向强度高，纤维含量可达70%",
      "产品尺寸精度高",
      "可制造各种截面型材",
    ],
    advantagesEn: [
      "Continuous, high-throughput production",
      "High longitudinal strength; fiber content up to 70 %",
      "Tight dimensional tolerances",
      "Wide range of producible cross-sections",
    ],
    disadvantages: [
      "仅适合等截面产品",
      "横向强度相对较低",
      "模具成本较高",
      "产品设计灵活性有限",
    ],
    disadvantagesEn: [
      "Limited to constant-cross-section parts",
      "Relatively low transverse strength",
      "Higher tooling cost",
      "Limited design flexibility",
    ],
    applications: ["电缆桥架", "栏杆扶手", "门窗型材", "建筑结构型材", "梯子"],
    applicationsEn: [
      "Cable trays",
      "Handrails",
      "Window/door profiles",
      "Structural building profiles",
      "Ladders",
    ],
    keyParameters: ["牵引速度", "模具温度", "纤维排布", "树脂体系"],
    keyParametersEn: [
      "Pulling speed",
      "Die temperature",
      "Fiber architecture",
      "Resin system",
    ],
  },
  {
    id: "compression-molding",
    name: "模压成型",
    nameEn: "Compression Molding (SMC/BMC)",
    description:
      "模压成型是将SMC（片状模塑料）或BMC（团状模塑料）放入加热的金属模具中，在压力作用下使物料充满模腔并固化成型的工艺。适合大批量生产结构复杂的制品。",
    descriptionEn:
      "Compression molding places SMC (sheet molding compound) or BMC (bulk molding compound) into a heated metal die; pressure forces the charge to fill the cavity and cure. It suits high-volume production of geometrically complex parts.",
    advantages: [
      "生产效率高，适合大批量",
      "产品尺寸精度高，表面质量好",
      "两面光滑",
      "可嵌入金属件",
    ],
    advantagesEn: [
      "High throughput, ideal for high-volume runs",
      "Tight tolerances and excellent surface finish",
      "Two-sided smooth (Class A) finish",
      "Metal inserts can be over-molded",
    ],
    disadvantages: [
      "模具和设备投资大",
      "产品尺寸受压机限制",
      "SMC/BMC原料成本较高",
      "设计变更困难",
    ],
    disadvantagesEn: [
      "High tooling and equipment cost",
      "Part size limited by press capacity",
      "SMC/BMC feedstock is relatively expensive",
      "Design changes are costly",
    ],
    applications: ["汽车零部件", "电器配件", "井盖", "建筑装饰板", "配电箱"],
    applicationsEn: [
      "Automotive parts",
      "Electrical components",
      "Manhole covers",
      "Architectural panels",
      "Switchgear enclosures",
    ],
    keyParameters: ["模压温度", "模压压力", "保压时间", "加料量"],
    keyParametersEn: [
      "Mold temperature",
      "Compression pressure",
      "Hold time",
      "Charge weight",
    ],
  },
  {
    id: "rtm",
    name: "RTM成型",
    nameEn: "Resin Transfer Molding",
    description:
      "RTM是将干态增强材料预先铺放在闭合模腔中，合模后将树脂在压力下注入模腔浸渍增强材料并固化的成型工艺。LRTM（轻型RTM）是其低压力变体。",
    descriptionEn:
      "Resin Transfer Molding (RTM) places dry reinforcement into a closed mold; after clamping, resin is injected under pressure to impregnate the preform and cure. LRTM is the low-pressure variant.",
    advantages: [
      "产品两面光滑",
      "尺寸精度高",
      "苯乙烯排放低（闭模）",
      "可实现一定程度的自动化",
    ],
    advantagesEn: [
      "Two-sided smooth finish",
      "High dimensional accuracy",
      "Low styrene/VOC emissions (closed mold)",
      "Partially automatable",
    ],
    disadvantages: [
      "模具精度要求高",
      "大型制品注入困难",
      "预成型体制作耗时",
      "设备投资中等偏高",
    ],
    disadvantagesEn: [
      "Demands high mold precision",
      "Large parts can be hard to fully impregnate",
      "Preform fabrication is time-consuming",
      "Moderate-to-high capital cost",
    ],
    applications: ["汽车结构件", "轨道交通", "航空内饰", "风电零部件"],
    applicationsEn: [
      "Automotive structural parts",
      "Rail rolling stock",
      "Aerospace interiors",
      "Wind energy components",
    ],
    keyParameters: ["注入压力", "树脂流速", "模具温度", "预成型体设计"],
    keyParametersEn: [
      "Injection pressure",
      "Resin flow rate",
      "Mold temperature",
      "Preform design",
    ],
  },
  {
    id: "vacuum-infusion",
    name: "真空导入成型",
    nameEn: "Vacuum Infusion (VARTM)",
    description:
      "真空导入是在单面模具上铺放干态增强材料和辅助材料，用真空袋密封后抽真空，利用大气压力将树脂导入模腔浸渍增强材料的成型工艺。是大型制品最主流的成型方法。",
    descriptionEn:
      "Vacuum infusion (VARTM) lays dry reinforcement and consumables on a single-sided mold sealed under a vacuum bag; atmospheric pressure draws resin through the laminate to impregnate it. It is the dominant process for large parts.",
    advantages: [
      "适合超大尺寸制品",
      "纤维含量高（55-65%）",
      "产品质量一致性好",
      "苯乙烯排放极低",
    ],
    advantagesEn: [
      "Suited to very large parts",
      "High fiber content (55–65 %)",
      "Excellent batch-to-batch consistency",
      "Very low styrene/VOC emissions",
    ],
    disadvantages: [
      "辅材消耗较大（真空袋、导流网等）",
      "对操作和密封要求高",
      "树脂体系选择受限",
      "生产周期较长",
    ],
    disadvantagesEn: [
      "Heavy consumable usage (bagging, flow media, etc.)",
      "Demands tight sealing and skilled operation",
      "Restricted resin-system choice",
      "Longer cycle time",
    ],
    applications: ["风电叶片", "大型游艇", "桥梁面板", "轨道车辆车身"],
    applicationsEn: [
      "Wind blades",
      "Large yachts",
      "Bridge decks",
      "Rail vehicle bodies",
    ],
    keyParameters: ["真空度", "树脂流道设计", "导流介质选择", "树脂适用期"],
    keyParametersEn: [
      "Vacuum level",
      "Resin flow-channel layout",
      "Flow-media selection",
      "Resin pot life",
    ],
  },
  {
    id: "roll-wrapping",
    name: "卷管工艺",
    nameEn: "Roll Wrapping (Sheet Rolling)",
    description:
      "卷管工艺将预浸料按设计角度裁剪后卷绕在抛光金属芯轴上，外层缠绕收缩带提供压实力，入烘箱固化后脱模、磨削、切割得到高质量复合材料管材。是制造碳纤维杆/管类制品（钓鱼竿、自行车架管、高尔夫杆身、无人机臂、滑雪杖）的主流工艺。",
    descriptionEn:
      "Roll wrapping cuts prepreg sheets at designed fiber angles, rolls them onto a polished steel mandrel, wraps the outside with shrink tape for consolidation pressure, oven-cures, then demolds, sands, and cuts to produce high-quality composite tubes. It is the mainstream process for carbon-fiber tubular goods — fishing rods, bicycle frame tubes, golf shafts, UAV booms, ski poles.",
    advantages: [
      "纤维角度自由组合（0/±θ/90），壁厚和铺层精确可控",
      "纤维含量高（60-70%），管材比强度/比刚度优异",
      "芯轴侧表面光滑、近镜面，外观与同轴度好",
      "适合多规格小批量定制和快速打样",
    ],
    advantagesEn: [
      "Free combination of fiber angles (0/±θ/90); precise wall-thickness and lay-up control",
      "High fiber content (60–70 %), excellent specific strength and stiffness",
      "Near-mirror inner surface (mandrel side) with tight concentricity",
      "Well suited to multi-spec, small-batch customization and rapid prototyping",
    ],
    disadvantages: [
      "仅适合等截面圆管/锥管，异形截面难做",
      "预浸料成本高，且需冷藏运输与保质期管理",
      "依赖人工卷制，操作技能直接影响一致性",
      "脱芯困难时易划伤内壁，芯轴需定期维护或重新镀铬",
    ],
    disadvantagesEn: [
      "Limited to constant-section round or tapered tubes — non-circular sections are difficult",
      "Prepreg is expensive and requires cold-chain handling plus shelf-life tracking",
      "Manual rolling — operator skill directly impacts consistency",
      "Demolding can scratch the inner wall; mandrels need regular maintenance or re-chroming",
    ],
    applications: [
      "钓鱼竿",
      "自行车架/座管",
      "高尔夫杆身",
      "无人机臂/桨轴",
      "羽毛球/网球拍杆",
      "登山杖/滑雪杖",
    ],
    applicationsEn: [
      "Fishing rods",
      "Bicycle frame and seat tubes",
      "Golf shafts",
      "UAV booms / propeller shafts",
      "Badminton & tennis racket shafts",
      "Trekking & ski poles",
    ],
    keyParameters: [
      "预浸料铺层角度与顺序",
      "芯轴锥度与表面粗糙度",
      "收缩带张力与缠绕角",
      "固化温度曲线",
    ],
    keyParametersEn: [
      "Prepreg ply orientation and stacking sequence",
      "Mandrel taper and surface roughness",
      "Shrink-tape tension and wrap angle",
      "Cure temperature profile",
    ],
  },
  {
    id: "3d-printing",
    name: "3D打印复合材料",
    nameEn: "Composite 3D Printing",
    description:
      "复合材料3D打印是利用增材制造技术直接成型连续或短切纤维增强复合材料的新兴工艺。包括连续纤维FDM、短切纤维SLS等多种技术路线。",
    descriptionEn:
      "Composite 3D printing uses additive manufacturing to fabricate continuous- or chopped-fiber reinforced composites directly. Routes include continuous-fiber FDM, chopped-fiber SLS, and others.",
    advantages: [
      "无需模具，设计自由度极高",
      "快速原型制造",
      "可制造复杂内部结构",
      "适合小批量定制",
    ],
    advantagesEn: [
      "No tooling required, high design freedom",
      "Rapid prototyping",
      "Complex internal geometries are feasible",
      "Suited to small-batch customization",
    ],
    disadvantages: [
      "力学性能不如传统工艺",
      "打印速度较慢",
      "材料种类有限",
      "设备成本高",
    ],
    disadvantagesEn: [
      "Mechanical performance below traditional processes",
      "Slow build rate",
      "Limited material catalog",
      "High equipment cost",
    ],
    applications: ["原型验证", "工装夹具", "航空零件", "医疗器械", "无人机"],
    applicationsEn: [
      "Prototyping",
      "Tooling and fixtures",
      "Aerospace parts",
      "Medical devices",
      "UAVs",
    ],
    keyParameters: ["打印温度", "纤维含量", "层间粘合", "路径规划"],
    keyParametersEn: [
      "Print temperature",
      "Fiber content",
      "Interlayer bonding",
      "Toolpath planning",
    ],
  },
];

export const standards = [
  { code: "GB/T 1449", name: "纤维增强塑料弯曲性能试验方法", type: "国标" },
  { code: "GB/T 1447", name: "纤维增强塑料拉伸性能试验方法", type: "国标" },
  { code: "GB/T 2567", name: "树脂浇铸体性能试验方法", type: "国标" },
  { code: "GB/T 8237", name: "纤维增强塑料用液体不饱和聚酯树脂", type: "国标" },
  { code: "GB/T 31539", name: "纤维增强塑料拉挤型材", type: "国标" },
  { code: "HG/T 3362", name: "玻璃纤维增强塑料格栅", type: "行标" },
  { code: "ASTM D3039", name: "Tensile Properties of Polymer Matrix Composites", type: "国际" },
  { code: "ASTM D790", name: "Flexural Properties of Unreinforced and Reinforced Plastics", type: "国际" },
  { code: "ISO 14125", name: "Fibre-reinforced Plastic Composites — Flexural Properties", type: "国际" },
];
