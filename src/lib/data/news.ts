export interface NewsItem {
  id: string;
  // Stable slug (matches the row already published in the DB). Keep this fixed
  // even when the title changes, so re-seeds update in place instead of
  // creating a new row + 404'ing the old URL. See scripts/seed-from-static.ts.
  slug: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  category: string;
  date: string;
  image?: string;
  readTime: string;
  readTimeEn: string;
  hot?: boolean;
}

export const newsCategories = [
  { id: "all", name: "全部", nameEn: "All" },
  { id: "industry", name: "行业动态", nameEn: "Industry" },
  { id: "policy", name: "政策法规", nameEn: "Policy" },
  { id: "tech", name: "技术前沿", nameEn: "Technology" },
  { id: "company", name: "企业新闻", nameEn: "Company news" },
  { id: "expo", name: "展会活动", nameEn: "Expos & events" },
];

// 2026-06-16: titles/summaries/bodies fact-checked against public sources and
// rewritten to remove fabricated figures (see article-bodies.ts header). Slugs
// were migrated to clean ASCII (the old fabricated-text slugs 301-redirect to
// these in next.config.ts). seed-from-static.ts keys off this slug.
export const newsList: NewsItem[] = [
  {
    id: "1",
    slug: "china-composites-output-2023-wind-ev",
    title: "中国复合材料产量稳步增长，风电与新能源汽车是主要拉动力",
    titleEn:
      "China's composites output keeps growing — wind power and EVs lead demand",
    summary:
      "据中国玻璃纤维工业协会数据，2023 年我国玻纤增强复合材料制品产量约 672 万吨、玻纤纱约 570 万吨，风电与新能源汽车等高端应用是主要增量来源。",
    summaryEn:
      "Per the China Fiberglass Industry Association, 2023 output of glass-fiber composite products was ~6.72 Mt and fiber yarn ~5.7 Mt, with wind power and EVs the main sources of incremental demand.",
    category: "industry",
    date: "2026-04-17",
    readTime: "5分钟",
    readTimeEn: "5 min",
    hot: true,
  },
  {
    id: "2",
    slug: "gb-t-31539-2015-frp-pultruded-profiles",
    title: "拉挤型材的现行国标是哪一部？GB/T 31539-2015 仍是验收依据",
    titleEn:
      "Which national standard governs FRP pultruded profiles? GB/T 31539-2015 remains in force",
    summary:
      "结构用纤维增强复合材料拉挤型材的现行国家标准为 GB/T 31539-2015《结构用纤维增强复合材料拉挤型材》，2015 年发布、2016 年 2 月实施，是采购与验收的基本依据。",
    summaryEn:
      "The current national standard for structural FRP pultruded profiles is GB/T 31539-2015, issued in 2015 and effective Feb 2016 — the baseline for procurement and acceptance.",
    category: "policy",
    date: "2026-04-16",
    readTime: "4分钟",
    readTimeEn: "4 min",
    hot: true,
  },
  {
    id: "3",
    slug: "china-jushi-glass-fiber-leader",
    title: "中国巨石：全球玻纤龙头的产能与智能制造版图",
    titleEn:
      "China Jushi: capacity and smart-manufacturing footprint of the world's top glass-fiber maker",
    summary:
      "中国巨石自 2008 年起即为全球产能最大的玻璃纤维生产商；2024 年粗纱及制品销量约 302.5 万吨创历史新高，玻纤纱在运行产能升至约 263.6 万吨/年。",
    summaryEn:
      "China Jushi has been the world's largest glass-fiber producer since 2008; 2024 roving sales hit a record ~3.03 Mt and running yarn capacity rose to ~2.64 Mt/yr.",
    category: "company",
    date: "2026-04-15",
    readTime: "4分钟",
    readTimeEn: "4 min",
  },
  {
    id: "4",
    slug: "composite-battery-enclosure-smc",
    title: "复合材料电池箱体盖板进入规模化应用：SMC 是主流，CFRP 用于高端",
    titleEn:
      "Composite battery enclosure covers go mainstream — SMC leads, CFRP for high-end",
    summary:
      "国内多家车企已在量产车型上采用 SMC 复合材料电池包上/下盖，较金属件减重约 15%~38%；碳纤维方案多用于高端或特定结构件。",
    summaryEn:
      "Several Chinese automakers now use SMC composite battery enclosure covers in series production, cutting weight ~15–38% vs metal; CFRP is reserved for high-end or specific parts.",
    category: "tech",
    date: "2026-04-14",
    readTime: "6分钟",
    readTimeEn: "6 min",
  },
  {
    id: "5",
    slug: "cce-2026-shanghai-composites-expo",
    title: "第 29 届中国国际复合材料工业技术展览会 9 月在上海举办",
    titleEn:
      "29th China Composites Expo (CCE) opens in Shanghai this September",
    summary:
      "据主办方信息，第 29 届中国国际复合材料工业技术展览会(CCE)将于 2026 年 9 月 1—3 日在国家会展中心(上海)举办，规划展览面积约 10 万平方米。",
    summaryEn:
      "Per the organizer, the 29th China International Composites Industry Technical Expo (CCE) runs Sept 1–3, 2026 at NECC Shanghai, with ~100,000 m² of planned floor space.",
    category: "expo",
    date: "2026-04-13",
    readTime: "3分钟",
    readTimeEn: "3 min",
  },
  {
    id: "6",
    slug: "vacuum-infusion-large-wind-blades",
    title: "真空灌注仍是大型风电叶片主流工艺，百米级叶片推动工艺升级",
    titleEn:
      "Vacuum infusion remains the mainstream process for large wind blades as blades pass 100 m",
    summary:
      "随着叶片向百米级发展（国内最长已达 123 米），真空灌注成为大型叶片主流成型工艺，一体在线灌注等新方案进一步降低缺陷率与树脂消耗。",
    summaryEn:
      "As blades pass 100 m (China's longest now 123 m), vacuum infusion is the mainstream process for large blades, with integrated in-line infusion further cutting defects and resin use.",
    category: "tech",
    date: "2026-04-12",
    readTime: "6分钟",
    readTimeEn: "6 min",
  },
  {
    id: "7",
    slug: "upr-resin-price-styrene-demand",
    title: "不饱和聚酯树脂价格怎么看？盯住苯乙烯成本与需求两端",
    titleEn: "Reading UPR resin prices — watch styrene costs and demand",
    summary:
      "通用型不饱和聚酯树脂价格主要随苯乙烯波动；2026 年初华东苯乙烯在万元/吨级别，而 2025 年下半年以来树脂行业需求偏弱、开工率约五成。",
    summaryEn:
      "General-purpose UPR prices track styrene; East China styrene was around RMB 10,000/t in early 2026, while resin demand has been weak with ~50% operating rates since H2 2025.",
    category: "industry",
    date: "2026-04-11",
    readTime: "4分钟",
    readTimeEn: "4 min",
  },
  {
    id: "8",
    slug: "composites-green-manufacturing-policy",
    title: "复合材料企业如何对接“绿色制造”政策框架",
    titleEn: "How composites makers fit into China's green-manufacturing framework",
    summary:
      "我国绿色制造以绿色工厂、绿色设计产品、绿色工业园区、绿色供应链为主干，依据《绿色工厂评价通则》(GB/T 36132-2018)等评价；目前尚无复材专属的单一“绿色制造标准”。",
    summaryEn:
      "China's green-manufacturing system is built on green factories, products, parks and supply chains, assessed under GB/T 36132-2018; there is no single composites-specific 'green manufacturing standard'.",
    category: "policy",
    date: "2026-04-10",
    readTime: "4分钟",
    readTimeEn: "4 min",
  },
  {
    id: "9",
    slug: "composite-pv-frames-pu-pultrusion",
    title: "光伏边框“以塑代铝”提速：玻纤增强聚氨酯拉挤边框进入放量期",
    titleEn:
      "Solar frames shift from aluminum to composites — glass/PU pultruded frames enter ramp-up",
    summary:
      "复合材料光伏边框以玻纤增强聚氨酯拉挤为主流路线，2024—2025 年被业界视为量产期；机构预计 2025 年渗透率可达双位数，但实际取决于铝价与产能爬坡。",
    summaryEn:
      "Composite PV frames are led by glass-fiber/polyurethane pultrusion, with 2024–2025 seen as the mass-production window; analysts project double-digit penetration by 2025, subject to aluminum prices and capacity ramp.",
    category: "industry",
    date: "2026-04-09",
    readTime: "6分钟",
    readTimeEn: "6 min",
  },
];
