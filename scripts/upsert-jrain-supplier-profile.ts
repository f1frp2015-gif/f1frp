// Idempotently publish JRain's curated public supplier profile on GetFRP.
// JRain has not claimed this profile, so it must remain unverified and must
// not be linked to a GetFRP enterprise account.
//
//   tsx --env-file=.env.local scripts/upsert-jrain-supplier-profile.ts

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";

const SUPPLIER_ID = "sup-jrain-frp";

const productsZh = [
  "FRP 罐体与容器",
  "FRP 管道、风管与管件",
  "FRP 洗涤塔",
  "FRP 双层复合制品",
  "FRP 格栅、踏步、梯子与扶手",
  "FRP 定制工业制品",
  "缠绕机、芯模与模具",
];

const productsEn = [
  "FRP tanks and vessels",
  "FRP piping, duct systems and fittings",
  "FRP scrubbers",
  "FRP dual-laminate products",
  "FRP gratings, steps, ladders and handrails",
  "Custom industrial FRP products",
  "Filament-winding machines, mandrels and molds",
];

const servicesZh = [
  "FRP 工程与按需定制",
  "缠绕成型与模具制造",
  "实验室及 FRP 性能测试",
  "按 ASME、ASTM 与 BS EN 等规范组织制造",
];

const servicesEn = [
  "FRP engineering and build-to-requirement customization",
  "Filament winding and mold fabrication",
  "Laboratory and FRP performance testing",
  "Manufacturing informed by ASME, ASTM and BS EN codes",
];

const ecatalogs = [
  {
    title: "JRain 官方产品目录",
    titleEn: "JRain Official Product Catalog",
    description: "罐体、管道与管件、洗涤塔、格栅附件、双层复合制品、定制件及缠绕设备。",
    descriptionEn:
      "Tanks, piping and fittings, scrubbers, grating accessories, dual laminates, custom FRP products and winding equipment.",
    url: "https://www.jrain-frp.com/products",
    format: "Web catalog",
  },
  {
    title: "JRain 应用目录",
    titleEn: "JRain Application Catalog",
    description: "化工、矿业、水与空气治理、电力、食品酒业、船舶管路及安全设施应用。",
    descriptionEn:
      "Applications in chemicals, mining, water and air treatment, power, food and wine, marine piping and safety equipment.",
    url: "https://www.jrain-frp.com/applications.html",
    format: "Web guide",
  },
];

const profile = {
  id: SUPPLIER_ID,
  name: "Hengshui Jrain FRP Co., Ltd.",
  nameEn: "Hengshui Jrain FRP Co., Ltd.",
  location: "河北衡水",
  locationEn: "Hengshui, Hebei, China",
  province: "河北",
  category: "manufacturer",
  products: productsZh,
  productsEn,
  processList: servicesZh,
  processListEn: servicesEn,
  established: 2008,
  verified: false,
  description:
    "JRain FRP 位于河北衡水，企业官网称自 2008 年从事玻璃钢复合制品制造，拥有约 5,000 平方米车间、缠绕设备、真空设备、模具、实验室及 FRP 检测设备。其产品覆盖工业罐体、管道与管件、洗涤塔、格栅附件、双层复合制品、定制工业件及缠绕设备。",
  descriptionEn:
    "JRain FRP is a composite-products manufacturer in Hengshui, Hebei. The company states that it has manufactured FRP products since 2008 and operates an approximately 5,000 m² workshop with winding equipment, vacuum equipment, molds, a laboratory and FRP test equipment. Its portfolio covers industrial tanks, piping and fittings, scrubbers, grating accessories, dual-laminate products, custom industrial parts and winding equipment.",
  certifications: ["ISO 9001（企业官网公开）"],
  certificationsEn: ["ISO 9001 (company-published)"],
  productsServicesSummary:
    "面向腐蚀性工业环境提供 FRP 罐体与容器、管道/风管/管件、洗涤塔、格栅/踏步/梯子/扶手、双层复合制品及按需定制件；同时提供 FRP 工程、缠绕成型、模具与芯模、缠绕设备及实验室测试能力。企业官网称其制造会参考 ASME、ASTM、BS EN 等国际规范。",
  productsServicesSummaryEn:
    "Supplies FRP tanks and vessels, piping, duct systems and fittings, scrubbers, gratings, steps, ladders, handrails, dual-laminate products and build-to-requirement parts for corrosive industrial environments. Capabilities also include FRP engineering, filament winding, molds and mandrels, winding equipment and laboratory testing. The company says its manufacturing is informed by international codes including ASME, ASTM and BS EN.",
  ecatalogs,
  profilePublished: true,
  profileReviewedAt: new Date("2026-07-31T00:00:00.000Z"),
  logo: "https://www.jrain-frp.com/static/template/img/b59ac9c7.webp",
  contactEmail: "sales@jrain-frp.com",
  contactPhone: "+86 153 0321 8081",
  address:
    "No. 1289, Yingbin South Street, Jizhou District, Hengshui, Hebei, China",
  website: "https://www.jrain-frp.com/",
  enterpriseId: null,
  capabilities: ["grating", "tube", "custom"],
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
      nameEn: supplierListings.nameEn,
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
    result.website !== profile.website
  ) {
    throw new Error("JRain public supplier profile failed post-upsert validation");
  }

  console.log(
    `[upsert-jrain-supplier-profile] published ${result.nameEn} (${result.id}); status=public-unclaimed; catalogs=${result.ecatalogs?.length ?? 0}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
