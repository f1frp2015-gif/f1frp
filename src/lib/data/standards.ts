export interface Standard {
  id: string;
  code: string;
  title: string;
  titleEn?: string;
  country: string;
  countryCode: string;
  category: string;
  process: string[];
  year?: string;
  status: "现行" | "废止" | "即将实施";
  description?: string;
}

export const countryFilters = [
  { id: "all", name: "全部", flag: "🌍" },
  { id: "CN", name: "中国", flag: "🇨🇳" },
  { id: "ISO", name: "国际ISO", flag: "🌐" },
  { id: "US", name: "美国ASTM", flag: "🇺🇸" },
  { id: "EU", name: "欧洲EN", flag: "🇪🇺" },
  { id: "DE", name: "德国DIN", flag: "🇩🇪" },
];

export const standardCategories = [
  { id: "all", name: "全部类别" },
  { id: "test-mechanical", name: "力学试验" },
  { id: "test-physical", name: "物理/热学试验" },
  { id: "test-chemical", name: "化学/耐腐蚀试验" },
  { id: "test-fire", name: "阻燃/燃烧试验" },
  { id: "raw-material", name: "原材料" },
  { id: "product-pipe", name: "管道" },
  { id: "product-tank", name: "储罐/容器" },
  { id: "product-profile", name: "型材/格栅" },
  { id: "product-general", name: "通用制品" },
  { id: "design", name: "设计/工程规范" },
  { id: "marine", name: "船舶/海工" },
  { id: "construction", name: "建筑加固" },
  { id: "electrical", name: "电气/电工" },
];

export const processTagOptions = [
  { id: "all", name: "全部工艺" },
  { id: "general", name: "通用" },
  { id: "hand-layup", name: "手糊" },
  { id: "winding", name: "缠绕" },
  { id: "pultrusion", name: "拉挤" },
  { id: "molding", name: "模压" },
  { id: "rtm", name: "RTM" },
  { id: "vacuum", name: "真空导入" },
  { id: "repair", name: "修补/加固" },
];

export const standards: Standard[] = [
  // ═══════════════════════════════════════════
  // 中国 — 力学试验标准
  // ═══════════════════════════════════════════
  { id: "cn-001", code: "GB/T 1446-2005", title: "纤维增强塑料性能试验方法总则", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-002", code: "GB/T 1447-2005", title: "纤维增强塑料拉伸性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-003", code: "GB/T 1448-2005", title: "纤维增强塑料压缩性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-004", code: "GB/T 1449-2005", title: "纤维增强塑料弯曲性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-005", code: "GB/T 1450.1-2005", title: "纤维增强塑料层间剪切强度试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-006", code: "GB/T 1450.2-2005", title: "纤维增强塑料冲压式剪切强度试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-007", code: "GB/T 1451-2005", title: "纤维增强塑料简支梁式冲击韧性试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-008", code: "GB/T 1458-2023", title: "纤维缠绕增强复合材料环形试样力学性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["winding"], year: "2023", status: "现行" },
  { id: "cn-009", code: "GB/T 3354-2014", title: "定向纤维增强塑料拉伸性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2014", status: "现行" },
  { id: "cn-010", code: "GB/T 3355-2014", title: "纤维增强塑料纵横剪切试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2014", status: "现行" },
  { id: "cn-011", code: "GB/T 3856-2005", title: "单向纤维增强塑料平板压缩性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-012", code: "GB/T 41061-2021", title: "纤维增强塑料蠕变性能试验方法", country: "中国", countryCode: "CN", category: "test-mechanical", process: ["general"], year: "2021", status: "现行" },

  // 中国 — 物理/热学试验
  { id: "cn-020", code: "GB/T 1462-2005", title: "纤维增强塑料吸水性试验方法", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-021", code: "GB/T 1463-2005", title: "纤维增强塑料密度和相对密度试验方法", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-022", code: "GB/T 2567-2021", title: "树脂浇铸体性能试验方法", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2021", status: "现行" },
  { id: "cn-023", code: "GB/T 2573-2008", title: "玻璃纤维增强塑料老化性能试验方法", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2008", status: "现行" },
  { id: "cn-024", code: "GB/T 3854-2017", title: "增强塑料巴柯尔硬度试验方法", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2017", status: "现行" },
  { id: "cn-025", code: "GB/T 3855-2005", title: "碳纤维增强塑料树脂含量试验方法", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2005", status: "现行" },
  { id: "cn-026", code: "GB/T 1634.1-2019", title: "塑料 负荷变形温度的测定(HDT)", country: "中国", countryCode: "CN", category: "test-physical", process: ["general"], year: "2019", status: "现行" },

  // 中国 — 化学/耐腐蚀
  { id: "cn-030", code: "GB/T 3857-2017", title: "玻璃纤维增强热固性塑料耐化学介质环境性能试验方法", country: "中国", countryCode: "CN", category: "test-chemical", process: ["general", "hand-layup"], year: "2017", status: "现行" },

  // 中国 — 阻燃
  { id: "cn-035", code: "GB/T 2406.2-2009", title: "塑料 用氧指数法测定燃烧行为(氧指数)", country: "中国", countryCode: "CN", category: "test-fire", process: ["general"], year: "2009", status: "现行" },
  { id: "cn-036", code: "GB/T 2408-2021", title: "塑料 燃烧性能的测定 水平法和垂直法", country: "中国", countryCode: "CN", category: "test-fire", process: ["general"], year: "2021", status: "现行" },
  { id: "cn-037", code: "GB/T 8924-2005", title: "纤维增强塑料燃烧性能试验方法（氧指数法）", country: "中国", countryCode: "CN", category: "test-fire", process: ["general"], year: "2005", status: "现行" },

  // 中国 — 原材料
  { id: "cn-040", code: "GB/T 8237-2016", title: "纤维增强塑料用液体不饱和聚酯树脂", country: "中国", countryCode: "CN", category: "raw-material", process: ["general"], year: "2016", status: "现行" },
  { id: "cn-041", code: "GB/T 18370-2017", title: "玻璃纤维无捻粗纱布", country: "中国", countryCode: "CN", category: "raw-material", process: ["general", "hand-layup"], year: "2017", status: "现行" },
  { id: "cn-042", code: "GB/T 18369-2008", title: "玻璃纤维无捻粗纱", country: "中国", countryCode: "CN", category: "raw-material", process: ["winding", "pultrusion"], year: "2008", status: "现行" },
  { id: "cn-043", code: "GB/T 7690.1-2013", title: "增强材料 纱 试验方法 第1部分：线密度的测定", country: "中国", countryCode: "CN", category: "raw-material", process: ["general"], year: "2013", status: "现行" },

  // 中国 — 管道
  { id: "cn-050", code: "GB/T 21238-2016", title: "玻璃纤维增强塑料夹砂管", country: "中国", countryCode: "CN", category: "product-pipe", process: ["winding"], year: "2016", status: "现行" },
  { id: "cn-051", code: "GB/T 21492-2019", title: "玻璃纤维增强塑料顶管", country: "中国", countryCode: "CN", category: "product-pipe", process: ["winding"], year: "2019", status: "现行" },
  { id: "cn-052", code: "GB/T 20623-2006", title: "玻璃纤维增强塑料管道和管件 螺纹连接", country: "中国", countryCode: "CN", category: "product-pipe", process: ["winding"], year: "2006", status: "现行" },

  // 中国 — 储罐/容器
  { id: "cn-055", code: "GB/T 28297-2012", title: "纤维增强塑料缠绕容器", country: "中国", countryCode: "CN", category: "product-tank", process: ["winding"], year: "2012", status: "现行" },
  { id: "cn-056", code: "JC/T 587-2012", title: "纤维缠绕增强塑料贮罐", country: "中国", countryCode: "CN", category: "product-tank", process: ["winding"], year: "2012", status: "现行" },

  // 中国 — 型材/格栅
  { id: "cn-060", code: "GB/T 31539-2015", title: "结构用纤维增强复合材料拉挤型材", country: "中国", countryCode: "CN", category: "product-profile", process: ["pultrusion"], year: "2015", status: "现行" },
  { id: "cn-061", code: "JC/T 1026-2007", title: "玻璃纤维增强热固性树脂承载型格栅", country: "中国", countryCode: "CN", category: "product-profile", process: ["molding"], year: "2007", status: "现行" },
  { id: "cn-062", code: "JC/T 2561-2020", title: "纤维增强复合材料电缆桥架", country: "中国", countryCode: "CN", category: "product-profile", process: ["pultrusion", "hand-layup"], year: "2020", status: "现行" },

  // 中国 — 模压制品
  { id: "cn-065", code: "GB/T 15568-2008", title: "通用型片状模塑料(SMC)", country: "中国", countryCode: "CN", category: "product-general", process: ["molding"], year: "2008", status: "现行" },
  { id: "cn-066", code: "GB/T 23641-2018", title: "电气用纤维增强不饱和聚酯模塑料(SMC/BMC)", country: "中国", countryCode: "CN", category: "electrical", process: ["molding"], year: "2018", status: "现行" },

  // 中国 — 设计/工程规范
  { id: "cn-070", code: "GB 51160-2016", title: "纤维增强塑料设备和管道工程技术规范", country: "中国", countryCode: "CN", category: "design", process: ["general", "winding", "hand-layup"], year: "2016", status: "现行" },
  { id: "cn-071", code: "HG/T 20696-2018", title: "纤维增强塑料化工设备技术规范", country: "中国", countryCode: "CN", category: "design", process: ["hand-layup", "winding"], year: "2018", status: "现行" },
  { id: "cn-072", code: "HG/T 21633-1991", title: "玻璃钢管和管件", country: "中国", countryCode: "CN", category: "design", process: ["winding"], year: "1991", status: "现行" },

  // 中国 — 建筑加固
  { id: "cn-075", code: "GB 50367-2013", title: "混凝土结构加固设计规范", country: "中国", countryCode: "CN", category: "construction", process: ["repair"], year: "2013", status: "现行" },
  { id: "cn-076", code: "GB 50728-2011", title: "工程结构加固材料安全性鉴定技术规范", country: "中国", countryCode: "CN", category: "construction", process: ["repair"], year: "2011", status: "现行" },
  { id: "cn-077", code: "GB/T 26745-2011", title: "结构加固修复用碳纤维片材", country: "中国", countryCode: "CN", category: "construction", process: ["repair"], year: "2011", status: "现行" },
  { id: "cn-078", code: "GB 50608-2020", title: "纤维增强复合材料工程应用技术标准", country: "中国", countryCode: "CN", category: "construction", process: ["general", "repair"], year: "2020", status: "现行" },

  // ═══════════════════════════════════════════
  // ISO 国际标准
  // ═══════════════════════════════════════════
  { id: "iso-001", code: "ISO 527-4:2023", title: "塑料 拉伸性能测定 第4部分: 各向同性和正交各向异性纤维增强复合材料", titleEn: "Plastics — Tensile properties — Part 4: Isotropic and orthotropic fibre-reinforced composites", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "2023", status: "现行" },
  { id: "iso-002", code: "ISO 527-5:2009", title: "塑料 拉伸性能测定 第5部分: 单向纤维增强复合材料", titleEn: "Plastics — Tensile properties — Part 5: Unidirectional fibre-reinforced composites", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "2009", status: "现行" },
  { id: "iso-003", code: "ISO 14125:1998", title: "纤维增强塑料复合材料 弯曲性能测定", titleEn: "Fibre-reinforced plastic composites — Determination of flexural properties", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "1998", status: "现行" },
  { id: "iso-004", code: "ISO 14126:1999", title: "纤维增强塑料复合材料 面内压缩性能测定", titleEn: "Fibre-reinforced plastic composites — Determination of compressive properties in the in-plane direction", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "1999", status: "现行" },
  { id: "iso-005", code: "ISO 14129:1997", title: "纤维增强塑料复合材料 面内剪切应力/应变响应(±45°法)", titleEn: "Fibre-reinforced plastic composites — ±45° tension test for in-plane shear", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "1997", status: "现行" },
  { id: "iso-006", code: "ISO 14130:1997", title: "纤维增强塑料复合材料 短梁法层间剪切强度测定", titleEn: "Fibre-reinforced plastic composites — Short-beam method for interlaminar shear strength", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "1997", status: "现行" },
  { id: "iso-007", code: "ISO 1172:1996", title: "纺织玻璃纤维增强塑料 玻纤和矿物填料含量测定(灼烧法)", titleEn: "Textile-glass-reinforced plastics — Determination of glass and mineral-filler content (calcination)", country: "ISO", countryCode: "ISO", category: "test-physical", process: ["general"], year: "1996", status: "现行" },
  { id: "iso-008", code: "ISO 75-1:2020", title: "塑料 负荷变形温度测定 第1部分", titleEn: "Plastics — Determination of temperature of deflection under load — Part 1", country: "ISO", countryCode: "ISO", category: "test-physical", process: ["general"], year: "2020", status: "现行" },
  { id: "iso-009", code: "ISO 62:2008", title: "塑料 吸水率测定", titleEn: "Plastics — Determination of water absorption", country: "ISO", countryCode: "ISO", category: "test-physical", process: ["general"], year: "2008", status: "现行" },
  { id: "iso-010", code: "ISO 15114:2014", title: "纤维增强塑料复合材料 II型层间断裂韧性测定", titleEn: "Fibre-reinforced plastic composites — Determination of mode II fracture resistance (GIIc)", country: "ISO", countryCode: "ISO", category: "test-mechanical", process: ["general"], year: "2014", status: "现行" },
  { id: "iso-011", code: "ISO 12215-5:2019", title: "小艇 船体结构与壁板 第5部分: 设计压力、应力和壁板", titleEn: "Small craft — Hull construction and scantlings — Part 5: Design pressures, stresses, scantlings", country: "ISO", countryCode: "ISO", category: "marine", process: ["hand-layup", "vacuum"], year: "2019", status: "现行" },
  { id: "iso-012", code: "ISO 10928:2016", title: "塑料管道系统 玻璃钢管 回归分析方法", titleEn: "Plastics piping systems — GRP pipes and fittings — Regression analysis methods", country: "ISO", countryCode: "ISO", category: "product-pipe", process: ["winding"], year: "2016", status: "现行" },

  // ═══════════════════════════════════════════
  // ASTM 美国标准
  // ═══════════════════════════════════════════
  { id: "us-001", code: "ASTM D3039", title: "聚合物基复合材料拉伸性能试验方法", titleEn: "Test Method for Tensile Properties of Polymer Matrix Composite Materials", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-002", code: "ASTM D695", title: "刚性塑料压缩性能试验方法", titleEn: "Test Method for Compressive Properties of Rigid Plastics", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-003", code: "ASTM D790", title: "非增强和增强塑料弯曲性能试验方法", titleEn: "Test Methods for Flexural Properties of Unreinforced and Reinforced Plastics", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-004", code: "ASTM D7264", title: "聚合物基复合材料弯曲性能试验方法", titleEn: "Test Method for Flexural Properties of Polymer Matrix Composite Materials", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-005", code: "ASTM D2344", title: "聚合物基复合材料短梁强度试验方法", titleEn: "Test Method for Short-Beam Strength of Polymer Matrix Composites", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-006", code: "ASTM D3518", title: "复合材料面内剪切响应试验方法(±45°拉伸)", titleEn: "Test Method for In-Plane Shear Response of Composites (±45° Tensile)", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-007", code: "ASTM D5379", title: "V型缺口梁法复合材料剪切性能试验(Iosipescu)", titleEn: "Test Method for Shear Properties of Composites by V-Notched Beam (Iosipescu)", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-008", code: "ASTM D3410", title: "聚合物基复合材料压缩性能试验方法(剪切加载)", titleEn: "Test Method for Compressive Properties of Polymer Matrix Composites (Shear Loading)", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-009", code: "ASTM D6641", title: "聚合物基复合材料压缩性能试验方法(联合加载CLC)", titleEn: "Test Method for Compressive Properties of Polymer Matrix Composites (CLC)", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-010", code: "ASTM D5528", title: "单向纤维增强聚合物基复合材料I型层间断裂韧性(DCB)", titleEn: "Test Method for Mode I Interlaminar Fracture Toughness of Unidirectional FRP Composites (DCB)", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-011", code: "ASTM D7905", title: "单向纤维增强聚合物基复合材料II型层间断裂韧性(ENF)", titleEn: "Test Method for Mode II Interlaminar Fracture Toughness (ENF)", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-020", code: "ASTM D2584", title: "固化增强树脂灼烧减量试验方法", titleEn: "Test Method for Ignition Loss of Cured Reinforced Resins", country: "美国", countryCode: "US", category: "test-physical", process: ["general"], status: "现行" },
  { id: "us-021", code: "ASTM D2734", title: "增强塑料孔隙率测定方法", titleEn: "Test Methods for Void Content of Reinforced Plastics", country: "美国", countryCode: "US", category: "test-physical", process: ["general"], status: "现行" },
  { id: "us-022", code: "ASTM D3171", title: "复合材料组分含量测定方法", titleEn: "Test Methods for Constituent Content of Composite Materials", country: "美国", countryCode: "US", category: "test-physical", process: ["general"], status: "现行" },
  { id: "us-023", code: "ASTM D792", title: "塑料密度测定方法（位移法）", titleEn: "Test Methods for Density of Plastics by Displacement", country: "美国", countryCode: "US", category: "test-physical", process: ["general"], status: "现行" },
  { id: "us-030", code: "ASTM D3916", title: "拉挤玻纤增强塑料杆拉伸性能试验方法", titleEn: "Test Method for Tensile Properties of Pultruded Glass-Fiber-Reinforced Plastic Rod", country: "美国", countryCode: "US", category: "product-profile", process: ["pultrusion"], status: "现行" },
  { id: "us-031", code: "ASTM D3917", title: "热固性玻纤增强塑料拉挤型材尺寸公差规范", titleEn: "Specification for Dimensional Tolerance of Pultruded Shapes", country: "美国", countryCode: "US", category: "product-profile", process: ["pultrusion"], status: "现行" },
  { id: "us-032", code: "ASTM D4385", title: "热固性增强塑料拉挤制品外观缺陷分类", titleEn: "Practice for Classifying Visual Defects in Pultruded Products", country: "美国", countryCode: "US", category: "product-profile", process: ["pultrusion"], status: "现行" },
  { id: "us-033", code: "ASTM D7205", title: "纤维增强聚合物基复合材料筋拉伸性能试验方法", titleEn: "Test Method for Tensile Properties of FRP Composite Bars", country: "美国", countryCode: "US", category: "construction", process: ["pultrusion"], status: "现行" },
  { id: "us-040", code: "ASTM D2290", title: "塑料管表观环向拉伸强度试验方法(分环法)", titleEn: "Test Method for Apparent Hoop Tensile Strength of Plastic Pipe (Split Disk)", country: "美国", countryCode: "US", category: "product-pipe", process: ["winding"], status: "现行" },
  { id: "us-041", code: "ASTM D2992", title: "FRP管水压或压力设计基准测定方法", titleEn: "Practice for Hydrostatic or Pressure Design Basis for FRP Pipe", country: "美国", countryCode: "US", category: "product-pipe", process: ["winding"], status: "现行" },
  { id: "us-042", code: "ASTM D2996", title: "纤维缠绕FRP管规范", titleEn: "Specification for Filament-Wound FRP Pipe", country: "美国", countryCode: "US", category: "product-pipe", process: ["winding"], status: "现行" },
  { id: "us-050", code: "ASTM D4762", title: "聚合物基复合材料试验标准指南", titleEn: "Standard Guide for Testing Polymer Matrix Composite Materials", country: "美国", countryCode: "US", category: "test-mechanical", process: ["general"], status: "现行" },
  { id: "us-051", code: "ASTM E662", title: "固体材料特定光密度的烟雾生成试验方法(NBS)", titleEn: "Test Method for Specific Optical Density of Smoke (NBS Smoke Chamber)", country: "美国", countryCode: "US", category: "test-fire", process: ["general"], status: "现行" },

  // ═══════════════════════════════════════════
  // EN 欧洲标准
  // ═══════════════════════════════════════════
  { id: "eu-001", code: "EN 13706-1:2002", title: "增强塑料复合材料 拉挤型材规范 第1部分：命名", titleEn: "Reinforced plastics composites — Pultruded profiles — Part 1: Designation", country: "欧洲", countryCode: "EU", category: "product-profile", process: ["pultrusion"], year: "2002", status: "现行" },
  { id: "eu-002", code: "EN 13706-2:2002", title: "增强塑料复合材料 拉挤型材规范 第2部分：试验方法和通用要求", titleEn: "Reinforced plastics composites — Pultruded profiles — Part 2: Methods of test and general requirements", country: "欧洲", countryCode: "EU", category: "product-profile", process: ["pultrusion"], year: "2002", status: "现行" },
  { id: "eu-003", code: "EN 13706-3:2002", title: "增强塑料复合材料 拉挤型材规范 第3部分：特定要求(E17/E23等级)", titleEn: "Reinforced plastics composites — Pultruded profiles — Part 3: Specific requirements (E17/E23)", country: "欧洲", countryCode: "EU", category: "product-profile", process: ["pultrusion"], year: "2002", status: "现行" },
  { id: "eu-010", code: "EN 13121-1:2003", title: "GRP地上储罐和容器 第1部分：原材料", titleEn: "GRP tanks and vessels for use above ground — Part 1: Raw materials", country: "欧洲", countryCode: "EU", category: "product-tank", process: ["winding", "hand-layup"], year: "2003", status: "现行" },
  { id: "eu-011", code: "EN 13121-2:2003", title: "GRP地上储罐和容器 第2部分：复合材料", titleEn: "GRP tanks and vessels for use above ground — Part 2: Composite materials", country: "欧洲", countryCode: "EU", category: "product-tank", process: ["winding", "hand-layup"], year: "2003", status: "现行" },
  { id: "eu-012", code: "EN 13121-3:2016", title: "GRP地上储罐和容器 第3部分：设计和制造", titleEn: "GRP tanks and vessels for use above ground — Part 3: Design and workmanship", country: "欧洲", countryCode: "EU", category: "product-tank", process: ["winding", "hand-layup"], year: "2016", status: "现行" },
  { id: "eu-013", code: "EN 13121-4:2005", title: "GRP地上储罐和容器 第4部分：交付、安装和维护", titleEn: "GRP tanks and vessels for use above ground — Part 4: Delivery, installation and maintenance", country: "欧洲", countryCode: "EU", category: "product-tank", process: ["winding", "hand-layup"], year: "2005", status: "现行" },
  { id: "eu-014", code: "EN 13923:2005", title: "纤维缠绕FRP压力容器 材料、设计、制造和试验", titleEn: "Filament-wound FRP pressure vessels — Materials, design, manufacturing and testing", country: "欧洲", countryCode: "EU", category: "product-tank", process: ["winding"], year: "2005", status: "现行" },
  { id: "eu-020", code: "EN 1796:2013", title: "塑料管道系统 给水用GRP管 基于UP树脂", titleEn: "Plastics piping systems for water supply — GRP based on UP resin", country: "欧洲", countryCode: "EU", category: "product-pipe", process: ["winding"], year: "2013", status: "现行" },
  { id: "eu-021", code: "EN 14364:2013", title: "塑料管道系统 排水排污用GRP管 基于UP树脂", titleEn: "Plastics piping systems for drainage and sewerage — GRP based on UP resin", country: "欧洲", countryCode: "EU", category: "product-pipe", process: ["winding"], year: "2013", status: "现行" },

  // ═══════════════════════════════════════════
  // DIN 德国标准
  // ═══════════════════════════════════════════
  { id: "de-001", code: "DIN 18820-1", title: "层板玻纤增强塑料 土木工程用 第1部分：设计", titleEn: "Laminated textile glass reinforced plastics for structural use — Part 1: Design", country: "德国", countryCode: "DE", category: "design", process: ["general", "hand-layup"], status: "现行" },
  { id: "de-002", code: "DIN 16965 (系列)", title: "玻纤增强聚酯树脂模制品", titleEn: "Glass fibre reinforced polyester resin mouldings", country: "德国", countryCode: "DE", category: "product-general", process: ["hand-layup", "molding"], status: "现行" },
  { id: "de-003", code: "DIN 16966 (系列)", title: "玻纤增强反应性树脂复合料", titleEn: "Glass fibre reinforced reaction resin compounds", country: "德国", countryCode: "DE", category: "product-general", process: ["general"], status: "现行" },
  { id: "de-004", code: "DIN EN 13706-1/2/3", title: "拉挤型材规范（德国采标EN 13706）", titleEn: "Pultruded profiles — German adoption of EN 13706", country: "德国", countryCode: "DE", category: "product-profile", process: ["pultrusion"], status: "现行" },
  { id: "de-005", code: "DIN EN 13121-1/2/3/4", title: "GRP储罐和容器（德国采标EN 13121）", titleEn: "GRP tanks and vessels — German adoption of EN 13121", country: "德国", countryCode: "DE", category: "product-tank", process: ["winding", "hand-layup"], status: "现行" },
];
