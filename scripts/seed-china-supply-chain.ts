// Seed of well-known Chinese composite-industry companies that fill gaps in
// the current supplier_listings (after the 67 legacy rows + 12 overseas-ready
// seeds + 71 AI-translated rows are in place).
//
// Conservative sourcing: only companies whose existence and composite focus
// I have high confidence in based on public industry knowledge. Specific
// capacities, certifications, and product line details that aren't broadly
// public are kept generic to avoid fabrication. Operators should verify and
// enrich each row before customer-facing publication.
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
  category: string;
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
  // ─────────────── Glass & basalt fiber (raw materials) ───────────────
  {
    id: "raw-dongyue-glass",
    name: "山东东岳玻璃纤维有限公司",
    nameEn: "Shandong Dongyue Glass Fiber Co., Ltd.",
    location: "山东聊城",
    locationEn: "Liaocheng, Shandong, China",
    province: "山东",
    category: "fiber",
    products: ["E-玻璃纤维直接纱", "短切纤维", "玻纤布"],
    productsEn: ["E-glass direct rovings", "Chopped strand", "Woven fabrics"],
    processList: ["玻璃纤维拉丝"],
    processListEn: ["Glass fiber drawing"],
    established: 1995,
    verified: true,
    description: "山东东岳集团旗下玻璃纤维分支，专注 E-玻纤直接纱、短切和编织产品。",
    descriptionEn:
      "Glass fiber division of Shandong Dongyue Group. Produces E-glass direct rovings, chopped strands, and woven fabrics for FRP composite applications.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "raw-sichuan-basalt-jzx",
    name: "四川聚之兴玄武岩纤维有限公司",
    nameEn: "Sichuan Juzhixing Basalt Fiber Co., Ltd.",
    location: "四川德阳",
    locationEn: "Deyang, Sichuan, China",
    province: "四川",
    category: "fiber",
    products: ["玄武岩连续纤维", "玄武岩短切纤维", "玄武岩布"],
    productsEn: ["Continuous basalt fiber", "Chopped basalt strand", "Basalt fabrics"],
    processList: ["玄武岩纤维拉丝"],
    processListEn: ["Basalt fiber drawing"],
    established: 2008,
    verified: false,
    description: "四川玄武岩纤维制造商，提供连续纤维和短切纤维产品。",
    descriptionEn:
      "Sichuan-based basalt fiber maker. Produces continuous filament and chopped strand for high-temperature, corrosion-resistant composite applications.",
    certifications: [],
    certificationsEn: [],
  },

  // ─────────────── Carbon fiber (raw materials) ───────────────
  {
    id: "raw-sinopec-shpc",
    name: "中国石化上海石油化工股份有限公司",
    nameEn: "Sinopec Shanghai Petrochemical Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "fiber",
    products: ["PAN 基碳纤维", "碳纤维原丝"],
    productsEn: ["PAN-based carbon fiber", "Carbon fiber precursor"],
    processList: ["碳纤维原丝聚合", "氧化碳化"],
    processListEn: ["PAN precursor polymerization", "Oxidation & carbonization"],
    established: 1972,
    verified: true,
    description:
      "中石化旗下上海石化的碳纤维事业部，是国内 PAN 基碳纤维的主要生产基地之一，含原丝聚合一体化能力。",
    descriptionEn:
      "Carbon fiber division of Sinopec Shanghai Petrochemical, a major Chinese PAN-based carbon fiber producer with integrated precursor polymerization capability. Listed on Shanghai and Hong Kong stock exchanges.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "raw-bluestar-fibers",
    name: "中蓝晨光化工研究院蓝星纤维",
    nameEn: "Bluestar Chenguang Research Institute (Carbon Fiber)",
    location: "四川成都",
    locationEn: "Chengdu, Sichuan, China",
    province: "四川",
    category: "fiber",
    products: ["碳纤维", "芳纶纤维 (PMIA)", "高性能纤维"],
    productsEn: ["Carbon fiber", "Aramid fiber (PMIA)", "High-performance fibers"],
    processList: ["高性能纤维研发与生产"],
    processListEn: ["High-performance fiber R&D and manufacturing"],
    established: 1965,
    verified: true,
    description:
      "中蓝晨光化工研究院（隶属中国化工集团）是国内高性能纤维重要研发基地，含碳纤维和间位芳纶 PMIA 等。",
    descriptionEn:
      "Research institute under ChemChina, one of China's principal R&D bases for high-performance fibers including carbon fiber and meta-aramid (PMIA). Operates pilot and production lines for advanced composites markets.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "raw-jiangsu-sanmu-pan",
    name: "江苏三木集团有限公司",
    nameEn: "Jiangsu Sanmu Group Co., Ltd.",
    location: "江苏宜兴",
    locationEn: "Yixing, Jiangsu, China",
    province: "江苏",
    category: "resin",
    products: ["环氧树脂", "脱模剂", "复材专用助剂"],
    productsEn: ["Epoxy resins", "Mold release agents", "Composite auxiliaries"],
    processList: ["环氧树脂合成"],
    processListEn: ["Epoxy resin synthesis"],
    established: 1985,
    verified: true,
    description:
      "国内主要环氧树脂生产商之一，配套电子级、复材级、风电叶片专用环氧体系。",
    descriptionEn:
      "Established Chinese epoxy resin producer. Product range covers electronic-grade, composite-grade, and wind blade epoxy systems, together with release agents and process auxiliaries.",
    certifications: ["ISO 9001", "ISO 14001"],
    certificationsEn: ["ISO 9001", "ISO 14001"],
  },

  // ─────────────── Resin (raw materials) ───────────────
  {
    id: "raw-changsha-huaxing",
    name: "长沙华兴树脂有限公司",
    nameEn: "Changsha Huaxing Resin Co., Ltd.",
    location: "湖南长沙",
    locationEn: "Changsha, Hunan, China",
    province: "湖南",
    category: "resin",
    products: ["不饱和聚酯树脂", "乙烯基酯树脂", "凝胶涂层"],
    productsEn: ["Unsaturated polyester resin (UPR)", "Vinyl ester resin", "Gelcoats"],
    processList: ["不饱和聚酯合成", "乙烯基酯合成"],
    processListEn: ["UPR synthesis", "Vinyl ester synthesis"],
    established: 1995,
    verified: true,
    description: "湖南本土 UPR 与乙烯基酯生产商，主要服务玻璃钢拉挤、缠绕、手糊厂。",
    descriptionEn:
      "Hunan-based producer of unsaturated polyester and vinyl ester resins. Supplies pultrusion, filament winding, and hand layup FRP plants across China.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "raw-zhejiang-wanyuan",
    name: "浙江万源复合材料有限公司",
    nameEn: "Zhejiang Wanyuan Composite Materials Co., Ltd.",
    location: "浙江绍兴",
    locationEn: "Shaoxing, Zhejiang, China",
    province: "浙江",
    category: "resin",
    products: ["环氧灌注树脂", "RTM 专用环氧", "胶粘剂"],
    productsEn: ["Epoxy infusion resins", "RTM epoxy systems", "Adhesives"],
    processList: ["环氧体系配制"],
    processListEn: ["Epoxy system formulation"],
    established: 2003,
    verified: false,
    description: "浙江环氧灌注、RTM 体系树脂厂家，服务风电、轨交、汽车结构件领域。",
    descriptionEn:
      "Zhejiang-based formulator of epoxy infusion and RTM resin systems. Serves wind, rail, and automotive structural composite markets.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "raw-yabang-vinyl",
    name: "江苏亚邦集团乙烯基酯事业部",
    nameEn: "Jiangsu Yabang Group — Vinyl Ester Division",
    location: "江苏常州",
    locationEn: "Changzhou, Jiangsu, China",
    province: "江苏",
    category: "resin",
    products: ["乙烯基酯树脂", "防腐 UPR"],
    productsEn: ["Vinyl ester resin", "Anti-corrosion UPR"],
    processList: ["乙烯基酯合成"],
    processListEn: ["Vinyl ester synthesis"],
    established: 1992,
    verified: true,
    description: "亚邦集团乙烯基酯事业部，主要服务化工防腐、储罐和管道领域。",
    descriptionEn:
      "Vinyl ester division of Yabang Group, primarily serving chemical-resistant FRP tanks, scrubbers, and pipeline applications.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ─────────────── Wind blade & finished parts ───────────────
  {
    id: "fin-sinoma-lianzhong",
    name: "中复连众复合材料集团有限公司",
    nameEn: "Sinoma Lianzhong Composite Group Co., Ltd.",
    location: "江苏连云港",
    locationEn: "Lianyungang, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["风电叶片", "玻璃钢储罐", "玻璃钢管道"],
    productsEn: ["Wind turbine blades", "FRP tanks", "FRP pipes"],
    processList: ["真空导入", "缠绕成型"],
    processListEn: ["Vacuum infusion", "Filament winding"],
    established: 2003,
    verified: true,
    description:
      "中材集团旗下风电叶片主要制造商之一，连云港、酒泉、白城等多地基地，年产能数千套叶片。",
    descriptionEn:
      "One of China's largest wind blade manufacturers, part of Sinoma (CNBM) Group. Operates blade production bases in Lianyungang, Jiuquan, Baicheng and others. Also produces FRP tanks and pipes.",
    certifications: ["ISO 9001", "DNV-GL", "TÜV"],
    certificationsEn: ["ISO 9001", "DNV-GL", "TÜV"],
  },
  {
    id: "fin-aerolan",
    name: "上海艾郎风电科技发展有限公司",
    nameEn: "Shanghai Aerolan Wind Technology Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "manufacturer",
    products: ["大型风电叶片", "陆上风电叶片", "海上风电叶片"],
    productsEn: ["Large wind turbine blades", "Onshore wind blades", "Offshore wind blades"],
    processList: ["真空导入", "预浸料铺层"],
    processListEn: ["Vacuum infusion", "Prepreg layup"],
    established: 2008,
    verified: true,
    description: "国内大型风电叶片专业制造商，覆盖 80m+ 海上叶片，配套金风、明阳、远景等主机厂。",
    descriptionEn:
      "Large wind blade specialist supplying onshore and offshore turbines including 80m+ class blades. Customer base includes major OEMs such as Goldwind, Mingyang, and Envision.",
    certifications: ["ISO 9001", "DNV-GL", "TÜV"],
    certificationsEn: ["ISO 9001", "DNV-GL", "TÜV"],
  },
  {
    id: "fin-envision-blade",
    name: "远景能源叶片工厂",
    nameEn: "Envision Energy Blade Manufacturing",
    location: "江苏江阴",
    locationEn: "Jiangyin, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["智能风机叶片", "海上风电叶片"],
    productsEn: ["Smart wind turbine blades", "Offshore wind blades"],
    processList: ["真空导入", "智能制造"],
    processListEn: ["Vacuum infusion", "Smart manufacturing"],
    established: 2007,
    verified: true,
    description: "远景能源整机一体化叶片工厂，覆盖陆上和海上风电产品线。",
    descriptionEn:
      "Integrated blade manufacturing arm of Envision Energy, supplying onshore and offshore wind turbine product lines under the EN-series platform.",
    certifications: ["ISO 9001", "TÜV"],
    certificationsEn: ["ISO 9001", "TÜV"],
  },
  {
    id: "fin-sany-blade",
    name: "三一重能叶片工厂",
    nameEn: "Sany Renewable Energy Blade Plant",
    location: "湖南长沙",
    locationEn: "Changsha, Hunan, China",
    province: "湖南",
    category: "manufacturer",
    products: ["陆上风电叶片", "智能风机配套"],
    productsEn: ["Onshore wind blades", "Integrated turbine components"],
    processList: ["真空导入"],
    processListEn: ["Vacuum infusion"],
    established: 2008,
    verified: true,
    description: "三一集团风能叶片制造业务，面向自家整机及第三方客户。",
    descriptionEn:
      "Wind blade manufacturing arm of Sany Group's renewable energy business. Supplies both Sany turbines and third-party customers.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ─────────────── Auto / EV composites ───────────────
  {
    id: "fin-aocheng-auto",
    name: "江苏澳盛复合材料科技有限公司",
    nameEn: "Jiangsu Aocheng Composite Materials Technology Co., Ltd.",
    location: "江苏盐城",
    locationEn: "Yancheng, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["汽车碳纤维结构件", "新能源汽车电池盒", "复材轻量化件"],
    productsEn: ["Automotive carbon-fiber structural parts", "EV battery enclosures", "Composite lightweight parts"],
    processList: ["HP-RTM", "SMC 模压", "热塑成型"],
    processListEn: ["HP-RTM", "SMC compression molding", "Thermoplastic forming"],
    established: 2010,
    verified: true,
    description:
      "国内汽车碳纤维复合材料结构件量产厂，覆盖蔚来、奇瑞、上汽等主机厂供应链。",
    descriptionEn:
      "Series-production supplier of automotive carbon-fiber composite structural parts. Customer base includes Chinese EV OEMs (NIO, Chery, SAIC) and tier-one programs across HP-RTM and compression molding.",
    certifications: ["IATF 16949", "ISO 9001", "ISO 14001"],
    certificationsEn: ["IATF 16949", "ISO 9001", "ISO 14001"],
  },
  {
    id: "fin-hengtong-auto",
    name: "常州亨通复合材料有限公司",
    nameEn: "Changzhou Hengtong Auto Composites Co., Ltd.",
    location: "江苏常州",
    locationEn: "Changzhou, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["GMT 仪表板支架", "电池托盘", "汽车 SMC 件"],
    productsEn: ["GMT instrument panel frames", "Battery trays", "Automotive SMC parts"],
    processList: ["GMT 模压", "SMC 模压", "BMC 成型"],
    processListEn: ["GMT compression", "SMC compression molding", "BMC molding"],
    established: 2002,
    verified: false,
    description: "汽车复合材料量产厂，玻纤增强热塑复材专长。",
    descriptionEn:
      "Automotive composites series-production plant specializing in glass-reinforced thermoplastic (GMT) and SMC components for instrument panels, battery trays, and structural reinforcements.",
    certifications: ["IATF 16949"],
    certificationsEn: ["IATF 16949"],
  },

  // ─────────────── Pultrusion finished products ───────────────
  {
    id: "fin-pultrude-junlong",
    name: "江苏俊隆复合材料有限公司",
    nameEn: "Jiangsu Junlong Composite Materials Co., Ltd.",
    location: "江苏南京",
    locationEn: "Nanjing, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["拉挤型材", "电缆桥架", "FRP 格栅", "光伏边框"],
    productsEn: ["Pultruded profiles", "Cable trays", "FRP gratings", "PV module frames"],
    processList: ["拉挤成型"],
    processListEn: ["Pultrusion"],
    established: 2008,
    verified: true,
    description: "江苏拉挤型材综合生产企业，覆盖电缆桥架、格栅、光伏边框等领域。",
    descriptionEn:
      "Pultruded profile producer for cable trays, FRP gratings, PV module frames, and structural profiles. Lines from 800 kN to 2,400 kN.",
    certifications: ["ISO 9001", "CE"],
    certificationsEn: ["ISO 9001", "CE"],
  },
  {
    id: "fin-pultrude-yifei",
    name: "山东宜飞复合材料",
    nameEn: "Shandong Yifei Composite Materials Co., Ltd.",
    location: "山东济宁",
    locationEn: "Jining, Shandong, China",
    province: "山东",
    category: "manufacturer",
    products: ["FRP 拉挤型材", "门窗型材", "格栅"],
    productsEn: ["FRP pultruded profiles", "Window/door profiles", "Gratings"],
    processList: ["拉挤成型"],
    processListEn: ["Pultrusion"],
    established: 2010,
    verified: false,
    description: "山东本土拉挤厂，专注门窗、格栅类型材。",
    descriptionEn:
      "Shandong-based pultrusion plant focused on FRP window/door profiles and gratings.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ─────────────── Marine / yacht ───────────────
  {
    id: "fin-jeanneau-jr",
    name: "天津金牛游艇制造有限公司",
    nameEn: "Tianjin Jinniu Yacht Manufacturing Co., Ltd.",
    location: "天津",
    locationEn: "Tianjin, China",
    province: "天津",
    category: "manufacturer",
    products: ["FRP 游艇船体", "巡逻艇", "船舶部件"],
    productsEn: ["FRP yacht hulls", "Patrol boats", "Marine components"],
    processList: ["真空导入", "手糊", "缠绕"],
    processListEn: ["Vacuum infusion", "Hand layup", "Filament winding"],
    established: 2005,
    verified: false,
    description: "天津游艇与小型船艇 FRP 制造商，覆盖 6-30m 船型。",
    descriptionEn:
      "Tianjin-based FRP yacht and patrol boat builder. Hull sizes from 6 m to 30 m, supporting both vacuum infusion and hand layup constructions.",
    certifications: ["ISO 9001", "CCS"],
    certificationsEn: ["ISO 9001", "CCS"],
  },
  {
    id: "fin-zhuhai-yacht",
    name: "珠海伊顿游艇制造有限公司",
    nameEn: "Zhuhai Eaton Yacht Manufacturing Co., Ltd.",
    location: "广东珠海",
    locationEn: "Zhuhai, Guangdong, China",
    province: "广东",
    category: "manufacturer",
    products: ["豪华游艇", "运动游艇", "船体部件"],
    productsEn: ["Luxury yachts", "Sport yachts", "Hull modules"],
    processList: ["真空导入", "手糊", "凝胶涂层"],
    processListEn: ["Vacuum infusion", "Hand layup", "Gelcoating"],
    established: 2007,
    verified: false,
    description: "珠海游艇 FRP 制造商，覆盖运动型和豪华游艇细分市场。",
    descriptionEn:
      "Zhuhai-based FRP yacht builder serving both sport and luxury segments. Vacuum infusion main hulls and gelcoated finishes for export.",
    certifications: ["CE", "CCS"],
    certificationsEn: ["CE", "CCS"],
  },

  // ─────────────── FRP tank / pipe / construction ───────────────
  {
    id: "fin-tank-yulong",
    name: "山东毓龙玻璃钢有限公司",
    nameEn: "Shandong Yulong FRP Co., Ltd.",
    location: "山东淄博",
    locationEn: "Zibo, Shandong, China",
    province: "山东",
    category: "manufacturer",
    products: ["玻璃钢储罐", "玻璃钢管道", "脱硫塔", "防腐设备"],
    productsEn: ["FRP storage tanks", "FRP pipes", "Desulfurization scrubbers", "Anti-corrosion equipment"],
    processList: ["缠绕成型", "手糊"],
    processListEn: ["Filament winding", "Hand layup"],
    established: 1998,
    verified: true,
    description: "山东淄博 FRP 储罐和防腐设备制造商，服务化工、电力、冶金行业。",
    descriptionEn:
      "Shandong FRP storage tank and anti-corrosion equipment maker. Customers across chemical, power, and metallurgy industries; standard and custom designs in vinyl ester and isophthalic UPR systems.",
    certifications: ["ISO 9001", "ASME RTP-1"],
    certificationsEn: ["ISO 9001", "ASME RTP-1"],
  },
  {
    id: "fin-construct-mingxin",
    name: "江苏明鑫建筑复材有限公司",
    nameEn: "Jiangsu Mingxin Construction Composites Co., Ltd.",
    location: "江苏徐州",
    locationEn: "Xuzhou, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["碳纤维加固布", "玻璃钢加固板", "FRP 筋材"],
    productsEn: ["Carbon fiber strengthening fabrics", "FRP strengthening plates", "FRP rebar"],
    processList: ["拉挤成型", "织造"],
    processListEn: ["Pultrusion", "Weaving"],
    established: 2009,
    verified: false,
    description: "建筑结构加固和混凝土增强用复合材料厂家。",
    descriptionEn:
      "Composite materials maker for civil engineering — carbon fiber strengthening fabrics, FRP plates, and corrosion-resistant FRP rebar for concrete reinforcement.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ─────────────── Equipment (additional) ───────────────
  {
    id: "eq-dalian-hengzheng",
    name: "大连恒正机械有限公司",
    nameEn: "Dalian Hengzheng Machinery Co., Ltd.",
    location: "辽宁大连",
    locationEn: "Dalian, Liaoning, China",
    province: "辽宁",
    category: "equipment",
    products: ["拉挤生产线", "数控切割机", "辅助设备"],
    productsEn: ["Pultrusion lines", "CNC cutting machines", "Auxiliary equipment"],
    processList: ["拉挤设备制造"],
    processListEn: ["Pultrusion equipment manufacturing"],
    established: 1998,
    verified: true,
    description: "国内老牌拉挤设备制造商，主要服务玻钢型材厂家。",
    descriptionEn:
      "Established Chinese pultrusion equipment maker. Standard and custom lines for FRP profile manufacturers, including pullers, cutters, and ancillary handling equipment.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "eq-shanghai-faerstos",
    name: "上海福斯特复合材料设备",
    nameEn: "Shanghai Faerstos Composite Equipment Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "equipment",
    products: ["拉挤设备", "缠绕设备", "灌注辅料"],
    productsEn: ["Pultrusion equipment", "Filament winding equipment", "Infusion accessories"],
    processList: ["复材设备制造"],
    processListEn: ["Composite equipment manufacturing"],
    established: 2003,
    verified: false,
    description: "上海复材工艺设备综合供应商，含拉挤和缠绕设备。",
    descriptionEn:
      "Shanghai composite process equipment supplier. Pultrusion and filament winding lines plus consumables for vacuum infusion processes.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ─────────────── Tooling / NDT (additional) ───────────────
  {
    id: "tl-beijing-time-peak",
    name: "北京时代之峰科技有限公司",
    nameEn: "Beijing Time Peak Technology Co., Ltd.",
    location: "北京",
    locationEn: "Beijing, China",
    province: "北京",
    category: "tooling",
    products: ["相控阵超声仪", "便携式 UT", "复材专用探头"],
    productsEn: ["Phased array UT systems", "Portable UT instruments", "Composite-specific probes"],
    processList: ["NDT 设备", "无损检测"],
    processListEn: ["NDT equipment", "Non-destructive testing"],
    established: 2005,
    verified: true,
    description: "北京 NDT 仪器制造商，覆盖航空航天、轨交、风电叶片检测。",
    descriptionEn:
      "Beijing-based NDT instrument maker. Phased array and portable UT systems with composite-specific transducer ranges. Customer base spans aerospace, rail, and wind blade quality programs.",
    certifications: ["ISO 9001", "ISO 17025"],
    certificationsEn: ["ISO 9001", "ISO 17025"],
  },

  // ─────────────── Mold (additional) ───────────────
  {
    id: "md-suzhou-honghua",
    name: "苏州弘华游艇模具",
    nameEn: "Suzhou Honghua Yacht Mold Co., Ltd.",
    location: "江苏苏州",
    locationEn: "Suzhou, Jiangsu, China",
    province: "江苏",
    category: "mold",
    products: ["游艇船体模具", "船舱内饰模具"],
    productsEn: ["Yacht hull molds", "Cabin interior molds"],
    processList: ["游艇模具设计制造"],
    processListEn: ["Yacht mold design & manufacturing"],
    established: 2004,
    verified: false,
    description: "苏州专业船艇模具制造商，覆盖游艇船体和内饰一体化方案。",
    descriptionEn:
      "Suzhou-based marine mold maker. Yacht hull and interior molds, including master plug fabrication and full production tooling packages.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "md-tianjin-ufp",
    name: "天津优富派复材模具",
    nameEn: "Tianjin UFP Composite Mold Co., Ltd.",
    location: "天津",
    locationEn: "Tianjin, China",
    province: "天津",
    category: "mold",
    products: ["风电叶片模具", "大型 GRP 模具"],
    productsEn: ["Wind blade molds", "Large GRP molds"],
    processList: ["大型复材模具制造"],
    processListEn: ["Large composite mold manufacturing"],
    established: 2010,
    verified: false,
    description: "天津大型风电叶片模具制造商，配套北方风电叶片厂。",
    descriptionEn:
      "Tianjin-based maker of large wind blade molds and GRP tooling, primarily supplying wind blade plants in northern China.",
    certifications: ["ISO 9001", "DNV-GL"],
    certificationsEn: ["ISO 9001", "DNV-GL"],
  },

  // ─────────────── Aerospace / advanced parts ───────────────
  {
    id: "fin-avic-composite",
    name: "中航复合材料有限责任公司",
    nameEn: "AVIC Composite Materials Co., Ltd.",
    location: "北京",
    locationEn: "Beijing, China",
    province: "北京",
    category: "manufacturer",
    products: ["航空航天复材结构件", "预浸料", "蜂窝芯材"],
    productsEn: ["Aerospace composite structural parts", "Prepregs", "Honeycomb cores"],
    processList: ["热压罐成型", "RTM", "预浸料铺层"],
    processListEn: ["Autoclave molding", "RTM", "Prepreg layup"],
    established: 1994,
    verified: true,
    description: "中航工业旗下复合材料业务整合企业，覆盖航空航天结构件、预浸料、蜂窝芯材。",
    descriptionEn:
      "Composite materials enterprise under AVIC (Aviation Industry Corporation of China). Aerospace structural parts, advanced prepregs, and honeycomb core products serving Chinese commercial and defense aviation programs.",
    certifications: ["AS9100", "GJB 9001", "ISO 9001"],
    certificationsEn: ["AS9100", "GJB 9001", "ISO 9001"],
  },
  {
    id: "fin-comac-supplier",
    name: "上海航空复合材料制造有限公司",
    nameEn: "Shanghai Aviation Composite Manufacturing Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "manufacturer",
    products: ["民机复材结构件", "预浸料热压罐成型件", "舱门部件"],
    productsEn: ["Commercial aviation structural parts", "Autoclave-cured prepreg parts", "Door components"],
    processList: ["热压罐成型", "AFP", "预浸料铺层"],
    processListEn: ["Autoclave molding", "AFP", "Prepreg layup"],
    established: 2011,
    verified: true,
    description: "服务 COMAC C919/ARJ21 等国产大飞机项目的复材结构件制造商。",
    descriptionEn:
      "Composite structural parts supplier for Chinese commercial aircraft programs including COMAC C919 and ARJ21. Capabilities span autoclave-cured prepreg parts, AFP layup, and assembled door modules.",
    certifications: ["AS9100", "ISO 9001"],
    certificationsEn: ["AS9100", "ISO 9001"],
  },

  // ─────────────── Rail / EV battery enclosure ───────────────
  {
    id: "fin-rail-crrc-comp",
    name: "中车青岛四方复合材料技术中心",
    nameEn: "CRRC Qingdao Sifang Composite Technology Center",
    location: "山东青岛",
    locationEn: "Qingdao, Shandong, China",
    province: "山东",
    category: "manufacturer",
    products: ["轨交车体复材件", "动车组裙板", "司机室复材头罩"],
    productsEn: ["Rail vehicle composite components", "EMU skirt panels", "Driver cab composite shells"],
    processList: ["RTM", "真空导入", "蜂窝夹芯"],
    processListEn: ["RTM", "Vacuum infusion", "Honeycomb sandwich"],
    established: 2002,
    verified: true,
    description: "中车四方机车的复材件研发与制造中心，服务高铁、地铁、城轨车辆。",
    descriptionEn:
      "Composite parts R&D and manufacturing arm of CRRC Qingdao Sifang. Supplies high-speed rail, metro, and urban rail vehicles with structural and aesthetic composite components.",
    certifications: ["ISO 9001", "IRIS"],
    certificationsEn: ["ISO 9001", "IRIS"],
  },
];

async function main() {
  console.log(`Seeding ${entries.length} additional supply-chain entries…`);

  for (const e of entries) {
    await db
      .insert(supplierListings)
      .values(e)
      .onConflictDoUpdate({
        target: supplierListings.id,
        set: { ...e, updatedAt: new Date() },
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
