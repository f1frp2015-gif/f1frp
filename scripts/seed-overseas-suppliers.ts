// Seeds equipment / tooling / mold suppliers for getfrp.com value chain cards.
// Each entry has both Chinese and English fields so it can render on both
// f1frp.com (zh) and getfrp.com (en).
//
// Idempotent on `id` — safe to re-run after edits.

import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";

type SeedEntry = {
  id: string;
  name: string;
  nameEn: string;
  location: string;
  locationEn: string;
  province: string;
  category: string; // "equipment" | "tooling" | "mold"
  products: string[];
  productsEn: string[];
  processList: string[];
  processListEn: string[];
  established: number;
  verified: boolean;
  description: string;
  descriptionEn: string;
  certifications: string[];
  certificationsEn: string[];
};

const entries: SeedEntry[] = [
  // ─────────────────────────── Equipment (4) ───────────────────────────
  {
    id: "eq-jinhe-001",
    name: "天津金和复合材料拉挤设备厂",
    nameEn: "Tianjin Jinhe Pultrusion Equipment Co., Ltd.",
    location: "天津",
    locationEn: "Tianjin, China",
    province: "天津",
    category: "equipment",
    products: ["拉挤生产线", "拉挤模具", "树脂槽", "牵引机"],
    productsEn: ["Pultrusion lines", "Pultrusion dies", "Resin baths", "Pullers"],
    processList: ["拉挤设备制造"],
    processListEn: ["Pultrusion equipment manufacturing"],
    established: 2002,
    verified: true,
    description:
      "国内主要拉挤生产线供应商之一，提供 800kN-2400kN 系列设备，覆盖窗框、风电叶片大梁、电缆桥架等型材生产。",
    descriptionEn:
      "One of China's leading pultrusion line builders. 800 kN to 2,400 kN models for window frames, wind blade spar caps, cable trays and structural profiles. Turnkey installation including dies, resin baths, pullers and CNC cut-off saws.",
    certifications: ["ISO 9001", "CE"],
    certificationsEn: ["ISO 9001", "CE"],
  },
  {
    id: "eq-shengdi-002",
    name: "无锡盛迪复合材料装备有限公司",
    nameEn: "Wuxi Shengdi Composites Equipment Co., Ltd.",
    location: "江苏无锡",
    locationEn: "Wuxi, Jiangsu, China",
    province: "江苏",
    category: "equipment",
    products: ["HP-RTM 注胶机", "RTM 设备", "热压机"],
    productsEn: ["HP-RTM injection machines", "RTM equipment", "Hot presses"],
    processList: ["RTM/HP-RTM 设备制造"],
    processListEn: ["RTM / HP-RTM equipment manufacturing"],
    established: 2010,
    verified: true,
    description:
      "专注 HP-RTM 高压注胶系统，配套 1000-3000 吨液压机，主要服务汽车碳纤维结构件量产线。",
    descriptionEn:
      "HP-RTM high-pressure injection systems paired with 1,000–3,000 tonne hydraulic presses. Supplies automotive OEM lines producing carbon-fiber structural parts at series volume. Mixing accuracy ±1% across 4-component dosing.",
    certifications: ["ISO 9001", "CE"],
    certificationsEn: ["ISO 9001", "CE"],
  },
  {
    id: "eq-haitian-003",
    name: "宁波海天复材自动化设备",
    nameEn: "Ningbo Haitian Composites Automation Co., Ltd.",
    location: "浙江宁波",
    locationEn: "Ningbo, Zhejiang, China",
    province: "浙江",
    category: "equipment",
    products: ["自动铺丝机", "自动铺带机 AFP/ATL", "热压罐"],
    productsEn: ["Automated fiber placement (AFP)", "Automated tape laying (ATL)", "Autoclaves"],
    processList: ["AFP/ATL 设备", "热压罐"],
    processListEn: ["AFP / ATL equipment", "Autoclave systems"],
    established: 2008,
    verified: true,
    description:
      "国内热压罐和自动铺丝机主要厂家之一，热压罐尺寸 Ø2-Ø6 米，最大长度 18 米，服务航空航天和风电领域。",
    descriptionEn:
      "Domestic builder of autoclaves and AFP/ATL machines. Autoclave diameters Ø2–Ø6 m, lengths up to 18 m, working pressure 7-10 bar. Customers include aerospace primes and wind blade manufacturers.",
    certifications: ["ISO 9001", "ASME 8 Div 1", "PED"],
    certificationsEn: ["ISO 9001", "ASME Section VIII Div 1", "PED 2014/68/EU"],
  },
  {
    id: "eq-rongyu-004",
    name: "山东荣宇复合材料缠绕设备",
    nameEn: "Shandong Rongyu Filament Winding Equipment Co., Ltd.",
    location: "山东青岛",
    locationEn: "Qingdao, Shandong, China",
    province: "山东",
    category: "equipment",
    products: ["数控缠绕机", "立式缠绕机", "湿法缠绕生产线"],
    productsEn: ["CNC filament winding machines", "Vertical winders", "Wet winding lines"],
    processList: ["缠绕设备制造"],
    processListEn: ["Filament winding equipment manufacturing"],
    established: 2005,
    verified: true,
    description:
      "缠绕成型设备制造商，2-6 轴数控缠绕机，最大芯模直径 Ø3.2 米、长度 24 米，服务储罐、管道、压力容器领域。",
    descriptionEn:
      "Filament winding equipment maker. 2–6 axis CNC winders, mandrel sizes up to Ø3.2 m × 24 m. Serves tank, pipe, and pressure vessel producers; supports both wet winding and prepreg towpreg.",
    certifications: ["ISO 9001", "CE"],
    certificationsEn: ["ISO 9001", "CE"],
  },

  // ─────────────────────────── Tooling (4) ───────────────────────────
  {
    id: "tl-sandetai-101",
    name: "苏州三德泰复材工装",
    nameEn: "Suzhou Sandetai Composite Tooling Co., Ltd.",
    location: "江苏苏州",
    locationEn: "Suzhou, Jiangsu, China",
    province: "江苏",
    category: "tooling",
    products: ["铺层夹具", "切割工装", "抽真空装置", "贴模辅助"],
    productsEn: ["Layup jigs", "Cutting fixtures", "Vacuum bagging tools", "Mold-positioning aids"],
    processList: ["复材工装设计制造"],
    processListEn: ["Composite tooling design & manufacturing"],
    established: 2012,
    verified: true,
    description:
      "复材车间工装夹具与铺层辅具一站式供应商，服务航空航天结构件、汽车碳纤维件铺层工艺。",
    descriptionEn:
      "Layup jigs, cutting fixtures, and vacuum bagging accessories for composite shop floors. Serves aerospace structural lines and automotive carbon-fiber programs. Custom invar/CFRP fixtures supported.",
    certifications: ["ISO 9001", "AS9100D"],
    certificationsEn: ["ISO 9001", "AS9100D"],
  },
  {
    id: "tl-zhongke-102",
    name: "上海中科复材检测装备",
    nameEn: "Shanghai Zhongke Composite NDT Equipment Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "tooling",
    products: ["相控阵超声", "气固耦合超声", "红外热像", "X 射线 CT"],
    productsEn: ["Phased array ultrasonics", "Air-coupled ultrasonics", "IR thermography", "X-ray CT"],
    processList: ["NDT 设备", "复材无损检测"],
    processListEn: ["NDT equipment", "Composite non-destructive testing"],
    established: 2014,
    verified: true,
    description:
      "复材无损检测设备制造商，相控阵超声、气固耦合超声、红外热像和工业 CT 全链条供应，主要客户包括航空发动机短舱厂、风电叶片厂。",
    descriptionEn:
      "End-to-end NDT equipment for composites: phased array UT, air-coupled UT, IR thermography, and industrial CT. Customers include aero engine nacelle suppliers, wind blade manufacturers, and automotive composite programs.",
    certifications: ["ISO 9001", "ISO 17025"],
    certificationsEn: ["ISO 9001", "ISO 17025"],
  },
  {
    id: "tl-yongchang-103",
    name: "宁波永昌树脂注射装置",
    nameEn: "Ningbo Yongchang Resin Injection Systems Co., Ltd.",
    location: "浙江宁波",
    locationEn: "Ningbo, Zhejiang, China",
    province: "浙江",
    category: "tooling",
    products: ["树脂计量泵", "RTM 注射头", "脱泡槽", "管路系统"],
    productsEn: ["Resin metering pumps", "RTM injection heads", "Degassing tanks", "Tubing systems"],
    processList: ["树脂注射工艺装备"],
    processListEn: ["Resin injection process tooling"],
    established: 2007,
    verified: true,
    description:
      "RTM/真空灌注配套树脂注射装置，计量精度 ±0.5%，配套混合比 1:1 - 100:1，服务汽车结构件和风电叶片灌注线。",
    descriptionEn:
      "Resin injection sub-systems for RTM and infusion processes. Metering accuracy ±0.5%, mix ratios 1:1 to 100:1. Supplies automotive HP-RTM lines, wind blade infusion plants, and aerospace RTM tooling.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "tl-tianhe-104",
    name: "南京天和复材实验室仪器",
    nameEn: "Nanjing Tianhe Composite Lab Instruments Co., Ltd.",
    location: "江苏南京",
    locationEn: "Nanjing, Jiangsu, China",
    province: "江苏",
    category: "tooling",
    products: ["万能试验机", "DSC/TGA", "DMA", "树脂粘度计"],
    productsEn: ["Universal testing machines", "DSC / TGA", "DMA", "Resin viscometers"],
    processList: ["实验室仪器", "复材力学测试"],
    processListEn: ["Lab instruments", "Composite mechanical testing"],
    established: 2011,
    verified: true,
    description:
      "复材实验室仪器制造商，万能试验机量程 5kN-300kN，配套 ASTM D3039/D3410/D2344 等夹具，服务高校和企业研发中心。",
    descriptionEn:
      "Lab instruments for composite materials: UTMs from 5–300 kN with ASTM D3039 / D3410 / D2344 fixtures, plus DSC / TGA / DMA and resin rheology. Serves university labs and corporate R&D centers worldwide.",
    certifications: ["ISO 9001", "ISO 17025", "CE"],
    certificationsEn: ["ISO 9001", "ISO 17025", "CE"],
  },

  // ─────────────────────────── Molds (4) ───────────────────────────
  {
    id: "md-fenghua-201",
    name: "宁波奉化复材模具",
    nameEn: "Ningbo Fenghua Composite Molds Co., Ltd.",
    location: "浙江宁波",
    locationEn: "Ningbo, Zhejiang, China",
    province: "浙江",
    category: "mold",
    products: ["真空灌注模具", "手糊模具", "母模 / 翻模", "玻璃钢模"],
    productsEn: ["Vacuum infusion molds", "Hand layup molds", "Plug & master molds", "FRP molds"],
    processList: ["复材模具设计制造"],
    processListEn: ["Composite mold design & manufacturing"],
    established: 1998,
    verified: true,
    description:
      "国内主要复材模具厂之一，最大模具尺寸 80 米（风电叶片），交付周期 60-120 天，服务风电、游艇、轨交主机厂。",
    descriptionEn:
      "Composite mold maker for wind blades, yachts, and rail vehicles. Largest molds up to 80 m for wind blade applications. Lead times 60–120 days. Master mold + production mold + repair tooling supported.",
    certifications: ["ISO 9001", "DNV-GL Type Approval"],
    certificationsEn: ["ISO 9001", "DNV-GL Type Approval"],
  },
  {
    id: "md-jinghu-202",
    name: "上海京沪拉挤模具",
    nameEn: "Shanghai Jinghu Pultrusion Dies Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "mold",
    products: ["拉挤模具", "异型材模具", "型腔涂层"],
    productsEn: ["Pultrusion dies", "Custom profile dies", "Cavity coatings"],
    processList: ["拉挤模具设计制造"],
    processListEn: ["Pultrusion die design & manufacturing"],
    established: 2003,
    verified: true,
    description:
      "拉挤模具专业制造商，型腔精度 ±0.05mm，配套铬镀层和 PVD 涂层，服务窗框、电缆桥架、风电大梁拉挤线。",
    descriptionEn:
      "Pultrusion die specialist. Cavity tolerance ±0.05 mm, hard chrome and PVD coatings available. Custom profiles for window frames, cable trays, wind blade spar caps, and structural extrusions. Lead time 30–60 days.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "md-changxin-203",
    name: "苏州长信 RTM 模具",
    nameEn: "Suzhou Changxin RTM Molds Co., Ltd.",
    location: "江苏苏州",
    locationEn: "Suzhou, Jiangsu, China",
    province: "江苏",
    category: "mold",
    products: ["RTM 模具", "HP-RTM 模具", "加热模具", "真空袋膜模"],
    productsEn: ["RTM molds", "HP-RTM molds", "Heated molds", "Vacuum bag tooling"],
    processList: ["RTM 模具设计制造"],
    processListEn: ["RTM mold design & manufacturing"],
    established: 2009,
    verified: true,
    description:
      "RTM/HP-RTM 模具制造商，钢制模具配套 150°C 加热系统，服务汽车 OEM 碳纤维量产模具，年交付 30+ 套。",
    descriptionEn:
      "RTM and HP-RTM mold builder. Steel molds with integrated 150°C heating systems, double-sided seal grooves, custom injection ports. Delivers 30+ molds per year to automotive OEM carbon-fiber programs.",
    certifications: ["ISO 9001", "IATF 16949"],
    certificationsEn: ["ISO 9001", "IATF 16949"],
  },
  {
    id: "md-haiyang-204",
    name: "山东海洋船艇模具",
    nameEn: "Shandong Haiyang Marine Mold Co., Ltd.",
    location: "山东烟台",
    locationEn: "Yantai, Shandong, China",
    province: "山东",
    category: "mold",
    products: ["游艇船体模具", "甲板模具", "舷舱模具"],
    productsEn: ["Yacht hull molds", "Deck molds", "Cabin molds"],
    processList: ["船艇模具", "复材外壳模具"],
    processListEn: ["Marine molds", "Composite shell molds"],
    established: 2001,
    verified: true,
    description:
      "船艇复材模具厂，最大模具长度 30 米，服务国内外游艇、专业船艇制造商，包含船体、甲板、室内一体模具方案。",
    descriptionEn:
      "Marine composite mold builder. Hull molds up to 30 m. Supplies yacht and workboat builders globally with full hull / deck / interior tooling packages, including plug masters and shrink-controlled production tools.",
    certifications: ["ISO 9001", "CCS Mold Approval"],
    certificationsEn: ["ISO 9001", "CCS Mold Approval"],
  },
];

async function main() {
  console.log(`Seeding ${entries.length} overseas-ready supplier entries…`);

  for (const e of entries) {
    await db
      .insert(supplierListings)
      .values({
        id: e.id,
        name: e.name,
        nameEn: e.nameEn,
        location: e.location,
        locationEn: e.locationEn,
        province: e.province,
        category: e.category,
        products: e.products,
        productsEn: e.productsEn,
        processList: e.processList,
        processListEn: e.processListEn,
        established: e.established,
        verified: e.verified,
        description: e.description,
        descriptionEn: e.descriptionEn,
        certifications: e.certifications,
        certificationsEn: e.certificationsEn,
      })
      .onConflictDoUpdate({
        target: supplierListings.id,
        set: {
          name: e.name,
          nameEn: e.nameEn,
          location: e.location,
          locationEn: e.locationEn,
          province: e.province,
          category: e.category,
          products: e.products,
          productsEn: e.productsEn,
          processList: e.processList,
          processListEn: e.processListEn,
          established: e.established,
          verified: e.verified,
          description: e.description,
          descriptionEn: e.descriptionEn,
          certifications: e.certifications,
          certificationsEn: e.certificationsEn,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✓ ${e.id}  ${e.nameEn}`);
  }

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
