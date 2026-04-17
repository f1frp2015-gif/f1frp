export interface Process {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  applications: string[];
  keyParameters: string[];
  image?: string;
}

export const processes: Process[] = [
  {
    id: "hand-layup",
    name: "手糊成型",
    nameEn: "Hand Lay-up",
    description:
      "手糊成型是最传统、应用最广泛的玻璃钢成型工艺。操作人员将增强材料（玻纤布/毡）铺放在涂有脱模剂的模具表面，用刷子或辊子将树脂浸渍到增强材料中，逐层铺放直至达到设计厚度，然后在常温或加热条件下固化成型。",
    advantages: [
      "设备投资少，模具成本低",
      "对产品形状和尺寸限制小",
      "适合小批量、大尺寸制品",
      "工艺灵活，便于局部加强",
    ],
    disadvantages: [
      "劳动强度大，生产效率低",
      "产品质量受操作者技能影响大",
      "苯乙烯等挥发物排放",
      "纤维含量较低（30-40%）",
    ],
    applications: ["船舶外壳", "储罐", "冷却塔", "卫浴制品", "雕塑模型"],
    keyParameters: ["树脂配比", "固化温度", "铺层设计", "脱模剂选择"],
  },
  {
    id: "filament-winding",
    name: "缠绕成型",
    nameEn: "Filament Winding",
    description:
      "缠绕成型是将浸渍树脂的连续纤维或布带按照一定规律缠绕在芯模上，然后固化脱模成为制品的工艺方法。缠绕角度、张力和树脂含量可以精确控制，适合制造回转体结构。",
    advantages: [
      "纤维含量高（60-80%），强度高",
      "自动化程度高，产品质量稳定",
      "适合大批量生产",
      "原材料利用率高",
    ],
    disadvantages: [
      "设备投资较大",
      "主要适合回转体形状",
      "表面质量不如模压制品",
      "芯模设计制造较复杂",
    ],
    applications: ["压力容器", "管道", "储罐", "火箭发动机壳体", "传动轴"],
    keyParameters: ["缠绕角度", "纤维张力", "树脂含量", "缠绕速度"],
  },
  {
    id: "pultrusion",
    name: "拉挤成型",
    nameEn: "Pultrusion",
    description:
      "拉挤成型是将浸渍树脂的连续纤维、毡材等增强材料在牵引力作用下通过加热模具，经成型固化，连续不断地生产等截面复合材料型材的工艺。",
    advantages: [
      "连续化生产，效率高",
      "纵向强度高，纤维含量可达70%",
      "产品尺寸精度高",
      "可制造各种截面型材",
    ],
    disadvantages: [
      "仅适合等截面产品",
      "横向强度相对较低",
      "模具成本较高",
      "产品设计灵活性有限",
    ],
    applications: ["电缆桥架", "栏杆扶手", "门窗型材", "建筑结构型材", "梯子"],
    keyParameters: ["牵引速度", "模具温度", "纤维排布", "树脂体系"],
  },
  {
    id: "compression-molding",
    name: "模压成型",
    nameEn: "Compression Molding (SMC/BMC)",
    description:
      "模压成型是将SMC（片状模塑料）或BMC（团状模塑料）放入加热的金属模具中，在压力作用下使物料充满模腔并固化成型的工艺。适合大批量生产结构复杂的制品。",
    advantages: [
      "生产效率高，适合大批量",
      "产品尺寸精度高，表面质量好",
      "两面光滑",
      "可嵌入金属件",
    ],
    disadvantages: [
      "模具和设备投资大",
      "产品尺寸受压机限制",
      "SMC/BMC原料成本较高",
      "设计变更困难",
    ],
    applications: ["汽车零部件", "电器配件", "井盖", "建筑装饰板", "配电箱"],
    keyParameters: ["模压温度", "模压压力", "保压时间", "加料量"],
  },
  {
    id: "rtm",
    name: "RTM成型",
    nameEn: "Resin Transfer Molding",
    description:
      "RTM是将干态增强材料预先铺放在闭合模腔中，合模后将树脂在压力下注入模腔浸渍增强材料并固化的成型工艺。LRTM（轻型RTM）是其低压力变体。",
    advantages: [
      "产品两面光滑",
      "尺寸精度高",
      "苯乙烯排放低（闭模）",
      "可实现一定程度的自动化",
    ],
    disadvantages: [
      "模具精度要求高",
      "大型制品注入困难",
      "预成型体制作耗时",
      "设备投资中等偏高",
    ],
    applications: ["汽车结构件", "轨道交通", "航空内饰", "风电零部件"],
    keyParameters: ["注入压力", "树脂流速", "模具温度", "预成型体设计"],
  },
  {
    id: "vacuum-infusion",
    name: "真空导入成型",
    nameEn: "Vacuum Infusion (VARTM)",
    description:
      "真空导入是在单面模具上铺放干态增强材料和辅助材料，用真空袋密封后抽真空，利用大气压力将树脂导入模腔浸渍增强材料的成型工艺。是大型制品最主流的成型方法。",
    advantages: [
      "适合超大尺寸制品",
      "纤维含量高（55-65%）",
      "产品质量一致性好",
      "苯乙烯排放极低",
    ],
    disadvantages: [
      "辅材消耗较大（真空袋、导流网等）",
      "对操作和密封要求高",
      "树脂体系选择受限",
      "生产周期较长",
    ],
    applications: ["风电叶片", "大型游艇", "桥梁面板", "轨道车辆车身"],
    keyParameters: ["真空度", "树脂流道设计", "导流介质选择", "树脂适用期"],
  },
  {
    id: "3d-printing",
    name: "3D打印复合材料",
    nameEn: "Composite 3D Printing",
    description:
      "复合材料3D打印是利用增材制造技术直接成型连续或短切纤维增强复合材料的新兴工艺。包括连续纤维FDM、短切纤维SLS等多种技术路线。",
    advantages: [
      "无需模具，设计自由度极高",
      "快速原型制造",
      "可制造复杂内部结构",
      "适合小批量定制",
    ],
    disadvantages: [
      "力学性能不如传统工艺",
      "打印速度较慢",
      "材料种类有限",
      "设备成本高",
    ],
    applications: ["原型验证", "工装夹具", "航空零件", "医疗器械", "无人机"],
    keyParameters: ["打印温度", "纤维含量", "层间粘合", "路径规划"],
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
