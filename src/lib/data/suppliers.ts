export interface Supplier {
  id: string;
  name: string;
  location: string;
  province: string;
  category: string;
  products: string[];
  processes: string[];
  established: number;
  verified: boolean;
  description: string;
  certifications: string[];
  website?: string;
}

export const supplierCategories = [
  { id: "manufacturer", name: "制品生产商", nameEn: "Manufacturer" },
  { id: "resin", name: "树脂供应商", nameEn: "Resin supplier" },
  { id: "fiber", name: "纤维供应商", nameEn: "Fiber supplier" },
  { id: "equipment", name: "设备供应商", nameEn: "Equipment supplier" },
  { id: "mold", name: "模具制造商", nameEn: "Mold maker" },
  { id: "service", name: "检测/认证服务", nameEn: "Testing / certification" },
];

export const suppliers: Supplier[] = [
  {
    id: "s1",
    name: "南通恒新复合材料有限公司",
    location: "江苏南通",
    province: "江苏",
    category: "manufacturer",
    products: ["玻璃钢格栅", "FRP型材", "拉挤产品"],
    processes: ["拉挤成型", "模压成型"],
    established: 2005,
    verified: true,
    description: "专业FRP格栅和拉挤型材生产企业，年产能1.5万吨。",
    certifications: ["ISO 9001", "ISO 14001", "CE认证"],
  },
  {
    id: "s2",
    name: "河北冀州中意复合材料有限公司",
    location: "河北衡水",
    province: "河北",
    category: "manufacturer",
    products: ["玻璃钢储罐", "玻璃钢管道", "脱硫塔"],
    processes: ["缠绕成型", "手糊成型"],
    established: 1998,
    verified: true,
    description: "国内领先的玻璃钢储罐和管道制造企业，产品出口30多个国家。",
    certifications: ["ISO 9001", "ASME认证", "API认证"],
  },
  {
    id: "s3",
    name: "华昌聚合物有限公司",
    location: "江苏常州",
    province: "江苏",
    category: "resin",
    products: ["不饱和聚酯树脂", "乙烯基酯树脂", "胶衣树脂"],
    processes: [],
    established: 2001,
    verified: true,
    description: "华东地区主要的树脂供应商，年产能5万吨，产品覆盖全品类UPR。",
    certifications: ["ISO 9001", "ISO 14001"],
  },
  {
    id: "s4",
    name: "中国巨石股份有限公司",
    location: "浙江嘉兴",
    province: "浙江",
    category: "fiber",
    products: ["玻璃纤维纱", "玻璃纤维布", "短切毡"],
    processes: [],
    established: 1993,
    verified: true,
    description: "全球最大的玻璃纤维生产企业，年产能超300万吨。",
    certifications: ["ISO 9001", "ISO 14001", "ISO 45001"],
  },
  {
    id: "s5",
    name: "光威复材股份有限公司",
    location: "山东威海",
    province: "山东",
    category: "fiber",
    products: ["碳纤维", "碳纤维预浸料", "碳纤维复合材料制品"],
    processes: ["碳纤维制备", "预浸料生产"],
    established: 1992,
    verified: true,
    description: "国内碳纤维龙头企业，军民融合发展典范，T300/T700/T800全系列覆盖。",
    certifications: ["ISO 9001", "GJB认证", "AS9100"],
  },
  {
    id: "s6",
    name: "山东双一科技股份有限公司",
    location: "山东德州",
    province: "山东",
    category: "manufacturer",
    products: ["风电叶片模具", "FRP模具", "复合材料工装"],
    processes: ["模具设计制造", "手糊成型", "真空导入"],
    established: 2003,
    verified: true,
    description: "国内领先的风电叶片模具制造商，产品远销欧美。",
    certifications: ["ISO 9001", "ISO 14001"],
  },
  {
    id: "yaoyi",
    name: "F1 Composite Co., Ltd（曜一新材）",
    location: "重庆两江新区",
    province: "重庆",
    category: "manufacturer",
    products: [
      "拉挤型材（I 型梁/槽钢/角钢/管材/平板）",
      "定制拉挤截面",
      "FRP 格栅与板材",
      "门窗系统型材（70/80/90 系列）",
    ],
    processes: ["拉挤成型 (Pultrusion)", "KNOWHOW 技术服务"],
    established: 2015,
    verified: true,
    description:
      "FRP 拉挤型材专业制造商，5 大生产基地、370 条拉挤线、年产能 15 万吨，200+ 工程化型材规格，产品出口 30+ 国家，已交付秦岭南极站等标杆项目。【关系披露】曜一新材为 f1frp 平台首批运营合作方与关联企业；f1frp 派单算法对曜一与其他供应商一视同仁，buyer 可在每条 RFQ 上查看派单匹配评分。详见官网 f1composite.com。",
    certifications: [
      "ISO 9001:2015",
      "CE (EU CPR)",
      "EN 13706",
      "ASTM",
      "PHI",
    ],
    website: "https://f1composite.com",
  },
];

export const provinces = [
  "全国", "江苏", "浙江", "山东", "河北", "广东", "四川", "湖北", "安徽", "河南", "重庆",
];
