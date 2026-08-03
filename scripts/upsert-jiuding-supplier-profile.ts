// Upgrade the existing Jiuding directory record into a curated public company
// profile. The company has not claimed the GetFRP profile, so the record must
// remain unverified and unlinked from any GetFRP enterprise account.
//
//   tsx --env-file=.env.local scripts/upsert-jiuding-supplier-profile.ts

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";

const SUPPLIER_ID = "sup-jiuding";

const productsZh = [
  "拉挤 FRP 型材（工字梁、H型、槽钢、角钢、方管、圆管、实心棒）",
  "模塑与拉挤 FRP 格栅",
  "FRP 法兰与管件",
  "玻璃钢管道与储罐",
  "增强砂轮用玻纤网布/网片（全球最大供应商）",
  "无碱玻璃纤维布、方格布",
  "高硅氧布与耐碱网布",
  "自粘胶带",
  "土工格栅",
  "SMC/BMC 模压制品",
  "FRP 电缆桥架",
  "FRP 扶手、梯子与安全护栏",
  "FRP 桥面板",
  "FRP 灯杆与横担",
  "FR4/G10 环氧玻纤棒",
  "FRP 帐篷杆/工具手柄",
  "玻璃钢门窗型材",
  "透明 FRP 采光板/屋面瓦",
];

const productsEn = [
  "Pultruded FRP profiles (I-beam, H-beam, channel, angle, square tube, round tube, solid rod)",
  "Molded and pultruded FRP grating",
  "FRP flanges and fittings",
  "FRP pipes and storage tanks",
  "Fiberglass mesh for reinforced abrasive wheels (world's largest supplier)",
  "E-glass woven roving and fabrics",
  "High-silica fabric and alkali-resistant mesh",
  "Self-adhesive fiberglass tape",
  "Fiberglass geogrid",
  "SMC/BMC compression-molded components",
  "FRP cable trays",
  "FRP handrails, ladders and safety barriers",
  "FRP bridge decks",
  "FRP light poles and cross arms",
  "FR4/G10 epoxy fiberglass rods",
  "FRP tent poles and tool handles",
  "FRP door and window profiles",
  "Translucent FRP skylight and roofing sheets",
];

const servicesZh = [
  "拉挤成型（不饱和聚酯/乙烯基酯/聚氨酯树脂体系）",
  "模压成型（SMC/BMC）",
  "缠绕成型（管道与储罐）",
  "玻纤织物织造与涂覆",
  "定制型材断面开发与模具设计",
  "出口包装与物流（50+ 国家）",
  "应用工程与售前技术支持",
  "OEM/ODM 定制制造",
];

const servicesEn = [
  "Pultrusion (unsaturated polyester / vinyl ester / polyurethane resin systems)",
  "Compression molding (SMC/BMC)",
  "Filament winding (pipes and tanks)",
  "Fiberglass fabric weaving and coating",
  "Custom profile die development and tooling design",
  "Export packaging and logistics (50+ countries)",
  "Application engineering and pre-sales technical support",
  "OEM/ODM contract manufacturing",
];

const ecatalogs = [
  {
    title: "九鼎复材产品展厅",
    titleEn: "Jiuding Composite Product Showroom",
    description: "官网产品展厅，416 个产品页面涵盖拉挤型材、格栅、管材、棒材、法兰、扶手、灯杆等全品类。",
    descriptionEn:
      "Official product showroom with 416 product pages covering pultruded profiles, grating, tubes, rods, flanges, handrails, light poles and more.",
    url: "https://www.jiudingcomposite.com/showroom/high-strength-frp-pultruded-structural-profile.html",
    format: "Web showroom",
  },
  {
    title: "九鼎新材公司新闻与动态",
    titleEn: "Jiuding News and Updates",
    description: "官网新闻中心：JEC 参展、行业获奖、协会任职、客户合作等最新动态。",
    descriptionEn:
      "Company news hub: JEC exhibition participation, industry awards, association appointments, customer partnerships and more.",
    url: "https://www.jiudingcomposite.com/newslist-1",
    format: "News center",
  },
  {
    title: "九鼎新材产品分类导航",
    titleEn: "Jiuding Product Category Navigation",
    description: "官网按应用和产品类型的分类浏览入口。",
    descriptionEn:
      "Category-based product browsing on the official website, organized by application and product type.",
    url: "https://www.jiudingcomposite.com/products",
    format: "Product catalog",
  },
  {
    title: "关于九鼎新材料",
    titleEn: "About Jiuding New Material",
    description: "企业沿革、上市信息（深交所 002201）、制造规模与出口市场。",
    descriptionEn:
      "Company history, public listing information (SZSE: 002201), manufacturing scale and export market coverage.",
    url: "https://www.jiudingcomposite.com/about",
    format: "Company profile",
  },
];

const profile = {
  id: SUPPLIER_ID,
  name: "江苏九鼎新材料股份有限公司",
  nameEn: "Jiangsu Jiuding New Material Co., Ltd.",
  location: "江苏如皋",
  locationEn: "Rugao, Jiangsu, China",
  province: "江苏",
  category: "manufacturer",
  products: productsZh,
  productsEn,
  processList: servicesZh,
  processListEn: servicesEn,
  established: 1994,
  verified: false,
  description:
    "江苏九鼎新材料股份有限公司（深交所：002201）创立于 1994 年，总部位于江苏如皋，是国内规模型纺织型玻纤制品生产企业、中国玻璃纤维制品深加工基地，国家火炬计划重点高新技术企业。公司是全球最大的增强砂轮用玻纤网片供应商，拥有 21 条拉挤生产线、500+ 套模具、100+ 套格栅模具，累计投资超亿元，员工约 2,400 人。产品涵盖拉挤 FRP 型材、模塑与拉挤格栅、FRP 法兰/管道/储罐、玻纤织物（方格布/高硅氧布/耐碱网布）、SMC/BMC 模压制品、电缆桥架、扶手护栏、FRP 桥面板/灯杆/横担、FR4/G10 环氧棒、帐篷杆及采光板等，出口至北美、欧洲、东南亚、日韩等 50+ 个国家和地区。2025 年 2 月从「正威新材」恢复为「九鼎新材」；2026 年总经理顾柔坚当选中国复合材料工业协会副会长，同年获远景能源 2025 杰出合作伙伴奖。",
  descriptionEn:
    "Jiangsu Jiuding New Material Co., Ltd. (SZSE: 002201), founded in 1994 and headquartered in Rugao, Jiangsu, is a major Chinese fiberglass textile manufacturer, a nationally designated fiberglass deep-processing base, and a Torch Plan national key high-tech enterprise. It is the world's largest supplier of fiberglass mesh for reinforced abrasive wheels, operating 21 pultrusion lines with 500+ profile dies and 100+ grating molds, with cumulative investment exceeding ¥100M and ~2,400 employees. Its product range spans pultruded FRP profiles, molded and pultruded grating, FRP flanges/pipes/tanks, fiberglass fabrics (woven roving, high-silica fabric, alkali-resistant mesh), SMC/BMC molded components, cable trays, handrails and barriers, FRP bridge decks/light poles/cross arms, FR4/G10 epoxy rods, tent poles, and translucent roofing sheets — exported to 50+ countries. The company regained its original name 'Jiuding New Material' in February 2025 after a brief period as 'Zhengwei New Material'. In May 2026, GM Gu Roujian was elected Vice President of the China Composites Industry Association; the same year, Jiuding received the Envision Energy 2025 Outstanding Partner Award.",
  certifications: [
    "ISO 9001 质量管理体系",
    "ISO 14001 环境管理体系",
    "ISO 45001 职业健康安全管理体系",
    "TÜV 认证（官网展示）",
    "CE 认证",
  ],
  certificationsEn: [
    "ISO 9001 quality management system",
    "ISO 14001 environmental management system",
    "ISO 45001 occupational health and safety management system",
    "TÜV certified (displayed on official website)",
    "CE marking",
  ],
  productsServicesSummary:
    "主营业务分两大板块：（1）玻纤深加工制品——增强砂轮网布/网片（全球最大供应商）、无碱玻纤布、高硅氧布、耐碱网布、方格布、土工格栅、自粘胶带、装饰壁布；（2）玻纤复合材料——拉挤 FRP 型材、模塑/拉挤格栅、FRP 法兰与贮罐、SMC/BMC 模压制品、FRP 电缆桥架、扶手/护栏/梯子、FRP 桥面板、灯杆与横担、FR4/G10 环氧棒、帐篷杆/工具手柄、采光板/屋面瓦。公司同时具备拉挤、模压、缠绕三种成型工艺以及玻纤织物织造/涂覆能力，可承接 OEM/ODM 定制。",
  productsServicesSummaryEn:
    "Jiuding operates across two major segments: (1) Fiberglass deep-processing products — abrasive-wheel reinforcement mesh (world's #1 supplier), E-glass woven fabrics, high-silica fabric, alkali-resistant mesh, woven roving, geogrid, self-adhesive tape, and decorative wall fabrics; (2) FRP composite products — pultruded profiles, molded/pultruded grating, FRP flanges and tanks, SMC/BMC molded components, cable trays, handrails/barriers/ladders, bridge decks, light poles and cross arms, FR4/G10 epoxy rods, tent poles/tool handles, and translucent roofing sheets. The company runs pultrusion, compression-molding and filament-winding processes in-house, along with fiberglass fabric weaving and coating capabilities, and accepts OEM/ODM contracts.",
  ecatalogs,
  profilePublished: true,
  profileReviewedAt: new Date("2026-08-02T00:00:00.000Z"),
  logo: "https://www.jiudingcomposite.com/favicon.ico",
  contactEmail: "zhuxiaoxiang@jiudinggroup.com",
  contactPhone: "+86 513 8069 5308",
  address: "No. 1 East Zhongshan Road, Rugao, Jiangsu 226500, China",
  website: "https://www.jiudingcomposite.com",
  enterpriseId: null,
  scaleTier: "XL",
  brandPriority: 22,
  capabilities: ["profile", "grating", "rebar", "rod", "tube", "panel", "custom"],
  standardsSupported: ["ISO 9001", "ISO 14001", "ISO 45001", "CE", "TÜV"],
  moqKg: null,
  leadTimeDays: null,
  exportReady: true,
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
      location: supplierListings.location,
      established: supplierListings.established,
      verified: supplierListings.verified,
      profilePublished: supplierListings.profilePublished,
      website: supplierListings.website,
      enterpriseId: supplierListings.enterpriseId,
      scaleTier: supplierListings.scaleTier,
      brandPriority: supplierListings.brandPriority,
      exportReady: supplierListings.exportReady,
      ecatalogs: supplierListings.ecatalogs,
    })
    .from(supplierListings)
    .where(eq(supplierListings.id, SUPPLIER_ID))
    .limit(1);

  if (
    !result?.profilePublished ||
    result.verified ||
    result.enterpriseId ||
    result.established !== 1994 ||
    result.website !== profile.website ||
    result.location !== "江苏如皋" ||
    result.scaleTier !== "XL" ||
    !result.exportReady
  ) {
    console.error("Post-upsert validation failed:", JSON.stringify(result, null, 2));
    throw new Error("Jiuding public supplier profile failed post-upsert validation");
  }

  console.log(
    `[upsert-jiuding-supplier-profile] published ${result.nameEn} (${result.id}); status=public-unclaimed; tier=${result.scaleTier}; priority=${result.brandPriority}; catalogs=${result.ecatalogs?.length ?? 0}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
