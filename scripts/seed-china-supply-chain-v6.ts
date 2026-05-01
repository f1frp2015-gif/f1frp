// v6 batch — fiber-composite supply chain only (no service category).
// Focus on industrial niches missing after v5 (421 rows). Targets:
//   • CMC / SiC ceramic-matrix composites (航天/导弹热结构)
//   • 复合绝缘子 / 复合芯棒 / 电力绝缘复材
//   • 航天/火箭复材壳体配套
//   • 轨道交通 Tier-2 复材内饰
//   • 集装箱底板 / 航空地板夹芯
//   • 海工油气复材立管/海缆护套
//   • 热塑性复合材料 (LFT/CFRT)
//   • Additional storage-tank / piping SMEs (安徽/江西/福建)
//   • Additional equipment & mold specialists
//
// All verified=false. Idempotent on `id`. Conservative sourcing.

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
  // ═══════════════════════════════════════════════════════════════════════
  // A. CMC / SiC ceramic-matrix composites
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "cf-suzhou-saifei-sic",
    name: "苏州赛力菲陶纤有限公司",
    nameEn: "Suzhou SaiFei Ceramic Fiber Co., Ltd.",
    location: "江苏苏州",
    locationEn: "Suzhou, Jiangsu, China",
    province: "江苏",
    category: "fiber",
    products: ["SiC 连续纤维", "SiC 纤维布", "陶瓷基复材预制体"],
    productsEn: ["Continuous SiC fiber", "SiC fabric", "CMC preforms"],
    processList: ["先驱体合成", "纺丝", "高温烧结"],
    processListEn: ["Precursor synthesis", "Spinning", "High-temperature sintering"],
    established: 2012,
    verified: false,
    description: "国内 SiC 连续纤维主要替代供应方，对标 Nicalon/Tyranno 系列。",
    descriptionEn:
      "One of China's main alternative suppliers of continuous SiC fiber, positioned against the Nicalon/Tyranno series.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-xian-xinyao-cmc",
    name: "西安鑫垚陶瓷复合材料有限公司",
    nameEn: "Xi'an Xinyao Ceramic Composite Materials Co., Ltd.",
    location: "陕西西安",
    locationEn: "Xi'an, Shaanxi, China",
    province: "陕西",
    category: "manufacturer",
    products: ["陶瓷基复材", "航空发动机热端件", "航天热结构件"],
    productsEn: ["Ceramic-matrix composites", "Aero-engine hot section parts", "Aerospace hot structures"],
    processList: ["CVI 化学气相浸渗", "PIP 先驱体浸渍裂解"],
    processListEn: ["Chemical vapor infiltration (CVI)", "Polymer impregnation pyrolysis (PIP)"],
    established: 2014,
    verified: false,
    description: "西安本地 CMC 产业化代表企业，依托西工大与中航发产业转移。",
    descriptionEn:
      "Xi'an CMC industrialization startup, leveraging tech transfer from NPU and AECC.",
    certifications: ["AS9100", "ISO 9001"],
    certificationsEn: ["AS9100", "ISO 9001"],
  },
  {
    id: "fin-hunan-dingli-cmc",
    name: "湖南顶立科技股份有限公司",
    nameEn: "Hunan Dingli Technology Co., Ltd.",
    location: "湖南长沙",
    locationEn: "Changsha, Hunan, China",
    province: "湖南",
    category: "manufacturer",
    products: ["碳/碳复材", "陶瓷基复材热结构件", "粉末冶金件"],
    productsEn: ["C/C composites", "CMC thermal structures", "Powder metallurgy parts"],
    processList: ["CVI", "热压烧结"],
    processListEn: ["CVI", "Hot-press sintering"],
    established: 2003,
    verified: false,
    description: "长沙本地碳/碳与陶瓷基复材厂，A 股科创板上市，工业窑炉与粉末冶金并重。",
    descriptionEn:
      "Changsha-based C/C and CMC maker, Sci-Tech Innovation Board listed; industrial furnaces and powder metallurgy are also core lines.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-shandong-ceramic-research",
    name: "山东国瓷功能材料股份有限公司",
    nameEn: "Shandong Sinocera Functional Material Co., Ltd.",
    location: "山东东营",
    locationEn: "Dongying, Shandong, China",
    province: "山东",
    category: "manufacturer",
    products: ["纳米陶瓷材料", "氧化锆陶瓷", "陶瓷基复材原料"],
    productsEn: ["Nano ceramic materials", "Zirconia ceramics", "CMC raw materials"],
    processList: ["水热合成", "粉体烧结"],
    processListEn: ["Hydrothermal synthesis", "Powder sintering"],
    established: 2005,
    verified: false,
    description: "国内代表性高端陶瓷材料厂，A 股上市；纳米陶瓷与电子陶瓷是核心。",
    descriptionEn:
      "Major Chinese high-end ceramic materials maker, A-share listed; nano-ceramics and electronic ceramics are core lines.",
    certifications: ["ISO 9001", "IATF 16949"],
    certificationsEn: ["ISO 9001", "IATF 16949"],
  },
  {
    id: "cf-zhongan-sic-jiangxi",
    name: "江西宁瓷新材料有限公司",
    nameEn: "Jiangxi Ningci New Materials Co., Ltd.",
    location: "江西景德镇",
    locationEn: "Jingdezhen, Jiangxi, China",
    province: "江西",
    category: "fiber",
    products: ["SiC 短切纤维", "SiC 晶须", "陶瓷基复材增强相"],
    productsEn: ["SiC chopped fiber", "SiC whiskers", "CMC reinforcement phases"],
    processList: ["先驱体合成", "粉体加工"],
    processListEn: ["Precursor synthesis", "Powder processing"],
    established: 2013,
    verified: false,
    description: "依托景德镇陶瓷工业基础的 SiC 增强相生产商。",
    descriptionEn:
      "SiC reinforcement-phase producer leveraging Jingdezhen's ceramic industry base.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B. Composite insulators / 复合芯棒 / 电力绝缘复材
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "fin-jiangsu-shenma-insulator",
    name: "江苏神马电力股份有限公司",
    nameEn: "Jiangsu Shenma Electric Power Co., Ltd.",
    location: "江苏南通",
    locationEn: "Nantong, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["复合绝缘子", "复合横担", "GIS 套管", "复合芯棒"],
    productsEn: ["Composite insulators", "Composite cross-arms", "GIS bushings", "Composite rod cores"],
    processList: ["拉挤", "硅橡胶注射"],
    processListEn: ["Pultrusion", "Silicone rubber injection"],
    established: 1996,
    verified: false,
    description: "国内复合绝缘子龙头，A 股上市，覆盖输电线路绝缘子全产品线。",
    descriptionEn:
      "Leading Chinese composite insulator maker, A-share listed; covers the full transmission-line insulator portfolio.",
    certifications: ["ISO 9001", "IEC"],
    certificationsEn: ["ISO 9001", "IEC"],
  },
  {
    id: "fin-jinguan-electric-henan",
    name: "南阳金冠电气有限公司",
    nameEn: "Nanyang Jinguan Electric Co., Ltd.",
    location: "河南南阳",
    locationEn: "Nanyang, Henan, China",
    province: "河南",
    category: "manufacturer",
    products: ["复合绝缘子", "避雷器", "复合外套"],
    productsEn: ["Composite insulators", "Surge arresters", "Composite housings"],
    processList: ["拉挤", "硅橡胶硫化"],
    processListEn: ["Pultrusion", "Silicone rubber vulcanization"],
    established: 2002,
    verified: false,
    description: "河南南阳本地输配电复合绝缘子主力厂，A 股上市。",
    descriptionEn:
      "Main Nanyang composite insulator and surge arrester maker for transmission/distribution networks; A-share listed.",
    certifications: ["ISO 9001", "IEC"],
    certificationsEn: ["ISO 9001", "IEC"],
  },
  {
    id: "fin-xiantao-rubber-insulator",
    name: "湖北襄阳电力复合材料有限公司",
    nameEn: "Hubei Xiangyang Power Composite Materials Co., Ltd.",
    location: "湖北襄阳",
    locationEn: "Xiangyang, Hubei, China",
    province: "湖北",
    category: "manufacturer",
    products: ["复合绝缘子", "复合横担", "电力玻璃钢杆塔"],
    productsEn: ["Composite insulators", "Composite cross-arms", "FRP utility poles"],
    processList: ["拉挤", "硅橡胶硫化"],
    processListEn: ["Pultrusion", "Silicone rubber vulcanization"],
    established: 2008,
    verified: false,
    description: "湖北襄阳本地电力复合绝缘材料厂，配套国家电网与南网招标。",
    descriptionEn:
      "Xiangyang power composite insulation maker, supplying State Grid and CSG procurement programs.",
    certifications: ["ISO 9001", "IEC"],
    certificationsEn: ["ISO 9001", "IEC"],
  },
  {
    id: "fin-shandong-taikai-frp-pole",
    name: "山东泰开电力玻璃钢有限公司",
    nameEn: "Shandong Taikai Power Fiberglass Co., Ltd.",
    location: "山东泰安",
    locationEn: "Tai'an, Shandong, China",
    province: "山东",
    category: "manufacturer",
    products: ["玻璃钢电杆", "复合横担", "拉挤型材"],
    productsEn: ["FRP utility poles", "Composite cross-arms", "Pultruded profiles"],
    processList: ["拉挤", "缠绕"],
    processListEn: ["Pultrusion", "Filament winding"],
    established: 2006,
    verified: false,
    description: "泰开电气体系内玻璃钢电力部件厂。",
    descriptionEn:
      "FRP power-component plant within the Taikai Electric Group ecosystem.",
    certifications: ["ISO 9001", "IEC"],
    certificationsEn: ["ISO 9001", "IEC"],
  },
  {
    id: "fin-zhuzhou-times-insulation",
    name: "株洲时代电气绝缘有限公司",
    nameEn: "Zhuzhou Times Electric Insulation Co., Ltd.",
    location: "湖南株洲",
    locationEn: "Zhuzhou, Hunan, China",
    province: "湖南",
    category: "manufacturer",
    products: ["复合芯棒", "电机绝缘材料", "高压绝缘复材"],
    productsEn: ["Composite rod cores", "Motor insulation materials", "HV insulation composites"],
    processList: ["拉挤", "浸胶"],
    processListEn: ["Pultrusion", "Resin impregnation"],
    established: 2003,
    verified: false,
    description: "株洲中车系电气绝缘材料厂，配套高压电机与轨交动车组。",
    descriptionEn:
      "CRRC-affiliated Zhuzhou electrical insulation plant, supplying HV motors and EMU rolling stock.",
    certifications: ["ISO 9001", "IRIS"],
    certificationsEn: ["ISO 9001", "IRIS"],
  },
  {
    id: "fin-shanghai-shuhai-insulator",
    name: "上海曙海电力复合绝缘子有限公司",
    nameEn: "Shanghai Shuhai Power Composite Insulator Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "manufacturer",
    products: ["复合绝缘子", "硅橡胶外套", "电力支柱绝缘子"],
    productsEn: ["Composite insulators", "Silicone rubber housings", "Power post insulators"],
    processList: ["拉挤", "硅橡胶注射"],
    processListEn: ["Pultrusion", "Silicone rubber injection"],
    established: 2009,
    verified: false,
    description: "上海本地复合绝缘子专业厂，特高压与配电网产品线齐全。",
    descriptionEn:
      "Shanghai composite insulator specialist with full UHV and distribution-network product lines.",
    certifications: ["ISO 9001", "IEC"],
    certificationsEn: ["ISO 9001", "IEC"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // C. Aerospace / rocket motor composite cases
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "fin-aerospace-hubei-4ad",
    name: "中国航天科工四院红林复材分公司",
    nameEn: "CASIC 4th Academy Honglin Composite Branch",
    location: "湖北武汉",
    locationEn: "Wuhan, Hubei, China",
    province: "湖北",
    category: "manufacturer",
    products: ["固体火箭壳体", "导弹复材结构件", "气瓶缠绕件"],
    productsEn: ["Solid rocket motor cases", "Missile composite structures", "Wound pressure vessels"],
    processList: ["碳纤维缠绕", "热压罐"],
    processListEn: ["Carbon fiber winding", "Autoclave"],
    established: 1999,
    verified: false,
    description: "中国航天科工四院在湖北武汉的复材分支，固体火箭壳体与导弹复材件配套。",
    descriptionEn:
      "Wuhan composite arm of CASIC 4th Academy; supplies solid rocket motor cases and missile composite structures.",
    certifications: ["AS9100", "ISO 9001"],
    certificationsEn: ["AS9100", "ISO 9001"],
  },
  {
    id: "fin-aerospace-shanghai-800",
    name: "上海航天技术研究院复材中心",
    nameEn: "Shanghai Aerospace Technology Research Institute Composite Center",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "manufacturer",
    products: ["运载火箭复材壳体", "卫星复材结构", "返回舱热防护件"],
    productsEn: ["Launch vehicle composite cases", "Satellite composite structures", "Reentry thermal protection"],
    processList: ["缠绕", "热压罐", "RTM"],
    processListEn: ["Winding", "Autoclave", "RTM"],
    established: 1965,
    verified: false,
    description: "中国航天八院（上海航天）下属复材中心，承担长征系列与卫星平台复材结构。",
    descriptionEn:
      "Composite center of SAST (CASC 8th Academy); supplies Long March series and satellite platform composite structures.",
    certifications: ["AS9100", "ISO 9001"],
    certificationsEn: ["AS9100", "ISO 9001"],
  },
  {
    id: "fin-aerospace-xian-rocket",
    name: "航天动力技术研究院西安复材厂",
    nameEn: "AAPM (Academy of Aerospace Propulsion Tech) Xi'an Composite Plant",
    location: "陕西西安",
    locationEn: "Xi'an, Shaanxi, China",
    province: "陕西",
    category: "manufacturer",
    products: ["固体发动机壳体", "喷管复材件", "热防护件"],
    productsEn: ["Solid motor cases", "Nozzle composite parts", "Thermal protection components"],
    processList: ["碳纤维缠绕", "C/C 复合", "热压罐"],
    processListEn: ["Carbon fiber winding", "C/C composite", "Autoclave"],
    established: 1962,
    verified: false,
    description: "中国航天科技四院（航天动力）西安复材生产线，固体火箭壳体与发动机复材主供方。",
    descriptionEn:
      "AAPM (CASC 4th Academy) Xi'an composite line; primary supplier of solid rocket cases and engine composites.",
    certifications: ["AS9100", "ISO 9001"],
    certificationsEn: ["AS9100", "ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // D. Rail-transit Tier-2 composite interior
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "fin-changzhou-tiansheng-rail",
    name: "常州天晟新材料股份有限公司",
    nameEn: "Changzhou Tiansheng New Material Co., Ltd.",
    location: "江苏常州",
    locationEn: "Changzhou, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["轨道交通内饰复材板", "高铁内顶板", "复合地板"],
    productsEn: ["Rail-transit composite interior panels", "High-speed rail ceiling panels", "Composite flooring"],
    processList: ["真空导入", "胶接夹芯"],
    processListEn: ["Vacuum infusion", "Sandwich bonding"],
    established: 2005,
    verified: false,
    description: "常州本地轨交复材内饰主力厂，A 股上市，配套中车四方/长客/株洲。",
    descriptionEn:
      "Leading Changzhou rail-interior composite plant, A-share listed; supplies CRRC Sifang/Changchun/Zhuzhou.",
    certifications: ["ISO 9001", "IRIS"],
    certificationsEn: ["ISO 9001", "IRIS"],
  },
  {
    id: "fin-jiangsu-shenfu-rail",
    name: "江苏申孚轨道交通装备有限公司",
    nameEn: "Jiangsu Shenfu Rail Transit Equipment Co., Ltd.",
    location: "江苏镇江",
    locationEn: "Zhenjiang, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["地铁车体复材件", "司机室复材头罩", "动车组配套件"],
    productsEn: ["Metro composite body parts", "Driver cab composite shells", "EMU accessories"],
    processList: ["RTM", "真空导入"],
    processListEn: ["RTM", "Vacuum infusion"],
    established: 2010,
    verified: false,
    description: "镇江本地轨道交通复材配套厂，配套中车系与城轨地铁项目。",
    descriptionEn:
      "Zhenjiang rail-transit composite supplier serving CRRC and metro project ecosystems.",
    certifications: ["IRIS", "ISO 9001"],
    certificationsEn: ["IRIS", "ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // E. Container floor / aviation cabin floor sandwich
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "fin-cimc-container-floor",
    name: "中集瑞江汽车有限公司复合地板事业部",
    nameEn: "CIMC Ruijiang Auto — Composite Flooring Division",
    location: "安徽芜湖",
    locationEn: "Wuhu, Anhui, China",
    province: "安徽",
    category: "manufacturer",
    products: ["集装箱底板", "冷藏车地板", "复合材料地板"],
    productsEn: ["Container flooring", "Reefer truck flooring", "Composite flooring"],
    processList: ["热压成型", "胶接复合"],
    processListEn: ["Hot-press molding", "Adhesive lamination"],
    established: 2002,
    verified: false,
    description: "中集集团瑞江公司复合地板业务，集装箱与冷藏车地板供应。",
    descriptionEn:
      "CIMC Ruijiang's composite flooring business — supplies container and reefer truck flooring.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-aviation-floor-jiangsu",
    name: "江苏中复神鹰航空复材地板有限公司",
    nameEn: "Jiangsu Sinoma Shenying Aviation Composite Flooring Co., Ltd.",
    location: "江苏连云港",
    locationEn: "Lianyungang, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["航空地板", "夹芯结构地板", "客舱内饰复材"],
    productsEn: ["Aviation cabin floor panels", "Sandwich-structure flooring", "Cabin interior composites"],
    processList: ["蜂窝夹芯胶接", "热压"],
    processListEn: ["Honeycomb sandwich bonding", "Hot-press"],
    established: 2018,
    verified: false,
    description: "中复神鹰航空复材子公司，C919/CR929 客舱地板国产化配套之一。",
    descriptionEn:
      "Sinoma Shenying's aviation composite subsidiary; one of the localized cabin-floor suppliers for C919/CR929.",
    certifications: ["AS9100", "ISO 9001"],
    certificationsEn: ["AS9100", "ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // F. Marine / oil & gas composite (海缆护套, FRP riser, 海工)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "fin-zhongtian-marine-cable",
    name: "中天科技海缆股份有限公司",
    nameEn: "Zhongtian Technology Submarine Cable Co., Ltd.",
    location: "江苏南通",
    locationEn: "Nantong, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["海上风电海缆", "脐带缆", "复合护套"],
    productsEn: ["Offshore wind submarine cables", "Umbilical cables", "Composite jacketing"],
    processList: ["挤出", "复合护套"],
    processListEn: ["Extrusion", "Composite jacketing"],
    established: 2003,
    verified: false,
    description: "中天科技集团海缆主力，国内海上风电海缆与脐带缆主供应商之一。",
    descriptionEn:
      "Zhongtian Tech Group's main submarine-cable arm; among the top Chinese suppliers of offshore-wind submarine cables and umbilicals.",
    certifications: ["DNV", "ISO 9001"],
    certificationsEn: ["DNV", "ISO 9001"],
  },
  {
    id: "fin-hengtong-marine",
    name: "江苏亨通海洋光网系统有限公司",
    nameEn: "Jiangsu Hengtong Marine Optical Network Co., Ltd.",
    location: "江苏苏州",
    locationEn: "Suzhou, Jiangsu, China",
    province: "江苏",
    category: "manufacturer",
    products: ["海上风电海缆", "复合海缆护套", "光电复合海缆"],
    productsEn: ["Offshore wind submarine cables", "Composite submarine jacketing", "Hybrid optoelectric cables"],
    processList: ["挤出", "复合护套"],
    processListEn: ["Extrusion", "Composite jacketing"],
    established: 2009,
    verified: false,
    description: "亨通光电海缆业务主力，海上风电场内海缆与外送海缆主要供应方。",
    descriptionEn:
      "Hengtong Optic-Electric's main submarine cable arm; major supplier of inter-array and export cables for offshore wind farms.",
    certifications: ["DNV", "ISO 9001"],
    certificationsEn: ["DNV", "ISO 9001"],
  },
  {
    id: "fin-tianjin-marine-frp-pipe",
    name: "天津海凌科复合材料海洋管道有限公司",
    nameEn: "Tianjin Hailingke Marine Composite Pipe Co., Ltd.",
    location: "天津",
    locationEn: "Tianjin, China",
    province: "天津",
    category: "manufacturer",
    products: ["FRP 海洋立管", "海工管道", "深水复材管"],
    productsEn: ["FRP marine risers", "Offshore piping", "Deepwater composite pipes"],
    processList: ["缠绕", "热成型"],
    processListEn: ["Filament winding", "Thermo-forming"],
    established: 2014,
    verified: false,
    description: "天津本地海洋复合材料管道厂，配套渤海/南海海工平台。",
    descriptionEn:
      "Tianjin marine composite pipe maker, supplying Bohai and South China Sea offshore platforms.",
    certifications: ["DNV", "ISO 9001"],
    certificationsEn: ["DNV", "ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // G. Thermoplastic composite (LFT / CFRT) specialty
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "ad-jiangsu-cfrt-thermoplastic",
    name: "江苏奇科技股份有限公司热塑复材事业部",
    nameEn: "Jiangsu Qi Technology — Thermoplastic Composite Division",
    location: "江苏宿迁",
    locationEn: "Suqian, Jiangsu, China",
    province: "江苏",
    category: "additive",
    products: ["CFRT 单向带", "热塑预浸带", "热塑复材片材"],
    productsEn: ["CFRT unidirectional tape", "Thermoplastic prepreg tape", "Thermoplastic composite sheet"],
    processList: ["熔融浸渍", "压延"],
    processListEn: ["Melt impregnation", "Calendering"],
    established: 2014,
    verified: false,
    description: "国内热塑性单向带与片材代表企业，配套体育/汽车轻量化客户。",
    descriptionEn:
      "Major Chinese thermoplastic UD tape and sheet maker, supplying sporting goods and automotive lightweighting customers.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "ad-hangzhou-lft-pp",
    name: "杭州本松新材料技术股份有限公司",
    nameEn: "Hangzhou Bensong New Material Technology Co., Ltd.",
    location: "浙江杭州",
    locationEn: "Hangzhou, Zhejiang, China",
    province: "浙江",
    category: "additive",
    products: ["长玻纤增强 PP", "GF/PA 增强料", "工程塑料合金"],
    productsEn: ["Long-glass-fiber PP", "GF/PA reinforced compounds", "Engineering plastic alloys"],
    processList: ["双螺杆挤出", "拉挤浸渍"],
    processListEn: ["Twin-screw extrusion", "Pultrusion impregnation"],
    established: 2002,
    verified: false,
    description: "杭州本松，国内长玻纤增强热塑性塑料代表企业，A 股上市。",
    descriptionEn:
      "Hangzhou Bensong — major Chinese LFT (long-glass-fiber thermoplastic) maker, A-share listed.",
    certifications: ["IATF 16949", "ISO 9001"],
    certificationsEn: ["IATF 16949", "ISO 9001"],
  },
  {
    id: "ad-shanghai-thermoplastic-pa",
    name: "上海普利特复合材料股份有限公司",
    nameEn: "Shanghai Pret Composites Co., Ltd.",
    location: "上海",
    locationEn: "Shanghai, China",
    province: "上海",
    category: "additive",
    products: ["改性塑料", "玻纤增强 PA66/PA6", "矿物增强复合料"],
    productsEn: ["Modified plastics", "GF-reinforced PA66/PA6", "Mineral-reinforced compounds"],
    processList: ["挤出", "复配"],
    processListEn: ["Extrusion", "Compounding"],
    established: 1993,
    verified: false,
    description: "上海普利特，国内改性塑料与玻纤增强工程塑料龙头企业，A 股上市。",
    descriptionEn:
      "Shanghai Pret — leading Chinese modified plastics and GF-reinforced engineering plastics maker, A-share listed.",
    certifications: ["IATF 16949", "ISO 9001"],
    certificationsEn: ["IATF 16949", "ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // H. Additional storage tank / piping SMEs (regional gaps)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "fin-anhui-wuhu-frp-tank",
    name: "安徽芜湖鑫盛玻璃钢有限公司",
    nameEn: "Anhui Wuhu Xinsheng Fiberglass Co., Ltd.",
    location: "安徽芜湖",
    locationEn: "Wuhu, Anhui, China",
    province: "安徽",
    category: "manufacturer",
    products: ["玻璃钢储罐", "玻璃钢管道", "FRP 通风管"],
    productsEn: ["FRP storage tanks", "FRP pipes", "FRP ventilation ducts"],
    processList: ["缠绕", "手糊"],
    processListEn: ["Filament winding", "Hand layup"],
    established: 2003,
    verified: false,
    description: "芜湖本地玻璃钢制品厂，化工与水务配套。",
    descriptionEn:
      "Wuhu FRP products plant supplying chemical and water-utility industries.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-jiangxi-nanchang-frp",
    name: "江西南昌福鸿玻璃钢有限公司",
    nameEn: "Jiangxi Nanchang Fuhong Fiberglass Co., Ltd.",
    location: "江西南昌",
    locationEn: "Nanchang, Jiangxi, China",
    province: "江西",
    category: "manufacturer",
    products: ["玻璃钢冷却塔", "玻璃钢储罐", "玻璃钢制品"],
    productsEn: ["FRP cooling towers", "FRP storage tanks", "FRP products"],
    processList: ["手糊", "缠绕"],
    processListEn: ["Hand layup", "Filament winding"],
    established: 2005,
    verified: false,
    description: "南昌本地玻璃钢制品厂，电力冷却塔与化工设备配套。",
    descriptionEn:
      "Nanchang FRP products plant, supplying power-industry cooling towers and chemical equipment.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-fujian-zhangzhou-frp",
    name: "福建漳州海泰复合材料有限公司",
    nameEn: "Fujian Zhangzhou Haitai Composite Materials Co., Ltd.",
    location: "福建漳州",
    locationEn: "Zhangzhou, Fujian, China",
    province: "福建",
    category: "manufacturer",
    products: ["玻璃钢渔船", "玻璃钢化粪池", "玻璃钢制品"],
    productsEn: ["FRP fishing boats", "FRP septic tanks", "FRP products"],
    processList: ["手糊", "缠绕"],
    processListEn: ["Hand layup", "Filament winding"],
    established: 2002,
    verified: false,
    description: "漳州本地综合性玻璃钢制品厂，南方沿海渔业与市政配套。",
    descriptionEn:
      "Comprehensive Zhangzhou FRP products plant, supplying southern coastal fishery and municipal markets.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-guangxi-frp-tank-extra",
    name: "广西柳州玻璃钢储罐有限公司",
    nameEn: "Guangxi Liuzhou Fiberglass Storage Tank Co., Ltd.",
    location: "广西柳州",
    locationEn: "Liuzhou, Guangxi, China",
    province: "广西",
    category: "manufacturer",
    products: ["玻璃钢储罐", "缠绕管道", "FRP 防腐设备"],
    productsEn: ["FRP storage tanks", "Filament-wound pipes", "FRP anti-corrosion equipment"],
    processList: ["缠绕"],
    processListEn: ["Filament winding"],
    established: 2010,
    verified: false,
    description: "柳州本地玻璃钢储罐与管道厂，西南化工与糖业项目配套。",
    descriptionEn:
      "Liuzhou FRP tank and pipe maker, supplying southwest chemical and sugar-industry projects.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-yunnan-frp-tank",
    name: "云南昆明南环玻璃钢有限公司",
    nameEn: "Yunnan Kunming Nanhuan Fiberglass Co., Ltd.",
    location: "云南昆明",
    locationEn: "Kunming, Yunnan, China",
    province: "云南",
    category: "manufacturer",
    products: ["玻璃钢冷却塔", "玻璃钢储罐", "玻璃钢管道"],
    productsEn: ["FRP cooling towers", "FRP storage tanks", "FRP pipes"],
    processList: ["手糊", "缠绕"],
    processListEn: ["Hand layup", "Filament winding"],
    established: 2007,
    verified: false,
    description: "昆明本地玻璃钢制品厂，西南磷化工与电力项目配套。",
    descriptionEn:
      "Kunming FRP products plant, supplying southwest phosphate-chemical and power-industry projects.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fin-hainan-frp-equipment",
    name: "海南海纳玻璃钢制品有限公司",
    nameEn: "Hainan Haina Fiberglass Products Co., Ltd.",
    location: "海南海口",
    locationEn: "Haikou, Hainan, China",
    province: "海南",
    category: "manufacturer",
    products: ["玻璃钢化粪池", "玻璃钢管道", "玻璃钢制品"],
    productsEn: ["FRP septic tanks", "FRP pipes", "FRP products"],
    processList: ["手糊", "缠绕"],
    processListEn: ["Hand layup", "Filament winding"],
    established: 2008,
    verified: false,
    description: "海南本地玻璃钢制品厂，市政与建筑配套。",
    descriptionEn:
      "Hainan FRP products plant supplying municipal and construction markets.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // I. Specialty fibers and add-ons (regional gaps)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "bf-hebei-cangzhou-basalt",
    name: "河北沧州天科玄武岩纤维有限公司",
    nameEn: "Hebei Cangzhou Tianke Basalt Fiber Co., Ltd.",
    location: "河北沧州",
    locationEn: "Cangzhou, Hebei, China",
    province: "河北",
    category: "fiber",
    products: ["玄武岩连续纤维", "玄武岩短切", "复合筋材"],
    productsEn: ["Continuous basalt fiber", "Chopped basalt", "Composite rebar"],
    processList: ["拉丝", "短切"],
    processListEn: ["Fiber drawing", "Chopping"],
    established: 2014,
    verified: false,
    description: "河北沧州本地玄武岩纤维厂，配套华北基建增强复材市场。",
    descriptionEn:
      "Hebei Cangzhou basalt fiber maker, supplying north-China infrastructure-reinforcement composites.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "bf-fujian-basalt-quanzhou",
    name: "福建鸿星玄武岩纤维有限公司",
    nameEn: "Fujian Hongxing Basalt Fiber Co., Ltd.",
    location: "福建泉州",
    locationEn: "Quanzhou, Fujian, China",
    province: "福建",
    category: "fiber",
    products: ["玄武岩连续纤维", "玄武岩布", "玄武岩复合筋"],
    productsEn: ["Continuous basalt fiber", "Basalt fabric", "Basalt composite rebar"],
    processList: ["拉丝", "纺织"],
    processListEn: ["Fiber drawing", "Weaving"],
    established: 2015,
    verified: false,
    description: "泉州本地玄武岩纤维厂，配套东南沿海基建与港工项目。",
    descriptionEn:
      "Quanzhou basalt fiber maker, supplying southeast-coastal infrastructure and port-engineering projects.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "fb-zhejiang-prepreg-fiber",
    name: "浙江远景达复合材料有限公司",
    nameEn: "Zhejiang Yuanjingda Composite Materials Co., Ltd.",
    location: "浙江湖州",
    locationEn: "Huzhou, Zhejiang, China",
    province: "浙江",
    category: "fiber",
    products: ["玻纤多轴布", "夹层增强毡", "风电叶片增强布"],
    productsEn: ["Multi-axial glass fabric", "Sandwich reinforcement mat", "Wind blade reinforcement fabric"],
    processList: ["缝编", "纺织"],
    processListEn: ["Stitch-bonding", "Weaving"],
    established: 2010,
    verified: false,
    description: "湖州本地玻纤多轴布厂，配套华东风电叶片厂。",
    descriptionEn:
      "Huzhou multi-axial glass fabric plant, supplying east-China wind blade plants.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // J. Equipment & mold additional
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "eq-sichuan-cnc-cf",
    name: "四川绵阳锐宏复材数控装备有限公司",
    nameEn: "Sichuan Mianyang Ruihong Composite CNC Equipment Co., Ltd.",
    location: "四川绵阳",
    locationEn: "Mianyang, Sichuan, China",
    province: "四川",
    category: "equipment",
    products: ["复材专用 CNC", "热压机", "复材切割设备"],
    productsEn: ["Composite-specific CNC", "Hot-press machines", "Composite cutting equipment"],
    processList: ["设备制造"],
    processListEn: ["Equipment manufacturing"],
    established: 2013,
    verified: false,
    description: "绵阳本地复材数控装备厂，国防与航空航天配套较多。",
    descriptionEn:
      "Mianyang composite CNC equipment maker primarily serving defense and aerospace customers.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "eq-tianjin-resin-injection",
    name: "天津金鸿复合材料注射成型设备有限公司",
    nameEn: "Tianjin Jinhong Composite Resin Injection Equipment Co., Ltd.",
    location: "天津",
    locationEn: "Tianjin, China",
    province: "天津",
    category: "equipment",
    products: ["RTM 注射机", "树脂混合机", "高压注射设备"],
    productsEn: ["RTM injection machines", "Resin mixers", "HP injection equipment"],
    processList: ["设备制造"],
    processListEn: ["Equipment manufacturing"],
    established: 2008,
    verified: false,
    description: "天津本地 RTM 设备厂，配套北方汽车与航空 RTM 客户。",
    descriptionEn:
      "Tianjin RTM equipment maker supplying north-China automotive and aerospace RTM customers.",
    certifications: ["ISO 9001"],
    certificationsEn: ["ISO 9001"],
  },
  {
    id: "md-jiangsu-rocket-mold",
    name: "江苏华翔精密航天模具有限公司",
    nameEn: "Jiangsu Huaxiang Precision Aerospace Mold Co., Ltd.",
    location: "江苏南通",
    locationEn: "Nantong, Jiangsu, China",
    province: "江苏",
    category: "mold",
    products: ["航天 INVAR 模具", "复材结构件模具", "热压罐模具"],
    productsEn: ["Aerospace INVAR molds", "Composite structural molds", "Autoclave molds"],
    processList: ["数控加工", "INVAR 钢模"],
    processListEn: ["CNC machining", "INVAR steel molds"],
    established: 2011,
    verified: false,
    description: "南通本地精密航天模具厂，配套航天科技/科工系统 INVAR 模具需求。",
    descriptionEn:
      "Nantong precision aerospace mold shop, supplying CASC/CASIC INVAR mold demand.",
    certifications: ["AS9100"],
    certificationsEn: ["AS9100"],
  },
  {
    id: "md-shaanxi-cmc-mold",
    name: "陕西西安瑞航复材高温模具有限公司",
    nameEn: "Shaanxi Xi'an Ruihang Composite High-Temperature Mold Co., Ltd.",
    location: "陕西西安",
    locationEn: "Xi'an, Shaanxi, China",
    province: "陕西",
    category: "mold",
    products: ["陶瓷基复材模具", "石墨工装", "高温复材模具"],
    productsEn: ["CMC molds", "Graphite tooling", "High-temperature composite molds"],
    processList: ["数控加工", "石墨加工"],
    processListEn: ["CNC machining", "Graphite machining"],
    established: 2014,
    verified: false,
    description: "西安本地高温复材专用模具厂，CMC 与碳/碳工装制造。",
    descriptionEn:
      "Xi'an high-temperature composite mold shop, fabricating CMC and C/C tooling.",
    certifications: ["AS9100"],
    certificationsEn: ["AS9100"],
  },
];

async function main() {
  console.log(`Seeding ${entries.length} v6 supply-chain entries…`);
  let inserted = 0;
  let updated = 0;

  for (const e of entries) {
    const existing = await db.query.supplierListings?.findFirst?.({
      where: (t, { eq }) => eq(t.id, e.id),
    });
    await db
      .insert(supplierListings)
      .values(e)
      .onConflictDoUpdate({
        target: supplierListings.id,
        set: { ...e, updatedAt: new Date() },
      });
    if (existing) updated++;
    else inserted++;
    console.log(`  ✓ ${e.id}  ${e.nameEn}`);
  }

  console.log(`\nv6 seed complete. inserted=${inserted}  updated=${updated}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
