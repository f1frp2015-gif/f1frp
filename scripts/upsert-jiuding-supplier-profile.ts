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
  "拉挤成型（UP/VE/EP/PU 树脂，0.5–2 m/min，21 条线 500+ 模具）",
  "模压成型（SMC/BMC，至 3,000 吨）",
  "缠绕成型（管道/贮罐/工艺容器，至直径 4m）",
  "VIP 真空灌注成型",
  "RTM 树脂传递模塑",
  "玻纤拉丝、改性、织造、表面处理（四大核心技术）",
  "定制断面模具开发与 CNC 加工",
  "来料认证、设计指导与售前工程技术支持",
  "出口包装、质检报告与合规单证（50+ 国家）",
  "OEM/ODM 合同制造（300+ 专有技术）",
];

const servicesEn = [
  "Pultrusion (UP/VE/EP/PU resins, 0.5–2 m/min, 21 lines, 500+ profile dies)",
  "Compression molding (SMC/BMC, up to 3,000-ton press capacity)",
  "Filament winding (pipe, tank, process vessel, up to 4 m diameter)",
  "VIP vacuum infusion processing",
  "RTM resin transfer molding",
  "Fiberglass drawing, modification, weaving & surface treatment (4 core technologies)",
  "Custom die development and CNC machining",
  "Raw material certification, design guidance & pre-sales engineering support",
  "Export packaging, quality test reports & compliance documentation (50+ countries)",
  "OEM/ODM contract manufacturing (300+ proprietary technologies)",
];

const ecatalogs = [
  {
    title: "九鼎复材产品展示厅 · 416 SKU 在线浏览",
    titleEn: "Product Showroom — 416 FRP SKUs with Specs & Photos",
    description: "官网产品展示厅，416 个产品页面覆盖拉挤型材（工字梁/H型/槽钢/角钢/方管/圆管/实心棒）、模塑/拉挤格栅、法兰、管材、灯杆、采光板、电缆桥架、FR4/G10 环氧棒、帐篷杆、扶手护栏等全品类，含规格参数与产品实物图。",
    descriptionEn:
      "Browse 416 individually listed FRP products with specifications, dimensions and photography: pultruded profiles (I-beam, H-beam, channel, angle, square/round tube, solid rod), molded and pultruded grating panels, flanges, pipes, light poles, roofing sheets, cable trays, FR4/G10 epoxy rods, tent poles, handrails and barriers.",
    url: "https://www.jiudingcomposite.com/showroom/high-strength-frp-pultruded-structural-profile.html",
    format: "Product showroom · 416 SKUs",
  },
  {
    title: "VR 工厂虚拟参观 · 在线验厂",
    titleEn: "VR Factory Tour — Virtual Site Inspection",
    description: "全景 VR 虚拟工厂参观：无需亲赴中国即可在线查看九鼎如皋生产基地的拉挤车间、格栅生产线、检测实验室和仓储区域，支持桌面与移动端浏览。",
    descriptionEn:
      "Immersive 360° VR factory tour: inspect Jiuding's Rugao production facility online — walk through pultrusion workshops, grating production lines, quality testing laboratories and warehousing areas without traveling to China. Desktop and mobile compatible.",
    url: "https://www.linked-reality.com/company/16085/en",
    format: "Virtual tour · 360° VR",
  },
  {
    title: "FRP 产品分类目录与选购指南",
    titleEn: "FRP Product Categories — Selection Guide",
    description: "按三大品类分类浏览：FRP Pultrusion Profiles（拉挤型材结构件与定制断面）、FRP Grating（模塑与拉挤格栅平台板）、FRP Flanges（法兰与管接头），每类含应用场景图示与选型说明。",
    descriptionEn:
      "Browse by product category with application photography and selection guidance: FRP Pultrusion Profiles (structural shapes and custom cross-sections), FRP Grating (molded and pultruded walkway and platform panels), FRP Flanges (pipe connectors and fittings for chemical and water systems).",
    url: "https://www.jiudingcomposite.com/products",
    format: "Product catalog",
  },
  {
    title: "九鼎新材 · 关于我们与全球联系",
    titleEn: "About Jiuding — Company Profile & Global Contacts",
    description: "企业概况页：公司历史沿革（1994 年创立·2007 年深交所上市 002201）、全球出口网络（50+ 国家）、12 种语言客服、Jason Zhu（亚太/澳洲）与 Wendy Zong（美洲/欧洲）联系信息、询盘表单。",
    descriptionEn:
      "Company overview: history since 1994, Shenzhen Stock Exchange listing (002201) since 2007, export network spanning 50+ countries, 12-language customer support, and direct contact details for Jason Zhu (Asia-Pacific & Australia) and Wendy Zong (Americas & Europe), plus online inquiry form.",
    url: "https://www.jiudingcomposite.com/about",
    format: "Company profile & contacts",
  },
  {
    title: "FRP 技术知识库 · 9 页深度文章",
    titleEn: "FRP Technical Knowledge Hub — 9 Pages of Articles",
    description: "官网技术知识库（9 页，持续更新）：FRP 拉挤型材、格栅、玻纤窗框、电缆桥架、灯杆横担等产品选型指南，含切割安装维护教程、耐候性/寿命分析、车辆轻量化应用等行业深度文章。",
    descriptionEn:
      "Technical knowledge hub (9 pages, regularly updated): product selection guides for FRP profiles, grating, window frames, cable trays and cross arms; installation and maintenance tutorials (cutting stair treads, surface care); durability and lifespan analysis; vehicle lightweighting and industrial application articles. Demonstrates deep in-house technical expertise.",
    url: "https://www.jiudingcomposite.com/info/",
    format: "Knowledge hub · 9 pages",
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
    "Jiangsu Jiuding New Material Co., Ltd. (SZSE: 002201) is one of China's largest and most diversified fiberglass reinforced plastic (FRP) composite manufacturers, with over three decades of continuous operation since its founding in 1994. Headquartered in Rugao, Jiangsu Province — a region recognized as a national hub for fiberglass deep-processing and advanced composite materials — Jiuding is publicly listed on the Shenzhen Stock Exchange and operates as a Torch Plan national key high-tech enterprise, reflecting its standing within China's strategic advanced materials sector.\n\n"
    + "Jiuding holds a commanding position in the global fiberglass supply chain. It is the world's largest producer of fiberglass mesh discs for reinforced abrasive grinding wheels, a product category where its manufacturing scale, proprietary weaving technology, and surface-treatment expertise give it unmatched cost and quality advantages. Beyond abrasive reinforcement, the company operates one of the most vertically integrated FRP manufacturing platforms in China, spanning fiberglass yarn drawing, fabric weaving, surface coating, and all three major thermoset composite forming processes: pultrusion, compression molding (SMC/BMC), and filament winding.\n\n"
    + "The company's pultrusion division runs 21 production lines equipped with more than 500 profile dies, capable of producing I-beams, H-beams, channels, angles, square and rectangular hollow tubes, round tubes, and solid rods in unsaturated polyester, vinyl ester, epoxy, phenolic, and polyurethane resin systems. Its grating division operates over 100 dedicated molds for both molded and pultruded FRP grating, including heavy-duty, mini-mesh, phenolic, and solid-top configurations for industrial flooring, walkways, trench covers, and offshore platforms. The filament-winding workshop produces corrosion-resistant FRP pipes, storage tanks, process vessels, and flanges for chemical processing, water treatment, and infrastructure applications.\n\n"
    + "Jiuding's product portfolio extends well beyond structural profiles and grating. The company manufactures SMC and BMC compression-molded components for electrical insulation, automotive, and building applications; FRP cable trays and ladder-type support systems; handrails, safety barriers, and access ladders; FRP bridge decks for pedestrian and light vehicle applications; street light poles and electrical cross arms with high dielectric strength; FR4 and G10 epoxy fiberglass rods for electrical and mechanical uses; lightweight FRP tent poles and tool handles; pultruded window and door frame profiles; and translucent FRP skylight and roofing sheets. In fiberglass textiles, Jiuding produces E-glass woven roving, high-silica fabrics for thermal protection, alkali-resistant mesh for construction reinforcement, self-adhesive fiberglass tapes, and fiberglass geogrids.\n\n"
    + "The company exports to more than 50 countries across North America, Europe, Southeast Asia, Japan, and South Korea, serving distributors, OEM manufacturers, engineering contractors, and government infrastructure projects. Its certifications include ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018 (OHSAS 18001) for quality, environmental, and occupational health management; IATF 16949:2016 for automotive-sector quality; TÜV product certification; and CE marking for European Union market access. Jiuding is a regular exhibitor at JEC World in Paris and the China International Composites Exhibition.\n\n"
    + "Key technical specifications for buyers: FRP pultruded profiles achieve approximately 7 tons of tensile strength per square centimeter of cross-section, with density one-quarter that of steel and weight savings up to 75%. The material withstands continuous operating temperatures from −50°C to 100°C, with a design service life of 20–25 years under normal conditions. Resin systems include general-purpose unsaturated polyester, isophthalic polyester (ISO), vinyl ester (VE), epoxy, phenolic, and polyurethane, selected by the end-use chemical environment and temperature. Fire-retardant, anti-static, UV-stabilized, and corrosion-resistant grades are available. Profiles can be cut, drilled, tapped, and machined with standard metalworking tools, and surface finishes include veil, nexus mat (anti-ageing), and pigmented gel coats. Jiuding maintains an active technical knowledge hub with 9 pages of product selection guides, installation tutorials, and application articles, reflecting deep in-house engineering expertise.\n\n"
    + "In 2025, the company regained its original name — Jiuding New Material — after a corporate restructuring returned control to the founding Jiuding Group under Chairman Gu Qingbo. In May 2026, General Manager Gu Roujian was elected Vice President of the China Composites Industry Association, underscoring Jiuding's influence in shaping industry standards and policy. The same year, the company received the Envision Energy 2025 Outstanding Partner Award, recognizing its contribution to renewable energy infrastructure. With cumulative investment exceeding ¥100 million, approximately 2,400 employees, and a factory area of 25,000 square meters, Jiuding is positioned as a top-tier FRP contract manufacturer for global buyers seeking high-volume, quality-certified fiberglass composite products from China.\n\n"
    + "For international buyers evaluating Chinese FRP suppliers, Jiuding offers several differentiated advantages. First, its status as a publicly listed company (SZSE: 002201) provides audited financial transparency and corporate governance accountability that privately held manufacturers cannot match. Second, its scale — 21 pultrusion lines, 500+ profile dies, and 100+ grating molds under one roof — enables it to handle large-volume orders and multi-product bundled procurement programs that would require multiple smaller suppliers. Third, its vertical integration from glass fiber yarn through finished FRP products reduces supply chain risk, improves quality traceability, and supports cost-competitive pricing for distributors and OEM buyers. Fourth, its export experience across 50+ countries means it understands international documentation, packaging, labeling, and compliance requirements for markets including the European Union (CE Marking), North America (ASTM standards), and Asia-Pacific. Fifth, its engineering team provides application-level support — from profile cross-section optimization and resin system selection to structural load calculations — helping buyers specify the right FRP solution for their project. Buyers interested in pultruded FRP profiles, molded FRP grating, FRP pipe and tank systems, or custom fiberglass composite products are encouraged to contact Jiuding through the GetFRP RFQ platform or directly via the company's multilingual website at www.jiudingcomposite.com.",
  certifications: [
    "ISO 9001:2015 质量管理体系认证",
    "ISO 14001:2015 环境管理体系认证",
    "ISO 45001:2018 职业健康安全管理体系认证",
    "IATF 16949:2016 汽车行业质量管理体系认证",
    "TÜV 产品认证（官网公示）",
    "CE 标志（欧盟市场）",
    "国家火炬计划重点高新技术企业",
    "中国玻璃纤维制品深加工基地",
    "江苏省质量奖获奖企业",
  ],
  certificationsEn: [
    "ISO 9001:2015 quality management system",
    "ISO 14001:2015 environmental management system",
    "ISO 45001:2018 occupational health and safety management",
    "IATF 16949:2016 automotive quality management system",
    "TÜV product certification (displayed on official website)",
    "CE marking for European Union market access",
    "National Torch Plan Key High-Tech Enterprise (China)",
    "National Fiberglass Deep-Processing Base (China)",
    "Jiangsu Provincial Quality Award",
  ],
  productsServicesSummary:
    "主营业务分两大板块：（1）玻纤深加工制品——增强砂轮网布/网片（全球最大供应商）、无碱玻纤布、高硅氧布、耐碱网布、方格布、土工格栅、自粘胶带、装饰壁布；（2）玻纤复合材料——拉挤 FRP 型材、模塑/拉挤格栅、FRP 法兰与贮罐、SMC/BMC 模压制品、FRP 电缆桥架、扶手/护栏/梯子、FRP 桥面板、灯杆与横担、FR4/G10 环氧棒、帐篷杆/工具手柄、采光板/屋面瓦。公司同时具备拉挤、模压、缠绕三种成型工艺以及玻纤织物织造/涂覆能力，可承接 OEM/ODM 定制。",
  productsServicesSummaryEn:
    "Jiuding New Material operates across two integrated business segments, both serving the global fiberglass reinforced plastic (FRP) and advanced composites market. Segment One — Fiberglass Deep-Processing Products: The company is the world's largest manufacturer of fiberglass mesh discs for reinforced abrasive grinding wheels, a position built on proprietary weaving technology, high-throughput surface coating lines, and decades of quality consistency. Additional textile products include E-glass woven roving and plain-weave fabrics for hand lay-up and vacuum infusion processes; high-silica fabrics rated for continuous thermal protection above 1,000°C in aerospace, foundry, and fire-safety applications; alkali-resistant mesh for EIFS façade reinforcement and concrete crack control; fiberglass geogrids for soil stabilization and asphalt reinforcement; self-adhesive fiberglass joint tapes for drywall and construction; and decorative wall-covering fabrics. These materials are supplied to abrasive manufacturers, construction materials companies, composite fabricators, and industrial distributors worldwide.\n\n"
    + "Segment Two — FRP Composite Products and Engineered Solutions: Jiuding manufactures one of the widest FRP product ranges available from a single Chinese supplier. The pultrusion division produces structural profiles (I-beam, H-beam, wide-flange beam, channel, equal and unequal angle, square and rectangular hollow tube, round tube, solid rod, flat bar, and custom cross-sections) in unsaturated polyester, vinyl ester, epoxy, phenolic, and polyurethane resin matrices, with fire-retardant, anti-static, UV-stabilized, and corrosion-resistant grades available. The grating division supplies both molded (square-mesh, rectangular-mesh, mini-mesh, covered, phenolic, heavy-duty) and pultruded (standard T-bar, heavy-duty I-bar, solid-top) grating panels, stair treads, and landing platforms. The filament-winding division delivers corrosion-resistant FRP pipes (standard and jacking), above-ground and underground storage tanks, process vessels, scrubbers, flanges, and custom fittings. The compression-molding workshop produces SMC and BMC electrical enclosures, insulators, automotive body panels, and building components. Additional engineered products include FRP cable trays and ladder racks, safety handrails and guardrails, access ladders, pedestrian and light-vehicle bridge decks, street light poles and electrical transmission cross arms, FR4 and G10 epoxy glass rods for transformers and switchgear, tent poles and tool handles, pultruded window and door lineals, and translucent corrugated roofing and skylight panels.\n\n"
    + "Jiuding accepts OEM and ODM contracts and provides application engineering, custom die development and CNC machining, raw material certification, pre-sales technical support including design guidance, and export documentation services with quality test reports for every shipment. The company's in-house capabilities span the full value chain: glass fiber yarn drawing and sizing, fabric weaving and surface finishing, profile die design and CNC machining, complete thermoset composite processing (pultrusion at 0.5–2 m/min with 21 lines, compression molding to 3,000-ton press capacity, filament winding to 4-meter diameter vessels, plus VIP vacuum infusion and RTM resin transfer molding), CNC fabrication and assembly, and export-compliant crating and container loading. The company operates four proprietary core technology platforms — fiberglass wire drawing, glass modification, textile weaving, and surface treatment — supported by more than 300 proprietary technologies. Buyers can source single-category volumes or bundled multi-category procurement packages from a single audited, publicly listed manufacturer, reducing supplier management overhead and simplifying logistics.",
  ecatalogs,
  profilePublished: true,
  profileReviewedAt: new Date("2026-08-02T00:00:00.000Z"),
  logo: "https://www.jiudingcomposite.com/uploads/202027407/logo202006051112355935739.png",
  contactEmail: "zhuxiaoxiang@jiudinggroup.com",
  contactPhone: "+86 513 8069 5308",
  address: "No. 1 East Zhongshan Road, Rugao, Jiangsu 226500, China",
  website: "https://www.jiudingcomposite.com",
  enterpriseId: null,
  scaleTier: "XL",
  brandPriority: 22,
  capabilities: ["profile", "grating", "rebar", "rod", "tube", "panel", "custom"],
  standardsSupported: [
    "ISO 9001:2015",
    "ISO 14001:2015",
    "ISO 45001:2018",
    "IATF 16949:2016",
    "EN 13706 (E17/E23)",
    "ASTM D3039 / D790 / D2344",
    "ASTM E84 (flame spread)",
    "GB/T 1447 / GB/T 1449",
    "CE Marking",
    "TÜV",
    "USCG (select products)",
  ],
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
