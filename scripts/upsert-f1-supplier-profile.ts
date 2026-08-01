// Idempotently publish the first Thomasnet-style supplier profile on GetFRP.
// Run after apply-supplier-profile-fields.ts.
//
//   tsx --env-file=.env.local scripts/upsert-f1-supplier-profile.ts

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { enterprises, supplierListings, users } from "@/lib/db/schema";

const ENTERPRISE_ID = "0ef991ac-03b8-46bd-a5e9-6346ea43939e";
const SUPPLIER_ID = "sup-yaoyi";
const OWNER_EMAIL = "f1frp2015@gmail.com";
const PINNED_BRAND_PRIORITY = 1000;

const productsZh = [
  "FRP 拉挤结构型材",
  "玻璃钢格栅与平台系统",
  "玻璃钢门窗型材及成品系统",
  "定制拉挤型材",
  "拉挤复合材料管材与板材",
];

const productsEn = [
  "Pultruded FRP structural profiles",
  "FRP gratings and platform systems",
  "Fiberglass window and door profiles and systems",
  "Custom pultrusions",
  "Pultruded composite pipe and panels",
];

const servicesZh = [
  "图纸与选型评审",
  "定制模具与打样",
  "质量与出口文件",
  "国际项目交付",
];

const servicesEn = [
  "Drawing and profile-selection review",
  "Custom tooling and prototyping",
  "Quality and export documentation",
  "International project delivery",
];

const ecatalogs = [
  {
    title: "F1 Composite FRP 型材设计手册（2026）",
    titleEn: "F1 Composite FRP Profile Design Manual — 2026",
    description: "结构型材、材料性能、设计基础与选型数据。",
    descriptionEn:
      "Structural profiles, material properties, design basis and selection data.",
    url: "https://www.f1composite.com/downloads/f1composite-frp-profile-design-manual-2026.pdf",
    format: "PDF · 24 pages",
  },
  {
    title: "玻璃钢门窗产品目录",
    titleEn: "Pultruded FRP Window & Door Catalog",
    description: "70/80/90/140 系列门窗型材、系统配置与热工数据。",
    descriptionEn:
      "70/80/90/140-series fenestration profiles, system configurations and thermal data.",
    url: "https://www.f1composite.com/downloads/f1composite-frp-window-door-catalog.pdf",
    format: "PDF",
  },
  {
    title: "油气与矿用拉挤管产品目录（2026.06）",
    titleEn: "Oilfield & Mine Pultruded Pipe Catalog — 2026.06",
    description: "油田地面集输与煤矿瓦斯抽放拉挤管系列。",
    descriptionEn:
      "Pultruded pipe series for oilfield gathering and coal-mine methane drainage.",
    url: "https://www.f1composite.com/downloads/f1composite-oilfield-mine-pipe-catalog-2026-06.pdf",
    format: "PDF · 3 pages",
  },
];

async function main() {
  await db
    .update(enterprises)
    .set({
      name: "重庆曜一新材料科技有限公司",
      shortName: "F1 Composite",
      logo: "https://www.f1composite.com/brand/f1-logo.png",
      status: "verified",
      category: "manufacturer",
      province: "重庆",
      city: "重庆",
      address:
        "No. 153 Jinyu Avenue, Liangjiang New Area, Chongqing 401121, China",
      contactName: "Doris Li",
      contactPhone: "13883338993",
      contactEmail: "inquiry@f1composite.com",
      website: "https://www.f1composite.com",
      established: 2024,
      employeeCount: "10-50",
      description:
        "F1 Composite 是风渡新材料的国际出口公司，为海外项目提供拉挤 FRP 型材、格栅、玻璃钢门窗系统和定制拉挤产品，并负责英文工程支持、合同、质量文件、出口单据与国际交付。",
      products: productsZh,
      processes: servicesZh,
      certifications: [],
      updatedAt: new Date(),
    })
    .where(eq(enterprises.id, ENTERPRISE_ID));

  await db
    .update(supplierListings)
    .set({
      name: "重庆曜一新材料科技有限公司",
      nameEn: "F1 Composite",
      location: "重庆",
      locationEn: "Chongqing, China",
      province: "重庆",
      category: "manufacturer",
      products: productsZh,
      productsEn,
      processList: servicesZh,
      processListEn: servicesEn,
      established: 2024,
      verified: true,
      description:
        "F1 Composite 是风渡新材料的国际出口公司，面向海外提供拉挤 FRP 型材、格栅、玻璃钢门窗系统及定制拉挤产品，并负责工程支持、商务合同、质量文件与国际交付。",
      descriptionEn:
        "F1 Composite is FengDu New Material's international export company for pultruded FRP profiles, gratings, fiberglass window and door systems, and custom pultrusions. F1 handles English-language engineering, contracting, quality documentation, export paperwork and international delivery.",
      certifications: [],
      certificationsEn: [],
      productsServicesSummary:
        "供应拉挤玻璃钢结构型材、格栅与平台系统、门窗型材及成品系统、定制拉挤件、管材与板材；配套提供图纸与选型评审、定制模具和打样、质量及出口文件、集货与国际物流服务。",
      productsServicesSummaryEn:
        "Supplies pultruded fiberglass structural profiles, gratings and platform systems, fenestration profiles and finished window/door systems, custom pultrusions, pipe and panels. Services include drawing and profile-selection review, custom tooling and prototyping, quality and export documentation, consolidation and international logistics.",
      ecatalogs,
      profilePublished: true,
      profileReviewedAt: new Date(),
      website: "https://www.f1composite.com",
      enterpriseId: ENTERPRISE_ID,
      capabilities: ["profile", "grating", "tube", "panel", "custom"],
      brandPriority: PINNED_BRAND_PRIORITY,
      exportReady: true,
      updatedAt: new Date(),
    })
    .where(eq(supplierListings.id, SUPPLIER_ID));

  await db
    .update(users)
    .set({ enterpriseId: ENTERPRISE_ID, updatedAt: new Date() })
    .where(
      and(eq(users.email, OWNER_EMAIL), eq(users.role, "admin")),
    );

  const [result] = await db
    .select({
      id: supplierListings.id,
      nameEn: supplierListings.nameEn,
      verified: supplierListings.verified,
      website: supplierListings.website,
      enterpriseId: supplierListings.enterpriseId,
      profilePublished: supplierListings.profilePublished,
      brandPriority: supplierListings.brandPriority,
      ecatalogs: supplierListings.ecatalogs,
    })
    .from(supplierListings)
    .where(eq(supplierListings.id, SUPPLIER_ID))
    .limit(1);

  if (
    !result?.verified ||
    !result.enterpriseId ||
    !result.website ||
    !result.profilePublished ||
    result.brandPriority !== PINNED_BRAND_PRIORITY
  ) {
    throw new Error("F1 supplier profile verification failed after update");
  }
  console.log(
    `[upsert-f1-supplier-profile] published ${result.nameEn} (${result.id}); catalogs=${result.ecatalogs?.length ?? 0}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
