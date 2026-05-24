export interface FormulaIngredient {
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  amount: string;
  amountEn: string;
  note?: string;
  noteEn?: string;
}

export interface ProcessingParam {
  name: string;
  nameEn: string;
  value: string;
  valueEn: string;
  note?: string;
  noteEn?: string;
}

export interface ExpectedProperty {
  name: string;
  nameEn: string;
  value: string;
  valueEn: string;
  standard?: string;
  note?: string;
  noteEn?: string;
}

export interface Formula {
  id: string;
  name: string;
  nameEn: string;
  process: string;
  processEn: string;
  processId: string;
  category: string;
  categoryEn: string;
  application: string;
  applicationEn: string;
  difficulty: "入门" | "中级" | "高级";
  description: string;
  descriptionEn: string;
  resinSystem: FormulaIngredient[];
  reinforcement: FormulaIngredient[];
  auxiliaries: FormulaIngredient[];
  processing: ProcessingParam[];
  properties: ExpectedProperty[];
  tips: string[];
  tipsEn: string[];
  safetyNotes: string[];
  safetyNotesEn: string[];
}

export const processFilters = [
  { id: "all", name: "全部工艺", nameEn: "All Processes", iconKey: "all-process" },
  { id: "hand-layup", name: "手糊成型", nameEn: "Hand Lay-up", iconKey: "hand-layup" },
  { id: "filament-winding", name: "缠绕成型", nameEn: "Filament Winding", iconKey: "filament-winding" },
  { id: "pultrusion", name: "拉挤成型", nameEn: "Pultrusion", iconKey: "pultrusion" },
  { id: "compression", name: "模压成型", nameEn: "Compression Molding", iconKey: "compression" },
  { id: "rtm", name: "RTM成型", nameEn: "RTM", iconKey: "rtm" },
  { id: "vacuum-infusion", name: "真空导入", nameEn: "Vacuum Infusion (VARTM)", iconKey: "vacuum-infusion" },
  { id: "roll-wrapping", name: "卷管工艺", nameEn: "Roll Wrapping", iconKey: "roll-wrapping" },
  { id: "3d-printing", name: "3D打印", nameEn: "3D Printing", iconKey: "3d-printing" },
  { id: "repair", name: "修补/防腐", nameEn: "Repair / Anti-corrosion", iconKey: "repair" },
];

export const categoryFilters = [
  { id: "all", name: "全部类型", nameEn: "All Categories" },
  { id: "structural", name: "结构制品", nameEn: "Structural Parts" },
  { id: "corrosion", name: "防腐工程", nameEn: "Anti-corrosion" },
  { id: "marine", name: "船舶/水工", nameEn: "Marine / Hydraulic" },
  { id: "pipe-tank", name: "管道储罐", nameEn: "Pipes & Tanks" },
  { id: "profile", name: "型材/格栅", nameEn: "Profiles & Gratings" },
  { id: "wind", name: "风电叶片", nameEn: "Wind Turbine Blades" },
  { id: "auto", name: "汽车/交通", nameEn: "Automotive / Transport" },
  { id: "building", name: "建筑装饰", nameEn: "Construction" },
  { id: "electrical", name: "电气绝缘", nameEn: "Electrical Insulation" },
];

export const formulas: Formula[] = [
  // ═══════════════════════════════════════════
  // 手糊成型配方
  // ═══════════════════════════════════════════
  {
    id: "hl-001",
    name: "通用手糊玻璃钢制品配方",
    nameEn: "General-Purpose Hand Lay-up FRP Formula",
    process: "手糊成型",
    processEn: "Hand Lay-up",
    processId: "hand-layup",
    category: "structural",
    categoryEn: "Structural Parts",
    application: "一般结构制品、外壳、罩壳、盖板",
    applicationEn: "General structural parts, housings, covers, panels",
    difficulty: "入门",
    description: "最基础的手糊成型配方，使用191#通用树脂配合玻纤短切毡和方格布，适合初学者和一般性能要求的制品。",
    descriptionEn: "The most basic hand lay-up formula, using 191# general-purpose resin with chopped strand mat and woven roving. Suitable for beginners and parts with general performance requirements.",
    resinSystem: [
      { name: "191#不饱和聚酯树脂", nameEn: "191# Unsaturated Polyester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份（重量）", amountEn: "100 phr (by weight)", note: "邻苯型，通用级", noteEn: "Orthophthalic, general grade" },
      { name: "MEKP固化剂", nameEn: "MEKP Curing Agent", role: "引发剂", roleEn: "Initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr", note: "Butanox M-50或同等品", noteEn: "Butanox M-50 or equivalent" },
      { name: "环烷酸钴促进剂", nameEn: "Cobalt Naphthenate Accelerator", role: "促进剂", roleEn: "Accelerator", amount: "0.5-1.0份", amountEn: "0.5-1.0 phr", note: "6%钴含量溶液", noteEn: "6% cobalt content solution" },
    ],
    reinforcement: [
      { name: "E-玻纤短切毡 300g/m²", nameEn: "E-glass Chopped Strand Mat 300 g/m²", role: "基层增强", roleEn: "Base reinforcement", amount: "第1、3、5层", amountEn: "Layers 1, 3, 5", note: "提供各向同性", noteEn: "Provides isotropy" },
      { name: "E-玻纤方格布 400g/m²", nameEn: "E-glass Woven Roving 400 g/m²", role: "主增强层", roleEn: "Main reinforcement", amount: "第2、4层", amountEn: "Layers 2, 4", note: "提供强度和刚度", noteEn: "Provides strength and stiffness" },
    ],
    auxiliaries: [
      { name: "胶衣树脂（异酞型）", nameEn: "Gelcoat Resin (Isophthalic)", role: "表面涂层", roleEn: "Surface coating", amount: "300-500g/m²", amountEn: "300-500 g/m²", note: "先刷胶衣再铺层", noteEn: "Apply gelcoat before lay-up" },
      { name: "蜡液脱模剂", nameEn: "Wax Mold Release Agent", role: "脱模", roleEn: "Mold release", amount: "3-5遍涂覆", amountEn: "3-5 coats", note: "新模具至少5遍", noteEn: "At least 5 coats for new molds" },
      { name: "苯乙烯", nameEn: "Styrene", role: "稀释剂（可选）", roleEn: "Diluent (optional)", amount: "3-5份", amountEn: "3-5 phr", note: "降低粘度，夏天慎用", noteEn: "Reduces viscosity; use cautiously in summer" },
    ],
    processing: [
      { name: "工作环境温度", nameEn: "Working ambient temperature", value: "15-30°C", valueEn: "15-30°C", note: "最佳20-25°C", noteEn: "Optimal 20-25°C" },
      { name: "胶衣凝胶时间", nameEn: "Gelcoat gel time", value: "20-40分钟", valueEn: "20-40 min", note: "指触不粘后开始铺层", noteEn: "Start lay-up after tack-free" },
      { name: "树脂凝胶时间", nameEn: "Resin gel time", value: "15-30分钟", valueEn: "15-30 min", note: "通过调固化剂用量控制", noteEn: "Control via initiator dosage" },
      { name: "脱模时间", nameEn: "Demolding time", value: "12-24小时", valueEn: "12-24 hours", note: "常温固化", noteEn: "Room-temperature cure" },
      { name: "后固化", nameEn: "Post-cure", value: "60°C × 4h（可选）", valueEn: "60°C × 4h (optional)", note: "提高HDT和强度", noteEn: "Raises HDT and strength" },
      { name: "纤维含量目标", nameEn: "Target fiber content", value: "30-35%（重量）", valueEn: "30-35% (by weight)" },
    ],
    properties: [
      { name: "拉伸强度", nameEn: "Tensile strength", value: "80-120 MPa", valueEn: "80-120 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", nameEn: "Flexural strength", value: "120-180 MPa", valueEn: "120-180 MPa", standard: "GB/T 1449" },
      { name: "弯曲模量", nameEn: "Flexural modulus", value: "6-8 GPa", valueEn: "6-8 GPa", standard: "GB/T 1449" },
      { name: "巴氏硬度", nameEn: "Barcol hardness", value: "35-40", valueEn: "35-40", standard: "GB/T 3854" },
      { name: "制品厚度", nameEn: "Part thickness", value: "3-5 mm（5层）", valueEn: "3-5 mm (5 plies)" },
    ],
    tips: [
      "固化剂和促进剂绝对不能直接混合！必须先将一种搅入树脂后再加另一种",
      "铺层时要用辊子充分排气泡，否则层间容易产生白斑（气泡缺陷）",
      "胶衣刷涂要均匀，厚度0.3-0.5mm，太薄容易露纤维纹，太厚容易龟裂",
      "夏季温度高时减少固化剂用量，冬季增加或使用加热辅助固化",
    ],
    tipsEn: [
      "Never mix initiator and accelerator directly! Always blend one into the resin first, then add the other.",
      "Use a roller during lay-up to fully expel air bubbles, otherwise interlaminar white spots (void defects) easily form.",
      "Apply gelcoat evenly at 0.3-0.5 mm thickness — too thin shows fiber print-through, too thick cracks.",
      "Reduce initiator dosage in hot summer; increase it or apply heat assistance in winter.",
    ],
    safetyNotes: [
      "苯乙烯有刺激性气味，必须在通风良好的环境下操作",
      "MEKP是有机过氧化物，避免接触皮肤和眼睛",
      "佩戴防有机气体口罩、防护手套和护目镜",
    ],
    safetyNotesEn: [
      "Styrene has a pungent odor — operate only in well-ventilated areas.",
      "MEKP is an organic peroxide — avoid skin and eye contact.",
      "Wear an organic-vapor respirator, protective gloves, and safety goggles.",
    ],
  },
  {
    id: "hl-002",
    name: "船舶/水工手糊防水配方",
    nameEn: "Marine / Hydraulic Hand Lay-up Waterproof Formula",
    process: "手糊成型",
    processEn: "Hand Lay-up",
    processId: "hand-layup",
    category: "marine",
    categoryEn: "Marine / Hydraulic",
    application: "游艇、渔船、水箱、水池防腐内衬",
    applicationEn: "Yachts, fishing boats, water tanks, anti-corrosion linings for pools",
    difficulty: "中级",
    description: "针对长期水浸泡环境优化的手糊配方，使用异酞型或乙烯基酯树脂配合ECR耐腐蚀玻纤，耐水性显著优于通用配方。",
    descriptionEn: "Hand lay-up formula optimized for prolonged water immersion. Uses isophthalic or vinyl ester resin with corrosion-resistant ECR glass fiber — water resistance is significantly better than general-purpose formulas.",
    resinSystem: [
      { name: "197#异酞型不饱和聚酯树脂", nameEn: "197# Isophthalic Unsaturated Polyester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "异酞型耐水性优于邻苯型", noteEn: "Isophthalic has better water resistance than orthophthalic" },
      { name: "MEKP固化剂", nameEn: "MEKP Curing Agent", role: "引发剂", roleEn: "Initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr" },
      { name: "环烷酸钴促进剂", nameEn: "Cobalt Naphthenate Accelerator", role: "促进剂", roleEn: "Accelerator", amount: "0.5-0.8份", amountEn: "0.5-0.8 phr" },
    ],
    reinforcement: [
      { name: "ECR玻纤短切毡 300g/m²", nameEn: "ECR Glass Chopped Strand Mat 300 g/m²", role: "防渗层", roleEn: "Barrier layer", amount: "内表面2层", amountEn: "2 plies on inner surface", note: "ECR耐腐蚀性能优于E-玻纤", noteEn: "ECR offers better corrosion resistance than E-glass" },
      { name: "ECR玻纤方格布 600g/m²", nameEn: "ECR Glass Woven Roving 600 g/m²", role: "结构层", roleEn: "Structural layer", amount: "中间3-4层", amountEn: "3-4 plies in middle", note: "高克重提升效率", noteEn: "Higher areal weight improves efficiency" },
      { name: "ECR玻纤表面毡 30g/m²", nameEn: "ECR Glass Surface Veil 30 g/m²", role: "富树脂层", roleEn: "Resin-rich layer", amount: "最内层", amountEn: "Innermost layer", note: "配合胶衣形成防渗屏障", noteEn: "Forms a barrier together with the gelcoat" },
    ],
    auxiliaries: [
      { name: "异酞型胶衣树脂", nameEn: "Isophthalic Gelcoat Resin", role: "耐水表面层", roleEn: "Water-resistant surface", amount: "400-600g/m²", amountEn: "400-600 g/m²", note: "建议NPG改性异酞型", noteEn: "NPG-modified isophthalic recommended" },
      { name: "PVA脱模剂", nameEn: "PVA Mold Release Agent", role: "脱模", roleEn: "Mold release", amount: "均匀涂覆", amountEn: "Apply evenly", note: "水溶性脱模膜", noteEn: "Water-soluble release film" },
      { name: "触变剂（气相二氧化硅）", nameEn: "Thixotropic Agent (Fumed Silica)", role: "防流挂", roleEn: "Anti-sag", amount: "1-2份", amountEn: "1-2 phr", note: "立面施工必须添加", noteEn: "Required for vertical surfaces" },
    ],
    processing: [
      { name: "工作环境温度", nameEn: "Working ambient temperature", value: "18-28°C", valueEn: "18-28°C" },
      { name: "环境湿度", nameEn: "Ambient humidity", value: "<80%", valueEn: "<80%", note: "高湿度影响固化和耐水性", noteEn: "High humidity impairs cure and water resistance" },
      { name: "胶衣厚度", nameEn: "Gelcoat thickness", value: "0.4-0.6mm", valueEn: "0.4-0.6 mm", note: "分两遍刷涂", noteEn: "Apply in two coats" },
      { name: "层间间隔", nameEn: "Inter-ply interval", value: "胶衣凝胶后立即", valueEn: "Immediately after gelcoat gels", note: "避免层间粘结不良", noteEn: "Avoids poor interlaminar adhesion" },
      { name: "脱模时间", nameEn: "Demolding time", value: "24-48小时", valueEn: "24-48 hours" },
      { name: "后固化", nameEn: "Post-cure", value: "80°C × 8h", valueEn: "80°C × 8h", note: "强烈建议，大幅提升耐水性", noteEn: "Strongly recommended; greatly improves water resistance" },
    ],
    properties: [
      { name: "拉伸强度", nameEn: "Tensile strength", value: "100-140 MPa", valueEn: "100-140 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", nameEn: "Flexural strength", value: "150-200 MPa", valueEn: "150-200 MPa", standard: "GB/T 1449" },
      { name: "吸水率（24h）", nameEn: "Water absorption (24h)", value: "<0.3%", valueEn: "<0.3%", standard: "GB/T 1462" },
      { name: "巴氏硬度", nameEn: "Barcol hardness", value: "40-45", valueEn: "40-45" },
    ],
    tips: [
      "水下/浸泡环境必须后固化，未后固化制品耐水性大打折扣",
      "胶衣+表面毡+2层短切毡形成的防渗层是关键，不能省略",
      "ECR玻纤比E-玻纤贵约30%，但在水环境中寿命可延长2-3倍",
      "施工环境湿度控制很重要，雨天或湿度>80%时停止施工",
    ],
    tipsEn: [
      "Post-cure is mandatory for submerged/immersed parts — without it, water resistance is severely reduced.",
      "The barrier layer (gelcoat + surface veil + 2 plies of chopped strand mat) is critical and must not be skipped.",
      "ECR glass costs ~30% more than E-glass but extends service life in water by 2-3×.",
      "Control ambient humidity during installation — stop work in rain or when humidity > 80%.",
    ],
    safetyNotes: [
      "佩戴防有机气体口罩和防护手套",
      "气相二氧化硅粉尘细微，调配时佩戴防尘口罩",
    ],
    safetyNotesEn: [
      "Wear an organic-vapor respirator and protective gloves.",
      "Fumed silica dust is very fine — wear a dust mask when blending.",
    ],
  },
  {
    id: "hl-003",
    name: "耐强酸FRP防腐内衬配方",
    nameEn: "Strong-Acid Resistant FRP Anti-corrosion Lining Formula",
    process: "手糊成型",
    processEn: "Hand Lay-up",
    processId: "hand-layup",
    category: "corrosion",
    categoryEn: "Anti-corrosion",
    application: "化工储罐内衬、酸洗槽、电镀槽、烟气脱硫塔内衬",
    applicationEn: "Chemical tank linings, pickling tanks, plating tanks, FGD tower linings",
    difficulty: "高级",
    description: "使用双酚A环氧型乙烯基酯树脂的高端防腐配方，可耐受强酸（盐酸、硫酸≤98%）和多数有机溶剂，是化工防腐领域的标准方案。",
    descriptionEn: "Premium anti-corrosion formula based on bisphenol-A epoxy vinyl ester resin. Resists strong acids (HCl, H₂SO₄ ≤98%) and most organic solvents — the standard solution in chemical anti-corrosion engineering.",
    resinSystem: [
      { name: "双酚A环氧型乙烯基酯树脂", nameEn: "Bisphenol-A Epoxy Vinyl Ester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "如力联思Palatal A430或亚什兰470", noteEn: "e.g. AOC Palatal A430 or Ashland Derakane 470" },
      { name: "MEKP固化剂", nameEn: "MEKP Curing Agent", role: "引发剂", roleEn: "Initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr", note: "根据温度调整", noteEn: "Adjust based on temperature" },
      { name: "环烷酸钴促进剂", nameEn: "Cobalt Naphthenate Accelerator", role: "促进剂", roleEn: "Accelerator", amount: "0.2-0.4份", amountEn: "0.2-0.4 phr", note: "乙烯基酯树脂促进剂用量低于UPR", noteEn: "Lower dosage than UPR systems" },
      { name: "DMA促进剂（可选）", nameEn: "DMA Accelerator (optional)", role: "辅助促进", roleEn: "Co-accelerator", amount: "0.05-0.1份", amountEn: "0.05-0.1 phr", note: "低温施工时添加", noteEn: "Add for low-temperature application" },
    ],
    reinforcement: [
      { name: "ECR玻纤表面毡 30g/m²", nameEn: "ECR Glass Surface Veil 30 g/m²", role: "富树脂层", roleEn: "Resin-rich layer", amount: "最内层1层", amountEn: "1 ply, innermost" },
      { name: "ECR玻纤短切毡 450g/m²", nameEn: "ECR Glass Chopped Strand Mat 450 g/m²", role: "防渗层", roleEn: "Barrier layer", amount: "2层", amountEn: "2 plies" },
      { name: "ECR玻纤方格布 800g/m²", nameEn: "ECR Glass Woven Roving 800 g/m²", role: "结构层", roleEn: "Structural layer", amount: "根据厚度要求", amountEn: "Per thickness requirement", note: "总厚度不小于4.5mm", noteEn: "Total thickness ≥ 4.5 mm" },
    ],
    auxiliaries: [
      { name: "乙烯基酯胶衣树脂", nameEn: "Vinyl Ester Gelcoat Resin", role: "防腐表面层", roleEn: "Anti-corrosion surface", amount: "500g/m²", amountEn: "500 g/m²", note: "必须使用乙烯基酯胶衣", noteEn: "Must use vinyl ester gelcoat" },
      { name: "气相二氧化硅", nameEn: "Fumed Silica", role: "触变剂", roleEn: "Thixotrope", amount: "1-2份", amountEn: "1-2 phr" },
      { name: "消泡剂", nameEn: "Defoamer", role: "消除气泡", roleEn: "Bubble removal", amount: "0.1-0.3份", amountEn: "0.1-0.3 phr", note: "BYK-A530或同等品", noteEn: "BYK-A530 or equivalent" },
    ],
    processing: [
      { name: "工作环境温度", nameEn: "Working ambient temperature", value: "20-30°C", valueEn: "20-30°C", note: "乙烯基酯对温度更敏感", noteEn: "Vinyl ester is more temperature-sensitive" },
      { name: "树脂凝胶时间", nameEn: "Resin gel time", value: "30-45分钟", valueEn: "30-45 min", note: "比UPR长", noteEn: "Longer than UPR" },
      { name: "层间间隔", nameEn: "Inter-ply interval", value: "上一层凝胶后立即", valueEn: "Immediately after previous ply gels", note: "确保层间粘结", noteEn: "Ensures interlaminar adhesion" },
      { name: "常温固化", nameEn: "Room-temperature cure", value: "48-72小时", valueEn: "48-72 hours" },
      { name: "后固化", nameEn: "Post-cure", value: "80°C × 4h + 120°C × 2h", valueEn: "80°C × 4h + 120°C × 2h", note: "阶梯升温，防腐工程必须后固化", noteEn: "Stepwise ramp; mandatory for anti-corrosion service" },
      { name: "内衬总厚度", nameEn: "Total liner thickness", value: "≥4.5mm", valueEn: "≥4.5 mm", note: "含防渗层和结构层", noteEn: "Includes barrier and structural layers" },
    ],
    properties: [
      { name: "拉伸强度", nameEn: "Tensile strength", value: "120-160 MPa", valueEn: "120-160 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", nameEn: "Flexural strength", value: "180-240 MPa", valueEn: "180-240 MPa", standard: "GB/T 1449" },
      { name: "热变形温度HDT", nameEn: "Heat distortion temperature (HDT)", value: "120-130°C（后固化后）", valueEn: "120-130°C (post-cured)", standard: "GB/T 1634" },
      { name: "耐20% HCl", nameEn: "20% HCl resistance", value: "合格（长期浸泡）", valueEn: "Pass (long-term immersion)", standard: "GB/T 3857" },
      { name: "耐70% H₂SO₄", nameEn: "70% H₂SO₄ resistance", value: "合格（长期浸泡）", valueEn: "Pass (long-term immersion)", standard: "GB/T 3857" },
    ],
    tips: [
      "乙烯基酯树脂对温度敏感，促进剂用量过大容易暴聚（放热失控）",
      "后固化是防腐性能的关键！未后固化的乙烯基酯制品防腐等级大幅降低",
      "防渗层（表面毡+2层短切毡）树脂含量应≥90%，这是防腐的核心屏障",
      "施工前确认介质详细成分和温度，不同酸种和浓度对树脂选择有影响",
      "参考HG/T 20696-1999《玻璃钢化工设备设计规定》进行结构设计",
    ],
    tipsEn: [
      "Vinyl ester is temperature-sensitive — excess accelerator can cause runaway exotherm.",
      "Post-curing is the key to corrosion performance! Without it, the rating drops drastically.",
      "Resin content in the barrier layer (surface veil + 2 chopped strand mats) must be ≥90% — this is the core barrier.",
      "Confirm the exact medium composition and service temperature beforehand — they affect resin selection.",
      "Follow HG/T 20696-1999 'Design Code for FRP Chemical Equipment' for structural design.",
    ],
    safetyNotes: [
      "乙烯基酯树脂苯乙烯含量高，必须强化通风",
      "DMA促进剂有毒性，操作时佩戴手套和口罩",
      "后固化时释放苯乙烯蒸气，确保烘箱通风",
    ],
    safetyNotesEn: [
      "Vinyl ester has high styrene content — provide robust ventilation.",
      "DMA accelerator is toxic — wear gloves and a respirator.",
      "Post-curing releases styrene vapor — ensure the oven is vented.",
    ],
  },

  // ═══════════════════════════════════════════
  // 缠绕成型配方
  // ═══════════════════════════════════════════
  {
    id: "fw-001",
    name: "玻璃钢管道缠绕配方",
    nameEn: "FRP Pipe Filament Winding Formula",
    process: "缠绕成型",
    processEn: "Filament Winding",
    processId: "filament-winding",
    category: "pipe-tank",
    categoryEn: "Pipes & Tanks",
    application: "给排水管道、工艺管道、电缆保护管",
    applicationEn: "Water supply/drainage piping, process piping, cable protection conduits",
    difficulty: "中级",
    description: "标准的FRP缠绕管道树脂配方，使用间苯型UPR配合连续玻纤纱和石英砂夹层，适合DN300-DN3000口径管道。",
    descriptionEn: "Standard resin formula for FRP filament-wound pipe. Uses isophthalic UPR with continuous glass roving and a sand-filled core layer; suitable for DN300-DN3000 pipes.",
    resinSystem: [
      { name: "3301间苯型不饱和聚酯树脂", nameEn: "3301 Isophthalic Unsaturated Polyester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "间苯型耐水优于邻苯型", noteEn: "Isophthalic has better water resistance than orthophthalic" },
      { name: "TBPB引发剂", nameEn: "TBPB Initiator", role: "高温引发剂", roleEn: "High-temperature initiator", amount: "0.5-1.0份", amountEn: "0.5-1.0 phr", note: "过氧化苯甲酸叔丁酯", noteEn: "tert-Butyl peroxybenzoate" },
      { name: "BPO引发剂", nameEn: "BPO Initiator", role: "中温引发剂", roleEn: "Mid-temperature initiator", amount: "0.3-0.5份", amountEn: "0.3-0.5 phr", note: "过氧化苯甲酰", noteEn: "Benzoyl peroxide" },
    ],
    reinforcement: [
      { name: "E-玻纤无碱纱 2400tex", nameEn: "E-glass Roving 2400 tex", role: "环向增强", roleEn: "Hoop reinforcement", amount: "按设计壁厚", amountEn: "Per design wall thickness", note: "缠绕角54.75°（±55°）为常用", noteEn: "±55° (54.75°) is the most common winding angle" },
      { name: "E-玻纤短切纱", nameEn: "E-glass Chopped Roving", role: "内衬层增强", roleEn: "Liner reinforcement", amount: "短切喷射", amountEn: "Chopper-spray", note: "内衬层纤维含量20-30%", noteEn: "Liner fiber content 20-30%" },
      { name: "石英砂（40-70目）", nameEn: "Quartz Sand (40-70 mesh)", role: "中间夹砂层", roleEn: "Sand core layer", amount: "按壁厚设计", amountEn: "Per wall thickness design", note: "提高刚度，降低成本", noteEn: "Improves stiffness, lowers cost" },
    ],
    auxiliaries: [
      { name: "内衬树脂（富树脂层）", nameEn: "Liner Resin (Resin-rich layer)", role: "防渗内衬", roleEn: "Barrier liner", amount: "2-3mm", amountEn: "2-3 mm", note: "纤维含量≤30%", noteEn: "Fiber content ≤30%" },
      { name: "外保护层树脂", nameEn: "External Protective Resin", role: "抗老化", roleEn: "Aging resistance", amount: "0.3-0.5mm", amountEn: "0.3-0.5 mm", note: "含UV稳定剂", noteEn: "Contains UV stabilizers" },
      { name: "硅烷偶联剂", nameEn: "Silane Coupling Agent", role: "砂/树脂界面", roleEn: "Sand/resin interface", amount: "砂量的0.5%", amountEn: "0.5% of sand mass", note: "KH-550或KH-570", noteEn: "KH-550 or KH-570" },
    ],
    processing: [
      { name: "缠绕角度", nameEn: "Winding angle", value: "±(50-55)°", valueEn: "±(50-55)°", note: "管道常用角度", noteEn: "Common angle for pipes" },
      { name: "纤维张力", nameEn: "Fiber tension", value: "20-50N/束", valueEn: "20-50 N per band", note: "张力均匀是关键", noteEn: "Uniform tension is critical" },
      { name: "缠绕速度", nameEn: "Winding speed", value: "15-30m/min", valueEn: "15-30 m/min", note: "根据管径调整", noteEn: "Adjust per pipe diameter" },
      { name: "芯模转速", nameEn: "Mandrel rotation speed", value: "5-15rpm", valueEn: "5-15 rpm", note: "根据管径调整", noteEn: "Adjust per pipe diameter" },
      { name: "固化温度", nameEn: "Cure temperature", value: "60-80°C（加热固化）", valueEn: "60-80°C (heated cure)", note: "或常温24h+后固化", noteEn: "Or 24h RT cure + post-cure" },
      { name: "脱模", nameEn: "Demolding", value: "液压脱模", valueEn: "Hydraulic demolding", note: "固化完全后脱模", noteEn: "Demold after full cure" },
    ],
    properties: [
      { name: "环向拉伸强度", nameEn: "Hoop tensile strength", value: "150-250 MPa", valueEn: "150-250 MPa", standard: "GB/T 1447" },
      { name: "轴向拉伸强度", nameEn: "Axial tensile strength", value: "60-100 MPa", valueEn: "60-100 MPa" },
      { name: "环刚度(DN1000)", nameEn: "Ring stiffness (DN1000)", value: "SN2500-SN10000", valueEn: "SN2500-SN10000", standard: "GB/T 21238" },
      { name: "巴氏硬度", nameEn: "Barcol hardness", value: "≥40", valueEn: "≥40" },
      { name: "内衬吸水率", nameEn: "Liner water absorption", value: "<0.2%", valueEn: "<0.2%" },
    ],
    tips: [
      "管道壁结构通常为：内衬层→内结构层→夹砂层→外结构层→外保护层",
      "缠绕角度决定轴向/环向强度比，承内压管道用±55°接近最优",
      "夹砂层砂必须干燥（含水率<0.1%），否则影响层间粘结和长期耐水性",
      "参考GB/T 21238《玻璃纤维增强塑料夹砂管》进行设计和检验",
    ],
    tipsEn: [
      "Typical wall structure: liner → inner structural → sand core → outer structural → external protective.",
      "Winding angle controls the axial/hoop strength ratio — ±55° is near-optimal for internal-pressure pipes.",
      "Sand for the core layer must be dry (moisture <0.1%); otherwise interlaminar bonding and long-term water resistance suffer.",
      "Follow GB/T 21238 'Glass-fiber reinforced plastic mortar pipe' for design and inspection.",
    ],
    safetyNotes: [
      "缠绕车间苯乙烯浓度较高，必须强制排风",
      "石英砂粉尘需防护",
    ],
    safetyNotesEn: [
      "Styrene concentration is high in winding shops — forced ventilation is required.",
      "Quartz sand dust requires respiratory protection.",
    ],
  },
  {
    id: "fw-002",
    name: "高压FRP储罐缠绕配方",
    nameEn: "High-Pressure FRP Tank Filament Winding Formula",
    process: "缠绕成型",
    processEn: "Filament Winding",
    processId: "filament-winding",
    category: "pipe-tank",
    categoryEn: "Pipes & Tanks",
    application: "化工储罐、压力容器（0.1-1.0MPa）、运输罐",
    applicationEn: "Chemical storage tanks, pressure vessels (0.1-1.0 MPa), transport tanks",
    difficulty: "高级",
    description: "高性能缠绕储罐配方，使用乙烯基酯树脂配合高强玻纤，适合有内压和化学腐蚀要求的储罐。",
    descriptionEn: "High-performance filament-wound tank formula. Uses vinyl ester resin with high-strength glass fiber for tanks subject to internal pressure and chemical corrosion.",
    resinSystem: [
      { name: "双酚A环氧型乙烯基酯树脂", nameEn: "Bisphenol-A Epoxy Vinyl Ester Resin", role: "防腐内衬树脂", roleEn: "Anti-corrosion liner resin", amount: "100份", amountEn: "100 phr", note: "内衬2-3mm", noteEn: "Liner 2-3 mm" },
      { name: "间苯型不饱和聚酯树脂", nameEn: "Isophthalic Unsaturated Polyester Resin", role: "结构层树脂", roleEn: "Structural layer resin", amount: "100份", amountEn: "100 phr", note: "结构层可用较经济的UPR", noteEn: "More economical UPR can be used for structural layer" },
      { name: "MEKP固化剂", nameEn: "MEKP Curing Agent", role: "引发剂", roleEn: "Initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr" },
      { name: "环烷酸钴", nameEn: "Cobalt Naphthenate", role: "促进剂", roleEn: "Accelerator", amount: "0.3-0.5份", amountEn: "0.3-0.5 phr" },
    ],
    reinforcement: [
      { name: "ECR玻纤纱 4800tex", nameEn: "ECR Glass Roving 4800 tex", role: "螺旋缠绕", roleEn: "Helical winding", amount: "结构层主增强", amountEn: "Main structural reinforcement" },
      { name: "ECR玻纤短切毡 450g/m²", nameEn: "ECR Glass Chopped Strand Mat 450 g/m²", role: "内衬层", roleEn: "Liner layer", amount: "2-3层", amountEn: "2-3 plies" },
      { name: "ECR玻纤表面毡 50g/m²", nameEn: "ECR Glass Surface Veil 50 g/m²", role: "富树脂层", roleEn: "Resin-rich layer", amount: "最内层", amountEn: "Innermost layer" },
    ],
    auxiliaries: [
      { name: "乙烯基酯胶衣", nameEn: "Vinyl Ester Gelcoat", role: "内表面", roleEn: "Inner surface", amount: "0.5mm", amountEn: "0.5 mm" },
      { name: "外表面UV涂层", nameEn: "External UV Coating", role: "耐候保护", roleEn: "Weathering protection", amount: "0.3mm", amountEn: "0.3 mm" },
      { name: "加强筋（手糊）", nameEn: "Stiffening Ribs (hand lay-up)", role: "局部增强", roleEn: "Local reinforcement", amount: "按设计", amountEn: "Per design", note: "接管、人孔处", noteEn: "At nozzles and manways" },
    ],
    processing: [
      { name: "内衬缠绕", nameEn: "Liner winding", value: "低角度(85-90°)", valueEn: "Low angle (85-90°)", note: "环向缠绕", noteEn: "Hoop winding" },
      { name: "结构层缠绕", nameEn: "Structural winding", value: "±55°交替", valueEn: "Alternating ±55°", note: "封头部分调整角度", noteEn: "Adjust angle on dome ends" },
      { name: "纤维张力", nameEn: "Fiber tension", value: "30-80N/束", valueEn: "30-80 N per band", note: "根据纱线tex调整", noteEn: "Adjust per roving tex" },
      { name: "固化", nameEn: "Cure", value: "内衬常温固化→结构层固化→整体后固化", valueEn: "RT cure liner → cure structural → overall post-cure" },
      { name: "后固化", nameEn: "Post-cure", value: "80°C × 8h", valueEn: "80°C × 8h", note: "储罐必须后固化", noteEn: "Mandatory for tanks" },
      { name: "水压试验", nameEn: "Hydrostatic test", value: "1.5倍设计压力", valueEn: "1.5× design pressure", note: "保压30min无渗漏", noteEn: "Hold 30 min without leakage" },
    ],
    properties: [
      { name: "环向拉伸强度", nameEn: "Hoop tensile strength", value: "200-350 MPa", valueEn: "200-350 MPa" },
      { name: "设计内压", nameEn: "Design internal pressure", value: "0.1-1.0 MPa", valueEn: "0.1-1.0 MPa" },
      { name: "耐腐蚀（内衬）", nameEn: "Corrosion resistance (liner)", value: "依介质确定", valueEn: "Per service medium", standard: "HG/T 20696" },
      { name: "设计寿命", nameEn: "Design life", value: "20年（防腐工况）", valueEn: "20 years (anti-corrosion service)" },
    ],
    tips: [
      "内衬层必须使用乙烯基酯树脂，结构层可换用更经济的树脂",
      "封头缠绕是技术难点，需要专门的封头成型程序",
      "储罐设计参考JC/T 587《纤维缠绕增强塑料贮罐》",
      "出厂前必须做水压试验和目视检验",
    ],
    tipsEn: [
      "The liner must use vinyl ester resin; structural layers can use more economical resins.",
      "Dome-end winding is the hardest step — a dedicated dome-winding program is needed.",
      "Follow JC/T 587 'Filament-wound reinforced plastic tanks' for design.",
      "Hydrostatic testing and visual inspection are mandatory before shipment.",
    ],
    safetyNotes: [
      "水压试验时远离设备，防止意外爆裂",
      "大型储罐内部施工需要受限空间作业许可",
    ],
    safetyNotesEn: [
      "Stay clear of the equipment during hydrostatic testing in case of rupture.",
      "Confined-space work permits are required for interior work on large tanks.",
    ],
  },

  // ═══════════════════════════════════════════
  // 拉挤成型配方
  // ═══════════════════════════════════════════
  {
    id: "pl-001",
    name: "FRP拉挤型材标准配方",
    nameEn: "FRP Pultruded Profile Standard Formula",
    process: "拉挤成型",
    processEn: "Pultrusion",
    processId: "pultrusion",
    category: "profile",
    categoryEn: "Profiles & Gratings",
    application: "栏杆、桥架、梯子、门窗型材、格栅承载条",
    applicationEn: "Handrails, cable trays, ladders, door/window profiles, grating bearing bars",
    difficulty: "中级",
    description: "标准的FRP拉挤型材配方，使用邻苯型UPR配合玻纤纱和连续毡，产品满足EN 13706 E23级或GB/T 31539 I级要求。",
    descriptionEn: "Standard pultruded profile formula. Uses orthophthalic UPR with glass roving and continuous mat; meets EN 13706 grade E23 or GB/T 31539 grade I.",
    resinSystem: [
      { name: "拉挤专用不饱和聚酯树脂", nameEn: "Pultrusion-Grade Unsaturated Polyester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "低收缩、低粘度拉挤专用牌号", noteEn: "Low-shrinkage, low-viscosity pultrusion grade" },
      { name: "TBPB引发剂", nameEn: "TBPB Initiator", role: "高温引发", roleEn: "High-temperature initiator", amount: "0.8-1.2份", amountEn: "0.8-1.2 phr", note: "后区引发", noteEn: "Initiates in rear zone" },
      { name: "BPO引发剂", nameEn: "BPO Initiator", role: "中温引发", roleEn: "Mid-temperature initiator", amount: "0.3-0.5份", amountEn: "0.3-0.5 phr", note: "前区引发", noteEn: "Initiates in front zone" },
      { name: "硬脂酸锌", nameEn: "Zinc Stearate", role: "内脱模剂", roleEn: "Internal mold release", amount: "2-4份", amountEn: "2-4 phr", note: "关键！保证顺利脱模", noteEn: "Critical for clean release from die" },
      { name: "低收缩添加剂（LPA）", nameEn: "Low-Profile Additive (LPA)", role: "减少收缩", roleEn: "Shrinkage reduction", amount: "3-5份", amountEn: "3-5 phr", note: "改善表面质量", noteEn: "Improves surface quality" },
    ],
    reinforcement: [
      { name: "E-玻纤无碱直接纱 4800tex", nameEn: "E-glass Direct Roving 4800 tex", role: "纵向增强", roleEn: "Longitudinal reinforcement", amount: "纤维含量60-70%", amountEn: "Fiber content 60-70%", note: "提供纵向强度", noteEn: "Provides longitudinal strength" },
      { name: "E-玻纤连续毡 450g/m²", nameEn: "E-glass Continuous Filament Mat 450 g/m²", role: "横向增强", roleEn: "Transverse reinforcement", amount: "外层包覆", amountEn: "Outer wrap", note: "改善横向性能", noteEn: "Improves transverse properties" },
      { name: "E-玻纤表面毡 30g/m²", nameEn: "E-glass Surface Veil 30 g/m²", role: "表面质量", roleEn: "Surface quality", amount: "最外层", amountEn: "Outermost layer", note: "获得光滑表面", noteEn: "Yields a smooth surface" },
    ],
    auxiliaries: [
      { name: "CaCO₃填料", nameEn: "CaCO₃ Filler", role: "降低成本/阻燃", roleEn: "Cost reduction / flame retardancy", amount: "10-30份", amountEn: "10-30 phr", note: "过多影响力学性能", noteEn: "Excessive amounts degrade mechanical properties" },
      { name: "色浆", nameEn: "Color Paste", role: "着色", roleEn: "Coloring", amount: "2-5份", amountEn: "2-5 phr", note: "拉挤制品常用灰/黄/绿", noteEn: "Gray/yellow/green common for pultruded products" },
      { name: "UV稳定剂", nameEn: "UV Stabilizer", role: "耐候性", roleEn: "Weatherability", amount: "0.5-1.0份", amountEn: "0.5-1.0 phr", note: "户外产品必须添加", noteEn: "Required for outdoor products" },
    ],
    processing: [
      { name: "模具温度（前区）", nameEn: "Die temperature (front zone)", value: "100-120°C", valueEn: "100-120°C", note: "引发凝胶区", noteEn: "Initiation/gel zone" },
      { name: "模具温度（中区）", nameEn: "Die temperature (middle zone)", value: "130-150°C", valueEn: "130-150°C", note: "主固化区", noteEn: "Main cure zone" },
      { name: "模具温度（后区）", nameEn: "Die temperature (rear zone)", value: "140-160°C", valueEn: "140-160°C", note: "完全固化区", noteEn: "Full-cure zone" },
      { name: "拉挤速度", nameEn: "Pull speed", value: "0.2-0.6 m/min", valueEn: "0.2-0.6 m/min", note: "根据截面大小和壁厚", noteEn: "Depends on cross-section size and wall thickness" },
      { name: "牵引力", nameEn: "Pull force", value: "5-30 kN", valueEn: "5-30 kN", note: "取决于截面周长和摩擦", noteEn: "Depends on section perimeter and friction" },
      { name: "树脂浴温度", nameEn: "Resin bath temperature", value: "20-30°C", valueEn: "20-30°C", note: "控制浸润效果", noteEn: "Controls wet-out" },
    ],
    properties: [
      { name: "纵向拉伸强度", nameEn: "Longitudinal tensile strength", value: "≥240 MPa", valueEn: "≥240 MPa", standard: "GB/T 31539" },
      { name: "纵向弯曲强度", nameEn: "Longitudinal flexural strength", value: "≥240 MPa", valueEn: "≥240 MPa", standard: "GB/T 31539" },
      { name: "纵向弯曲模量", nameEn: "Longitudinal flexural modulus", value: "≥20 GPa", valueEn: "≥20 GPa", standard: "GB/T 31539" },
      { name: "巴氏硬度", nameEn: "Barcol hardness", value: "≥40", valueEn: "≥40", standard: "GB/T 3854" },
      { name: "纤维含量", nameEn: "Fiber content", value: "60-70%（重量）", valueEn: "60-70% (by weight)" },
    ],
    tips: [
      "内脱模剂（硬脂酸锌）是拉挤工艺的生命线，量不够会堵模",
      "三段温度梯度设计是核心技术，温度曲线需要针对每个配方和截面调试",
      "连续毡包覆层对横向强度贡献极大，不能全部用纱",
      "新配方开车前先用小截面试模，调通再上大截面",
      "拉挤速度不是越快越好，速度过快会固化不充分",
    ],
    tipsEn: [
      "Internal mold release (zinc stearate) is the lifeline of pultrusion — insufficient amounts will jam the die.",
      "The three-zone temperature gradient is the core know-how; the curve must be tuned for every formula and profile.",
      "Continuous mat wrap contributes greatly to transverse strength — don't rely on roving alone.",
      "Trial-run new formulas on a small cross-section first, then scale up after the process is dialed in.",
      "Faster is not better for pull speed — excessive speed leaves the part undercured.",
    ],
    safetyNotes: [
      "模具温度很高，防止烫伤",
      "树脂浴区域苯乙烯挥发集中，需要局部排风",
      "切割产生玻纤粉尘，切割区域需要除尘设备",
    ],
    safetyNotesEn: [
      "Die temperatures are very high — beware of burns.",
      "Styrene emissions concentrate at the resin bath — provide local exhaust.",
      "Cutting generates glass-fiber dust — install dust extraction at cutting stations.",
    ],
  },
  {
    id: "pl-002",
    name: "阻燃FRP格栅/型材配方",
    nameEn: "Flame-Retardant FRP Grating / Profile Formula",
    process: "拉挤成型",
    processEn: "Pultrusion",
    processId: "pultrusion",
    category: "profile",
    categoryEn: "Profiles & Gratings",
    application: "化工平台格栅、海上石油平台、地铁/隧道用型材",
    applicationEn: "Chemical platform gratings, offshore oil platforms, subway / tunnel profiles",
    difficulty: "高级",
    description: "满足阻燃一级要求的拉挤配方，通过添加ATH阻燃填料和使用阻燃树脂实现自熄性，氧指数≥32。",
    descriptionEn: "Pultrusion formula meeting Class 1 flame retardancy. Self-extinguishing with LOI ≥ 32 via ATH flame-retardant filler combined with a flame-retardant resin.",
    resinSystem: [
      { name: "阻燃不饱和聚酯树脂", nameEn: "Flame-Retardant Unsaturated Polyester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "卤代或磷系阻燃型", noteEn: "Halogenated or phosphorus-based FR grade" },
      { name: "TBPB引发剂", nameEn: "TBPB Initiator", role: "高温引发", roleEn: "High-temperature initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr" },
      { name: "BPO引发剂", nameEn: "BPO Initiator", role: "中温引发", roleEn: "Mid-temperature initiator", amount: "0.3-0.5份", amountEn: "0.3-0.5 phr" },
      { name: "硬脂酸锌", nameEn: "Zinc Stearate", role: "内脱模剂", roleEn: "Internal mold release", amount: "3-5份", amountEn: "3-5 phr" },
    ],
    reinforcement: [
      { name: "E-玻纤直接纱 4800tex", nameEn: "E-glass Direct Roving 4800 tex", role: "纵向增强", roleEn: "Longitudinal reinforcement", amount: "纤维含量55-65%", amountEn: "Fiber content 55-65%" },
      { name: "E-玻纤连续毡 450g/m²", nameEn: "E-glass Continuous Filament Mat 450 g/m²", role: "横向增强", roleEn: "Transverse reinforcement", amount: "外层包覆", amountEn: "Outer wrap" },
    ],
    auxiliaries: [
      { name: "ATH（氢氧化铝）", nameEn: "ATH (Aluminum Trihydrate)", role: "阻燃填料", roleEn: "Flame-retardant filler", amount: "40-80份", amountEn: "40-80 phr", note: "主要阻燃组分", noteEn: "Primary flame-retardant component" },
      { name: "三氧化二锑（Sb₂O₃）", nameEn: "Antimony Trioxide (Sb₂O₃)", role: "阻燃协效剂", roleEn: "FR synergist", amount: "3-5份", amountEn: "3-5 phr", note: "与卤素协效", noteEn: "Synergistic with halogens" },
      { name: "色浆（灰色/黄色）", nameEn: "Color Paste (gray/yellow)", role: "着色", roleEn: "Coloring", amount: "2-4份", amountEn: "2-4 phr" },
      { name: "UV稳定剂", nameEn: "UV Stabilizer", role: "耐候", roleEn: "Weatherability", amount: "0.5-1.0份", amountEn: "0.5-1.0 phr" },
    ],
    processing: [
      { name: "模具温度", nameEn: "Die temperature", value: "前110°C / 中140°C / 后155°C", valueEn: "Front 110°C / Middle 140°C / Rear 155°C" },
      { name: "拉挤速度", nameEn: "Pull speed", value: "0.15-0.4 m/min", valueEn: "0.15-0.4 m/min", note: "ATH高填充导致速度降低", noteEn: "Speed lowered by high ATH loading" },
      { name: "树脂粘度", nameEn: "Resin viscosity", value: "需调整至浸润良好", valueEn: "Adjust for good wet-out", note: "ATH使粘度大幅升高", noteEn: "ATH greatly raises viscosity" },
    ],
    properties: [
      { name: "氧指数", nameEn: "Limiting Oxygen Index (LOI)", value: "≥32", valueEn: "≥32", standard: "GB/T 2406" },
      { name: "阻燃等级", nameEn: "Flame retardancy rating", value: "FV-0 / 阻燃一级", valueEn: "FV-0 / Class 1 FR", standard: "GB/T 2408" },
      { name: "纵向弯曲强度", nameEn: "Longitudinal flexural strength", value: "≥180 MPa", valueEn: "≥180 MPa" },
      { name: "纵向弯曲模量", nameEn: "Longitudinal flexural modulus", value: "≥15 GPa", valueEn: "≥15 GPa", note: "ATH高填充会降低模量", noteEn: "High ATH loading reduces modulus" },
      { name: "烟密度", nameEn: "Smoke density", value: "≤75（NBS法）", valueEn: "≤75 (NBS method)", standard: "ASTM E662" },
    ],
    tips: [
      "ATH用量越高阻燃越好，但力学性能和加工性越差，需要平衡",
      "ATH的粒径很关键，建议使用D50<10μm的细粒径ATH",
      "高填充配方粘度大，浸纱困难，可能需要注射式浸润替代浸槽",
      "化工平台格栅一般要求氧指数≥28，海上石油平台要求≥32",
    ],
    tipsEn: [
      "More ATH means better flame retardancy but worse mechanicals and processability — balance is required.",
      "ATH particle size is critical — fine ATH with D50 < 10 μm is recommended.",
      "Highly filled formulations are very viscous and hard to wet out — injection wet-out may be needed instead of an open bath.",
      "Chemical-platform gratings typically require LOI ≥ 28; offshore oil platforms require ≥ 32.",
    ],
    safetyNotes: [
      "卤代阻燃树脂燃烧时产生有毒气体",
      "ATH粉尘需佩戴防尘口罩",
      "三氧化二锑粉尘有刺激性",
    ],
    safetyNotesEn: [
      "Halogenated FR resins emit toxic gases when burned.",
      "Wear a dust mask when handling ATH powder.",
      "Antimony trioxide dust is irritating.",
    ],
  },

  // ═══════════════════════════════════════════
  // 模压成型配方
  // ═══════════════════════════════════════════
  {
    id: "cm-001",
    name: "SMC汽车外板配方",
    nameEn: "SMC Automotive Body Panel Formula",
    process: "模压成型",
    processEn: "Compression Molding",
    processId: "compression",
    category: "auto",
    categoryEn: "Automotive / Transport",
    application: "商用车保险杠、引擎盖、挡泥板、仪表盘骨架",
    applicationEn: "Commercial-vehicle bumpers, hoods, fenders, instrument-panel substrates",
    difficulty: "高级",
    description: "A级表面SMC片材配方，满足汽车外覆盖件的表面质量和力学性能要求，可喷漆处理。",
    descriptionEn: "Class-A surface SMC sheet formula meeting the surface quality and mechanical requirements of automotive exterior panels — paintable.",
    resinSystem: [
      { name: "低收缩SMC专用不饱和聚酯树脂", nameEn: "Low-Shrink SMC-Grade Unsaturated Polyester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "高反应活性型", noteEn: "High-reactivity grade" },
      { name: "聚苯乙烯LPA低收缩剂", nameEn: "Polystyrene LPA (Low-Profile Additive)", role: "收缩补偿", roleEn: "Shrinkage compensation", amount: "30-40份", amountEn: "30-40 phr", note: "A级表面的关键", noteEn: "Key to Class-A surface" },
      { name: "TBPB引发剂", nameEn: "TBPB Initiator", role: "高温引发", roleEn: "High-temperature initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr" },
      { name: "MgO增稠剂", nameEn: "MgO Thickener", role: "化学增稠", roleEn: "Chemical thickening", amount: "2-4份", amountEn: "2-4 phr", note: "片材制备后增稠至模压粘度", noteEn: "Thickens sheet to molding viscosity after preparation" },
      { name: "硬脂酸锌", nameEn: "Zinc Stearate", role: "内脱模剂", roleEn: "Internal mold release", amount: "3-5份", amountEn: "3-5 phr" },
    ],
    reinforcement: [
      { name: "E-玻纤短切纱 25mm", nameEn: "E-glass Chopped Roving 25 mm", role: "增强纤维", roleEn: "Reinforcing fiber", amount: "25-30%（重量）", amountEn: "25-30% (by weight)", note: "SMC机组在线切割", noteEn: "Chopped inline on the SMC line" },
    ],
    auxiliaries: [
      { name: "CaCO₃填料", nameEn: "CaCO₃ Filler", role: "降低收缩/成本", roleEn: "Shrink/cost reduction", amount: "100-150份", amountEn: "100-150 phr", note: "1250目细粉", noteEn: "1250-mesh fine powder" },
      { name: "色浆", nameEn: "Color Paste", role: "底色", roleEn: "Base color", amount: "3-5份", amountEn: "3-5 phr" },
      { name: "PE薄膜", nameEn: "PE Carrier Film", role: "SMC载体膜", roleEn: "SMC carrier film", amount: "上下各一层", amountEn: "One layer top and bottom" },
    ],
    processing: [
      { name: "SMC片材熟化", nameEn: "SMC sheet maturation", value: "25°C × 24-72h", valueEn: "25°C × 24-72h", note: "MgO增稠达到可切割状态", noteEn: "MgO thickens to a cuttable state" },
      { name: "模压温度", nameEn: "Molding temperature", value: "140-155°C", valueEn: "140-155°C" },
      { name: "模压压力", nameEn: "Molding pressure", value: "5-10 MPa", valueEn: "5-10 MPa", note: "A级表面需要较高压力", noteEn: "Class-A surface requires higher pressure" },
      { name: "保压时间", nameEn: "Hold time", value: "60-120秒/mm壁厚", valueEn: "60-120 s per mm wall thickness" },
      { name: "加料量", nameEn: "Charge coverage", value: "模腔面积的60-70%", valueEn: "60-70% of cavity area" },
      { name: "开模温度", nameEn: "Demolding temperature", value: ">130°C", valueEn: ">130°C", note: "过早开模导致翘曲", noteEn: "Premature demolding causes warpage" },
    ],
    properties: [
      { name: "拉伸强度", nameEn: "Tensile strength", value: "60-80 MPa", valueEn: "60-80 MPa", standard: "GB/T 1447" },
      { name: "弯曲强度", nameEn: "Flexural strength", value: "120-160 MPa", valueEn: "120-160 MPa", standard: "GB/T 1449" },
      { name: "冲击强度（缺口）", nameEn: "Notched impact strength", value: "30-50 kJ/m²", valueEn: "30-50 kJ/m²", standard: "GB/T 1043" },
      { name: "线性收缩率", nameEn: "Linear shrinkage", value: "<0.05%", valueEn: "<0.05%", note: "LPA补偿后", noteEn: "After LPA compensation" },
      { name: "表面质量", nameEn: "Surface quality", value: "A级（可直接喷漆）", valueEn: "Class A (directly paintable)" },
    ],
    tips: [
      "LPA用量是A级表面的决定性因素，用量不足表面会有缩痕和波纹",
      "MgO增稠是SMC片材化的核心，增稠曲线需要严格控制",
      "模压料的流动性和加料位置决定了制品能否充满模腔",
      "CaCO₃粒径越细表面越好，但粘度越高",
      "适用标准: GB/T 12585《硬质模塑料 SMC和BMC》",
    ],
    tipsEn: [
      "LPA dosage decides Class-A surface quality — too little leaves sink marks and waviness.",
      "MgO thickening is the core of SMC sheet making — the thickening curve must be tightly controlled.",
      "Charge flow and placement determine whether the cavity fills completely.",
      "Finer CaCO₃ gives a better surface but higher viscosity.",
      "Applicable standard: GB/T 12585 'Rigid Molding Compounds — SMC and BMC'.",
    ],
    safetyNotes: [
      "模压温度高，注意防烫伤",
      "液压机有夹伤风险，严格遵守操作规程",
    ],
    safetyNotesEn: [
      "Molding temperatures are high — beware of burns.",
      "Hydraulic presses pose pinch hazards — follow operating procedures strictly.",
    ],
  },

  // ═══════════════════════════════════════════
  // RTM配方
  // ═══════════════════════════════════════════
  {
    id: "rtm-001",
    name: "轻型RTM汽车结构件配方",
    nameEn: "Light RTM (LRTM) Automotive Structural Part Formula",
    process: "RTM成型",
    processEn: "RTM",
    processId: "rtm",
    category: "auto",
    categoryEn: "Automotive / Transport",
    application: "汽车结构件、轨道交通内饰板、航空次结构件",
    applicationEn: "Automotive structural parts, rail-transit interior panels, aerospace secondary structures",
    difficulty: "高级",
    description: "LRTM（轻型RTM）工艺配方，使用低粘度环氧树脂配合多轴向织物预成型体，制品两面光滑，纤维含量高。",
    descriptionEn: "LRTM (Light RTM) formula. Uses low-viscosity epoxy resin with multi-axial fabric preforms — two smooth surfaces and high fiber content.",
    resinSystem: [
      { name: "RTM专用低粘度环氧树脂", nameEn: "RTM-Grade Low-Viscosity Epoxy Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "25°C粘度<500mPa·s", noteEn: "Viscosity <500 mPa·s at 25°C" },
      { name: "改性胺类固化剂", nameEn: "Modified Amine Curing Agent", role: "固化剂", roleEn: "Curing agent", amount: "按树脂配比", amountEn: "Per resin mix ratio", note: "慢速固化型，适用期>60min", noteEn: "Slow-cure type, pot life >60 min" },
    ],
    reinforcement: [
      { name: "多轴向经编织物 ±45°/0°/90° 600g/m²", nameEn: "Multi-Axial Stitched Fabric ±45°/0°/90° 600 g/m²", role: "主增强", roleEn: "Main reinforcement", amount: "按设计铺层", amountEn: "Per design lay-up", note: "预成型体缝合固定", noteEn: "Stitched into a preform" },
      { name: "玻纤或碳纤表面毡", nameEn: "Glass or Carbon Surface Veil", role: "表面层", roleEn: "Surface layer", amount: "最外层", amountEn: "Outermost layer", note: "改善表面质量", noteEn: "Improves surface quality" },
    ],
    auxiliaries: [
      { name: "预成型体粘结剂", nameEn: "Preform Binder", role: "预成型固定", roleEn: "Preform fixation", amount: "织物重量的2-5%", amountEn: "2-5% of fabric weight", note: "热塑性粘结粉", noteEn: "Thermoplastic binder powder" },
      { name: "密封条（硅胶）", nameEn: "Silicone Sealing Strip", role: "模具密封", roleEn: "Mold sealing", amount: "按模具周长", amountEn: "Per mold perimeter" },
      { name: "半永久脱模剂", nameEn: "Semi-Permanent Mold Release", role: "脱模", roleEn: "Mold release", amount: "每5-10模补涂", amountEn: "Re-apply every 5-10 cycles", note: "Frekote 770NC或同等品", noteEn: "Frekote 770NC or equivalent" },
    ],
    processing: [
      { name: "预成型体制备", nameEn: "Preform preparation", value: "裁剪→铺层→加热定型", valueEn: "Cut → lay-up → heat-set", note: "80°C × 10min", noteEn: "80°C × 10 min" },
      { name: "注入压力", nameEn: "Injection pressure", value: "0.1-0.3 MPa（LRTM）", valueEn: "0.1-0.3 MPa (LRTM)", note: "真空辅助降低压力", noteEn: "Vacuum assist reduces pressure" },
      { name: "真空度", nameEn: "Vacuum level", value: ">0.09 MPa", valueEn: ">0.09 MPa" },
      { name: "模具温度", nameEn: "Mold temperature", value: "60-80°C", valueEn: "60-80°C" },
      { name: "注入时间", nameEn: "Injection time", value: "5-30min", valueEn: "5-30 min", note: "取决于零件尺寸", noteEn: "Depends on part size" },
      { name: "固化", nameEn: "Cure", value: "80°C × 2h + 120°C × 2h", valueEn: "80°C × 2h + 120°C × 2h" },
      { name: "纤维体积含量", nameEn: "Fiber volume content", value: "50-60%", valueEn: "50-60%" },
    ],
    properties: [
      { name: "拉伸强度", nameEn: "Tensile strength", value: "250-400 MPa", valueEn: "250-400 MPa" },
      { name: "弯曲强度", nameEn: "Flexural strength", value: "300-500 MPa", valueEn: "300-500 MPa" },
      { name: "弯曲模量", nameEn: "Flexural modulus", value: "15-25 GPa", valueEn: "15-25 GPa" },
      { name: "Tg（玻璃化转变）", nameEn: "Tg (glass transition)", value: "120-140°C", valueEn: "120-140°C" },
      { name: "表面质量", nameEn: "Surface quality", value: "两面光滑", valueEn: "Smooth on both sides" },
    ],
    tips: [
      "树脂粘度是RTM成败的关键，注入前确认粘度在工艺窗口内",
      "预成型体的渗透率决定注入时间，可通过试验测定",
      "注入口和排气口位置设计影响浸润质量，需要做流动模拟",
      "模具密封不好会导致干斑（未浸润区域），必须确保真空不泄漏",
    ],
    tipsEn: [
      "Resin viscosity makes or breaks RTM — confirm it is within the process window before injection.",
      "Preform permeability determines injection time and can be measured experimentally.",
      "Inlet/vent placement affects wet-out quality — run a flow simulation.",
      "Poor mold sealing causes dry spots — guarantee a leak-free vacuum.",
    ],
    safetyNotes: [
      "环氧树脂固化剂有致敏性，佩戴手套",
      "避免皮肤接触未固化的环氧树脂",
    ],
    safetyNotesEn: [
      "Epoxy hardeners can cause sensitization — wear gloves.",
      "Avoid skin contact with uncured epoxy resin.",
    ],
  },

  // ═══════════════════════════════════════════
  // 真空导入配方
  // ═══════════════════════════════════════════
  {
    id: "vi-001",
    name: "大型风电叶片真空导入配方",
    nameEn: "Large Wind-Blade Vacuum Infusion Formula",
    process: "真空导入成型",
    processEn: "Vacuum Infusion (VARTM)",
    processId: "vacuum-infusion",
    category: "wind",
    categoryEn: "Wind Turbine Blades",
    application: "风电叶片壳体、大型游艇船体、桥梁面板",
    applicationEn: "Wind-blade shells, large yacht hulls, bridge deck panels",
    difficulty: "高级",
    description: "针对大型零件（>10m）优化的VARTM配方，使用低粘度环氧树脂配合单向织物和多轴向布，纤维含量55-65%。",
    descriptionEn: "VARTM formula optimized for large parts (>10 m). Uses low-viscosity epoxy resin with unidirectional and multi-axial fabrics; fiber content 55-65%.",
    resinSystem: [
      { name: "真空导入专用环氧树脂", nameEn: "Vacuum-Infusion-Grade Epoxy Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "25°C粘度200-400mPa·s", noteEn: "Viscosity 200-400 mPa·s at 25°C" },
      { name: "改性脂环胺固化剂", nameEn: "Modified Cycloaliphatic Amine Curing Agent", role: "固化剂", roleEn: "Curing agent", amount: "按树脂配比（通常30-35份）", amountEn: "Per resin mix ratio (typically 30-35 phr)", note: "适用期120-180min", noteEn: "Pot life 120-180 min" },
    ],
    reinforcement: [
      { name: "单向玻纤织物 1200g/m²", nameEn: "Unidirectional Glass Fabric 1200 g/m²", role: "主梁增强", roleEn: "Spar-cap reinforcement", amount: "主梁帽区域", amountEn: "Spar-cap region", note: "提供纵向弯曲刚度", noteEn: "Provides longitudinal flexural stiffness" },
      { name: "双轴向织物 ±45° 800g/m²", nameEn: "Biaxial Fabric ±45° 800 g/m²", role: "壳体蒙皮", roleEn: "Shell skin", amount: "全覆盖", amountEn: "Full coverage", note: "抗扭转和剪切", noteEn: "Resists torsion and shear" },
      { name: "三轴向织物 0/±45° 1000g/m²", nameEn: "Triaxial Fabric 0/±45° 1000 g/m²", role: "综合增强", roleEn: "General reinforcement", amount: "关键区域", amountEn: "Critical regions" },
    ],
    auxiliaries: [
      { name: "PVC/PET泡沫芯材", nameEn: "PVC/PET Foam Core", role: "夹层芯材", roleEn: "Sandwich core", amount: "按壳体设计", amountEn: "Per shell design", note: "Divinycell H80或同等品", noteEn: "Divinycell H80 or equivalent" },
      { name: "导流网（HDPE）", nameEn: "Flow Mesh (HDPE)", role: "树脂分配", roleEn: "Resin distribution", amount: "全覆盖", amountEn: "Full coverage", note: "Greenflow 75或同等品", noteEn: "Greenflow 75 or equivalent" },
      { name: "脱模布（尼龙）", nameEn: "Peel Ply (Nylon)", role: "工艺辅材", roleEn: "Process consumable", amount: "全覆盖", amountEn: "Full coverage", note: "脱模后易剥离", noteEn: "Peels off easily after demolding" },
      { name: "真空袋膜", nameEn: "Vacuum Bag Film", role: "密封", roleEn: "Sealing", amount: "全覆盖", amountEn: "Full coverage", note: "耐温80°C以上", noteEn: "Heat-resistant above 80°C" },
      { name: "密封胶带", nameEn: "Sealant Tape", role: "周边密封", roleEn: "Perimeter seal", amount: "按周长", amountEn: "Per perimeter" },
      { name: "螺旋管", nameEn: "Spiral Tubing", role: "树脂进胶管", roleEn: "Resin inlet line", amount: "按导流设计", amountEn: "Per flow design" },
    ],
    processing: [
      { name: "铺层时间", nameEn: "Lay-up time", value: "4-8小时（大型叶片）", valueEn: "4-8 hours (large blades)", note: "需要团队配合", noteEn: "Requires a coordinated team" },
      { name: "抽真空", nameEn: "Vacuum", value: "≥0.095 MPa", valueEn: "≥0.095 MPa", note: "保持30min检漏", noteEn: "Hold 30 min for leak check" },
      { name: "树脂混合温度", nameEn: "Resin mixing temperature", value: "25-30°C", valueEn: "25-30°C", note: "预热降低粘度", noteEn: "Pre-heat to lower viscosity" },
      { name: "注入时间", nameEn: "Injection time", value: "30-120min", valueEn: "30-120 min", note: "取决于零件尺寸", noteEn: "Depends on part size" },
      { name: "固化", nameEn: "Cure", value: "常温6-8h凝胶 → 60°C × 6h 后固化", valueEn: "RT gel 6-8h → 60°C × 6h post-cure" },
      { name: "纤维体积含量", nameEn: "Fiber volume content", value: "55-62%", valueEn: "55-62%" },
    ],
    properties: [
      { name: "纵向拉伸强度", nameEn: "Longitudinal tensile strength", value: "700-900 MPa（UD层）", valueEn: "700-900 MPa (UD plies)" },
      { name: "纵向压缩强度", nameEn: "Longitudinal compressive strength", value: "500-600 MPa（UD层）", valueEn: "500-600 MPa (UD plies)" },
      { name: "层间剪切强度", nameEn: "Interlaminar shear strength", value: "45-55 MPa", valueEn: "45-55 MPa", standard: "ASTM D2344" },
      { name: "Tg", nameEn: "Tg", value: "70-80°C（后固化后）", valueEn: "70-80°C (post-cured)" },
      { name: "孔隙率", nameEn: "Void content", value: "<1%", valueEn: "<1%", note: "真空导入优势", noteEn: "Advantage of vacuum infusion" },
    ],
    tips: [
      "树脂适用期必须覆盖完整注入时间+安全余量，大零件选长适用期体系",
      "导流网布局设计是技术核心，决定了浸润均匀性和注入速度",
      "泡沫芯材必须预开槽/打孔，否则芯材下方无法浸润",
      "真空检漏极其重要，1个小泄漏点可能导致整个零件报废",
      "参考DNV-ST-0376《风力发电机组转子叶片》进行设计",
    ],
    tipsEn: [
      "Resin pot life must cover the full injection time plus a safety margin — choose long-pot-life systems for large parts.",
      "Flow-mesh layout is the core know-how; it determines wet-out uniformity and injection speed.",
      "Foam cores must be pre-grooved/perforated, otherwise the underside cannot wet out.",
      "Vacuum leak checking is critical — a single small leak can scrap the whole part.",
      "Follow DNV-ST-0376 'Rotor blades for wind turbines' for design.",
    ],
    safetyNotes: [
      "环氧固化剂有致敏性，全程佩戴手套和长袖工作服",
      "玻纤织物裁剪时产生粉尘，佩戴口罩",
      "大型铺层作业注意人体工程学，防止腰伤",
    ],
    safetyNotesEn: [
      "Epoxy hardeners can sensitize skin — wear gloves and long sleeves throughout.",
      "Cutting glass fabric generates dust — wear a respirator.",
      "Mind ergonomics during large lay-ups to avoid back injuries.",
    ],
  },

  // ═══════════════════════════════════════════
  // 修补/防腐配方
  // ═══════════════════════════════════════════
  {
    id: "rp-001",
    name: "FRP制品现场修补配方",
    nameEn: "FRP Field Repair Formula",
    process: "修补/防腐",
    processEn: "Repair / Anti-corrosion",
    processId: "repair",
    category: "structural",
    categoryEn: "Structural Parts",
    application: "FRP制品裂纹修补、破损修复、防腐层修补",
    applicationEn: "Crack repair, damage repair, and anti-corrosion liner patching for FRP parts",
    difficulty: "入门",
    description: "通用的FRP制品现场修补配方，适用于裂纹、穿孔、磕碰损伤的修复。操作简单，不需要专业设备。",
    descriptionEn: "General field-repair formula for FRP parts. Suitable for cracks, punctures, and impact damage. Simple operation, no specialized equipment required.",
    resinSystem: [
      { name: "196#不饱和聚酯树脂", nameEn: "196# Unsaturated Polyester Resin", role: "修补树脂", roleEn: "Repair resin", amount: "按需", amountEn: "As needed", note: "与原制品树脂体系一致最佳", noteEn: "Best to match the original resin system" },
      { name: "MEKP固化剂", nameEn: "MEKP Curing Agent", role: "引发剂", roleEn: "Initiator", amount: "1.5-2.0份", amountEn: "1.5-2.0 phr", note: "修补时适当增加", noteEn: "Slightly higher for repair work" },
      { name: "环烷酸钴促进剂", nameEn: "Cobalt Naphthenate Accelerator", role: "促进剂", roleEn: "Accelerator", amount: "0.5-1.0份", amountEn: "0.5-1.0 phr" },
    ],
    reinforcement: [
      { name: "玻纤短切毡 300g/m²", nameEn: "Glass Chopped Strand Mat 300 g/m²", role: "修补增强", roleEn: "Repair reinforcement", amount: "2-4层", amountEn: "2-4 plies", note: "每层比上一层大20-30mm", noteEn: "Each ply 20-30 mm larger than the previous" },
      { name: "玻纤方格布 200g/m²", nameEn: "Glass Woven Roving 200 g/m²", role: "最外层", roleEn: "Outermost layer", amount: "1层", amountEn: "1 ply", note: "改善外观", noteEn: "Improves appearance" },
    ],
    auxiliaries: [
      { name: "丙酮", nameEn: "Acetone", role: "清洗打磨面", roleEn: "Cleaning sanded surface", amount: "适量", amountEn: "As needed", note: "去除油污和灰尘", noteEn: "Removes grease and dust" },
      { name: "砂纸（60-120目）", nameEn: "Sandpaper (60-120 grit)", role: "表面打磨", roleEn: "Surface sanding", amount: "打磨至粗糙", amountEn: "Sand to a rough finish" },
      { name: "气相二氧化硅", nameEn: "Fumed Silica", role: "腻子用触变剂", roleEn: "Putty thixotrope", amount: "5-10份", amountEn: "5-10 phr", note: "调成腻子填充凹坑", noteEn: "Make a putty for filling depressions" },
    ],
    processing: [
      { name: "1. 损伤评估", nameEn: "1. Damage assessment", value: "确定损伤范围和深度", valueEn: "Determine damage extent and depth" },
      { name: "2. 表面处理", nameEn: "2. Surface preparation", value: "打磨至粗糙 → 丙酮擦拭 → 干燥", valueEn: "Sand rough → wipe with acetone → dry" },
      { name: "3. 填充（如有凹坑）", nameEn: "3. Fill (if depressions exist)", value: "树脂腻子填平 → 等凝胶", valueEn: "Fill with resin putty → wait for gel" },
      { name: "4. 铺层修补", nameEn: "4. Patch lay-up", value: "树脂浸润毡/布 → 逐层铺覆 → 排气泡", valueEn: "Wet out mat/cloth → lay up ply by ply → debulk" },
      { name: "5. 固化", nameEn: "5. Cure", value: "常温24h", valueEn: "24h at room temperature" },
      { name: "6. 修整", nameEn: "6. Finishing", value: "打磨平整 → 涂胶衣（如需）", valueEn: "Sand flush → apply gelcoat if required" },
    ],
    properties: [
      { name: "修补区强度", nameEn: "Repair-zone strength", value: "原强度的70-90%", valueEn: "70-90% of original strength" },
      { name: "搭接宽度", nameEn: "Overlap width", value: "每侧≥损伤区最大尺寸", valueEn: "≥ largest damage dimension on each side", note: "阶梯搭接更好", noteEn: "Stepped overlap is preferred" },
    ],
    tips: [
      "修补区域打磨是关键，要露出新鲜纤维层才能保证粘结",
      "每层补丁要比上一层大20-30mm，形成阶梯搭接",
      "如果原制品用的是乙烯基酯树脂，修补也要用乙烯基酯",
      "穿孔修补要从两侧进行，先补内侧再补外侧",
      "修补后做敲击检测，声音沉闷说明有脱粘",
    ],
    tipsEn: [
      "Sanding the repair area is critical — fresh fiber layers must be exposed to ensure bonding.",
      "Each patch ply should be 20-30 mm larger than the previous, forming a stepped overlap.",
      "If the original part used vinyl ester, the repair must also use vinyl ester.",
      "For through-hole repairs, work from both sides — patch the inner face first, then the outer.",
      "Tap-test after repair — a dull thud indicates disbonding.",
    ],
    safetyNotes: [
      "丙酮易燃，远离火源",
      "打磨FRP时产生粉尘，佩戴防尘口罩",
      "密闭空间修补必须强制通风",
    ],
    safetyNotesEn: [
      "Acetone is flammable — keep away from ignition sources.",
      "Sanding FRP generates dust — wear a dust mask.",
      "Forced ventilation is mandatory for confined-space repairs.",
    ],
  },
  {
    id: "rp-002",
    name: "混凝土结构FRP加固配方",
    nameEn: "FRP Strengthening Formula for Concrete Structures",
    process: "修补/防腐",
    processEn: "Repair / Anti-corrosion",
    processId: "repair",
    category: "building",
    categoryEn: "Construction",
    application: "桥梁加固、梁柱加固、楼板加固、抗震加固",
    applicationEn: "Bridge strengthening, beam/column strengthening, slab strengthening, seismic retrofit",
    difficulty: "中级",
    description: "碳纤维布/玻纤布外贴加固混凝土结构的配方，使用浸渍环氧树脂体系，按GB 50367《混凝土结构加固设计规范》施工。",
    descriptionEn: "External-bond carbon/glass fabric strengthening formula for concrete structures. Uses an impregnating epoxy resin system; installation per GB 50367 'Code for Design of Strengthening Concrete Structures'.",
    resinSystem: [
      { name: "底涂环氧树脂", nameEn: "Primer Epoxy Resin", role: "基层渗透", roleEn: "Substrate penetration", amount: "按基面情况", amountEn: "Per substrate condition", note: "低粘度渗透型", noteEn: "Low-viscosity penetrating grade" },
      { name: "找平环氧腻子", nameEn: "Leveling Epoxy Putty", role: "基面找平", roleEn: "Substrate leveling", amount: "按基面平整度", amountEn: "Per substrate flatness", note: "环氧树脂+石英粉", noteEn: "Epoxy resin + quartz powder" },
      { name: "浸渍环氧树脂", nameEn: "Impregnating Epoxy Resin", role: "纤维浸润", roleEn: "Fiber wet-out", amount: "200-300g/m²/层", amountEn: "200-300 g/m² per ply", note: "中等粘度，触变性", noteEn: "Medium viscosity, thixotropic" },
    ],
    reinforcement: [
      { name: "碳纤维单向布 300g/m²", nameEn: "Unidirectional Carbon Fabric 300 g/m²", role: "受拉加固", roleEn: "Tensile strengthening", amount: "1-3层", amountEn: "1-3 plies", note: "T300级，幅宽100-500mm", noteEn: "T300 grade, width 100-500 mm" },
      { name: "碳纤维单向布 200g/m²", nameEn: "Unidirectional Carbon Fabric 200 g/m²", role: "抗剪加固", roleEn: "Shear strengthening", amount: "U型箍或全包", amountEn: "U-stirrups or full wrap", note: "环向包裹", noteEn: "Hoop wrapping" },
    ],
    auxiliaries: [
      { name: "石英砂（粗）", nameEn: "Quartz Sand (coarse)", role: "最外层撒砂", roleEn: "Top-coat sand broadcast", amount: "适量", amountEn: "As needed", note: "后续需要抹灰时增加粘结", noteEn: "Improves bonding for subsequent plastering" },
      { name: "防火涂料", nameEn: "Intumescent Fire Coating", role: "耐火保护", roleEn: "Fire protection", amount: "按耐火等级", amountEn: "Per fire rating", note: "CFRP加固后通常需要防火处理", noteEn: "Fire protection typically required after CFRP strengthening" },
    ],
    processing: [
      { name: "1. 基面处理", nameEn: "1. Substrate preparation", value: "凿除松散层 → 打磨至C15以上坚实面", valueEn: "Chip away loose material → grind down to sound concrete ≥ C15" },
      { name: "2. 刷底涂", nameEn: "2. Primer application", value: "渗透封底 → 干燥12-24h", valueEn: "Penetrating primer → dry 12-24h" },
      { name: "3. 找平", nameEn: "3. Leveling", value: "环氧腻子找平至≤1mm/m不平整度", valueEn: "Level with epoxy putty to ≤1 mm/m flatness" },
      { name: "4. 粘贴碳纤维", nameEn: "4. Bond carbon fabric", value: "涂浸渍胶 → 贴碳布 → 辊压排气 → 再涂胶", valueEn: "Apply saturating epoxy → bond fabric → roll out air → top-coat resin" },
      { name: "5. 固化", nameEn: "5. Cure", value: "常温7天达设计强度", valueEn: "Reaches design strength after 7 days at room temperature", note: "10°C以下慎施工", noteEn: "Avoid installation below 10°C" },
      { name: "6. 检验", nameEn: "6. Inspection", value: "粘结强度拉拔试验 ≥2.5MPa", valueEn: "Pull-off bond strength ≥ 2.5 MPa" },
    ],
    properties: [
      { name: "碳纤维抗拉强度", nameEn: "Carbon-fiber tensile strength", value: "≥3400 MPa", valueEn: "≥3400 MPa", standard: "GB 50367" },
      { name: "碳纤维弹性模量", nameEn: "Carbon-fiber elastic modulus", value: "≥230 GPa", valueEn: "≥230 GPa" },
      { name: "浸渍胶粘结强度", nameEn: "Saturating epoxy bond strength", value: "≥2.5 MPa", valueEn: "≥2.5 MPa", standard: "GB/T 7124" },
      { name: "浸渍胶拉伸剪切强度", nameEn: "Saturating epoxy tensile shear strength", value: "≥10 MPa", valueEn: "≥10 MPa" },
    ],
    tips: [
      "基面处理质量决定加固效果的80%，这是最关键的工序",
      "碳纤维布搭接长度≥100mm，搭接区域应避开最大应力处",
      "多层粘贴时，每层之间不需要等完全固化，可以湿碰湿施工",
      "严格按GB 50367和GB 50728进行设计和施工验收",
      "加固后必须做防火处理，CFRP在高温下会失去强度",
    ],
    tipsEn: [
      "Substrate preparation determines 80% of strengthening effectiveness — it is the single most critical step.",
      "Carbon fabric overlap length ≥ 100 mm, and overlaps must avoid peak-stress regions.",
      "For multi-ply bonding, plies do not need to fully cure between layers — wet-on-wet is acceptable.",
      "Strictly follow GB 50367 and GB 50728 for design and acceptance.",
      "Fire protection is mandatory after strengthening — CFRP loses strength at high temperatures.",
    ],
    safetyNotes: [
      "高空作业需要安全措施",
      "环氧树脂有致敏性，佩戴手套",
      "碳纤维丝导电，远离电气线路",
    ],
    safetyNotesEn: [
      "Working at heights requires fall-protection measures.",
      "Epoxy resin can sensitize skin — wear gloves.",
      "Carbon-fiber filaments are electrically conductive — keep clear of energized wiring.",
    ],
  },
  {
    id: "vi-002",
    name: "真空导入FRP船体配方",
    nameEn: "Vacuum-Infusion FRP Hull Formula",
    process: "真空导入成型",
    processEn: "Vacuum Infusion (VARTM)",
    processId: "vacuum-infusion",
    category: "marine",
    categoryEn: "Marine / Hydraulic",
    application: "游艇船体、帆船、工作艇、巡逻艇",
    applicationEn: "Yacht hulls, sailboats, work boats, patrol boats",
    difficulty: "中级",
    description: "船舶用VARTM配方，使用乙烯基酯树脂配合多轴向玻纤和PVC泡沫芯材，满足船级社认证要求。",
    descriptionEn: "Marine VARTM formula. Uses vinyl ester resin with multi-axial glass fabrics and PVC foam core; meets classification-society approval requirements.",
    resinSystem: [
      { name: "真空导入乙烯基酯树脂", nameEn: "Vacuum-Infusion Vinyl Ester Resin", role: "基体树脂", roleEn: "Matrix resin", amount: "100份", amountEn: "100 phr", note: "低粘度VARTM专用牌号", noteEn: "Low-viscosity VARTM-grade" },
      { name: "MEKP固化剂", nameEn: "MEKP Curing Agent", role: "引发剂", roleEn: "Initiator", amount: "1.0-1.5份", amountEn: "1.0-1.5 phr" },
      { name: "环烷酸钴促进剂", nameEn: "Cobalt Naphthenate Accelerator", role: "促进剂", roleEn: "Accelerator", amount: "0.2-0.4份", amountEn: "0.2-0.4 phr" },
    ],
    reinforcement: [
      { name: "E-玻纤双轴向布 ±45° 600g/m²", nameEn: "E-glass Biaxial Fabric ±45° 600 g/m²", role: "外蒙皮", roleEn: "Outer skin", amount: "3-4层", amountEn: "3-4 plies" },
      { name: "E-玻纤三轴向布 800g/m²", nameEn: "E-glass Triaxial Fabric 800 g/m²", role: "内蒙皮", roleEn: "Inner skin", amount: "2-3层", amountEn: "2-3 plies" },
      { name: "E-玻纤短切毡 300g/m²", nameEn: "E-glass Chopped Strand Mat 300 g/m²", role: "过渡层", roleEn: "Transition layer", amount: "芯材两侧各1层", amountEn: "1 ply on each side of the core" },
    ],
    auxiliaries: [
      { name: "PVC泡沫芯材 H80", nameEn: "PVC Foam Core H80", role: "夹层芯材", roleEn: "Sandwich core", amount: "15-25mm", amountEn: "15-25 mm", note: "底部用H100/H130", noteEn: "Use H100/H130 in the bottom" },
      { name: "导流网", nameEn: "Flow Mesh", role: "树脂分配", roleEn: "Resin distribution", amount: "全覆盖", amountEn: "Full coverage" },
      { name: "脱模布", nameEn: "Peel Ply", role: "辅材", roleEn: "Process consumable", amount: "全覆盖", amountEn: "Full coverage" },
      { name: "异酞型胶衣", nameEn: "Isophthalic Gelcoat", role: "外表面", roleEn: "Exterior surface", amount: "0.5mm", amountEn: "0.5 mm", note: "模具上预先喷涂", noteEn: "Pre-sprayed onto the mold" },
    ],
    processing: [
      { name: "胶衣喷涂", nameEn: "Gelcoat spraying", value: "0.4-0.6mm → 凝胶后铺层", valueEn: "0.4-0.6 mm → lay-up after gel" },
      { name: "铺层", nameEn: "Lay-up", value: "外蒙皮 → 芯材 → 内蒙皮", valueEn: "Outer skin → core → inner skin" },
      { name: "真空度", nameEn: "Vacuum level", value: "≥0.09 MPa", valueEn: "≥0.09 MPa" },
      { name: "注入", nameEn: "Injection", value: "从龙骨线注入，向两侧舷流动", valueEn: "Inject along keel line, flow outward to both sides" },
      { name: "固化", nameEn: "Cure", value: "常温24h → 后固化60°C × 8h", valueEn: "RT 24h → post-cure 60°C × 8h" },
    ],
    properties: [
      { name: "外蒙皮拉伸强度", nameEn: "Outer-skin tensile strength", value: "200-280 MPa", valueEn: "200-280 MPa" },
      { name: "夹层弯曲刚度", nameEn: "Sandwich flexural stiffness", value: "按船级社要求计算", valueEn: "Calculated per classification-society rules" },
      { name: "吸水率", nameEn: "Water absorption", value: "<0.5%（后固化后）", valueEn: "<0.5% (post-cured)" },
      { name: "纤维含量", nameEn: "Fiber content", value: "50-58%（重量）", valueEn: "50-58% (by weight)" },
    ],
    tips: [
      "船体导入树脂注入口通常设在龙骨线，出胶口在甲板边缘",
      "泡沫芯材转角处需要预热弯曲或使用划线芯材",
      "乙烯基酯导入粘度窗口比环氧窄，温度控制更重要",
      "船级社认证（CCS/DNV/LR）对材料和工艺有具体要求，提前确认",
    ],
    tipsEn: [
      "Hull infusion inlets are typically on the keel line, with vents at the deck edges.",
      "Foam-core corners need heat-bending or scored/contour-cut cores.",
      "Vinyl ester has a narrower infusion-viscosity window than epoxy — temperature control matters more.",
      "Classification-society approvals (CCS/DNV/LR) impose specific material and process requirements — confirm early.",
    ],
    safetyNotes: [
      "乙烯基酯苯乙烯挥发量大，密闭车间注意通风",
      "大型船体铺层作业注意防坠落",
    ],
    safetyNotesEn: [
      "Vinyl ester releases significant styrene — ventilate enclosed shops carefully.",
      "Use fall protection during large-hull lay-up work.",
    ],
  },
];
