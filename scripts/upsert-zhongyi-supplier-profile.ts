// Upgrade the existing Zhongyi directory record into a curated public company
// profile. The company has not claimed the GetFRP profile, so the record must
// remain unverified and unlinked from any GetFRP enterprise account.
//
//   tsx --env-file=.env.local scripts/upsert-zhongyi-supplier-profile.ts

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";

const SUPPLIER_ID = "s2";

const productsZh = [
  "FRP 储罐与工艺容器",
  "FRP 塔器与洗涤系统",
  "缠绕 FRP 管道、管件与夹砂管",
  "大直径 FRP 烟道与烟囱",
  "FF 双壁地下储油罐",
  "电解槽与耐腐蚀工艺设备",
  "SMC 模压制品",
  "拉挤 FRP 型材",
  "PE/PVC 管道",
];

const productsEn = [
  "Engineered FRP storage tanks and process vessels",
  "FRP process towers and scrubber systems",
  "Filament-wound FRP pipe, fittings and mortar pipe",
  "Large-diameter FRP flues and chimneys",
  "FF double-wall underground storage tanks",
  "Electrolytic cells and corrosion-resistant process equipment",
  "SMC compression-molded components",
  "Pultruded FRP profiles",
  "PE and PVC piping",
];

const servicesZh = [
  "应用工程、结构设计与材料选型",
  "纤维缠绕与大型构件制造",
  "工厂预制与现场安装",
  "定制防腐系统开发",
  "多基地大型项目协同制造",
  "销售与售后技术支持",
];

const servicesEn = [
  "Application engineering, design and material selection",
  "Filament winding and large-component fabrication",
  "Factory prefabrication and field installation",
  "Custom corrosion-control system development",
  "Multi-site manufacturing for large projects",
  "Sales and after-sales technical support",
];

const ecatalogs = [
  {
    title: "中意复材产品组合",
    titleEn: "Zhongyi FRP Product Portfolio",
    description: "容器、塔器、管道、烟道、双壁储罐、模压件与拉挤型材等产品目录。",
    descriptionEn:
      "Official portfolio covering vessels, process towers, piping, flues, double-wall tanks, molded components and pultruded profiles.",
    url: "http://www.jzfrp.cn/products/1.html",
    format: "Web catalog",
  },
  {
    title: "公司介绍与技术能力",
    titleEn: "Company Profile and Technical Capabilities",
    description: "企业沿革、制造规模、研发平台、项目资质与出口市场。",
    descriptionEn:
      "Company history, manufacturing scale, engineering resources, project credentials and export-market coverage.",
    url: "http://www.jzfrp.cn/Profile.html",
    format: "Company profile",
  },
  {
    title: "制造基地与子公司网络",
    titleEn: "Manufacturing Footprint and Subsidiary Network",
    description: "官网公开的国内制造基地、厂房与仓储面积信息。",
    descriptionEn:
      "Official overview of the company's manufacturing sites, workshop space and warehouse capacity across China.",
    url: "http://www.jzfrp.com/subsidiary.html",
    format: "Facility directory",
  },
  {
    title: "质量体系与资质证书",
    titleEn: "Quality Systems and Company Credentials",
    description: "企业官网公开的质量、环境、职业健康安全体系及其他资质文件。",
    descriptionEn:
      "Company-published quality, environmental, occupational health and safety, and related credential documents.",
    url: "http://www.jzfrp.com/Honor/1724687592746078208.html",
    format: "Credential library",
  },
];

const profile = {
  id: SUPPLIER_ID,
  name: "冀州中意复合材料股份有限公司",
  nameEn: "Jizhou Zhongyi FRP Co., Ltd.",
  location: "河北衡水",
  locationEn: "Hengshui, Hebei, China",
  province: "河北",
  category: "manufacturer",
  products: productsZh,
  productsEn,
  processList: servicesZh,
  processListEn: servicesEn,
  established: 1986,
  verified: false,
  description:
    "冀州中意复合材料股份有限公司创立于 1986 年，是国内较早采用微机控制机械缠绕工艺制造 FRP 容器和管道的企业。公司官网称其拥有覆盖河北、广东和新疆的多基地制造网络，员工约 1,500 人，其中技术人员 200 余人，业务涵盖耐腐蚀 FRP 工艺设备、管路系统的研发、设计、制造、安装与服务。",
  descriptionEn:
    "Founded in 1986, Jizhou Zhongyi FRP Co., Ltd. is an established Chinese manufacturer and engineering contractor specializing in corrosion-resistant FRP process equipment and piping systems. The company reports a multi-plant manufacturing network across Hebei, Guangdong and Xinjiang, with approximately 1,500 employees, including more than 200 technical personnel. Its work spans engineering, fabrication and field installation for chemical processing, energy, petrochemical, power, metallurgy, food and beverage, and water infrastructure projects.",
  certifications: [
    "ISO 9001 质量管理体系（企业官网公开）",
    "ISO 14001 环境管理体系（企业官网公开）",
    "ISO 45001 职业健康安全管理体系（企业官网公开）",
    "TÜV 认证（范围以企业官网文件为准）",
  ],
  certificationsEn: [
    "ISO 9001 quality management system (company-published)",
    "ISO 14001 environmental management system (company-published)",
    "ISO 45001 occupational health and safety management system (company-published)",
    "TÜV certification (scope per company-published documents)",
  ],
  productsServicesSummary:
    "为化工、新能源、石油石化、电力、冶金、酿造及给排水项目提供耐腐蚀 FRP 储罐、工艺容器、塔器、洗涤系统、缠绕管道与管件、大直径烟道/烟囱、双壁油罐、电解槽、SMC 模压件和拉挤型材。服务范围覆盖应用工程、材料选型、结构设计、定制制造、工厂预制及现场安装。企业官网同时公开压力容器、压力管道及相关工程资质，具体适用范围应在项目询价阶段按证书核验。",
  productsServicesSummaryEn:
    "Zhongyi supplies corrosion-resistant FRP tanks, process vessels, towers, scrubber systems, filament-wound pipe and fittings, large-diameter flues and chimneys, double-wall underground tanks, electrolytic cells, SMC components and pultruded profiles. Its project scope includes application engineering, material selection, structural design, custom fabrication, factory prefabrication and field installation. The company also publishes pressure-vessel, pressure-piping and construction credentials; buyers should confirm certificate scope and validity against the specific project and destination market.",
  ecatalogs,
  profilePublished: true,
  profileReviewedAt: new Date("2026-08-01T00:00:00.000Z"),
  logo: "https://getfrp.com/api/supplier-assets/zhongyi-logo",
  contactEmail: "salesdirector@jzfrp.com",
  contactPhone: "+86 318 861 3433",
  address:
    "No. 955 Xinghua South Street, Jizhou District, Hengshui, Hebei, China",
  website: "http://www.jzfrp.cn/",
  enterpriseId: null,
  scaleTier: "XL",
  brandPriority: 20,
  capabilities: ["profile", "tube", "custom"],
  standardsSupported: [],
  exportReady: false,
  updatedAt: new Date(),
};

async function main() {
  await db
    .insert(supplierListings)
    .values(profile)
    .onConflictDoUpdate({
      target: supplierListings.id,
      set: profile,
    });

  const [result] = await db
    .select({
      id: supplierListings.id,
      name: supplierListings.name,
      nameEn: supplierListings.nameEn,
      established: supplierListings.established,
      verified: supplierListings.verified,
      profilePublished: supplierListings.profilePublished,
      website: supplierListings.website,
      enterpriseId: supplierListings.enterpriseId,
      ecatalogs: supplierListings.ecatalogs,
    })
    .from(supplierListings)
    .where(eq(supplierListings.id, SUPPLIER_ID))
    .limit(1);

  if (
    !result?.profilePublished ||
    result.verified ||
    result.enterpriseId ||
    result.established !== 1986 ||
    result.website !== profile.website
  ) {
    throw new Error("Zhongyi public supplier profile failed post-upsert validation");
  }

  console.log(
    `[upsert-zhongyi-supplier-profile] published ${result.nameEn} (${result.id}); status=public-unclaimed; catalogs=${result.ecatalogs?.length ?? 0}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
