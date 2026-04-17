export interface FormulaIngredient {
  name: string;
  role: string;
  amount: string;
  note?: string;
}

export interface ProcessingParam {
  name: string;
  value: string;
  note?: string;
}

export interface ExpectedProperty {
  name: string;
  value: string;
  standard?: string;
  note?: string;
}

export interface Formula {
  id: string;
  name: string;
  process: string;
  processId: string;
  category: string;
  application: string;
  difficulty: "入门" | "中级" | "高级";
  description: string;
  resinSystem: FormulaIngredient[];
  reinforcement: FormulaIngredient[];
  auxiliaries: FormulaIngredient[];
  processing: ProcessingParam[];
  properties: ExpectedProperty[];
  tips: string[];
  safetyNotes: string[];
}

export const processFilters = [
  { id: "all", name: "全部工艺", icon: "📋" },
  { id: "hand-layup", name: "手糊成型", icon: "🖌️" },
  { id: "filament-winding", name: "缠绕成型", icon: "🔄" },
  { id: "pultrusion", name: "拉挤成型", icon: "➡️" },
  { id: "compression", name: "模压成型", icon: "⬇️" },
  { id: "rtm", name: "RTM成型", icon: "💉" },
  { id: "vacuum-infusion", name: "真空导入", icon: "🌀" },
  { id: "repair", name: "修补/防腐", icon: "🔧" },
];

export const categoryFilters = [
  { id: "all", name: "全部类型" },
  { id: "structural", name: "结构制品" },
  { id: "corrosion", name: "防腐工程" },
  { id: "marine", name: "船舶/水工" },
  { id: "pipe-tank", name: "管道储罐" },
  { id: "profile", name: "型材/格栅" },
  { id: "wind", name: "风电叶片" },
  { id: "auto", name: "汽车/交通" },
  { id: "building", name: "建筑装饰" },
  { id: "electrical", name: "电气绝缘" },
];

export const formulas: Formula[] = [
  // ═══════════════════════════════════════════
  // 手糊成型配方
  // ═══════════════════════════════════════════
  {
    id: "hl-001",
    name: "通用手糊玻璃钢制品配方",
    process: "手糊成型",
    processId: "hand-layup",
    category: "structural",
    application: "一般结构制品、外壳、罩壳、盖板",
    difficulty: "入门",
    description: "最基础的手糊成型配方，使用191#通用树脂配合玻纤短切毡和方格布，适合初学者和一般性能要求的制品。",
    resinSystem: [
      { name: "191#不饱和聚酯树脂", role: "基体树脂", amount: "100份（重量）", note: "邻苯型，通用级" },
      { name: "MEKP固化剂", role: "引发剂", amount: "1.0-1.5份", note: "Butanox M-50或同等品" },
      { name: "环烷酸钴促进剂", role: "促进剂", amount: "0.5-1.0份", note: "6%钴含量溶液" },
    ],
    reinforcement: [
      { name: "E-玻纤短切毡 300g/m²", role: "基层增强", amount: "第1、3、5层", note: "提供各向同性" },
      { name: "E-玻纤方格布 400g/m²", role: "主增强层", amount: "第2、4层", note: "提供强度和刚度" },
    ],
    auxiliaries: [
      { name: "胶衣树脂（异酞型）", role: "表面涂层", amount: "300-500g/m²", note: "先刷胶衣再铺层" },
      { name: "蜡液脱模剂", role: "脱模", amount: "3-5遍涂覆", note: "新模具至少5遍" },
      { name: "苯乙烯", role: "稀释剂（可选）", amount: "3-5份", note: "降低粘度，夏天慎用" },
    ],
    processing: [
      { name: "工作环境温度", value: "15-30°C", note: "最佳20-25°C" },
      { name: "胶衣凝胶时间", value: "20-40分钟", note: "指触不粘后开始铺层" },
      { name: "树脂凝胶时间", value: "15-30分钟", note: "通过调固化剂用量控制" },
      { name: "脱模时间", value: "12-24小时", note: "常温固化" },
      { name: "后固化", value: "60°C × 4h（可选）", note: "提高HDT和强度" },
      { name: "纤维含量目标", value: "30-35%（重量）" },
    ],
    properties: [
      { name: "拉伸强度", value: "80-120 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", value: "120-180 MPa", standard: "GB/T 1449" },
      { name: "弯曲模量", value: "6-8 GPa", standard: "GB/T 1449" },
      { name: "巴氏硬度", value: "35-40", standard: "GB/T 3854" },
      { name: "制品厚度", value: "3-5 mm（5层）" },
    ],
    tips: [
      "固化剂和促进剂绝对不能直接混合！必须先将一种搅入树脂后再加另一种",
      "铺层时要用辊子充分排气泡，否则层间容易产生白斑（气泡缺陷）",
      "胶衣刷涂要均匀，厚度0.3-0.5mm，太薄容易露纤维纹，太厚容易龟裂",
      "夏季温度高时减少固化剂用量，冬季增加或使用加热辅助固化",
    ],
    safetyNotes: [
      "苯乙烯有刺激性气味，必须在通风良好的环境下操作",
      "MEKP是有机过氧化物，避免接触皮肤和眼睛",
      "佩戴防有机气体口罩、防护手套和护目镜",
    ],
  },
  {
    id: "hl-002",
    name: "船舶/水工手糊防水配方",
    process: "手糊成型",
    processId: "hand-layup",
    category: "marine",
    application: "游艇、渔船、水箱、水池防腐内衬",
    difficulty: "中级",
    description: "针对长期水浸泡环境优化的手糊配方，使用异酞型或乙烯基酯树脂配合ECR耐腐蚀玻纤，耐水性显著优于通用配方。",
    resinSystem: [
      { name: "197#异酞型不饱和聚酯树脂", role: "基体树脂", amount: "100份", note: "异酞型耐水性优于邻苯型" },
      { name: "MEKP固化剂", role: "引发剂", amount: "1.0-1.5份" },
      { name: "环烷酸钴促进剂", role: "促进剂", amount: "0.5-0.8份" },
    ],
    reinforcement: [
      { name: "ECR玻纤短切毡 300g/m²", role: "防渗层", amount: "内表面2层", note: "ECR耐腐蚀性能优于E-玻纤" },
      { name: "ECR玻纤方格布 600g/m²", role: "结构层", amount: "中间3-4层", note: "高克重提升效率" },
      { name: "ECR玻纤表面毡 30g/m²", role: "富树脂层", amount: "最内层", note: "配合胶衣形成防渗屏障" },
    ],
    auxiliaries: [
      { name: "异酞型胶衣树脂", role: "耐水表面层", amount: "400-600g/m²", note: "建议NPG改性异酞型" },
      { name: "PVA脱模剂", role: "脱模", amount: "均匀涂覆", note: "水溶性脱模膜" },
      { name: "触变剂（气相二氧化硅）", role: "防流挂", amount: "1-2份", note: "立面施工必须添加" },
    ],
    processing: [
      { name: "工作环境温度", value: "18-28°C" },
      { name: "环境湿度", value: "<80%", note: "高湿度影响固化和耐水性" },
      { name: "胶衣厚度", value: "0.4-0.6mm", note: "分两遍刷涂" },
      { name: "层间间隔", value: "胶衣凝胶后立即", note: "避免层间粘结不良" },
      { name: "脱模时间", value: "24-48小时" },
      { name: "后固化", value: "80°C × 8h", note: "强烈建议，大幅提升耐水性" },
    ],
    properties: [
      { name: "拉伸强度", value: "100-140 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", value: "150-200 MPa", standard: "GB/T 1449" },
      { name: "吸水率（24h）", value: "<0.3%", standard: "GB/T 1462" },
      { name: "巴氏硬度", value: "40-45" },
    ],
    tips: [
      "水下/浸泡环境必须后固化，未后固化制品耐水性大打折扣",
      "胶衣+表面毡+2层短切毡形成的防渗层是关键，不能省略",
      "ECR玻纤比E-玻纤贵约30%，但在水环境中寿命可延长2-3倍",
      "施工环境湿度控制很重要，雨天或湿度>80%时停止施工",
    ],
    safetyNotes: [
      "佩戴防有机气体口罩和防护手套",
      "气相二氧化硅粉尘细微，调配时佩戴防尘口罩",
    ],
  },
  {
    id: "hl-003",
    name: "耐强酸FRP防腐内衬配方",
    process: "手糊成型",
    processId: "hand-layup",
    category: "corrosion",
    application: "化工储罐内衬、酸洗槽、电镀槽、烟气脱硫塔内衬",
    difficulty: "高级",
    description: "使用双酚A环氧型乙烯基酯树脂的高端防腐配方，可耐受强酸（盐酸、硫酸≤98%）和多数有机溶剂，是化工防腐领域的标准方案。",
    resinSystem: [
      { name: "双酚A环氧型乙烯基酯树脂", role: "基体树脂", amount: "100份", note: "如力联思Palatal A430或亚什兰470" },
      { name: "MEKP固化剂", role: "引发剂", amount: "1.0-1.5份", note: "根据温度调整" },
      { name: "环烷酸钴促进剂", role: "促进剂", amount: "0.2-0.4份", note: "乙烯基酯树脂促进剂用量低于UPR" },
      { name: "DMA促进剂（可选）", role: "辅助促进", amount: "0.05-0.1份", note: "低温施工时添加" },
    ],
    reinforcement: [
      { name: "ECR玻纤表面毡 30g/m²", role: "富树脂层", amount: "最内层1层" },
      { name: "ECR玻纤短切毡 450g/m²", role: "防渗层", amount: "2层" },
      { name: "ECR玻纤方格布 800g/m²", role: "结构层", amount: "根据厚度要求", note: "总厚度不小于4.5mm" },
    ],
    auxiliaries: [
      { name: "乙烯基酯胶衣树脂", role: "防腐表面层", amount: "500g/m²", note: "必须使用乙烯基酯胶衣" },
      { name: "气相二氧化硅", role: "触变剂", amount: "1-2份" },
      { name: "消泡剂", role: "消除气泡", amount: "0.1-0.3份", note: "BYK-A530或同等品" },
    ],
    processing: [
      { name: "工作环境温度", value: "20-30°C", note: "乙烯基酯对温度更敏感" },
      { name: "树脂凝胶时间", value: "30-45分钟", note: "比UPR长" },
      { name: "层间间隔", value: "上一层凝胶后立即", note: "确保层间粘结" },
      { name: "常温固化", value: "48-72小时" },
      { name: "后固化", value: "80°C × 4h + 120°C × 2h", note: "阶梯升温，防腐工程必须后固化" },
      { name: "内衬总厚度", value: "≥4.5mm", note: "含防渗层和结构层" },
    ],
    properties: [
      { name: "拉伸强度", value: "120-160 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", value: "180-240 MPa", standard: "GB/T 1449" },
      { name: "热变形温度HDT", value: "120-130°C（后固化后）", standard: "GB/T 1634" },
      { name: "耐20% HCl", value: "合格（长期浸泡）", standard: "GB/T 3857" },
      { name: "耐70% H₂SO₄", value: "合格（长期浸泡）", standard: "GB/T 3857" },
    ],
    tips: [
      "乙烯基酯树脂对温度敏感，促进剂用量过大容易暴聚（放热失控）",
      "后固化是防腐性能的关键！未后固化的乙烯基酯制品防腐等级大幅降低",
      "防渗层（表面毡+2层短切毡）树脂含量应≥90%，这是防腐的核心屏障",
      "施工前确认介质详细成分和温度，不同酸种和浓度对树脂选择有影响",
      "参考HG/T 20696-1999《玻璃钢化工设备设计规定》进行结构设计",
    ],
    safetyNotes: [
      "乙烯基酯树脂苯乙烯含量高，必须强化通风",
      "DMA促进剂有毒性，操作时佩戴手套和口罩",
      "后固化时释放苯乙烯蒸气，确保烘箱通风",
    ],
  },

  // ═══════════════════════════════════════════
  // 缠绕成型配方
  // ═══════════════════════════════════════════
  {
    id: "fw-001",
    name: "玻璃钢管道缠绕配方",
    process: "缠绕成型",
    processId: "filament-winding",
    category: "pipe-tank",
    application: "给排水管道、工艺管道、电缆保护管",
    difficulty: "中级",
    description: "标准的FRP缠绕管道树脂配方，使用间苯型UPR配合连续玻纤纱和石英砂夹层，适合DN300-DN3000口径管道。",
    resinSystem: [
      { name: "3301间苯型不饱和聚酯树脂", role: "基体树脂", amount: "100份", note: "间苯型耐水优于邻苯型" },
      { name: "TBPB引发剂", role: "高温引发剂", amount: "0.5-1.0份", note: "过氧化苯甲酸叔丁酯" },
      { name: "BPO引发剂", role: "中温引发剂", amount: "0.3-0.5份", note: "过氧化苯甲酰" },
    ],
    reinforcement: [
      { name: "E-玻纤无碱纱 2400tex", role: "环向增强", amount: "按设计壁厚", note: "缠绕角54.75°（±55°）为常用" },
      { name: "E-玻纤短切纱", role: "内衬层增强", amount: "短切喷射", note: "内衬层纤维含量20-30%" },
      { name: "石英砂（40-70目）", role: "中间夹砂层", amount: "按壁厚设计", note: "提高刚度，降低成本" },
    ],
    auxiliaries: [
      { name: "内衬树脂（富树脂层）", role: "防渗内衬", amount: "2-3mm", note: "纤维含量≤30%" },
      { name: "外保护层树脂", role: "抗老化", amount: "0.3-0.5mm", note: "含UV稳定剂" },
      { name: "硅烷偶联剂", role: "砂/树脂界面", amount: "砂量的0.5%", note: "KH-550或KH-570" },
    ],
    processing: [
      { name: "缠绕角度", value: "±(50-55)°", note: "管道常用角度" },
      { name: "纤维张力", value: "20-50N/束", note: "张力均匀是关键" },
      { name: "缠绕速度", value: "15-30m/min", note: "根据管径调整" },
      { name: "芯模转速", value: "5-15rpm", note: "根据管径调整" },
      { name: "固化温度", value: "60-80°C（加热固化）", note: "或常温24h+后固化" },
      { name: "脱模", value: "液压脱模", note: "固化完全后脱模" },
    ],
    properties: [
      { name: "环向拉伸强度", value: "150-250 MPa", standard: "GB/T 1447" },
      { name: "轴向拉伸强度", value: "60-100 MPa" },
      { name: "环刚度(DN1000)", value: "SN2500-SN10000", standard: "GB/T 21238" },
      { name: "巴氏硬度", value: "≥40" },
      { name: "内衬吸水率", value: "<0.2%" },
    ],
    tips: [
      "管道壁结构通常为：内衬层→内结构层→夹砂层→外结构层→外保护层",
      "缠绕角度决定轴向/环向强度比，承内压管道用±55°接近最优",
      "夹砂层砂必须干燥（含水率<0.1%），否则影响层间粘结和长期耐水性",
      "参考GB/T 21238《玻璃纤维增强塑料夹砂管》进行设计和检验",
    ],
    safetyNotes: [
      "缠绕车间苯乙烯浓度较高，必须强制排风",
      "石英砂粉尘需防护",
    ],
  },
  {
    id: "fw-002",
    name: "高压FRP储罐缠绕配方",
    process: "缠绕成型",
    processId: "filament-winding",
    category: "pipe-tank",
    application: "化工储罐、压力容器（0.1-1.0MPa）、运输罐",
    difficulty: "高级",
    description: "高性能缠绕储罐配方，使用乙烯基酯树脂配合高强玻纤，适合有内压和化学腐蚀要求的储罐。",
    resinSystem: [
      { name: "双酚A环氧型乙烯基酯树脂", role: "防腐内衬树脂", amount: "100份", note: "内衬2-3mm" },
      { name: "间苯型不饱和聚酯树脂", role: "结构层树脂", amount: "100份", note: "结构层可用较经济的UPR" },
      { name: "MEKP固化剂", role: "引发剂", amount: "1.0-1.5份" },
      { name: "环烷酸钴", role: "促进剂", amount: "0.3-0.5份" },
    ],
    reinforcement: [
      { name: "ECR玻纤纱 4800tex", role: "螺旋缠绕", amount: "结构层主增强" },
      { name: "ECR玻纤短切毡 450g/m²", role: "内衬层", amount: "2-3层" },
      { name: "ECR玻纤表面毡 50g/m²", role: "富树脂层", amount: "最内层" },
    ],
    auxiliaries: [
      { name: "乙烯基酯胶衣", role: "内表面", amount: "0.5mm" },
      { name: "外表面UV涂层", role: "耐候保护", amount: "0.3mm" },
      { name: "加强筋（手糊）", role: "局部增强", amount: "按设计", note: "接管、人孔处" },
    ],
    processing: [
      { name: "内衬缠绕", value: "低角度(85-90°)", note: "环向缠绕" },
      { name: "结构层缠绕", value: "±55°交替", note: "封头部分调整角度" },
      { name: "纤维张力", value: "30-80N/束", note: "根据纱线tex调整" },
      { name: "固化", value: "内衬常温固化→结构层固化→整体后固化" },
      { name: "后固化", value: "80°C × 8h", note: "储罐必须后固化" },
      { name: "水压试验", value: "1.5倍设计压力", note: "保压30min无渗漏" },
    ],
    properties: [
      { name: "环向拉伸强度", value: "200-350 MPa" },
      { name: "设计内压", value: "0.1-1.0 MPa" },
      { name: "耐腐蚀（内衬）", value: "依介质确定", standard: "HG/T 20696" },
      { name: "设计寿命", value: "20年（防腐工况）" },
    ],
    tips: [
      "内衬层必须使用乙烯基酯树脂，结构层可换用更经济的树脂",
      "封头缠绕是技术难点，需要专门的封头成型程序",
      "储罐设计参考JC/T 587《纤维缠绕增强塑料贮罐》",
      "出厂前必须做水压试验和目视检验",
    ],
    safetyNotes: [
      "水压试验时远离设备，防止意外爆裂",
      "大型储罐内部施工需要受限空间作业许可",
    ],
  },

  // ═══════════════════════════════════════════
  // 拉挤成型配方
  // ═══════════════════════════════════════════
  {
    id: "pl-001",
    name: "FRP拉挤型材标准配方",
    process: "拉挤成型",
    processId: "pultrusion",
    category: "profile",
    application: "栏杆、桥架、梯子、门窗型材、格栅承载条",
    difficulty: "中级",
    description: "标准的FRP拉挤型材配方，使用邻苯型UPR配合玻纤纱和连续毡，产品满足EN 13706 E23级或GB/T 31539 I级要求。",
    resinSystem: [
      { name: "拉挤专用不饱和聚酯树脂", role: "基体树脂", amount: "100份", note: "低收缩、低粘度拉挤专用牌号" },
      { name: "TBPB引发剂", role: "高温引发", amount: "0.8-1.2份", note: "后区引发" },
      { name: "BPO引发剂", role: "中温引发", amount: "0.3-0.5份", note: "前区引发" },
      { name: "硬脂酸锌", role: "内脱模剂", amount: "2-4份", note: "关键！保证顺利脱模" },
      { name: "低收缩添加剂（LPA）", role: "减少收缩", amount: "3-5份", note: "改善表面质量" },
    ],
    reinforcement: [
      { name: "E-玻纤无碱直接纱 4800tex", role: "纵向增强", amount: "纤维含量60-70%", note: "提供纵向强度" },
      { name: "E-玻纤连续毡 450g/m²", role: "横向增强", amount: "外层包覆", note: "改善横向性能" },
      { name: "E-玻纤表面毡 30g/m²", role: "表面质量", amount: "最外层", note: "获得光滑表面" },
    ],
    auxiliaries: [
      { name: "CaCO₃填料", role: "降低成本/阻燃", amount: "10-30份", note: "过多影响力学性能" },
      { name: "色浆", role: "着色", amount: "2-5份", note: "拉挤制品常用灰/黄/绿" },
      { name: "UV稳定剂", role: "耐候性", amount: "0.5-1.0份", note: "户外产品必须添加" },
    ],
    processing: [
      { name: "模具温度（前区）", value: "100-120°C", note: "引发凝胶区" },
      { name: "模具温度（中区）", value: "130-150°C", note: "主固化区" },
      { name: "模具温度（后区）", value: "140-160°C", note: "完全固化区" },
      { name: "拉挤速度", value: "0.2-0.6 m/min", note: "根据截面大小和壁厚" },
      { name: "牵引力", value: "5-30 kN", note: "取决于截面周长和摩擦" },
      { name: "树脂浴温度", value: "20-30°C", note: "控制浸润效果" },
    ],
    properties: [
      { name: "纵向拉伸强度", value: "≥240 MPa", standard: "GB/T 31539" },
      { name: "纵向弯曲强度", value: "≥240 MPa", standard: "GB/T 31539" },
      { name: "纵向弯曲模量", value: "≥20 GPa", standard: "GB/T 31539" },
      { name: "巴氏硬度", value: "≥40", standard: "GB/T 3854" },
      { name: "纤维含量", value: "60-70%（重量）" },
    ],
    tips: [
      "内脱模剂（硬脂酸锌）是拉挤工艺的生命线，量不够会堵模",
      "三段温度梯度设计是核心技术，温度曲线需要针对每个配方和截面调试",
      "连续毡包覆层对横向强度贡献极大，不能全部用纱",
      "新配方开车前先用小截面试模，调通再上大截面",
      "拉挤速度不是越快越好，速度过快会固化不充分",
    ],
    safetyNotes: [
      "模具温度很高，防止烫伤",
      "树脂浴区域苯乙烯挥发集中，需要局部排风",
      "切割产生玻纤粉尘，切割区域需要除尘设备",
    ],
  },
  {
    id: "pl-002",
    name: "阻燃FRP格栅/型材配方",
    process: "拉挤成型",
    processId: "pultrusion",
    category: "profile",
    application: "化工平台格栅、海上石油平台、地铁/隧道用型材",
    difficulty: "高级",
    description: "满足阻燃一级要求的拉挤配方，通过添加ATH阻燃填料和使用阻燃树脂实现自熄性，氧指数≥32。",
    resinSystem: [
      { name: "阻燃不饱和聚酯树脂", role: "基体树脂", amount: "100份", note: "卤代或磷系阻燃型" },
      { name: "TBPB引发剂", role: "高温引发", amount: "1.0-1.5份" },
      { name: "BPO引发剂", role: "中温引发", amount: "0.3-0.5份" },
      { name: "硬脂酸锌", role: "内脱模剂", amount: "3-5份" },
    ],
    reinforcement: [
      { name: "E-玻纤直接纱 4800tex", role: "纵向增强", amount: "纤维含量55-65%" },
      { name: "E-玻纤连续毡 450g/m²", role: "横向增强", amount: "外层包覆" },
    ],
    auxiliaries: [
      { name: "ATH（氢氧化铝）", role: "阻燃填料", amount: "40-80份", note: "主要阻燃组分" },
      { name: "三氧化二锑（Sb₂O₃）", role: "阻燃协效剂", amount: "3-5份", note: "与卤素协效" },
      { name: "色浆（灰色/黄色）", role: "着色", amount: "2-4份" },
      { name: "UV稳定剂", role: "耐候", amount: "0.5-1.0份" },
    ],
    processing: [
      { name: "模具温度", value: "前110°C / 中140°C / 后155°C" },
      { name: "拉挤速度", value: "0.15-0.4 m/min", note: "ATH高填充导致速度降低" },
      { name: "树脂粘度", value: "需调整至浸润良好", note: "ATH使粘度大幅升高" },
    ],
    properties: [
      { name: "氧指数", value: "≥32", standard: "GB/T 2406" },
      { name: "阻燃等级", value: "FV-0 / 阻燃一级", standard: "GB/T 2408" },
      { name: "纵向弯曲强度", value: "≥180 MPa" },
      { name: "纵向弯曲模量", value: "≥15 GPa", note: "ATH高填充会降低模量" },
      { name: "烟密度", value: "≤75（NBS法）", standard: "ASTM E662" },
    ],
    tips: [
      "ATH用量越高阻燃越好，但力学性能和加工性越差，需要平衡",
      "ATH的粒径很关键，建议使用D50<10μm的细粒径ATH",
      "高填充配方粘度大，浸纱困难，可能需要注射式浸润替代浸槽",
      "化工平台格栅一般要求氧指数≥28，海上石油平台要求≥32",
    ],
    safetyNotes: [
      "卤代阻燃树脂燃烧时产生有毒气体",
      "ATH粉尘需佩戴防尘口罩",
      "三氧化二锑粉尘有刺激性",
    ],
  },

  // ═══════════════════════════════════════════
  // 模压成型配方
  // ═══════════════════════════════════════════
  {
    id: "cm-001",
    name: "SMC汽车外板配方",
    process: "模压成型",
    processId: "compression",
    category: "auto",
    application: "商用车保险杠、引擎盖、挡泥板、仪表盘骨架",
    difficulty: "高级",
    description: "A级表面SMC片材配方，满足汽车外覆盖件的表面质量和力学性能要求，可喷漆处理。",
    resinSystem: [
      { name: "低收缩SMC专用不饱和聚酯树脂", role: "基体树脂", amount: "100份", note: "高反应活性型" },
      { name: "聚苯乙烯LPA低收缩剂", role: "收缩补偿", amount: "30-40份", note: "A级表面的关键" },
      { name: "TBPB引发剂", role: "高温引发", amount: "1.0-1.5份" },
      { name: "MgO增稠剂", role: "化学增稠", amount: "2-4份", note: "片材制备后增稠至模压粘度" },
      { name: "硬脂酸锌", role: "内脱模剂", amount: "3-5份" },
    ],
    reinforcement: [
      { name: "E-玻纤短切纱 25mm", role: "增强纤维", amount: "25-30%（重量）", note: "SMC机组在线切割" },
    ],
    auxiliaries: [
      { name: "CaCO₃填料", role: "降低收缩/成本", amount: "100-150份", note: "1250目细粉" },
      { name: "色浆", role: "底色", amount: "3-5份" },
      { name: "PE薄膜", role: "SMC载体膜", amount: "上下各一层" },
    ],
    processing: [
      { name: "SMC片材熟化", value: "25°C × 24-72h", note: "MgO增稠达到可切割状态" },
      { name: "模压温度", value: "140-155°C" },
      { name: "模压压力", value: "5-10 MPa", note: "A级表面需要较高压力" },
      { name: "保压时间", value: "60-120秒/mm壁厚" },
      { name: "加料量", value: "模腔面积的60-70%" },
      { name: "开模温度", value: ">130°C", note: "过早开模导致翘曲" },
    ],
    properties: [
      { name: "拉伸强度", value: "60-80 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", value: "120-160 MPa", standard: "GB/T 1449" },
      { name: "冲击强度（缺口）", value: "30-50 kJ/m²", standard: "GB/T 1043" },
      { name: "线性收缩率", value: "<0.05%", note: "LPA补偿后" },
      { name: "表面质量", value: "A级（可直接喷漆）" },
    ],
    tips: [
      "LPA用量是A级表面的决定性因素，用量不足表面会有缩痕和波纹",
      "MgO增稠是SMC片材化的核心，增稠曲线需要严格控制",
      "模压料的流动性和加料位置决定了制品能否充满模腔",
      "CaCO₃粒径越细表面越好，但粘度越高",
      "适用标准: GB/T 12585《硬质模塑料 SMC和BMC》",
    ],
    safetyNotes: [
      "模压温度高，注意防烫伤",
      "液压机有夹伤风险，严格遵守操作规程",
    ],
  },

  // ═══════════════════════════════════════════
  // RTM配方
  // ═══════════════════════════════════════════
  {
    id: "rtm-001",
    name: "轻型RTM汽车结构件配方",
    process: "RTM成型",
    processId: "rtm",
    category: "auto",
    application: "汽车结构件、轨道交通内饰板、航空次结构件",
    difficulty: "高级",
    description: "LRTM（轻型RTM）工艺配方，使用低粘度环氧树脂配合多轴向织物预成型体，制品两面光滑，纤维含量高。",
    resinSystem: [
      { name: "RTM专用低粘度环氧树脂", role: "基体树脂", amount: "100份", note: "25°C粘度<500mPa·s" },
      { name: "改性胺类固化剂", role: "固化剂", amount: "按树脂配比", note: "慢速固化型，适用期>60min" },
    ],
    reinforcement: [
      { name: "多轴向经编织物 ±45°/0°/90° 600g/m²", role: "主增强", amount: "按设计铺层", note: "预成型体缝合固定" },
      { name: "玻纤或碳纤表面毡", role: "表面层", amount: "最外层", note: "改善表面质量" },
    ],
    auxiliaries: [
      { name: "预成型体粘结剂", role: "预成型固定", amount: "织物重量的2-5%", note: "热塑性粘结粉" },
      { name: "密封条（硅胶）", role: "模具密封", amount: "按模具周长" },
      { name: "半永久脱模剂", role: "脱模", amount: "每5-10模补涂", note: "Frekote 770NC或同等品" },
    ],
    processing: [
      { name: "预成型体制备", value: "裁剪→铺层→加热定型", note: "80°C × 10min" },
      { name: "注入压力", value: "0.1-0.3 MPa（LRTM）", note: "真空辅助降低压力" },
      { name: "真空度", value: ">0.09 MPa" },
      { name: "模具温度", value: "60-80°C" },
      { name: "注入时间", value: "5-30min", note: "取决于零件尺寸" },
      { name: "固化", value: "80°C × 2h + 120°C × 2h" },
      { name: "纤维体积含量", value: "50-60%" },
    ],
    properties: [
      { name: "拉伸强度", value: "250-400 MPa" },
      { name: "弯曲强度", value: "300-500 MPa" },
      { name: "弯曲模量", value: "15-25 GPa" },
      { name: "Tg（玻璃化转变）", value: "120-140°C" },
      { name: "表面质量", value: "两面光滑" },
    ],
    tips: [
      "树脂粘度是RTM成败的关键，注入前确认粘度在工艺窗口内",
      "预成型体的渗透率决定注入时间，可通过试验测定",
      "注入口和排气口位置设计影响浸润质量，需要做流动模拟",
      "模具密封不好会导致干斑（未浸润区域），必须确保真空不泄漏",
    ],
    safetyNotes: [
      "环氧树脂固化剂有致敏性，佩戴手套",
      "避免皮肤接触未固化的环氧树脂",
    ],
  },

  // ═══════════════════════════════════════════
  // 真空导入配方
  // ═══════════════════════════════════════════
  {
    id: "vi-001",
    name: "大型风电叶片真空导入配方",
    process: "真空导入成型",
    processId: "vacuum-infusion",
    category: "wind",
    application: "风电叶片壳体、大型游艇船体、桥梁面板",
    difficulty: "高级",
    description: "针对大型零件（>10m）优化的VARTM配方，使用低粘度环氧树脂配合单向织物和多轴向布，纤维含量55-65%。",
    resinSystem: [
      { name: "真空导入专用环氧树脂", role: "基体树脂", amount: "100份", note: "25°C粘度200-400mPa·s" },
      { name: "改性脂环胺固化剂", role: "固化剂", amount: "按树脂配比（通常30-35份）", note: "适用期120-180min" },
    ],
    reinforcement: [
      { name: "单向玻纤织物 1200g/m²", role: "主梁增强", amount: "主梁帽区域", note: "提供纵向弯曲刚度" },
      { name: "双轴向织物 ±45° 800g/m²", role: "壳体蒙皮", amount: "全覆盖", note: "抗扭转和剪切" },
      { name: "三轴向织物 0/±45° 1000g/m²", role: "综合增强", amount: "关键区域" },
    ],
    auxiliaries: [
      { name: "PVC/PET泡沫芯材", role: "夹层芯材", amount: "按壳体设计", note: "Divinycell H80或同等品" },
      { name: "导流网（HDPE）", role: "树脂分配", amount: "全覆盖", note: "Greenflow 75或同等品" },
      { name: "脱模布（尼龙）", role: "工艺辅材", amount: "全覆盖", note: "脱模后易剥离" },
      { name: "真空袋膜", role: "密封", amount: "全覆盖", note: "耐温80°C以上" },
      { name: "密封胶带", role: "周边密封", amount: "按周长" },
      { name: "螺旋管", role: "树脂进胶管", amount: "按导流设计" },
    ],
    processing: [
      { name: "铺层时间", value: "4-8小时（大型叶片）", note: "需要团队配合" },
      { name: "抽真空", value: "≥0.095 MPa", note: "保持30min检漏" },
      { name: "树脂混合温度", value: "25-30°C", note: "预热降低粘度" },
      { name: "注入时间", value: "30-120min", note: "取决于零件尺寸" },
      { name: "固化", value: "常温6-8h凝胶 → 60°C × 6h 后固化" },
      { name: "纤维体积含量", value: "55-62%" },
    ],
    properties: [
      { name: "纵向拉伸强度", value: "700-900 MPa（UD层）" },
      { name: "纵向压缩强度", value: "500-600 MPa（UD层）" },
      { name: "层间剪切强度", value: "45-55 MPa", standard: "ASTM D2344" },
      { name: "Tg", value: "70-80°C（后固化后）" },
      { name: "孔隙率", value: "<1%", note: "真空导入优势" },
    ],
    tips: [
      "树脂适用期必须覆盖完整注入时间+安全余量，大零件选长适用期体系",
      "导流网布局设计是技术核心，决定了浸润均匀性和注入速度",
      "泡沫芯材必须预开槽/打孔，否则芯材下方无法浸润",
      "真空检漏极其重要，1个小泄漏点可能导致整个零件报废",
      "参考DNV-ST-0376《风力发电机组转子叶片》进行设计",
    ],
    safetyNotes: [
      "环氧固化剂有致敏性，全程佩戴手套和长袖工作服",
      "玻纤织物裁剪时产生粉尘，佩戴口罩",
      "大型铺层作业注意人体工程学，防止腰伤",
    ],
  },

  // ═══════════════════════════════════════════
  // 修补/防腐配方
  // ═══════════════════════════════════════════
  {
    id: "rp-001",
    name: "FRP制品现场修补配方",
    process: "修补/防腐",
    processId: "repair",
    category: "structural",
    application: "FRP制品裂纹修补、破损修复、防腐层修补",
    difficulty: "入门",
    description: "通用的FRP制品现场修补配方，适用于裂纹、穿孔、磕碰损伤的修复。操作简单，不需要专业设备。",
    resinSystem: [
      { name: "196#不饱和聚酯树脂", role: "修补树脂", amount: "按需", note: "与原制品树脂体系一致最佳" },
      { name: "MEKP固化剂", role: "引发剂", amount: "1.5-2.0份", note: "修补时适当增加" },
      { name: "环烷酸钴促进剂", role: "促进剂", amount: "0.5-1.0份" },
    ],
    reinforcement: [
      { name: "玻纤短切毡 300g/m²", role: "修补增强", amount: "2-4层", note: "每层比上一层大20-30mm" },
      { name: "玻纤方格布 200g/m²", role: "最外层", amount: "1层", note: "改善外观" },
    ],
    auxiliaries: [
      { name: "丙酮", role: "清洗打磨面", amount: "适量", note: "去除油污和灰尘" },
      { name: "砂纸（60-120目）", role: "表面打磨", amount: "打磨至粗糙" },
      { name: "气相二氧化硅", role: "腻子用触变剂", amount: "5-10份", note: "调成腻子填充凹坑" },
    ],
    processing: [
      { name: "1. 损伤评估", value: "确定损伤范围和深度" },
      { name: "2. 表面处理", value: "打磨至粗糙 → 丙酮擦拭 → 干燥" },
      { name: "3. 填充（如有凹坑）", value: "树脂腻子填平 → 等凝胶" },
      { name: "4. 铺层修补", value: "树脂浸润毡/布 → 逐层铺覆 → 排气泡" },
      { name: "5. 固化", value: "常温24h" },
      { name: "6. 修整", value: "打磨平整 → 涂胶衣（如需）" },
    ],
    properties: [
      { name: "修补区强度", value: "原强度的70-90%" },
      { name: "搭接宽度", value: "每侧≥损伤区最大尺寸", note: "阶梯搭接更好" },
    ],
    tips: [
      "修补区域打磨是关键，要露出新鲜纤维层才能保证粘结",
      "每层补丁要比上一层大20-30mm，形成阶梯搭接",
      "如果原制品用的是乙烯基酯树脂，修补也要用乙烯基酯",
      "穿孔修补要从两侧进行，先补内侧再补外侧",
      "修补后做敲击检测，声音沉闷说明有脱粘",
    ],
    safetyNotes: [
      "丙酮易燃，远离火源",
      "打磨FRP时产生粉尘，佩戴防尘口罩",
      "密闭空间修补必须强制通风",
    ],
  },
  {
    id: "rp-002",
    name: "混凝土结构FRP加固配方",
    process: "修补/防腐",
    processId: "repair",
    category: "building",
    application: "桥梁加固、梁柱加固、楼板加固、抗震加固",
    difficulty: "中级",
    description: "碳纤维布/玻纤布外贴加固混凝土结构的配方，使用浸渍环氧树脂体系，按GB 50367《混凝土结构加固设计规范》施工。",
    resinSystem: [
      { name: "底涂环氧树脂", role: "基层渗透", amount: "按基面情况", note: "低粘度渗透型" },
      { name: "找平环氧腻子", role: "基面找平", amount: "按基面平整度", note: "环氧树脂+石英粉" },
      { name: "浸渍环氧树脂", role: "纤维浸润", amount: "200-300g/m²/层", note: "中等粘度，触变性" },
    ],
    reinforcement: [
      { name: "碳纤维单向布 300g/m²", role: "受拉加固", amount: "1-3层", note: "T300级，幅宽100-500mm" },
      { name: "碳纤维单向布 200g/m²", role: "抗剪加固", amount: "U型箍或全包", note: "环向包裹" },
    ],
    auxiliaries: [
      { name: "石英砂（粗）", role: "最外层撒砂", amount: "适量", note: "后续需要抹灰时增加粘结" },
      { name: "防火涂料", role: "耐火保护", amount: "按耐火等级", note: "CFRP加固后通常需要防火处理" },
    ],
    processing: [
      { name: "1. 基面处理", value: "凿除松散层 → 打磨至C15以上坚实面" },
      { name: "2. 刷底涂", value: "渗透封底 → 干燥12-24h" },
      { name: "3. 找平", value: "环氧腻子找平至≤1mm/m不平整度" },
      { name: "4. 粘贴碳纤维", value: "涂浸渍胶 → 贴碳布 → 辊压排气 → 再涂胶" },
      { name: "5. 固化", value: "常温7天达设计强度", note: "10°C以下慎施工" },
      { name: "6. 检验", value: "粘结强度拉拔试验 ≥2.5MPa" },
    ],
    properties: [
      { name: "碳纤维抗拉强度", value: "≥3400 MPa", standard: "GB 50367" },
      { name: "碳纤维弹性模量", value: "≥230 GPa" },
      { name: "浸渍胶粘结强度", value: "≥2.5 MPa", standard: "GB/T 7124" },
      { name: "浸渍胶拉伸剪切强度", value: "≥10 MPa" },
    ],
    tips: [
      "基面处理质量决定加固效果的80%，这是最关键的工序",
      "碳纤维布搭接长度≥100mm，搭接区域应避开最大应力处",
      "多层粘贴时，每层之间不需要等完全固化，可以湿碰湿施工",
      "严格按GB 50367和GB 50728进行设计和施工验收",
      "加固后必须做防火处理，CFRP在高温下会失去强度",
    ],
    safetyNotes: [
      "高空作业需要安全措施",
      "环氧树脂有致敏性，佩戴手套",
      "碳纤维丝导电，远离电气线路",
    ],
  },
  {
    id: "vi-002",
    name: "真空导入FRP船体配方",
    process: "真空导入成型",
    processId: "vacuum-infusion",
    category: "marine",
    application: "游艇船体、帆船、工作艇、巡逻艇",
    difficulty: "中级",
    description: "船舶用VARTM配方，使用乙烯基酯树脂配合多轴向玻纤和PVC泡沫芯材，满足船级社认证要求。",
    resinSystem: [
      { name: "真空导入乙烯基酯树脂", role: "基体树脂", amount: "100份", note: "低粘度VARTM专用牌号" },
      { name: "MEKP固化剂", role: "引发剂", amount: "1.0-1.5份" },
      { name: "环烷酸钴促进剂", role: "促进剂", amount: "0.2-0.4份" },
    ],
    reinforcement: [
      { name: "E-玻纤双轴向布 ±45° 600g/m²", role: "外蒙皮", amount: "3-4层" },
      { name: "E-玻纤三轴向布 800g/m²", role: "内蒙皮", amount: "2-3层" },
      { name: "E-玻纤短切毡 300g/m²", role: "过渡层", amount: "芯材两侧各1层" },
    ],
    auxiliaries: [
      { name: "PVC泡沫芯材 H80", role: "夹层芯材", amount: "15-25mm", note: "底部用H100/H130" },
      { name: "导流网", role: "树脂分配", amount: "全覆盖" },
      { name: "脱模布", role: "辅材", amount: "全覆盖" },
      { name: "异酞型胶衣", role: "外表面", amount: "0.5mm", note: "模具上预先喷涂" },
    ],
    processing: [
      { name: "胶衣喷涂", value: "0.4-0.6mm → 凝胶后铺层" },
      { name: "铺层", value: "外蒙皮 → 芯材 → 内蒙皮" },
      { name: "真空度", value: "≥0.09 MPa" },
      { name: "注入", value: "从龙骨线注入，向两侧舷流动" },
      { name: "固化", value: "常温24h → 后固化60°C × 8h" },
    ],
    properties: [
      { name: "外蒙皮拉伸强度", value: "200-280 MPa" },
      { name: "夹层弯曲刚度", value: "按船级社要求计算" },
      { name: "吸水率", value: "<0.5%（后固化后）" },
      { name: "纤维含量", value: "50-58%（重量）" },
    ],
    tips: [
      "船体导入树脂注入口通常设在龙骨线，出胶口在甲板边缘",
      "泡沫芯材转角处需要预热弯曲或使用划线芯材",
      "乙烯基酯导入粘度窗口比环氧窄，温度控制更重要",
      "船级社认证（CCS/DNV/LR）对材料和工艺有具体要求，提前确认",
    ],
    safetyNotes: [
      "乙烯基酯苯乙烯挥发量大，密闭车间注意通风",
      "大型船体铺层作业注意防坠落",
    ],
  },
];
