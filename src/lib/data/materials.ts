export interface Material {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  properties: {
    density?: string;
    tensileStrength?: string;
    flexuralStrength?: string;
    flexuralModulus?: string;
    hdt?: string;
    elongation?: string;
    hardness?: string;
    flameRetardant?: string;
    waterAbsorption?: string;
  };
  applications: string[];
  description: string;
}

export const materialCategories = [
  { id: "resin", name: "树脂基体", icon: "🧪", count: 86 },
  { id: "fiber", name: "增强纤维", icon: "🧵", count: 54 },
  { id: "core", name: "芯材", icon: "📦", count: 28 },
  { id: "gelcoat", name: "胶衣/涂层", icon: "🎨", count: 32 },
  { id: "auxiliary", name: "辅助材料", icon: "⚗️", count: 45 },
  { id: "composite", name: "复合材料制品", icon: "🏗️", count: 67 },
];

export const materials: Material[] = [
  {
    id: "upr-196",
    name: "196#不饱和聚酯树脂",
    nameEn: "Unsaturated Polyester Resin 196",
    category: "resin",
    subCategory: "不饱和聚酯树脂",
    brand: "华昌聚合物",
    model: "HC-196",
    properties: {
      density: "1.12 g/cm³",
      tensileStrength: "65 MPa",
      flexuralStrength: "110 MPa",
      flexuralModulus: "3.8 GPa",
      hdt: "85°C",
      elongation: "2.5%",
      hardness: "巴氏硬度 40",
      waterAbsorption: "0.15%",
    },
    applications: ["手糊制品", "缠绕管道", "板材"],
    description: "通用型邻苯型不饱和聚酯树脂，适用于一般性能要求的玻璃钢制品。",
  },
  {
    id: "upr-191",
    name: "191#不饱和聚酯树脂",
    nameEn: "Unsaturated Polyester Resin 191",
    category: "resin",
    subCategory: "不饱和聚酯树脂",
    brand: "华昌聚合物",
    model: "HC-191",
    properties: {
      density: "1.11 g/cm³",
      tensileStrength: "60 MPa",
      flexuralStrength: "100 MPa",
      flexuralModulus: "3.6 GPa",
      hdt: "80°C",
      elongation: "2.8%",
      hardness: "巴氏硬度 38",
      waterAbsorption: "0.18%",
    },
    applications: ["手糊制品", "玻璃钢制品"],
    description: "通用型不饱和聚酯树脂，性价比高，是最常用的手糊成型树脂。",
  },
  {
    id: "vinyl-ester-901",
    name: "乙烯基酯树脂 901",
    nameEn: "Vinyl Ester Resin 901",
    category: "resin",
    subCategory: "乙烯基酯树脂",
    brand: "力联思",
    model: "Palatal A430-01",
    properties: {
      density: "1.15 g/cm³",
      tensileStrength: "82 MPa",
      flexuralStrength: "135 MPa",
      flexuralModulus: "3.5 GPa",
      hdt: "120°C",
      elongation: "5.0%",
      hardness: "巴氏硬度 45",
      waterAbsorption: "0.08%",
    },
    applications: ["化工防腐", "储罐", "烟囱内衬"],
    description: "双酚A环氧型乙烯基酯树脂，具有优异的耐化学腐蚀性能。",
  },
  {
    id: "epoxy-e51",
    name: "E-51环氧树脂",
    nameEn: "Epoxy Resin E-51",
    category: "resin",
    subCategory: "环氧树脂",
    brand: "南亚环氧",
    model: "NPEL-128",
    properties: {
      density: "1.16 g/cm³",
      tensileStrength: "85 MPa",
      flexuralStrength: "125 MPa",
      flexuralModulus: "3.2 GPa",
      hdt: "140°C",
      elongation: "4.5%",
      hardness: "邵氏D硬度 85",
      waterAbsorption: "0.10%",
    },
    applications: ["碳纤维复合材料", "风电叶片", "航空航天"],
    description: "标准双酚A型液态环氧树脂，广泛用于高性能复合材料基体。",
  },
  {
    id: "eglass-ecr",
    name: "ECR玻璃纤维无碱布",
    nameEn: "ECR Glass Fiber Woven Roving",
    category: "fiber",
    subCategory: "玻璃纤维",
    brand: "中国巨石",
    model: "ECR2400-800",
    properties: {
      density: "2.62 g/cm³",
      tensileStrength: "3400 MPa",
      flexuralModulus: "80 GPa",
      elongation: "4.8%",
    },
    applications: ["风电叶片", "船舶", "汽车配件"],
    description: "高性能耐腐蚀玻璃纤维，兼具优异的力学性能和耐化学腐蚀性。",
  },
  {
    id: "carbon-t300",
    name: "T300级碳纤维",
    nameEn: "T300 Carbon Fiber",
    category: "fiber",
    subCategory: "碳纤维",
    brand: "光威复材",
    model: "GW-T300-3K",
    properties: {
      density: "1.76 g/cm³",
      tensileStrength: "3530 MPa",
      flexuralModulus: "230 GPa",
      elongation: "1.5%",
    },
    applications: ["航空航天", "体育器材", "风电叶片主梁"],
    description: "国产T300级碳纤维，性能对标东丽T300，适用于结构增强。",
  },
  {
    id: "pvc-foam-h80",
    name: "PVC泡沫芯材 H80",
    nameEn: "PVC Foam Core H80",
    category: "core",
    subCategory: "PVC泡沫",
    brand: "3A Composites",
    model: "Airex C70.75",
    properties: {
      density: "0.08 g/cm³",
      tensileStrength: "2.2 MPa",
      flexuralStrength: "1.6 MPa",
      flexuralModulus: "0.069 GPa",
      waterAbsorption: "0.5%",
    },
    applications: ["夹层结构", "船舶", "风电"],
    description: "闭孔PVC泡沫，优异的抗压和抗剪切性能，用于夹层结构芯材。",
  },
  {
    id: "gelcoat-iso",
    name: "异酞型胶衣树脂",
    nameEn: "Isophthalic Gelcoat",
    category: "gelcoat",
    subCategory: "胶衣",
    brand: "力联思",
    model: "Synolite 0485-N-1",
    properties: {
      hardness: "巴氏硬度 45",
      waterAbsorption: "0.08%",
      flameRetardant: "UL 94 HB",
    },
    applications: ["船舶外壳", "卫浴制品", "户外设施"],
    description: "异酞型喷射胶衣，优异的耐水性和耐候性，表面光洁度高。",
  },
  {
    id: "mekp-catalyst",
    name: "MEKP固化剂",
    nameEn: "MEKP Catalyst",
    category: "auxiliary",
    subCategory: "固化剂",
    brand: "阿克苏诺贝尔",
    model: "Butanox M-50",
    properties: {},
    applications: ["不饱和聚酯树脂固化", "乙烯基酯树脂固化"],
    description: "过氧化甲乙酮，是不饱和聚酯树脂最常用的引发剂/固化剂。",
  },
  {
    id: "frp-grating",
    name: "模塑玻璃钢格栅",
    nameEn: "Molded FRP Grating",
    category: "composite",
    subCategory: "格栅",
    brand: "南通恒新",
    model: "HX-38×38×38",
    properties: {
      density: "1.8 g/cm³",
      flexuralStrength: "170 MPa",
      flameRetardant: "阻燃一级",
    },
    applications: ["化工平台", "污水处理", "海上石油"],
    description: "模塑成型玻璃钢格栅，耐腐蚀、阻燃、防滑，替代钢格栅。",
  },
];

export const priceData = [
  { name: "196#树脂", price: 8500, unit: "元/吨", change: 2.1, region: "华东" },
  { name: "191#树脂", price: 7800, unit: "元/吨", change: -1.5, region: "华东" },
  { name: "乙烯基酯树脂", price: 18500, unit: "元/吨", change: 0.8, region: "华东" },
  { name: "E-51环氧树脂", price: 22000, unit: "元/吨", change: 3.2, region: "华东" },
  { name: "ECR无碱纱", price: 4200, unit: "元/吨", change: -0.5, region: "华东" },
  { name: "T300碳纤维(3K)", price: 120, unit: "元/米", change: -2.0, region: "全国" },
  { name: "PVC泡沫(H80)", price: 85, unit: "元/㎡", change: 0.0, region: "全国" },
  { name: "模塑格栅(38型)", price: 165, unit: "元/㎡", change: 1.2, region: "华东" },
];
