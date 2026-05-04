export interface NewsItem {
  id: string;
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

export const newsList: NewsItem[] = [
  {
    id: "1",
    title: "2026年中国复合材料市场规模预计突破3500亿，风电和新能源汽车成主要驱动力",
    titleEn:
      "China composites market projected to exceed RMB 350 bn in 2026 — wind power and EVs lead growth",
    summary:
      "据中国复合材料工业协会最新报告，2026年国内复合材料市场将延续两位数增长态势，其中风电叶片用复合材料需求预计增长15%以上...",
    summaryEn:
      "According to the China Composites Industry Association, the domestic composites market will sustain double-digit growth through 2026, with wind blade demand alone up over 15% YoY...",
    category: "industry",
    date: "2026-04-17",
    readTime: "5分钟",
    readTimeEn: "5 min",
    hot: true,
  },
  {
    id: "2",
    title: "国家标准GB/T 31539-2026《纤维增强塑料拉挤型材》正式发布实施",
    titleEn:
      "China releases revised national standard GB/T 31539-2026 on FRP pultruded profiles",
    summary:
      "新版国标在力学性能指标、耐候性测试方法和产品分类等方面进行了全面修订，将有效规范FRP拉挤型材市场...",
    summaryEn:
      "The revised standard updates mechanical performance indices, weathering test methods, and product classification — tightening market discipline for FRP pultruded profiles...",
    category: "policy",
    date: "2026-04-16",
    readTime: "3分钟",
    readTimeEn: "3 min",
    hot: true,
  },
  {
    id: "3",
    title: "巨石集团年产30万吨高性能玻纤智能制造基地投产，全球产能跃居首位",
    titleEn:
      "Jushi commissions 300 kt/yr high-performance glass fiber smart plant — now world's largest by capacity",
    summary:
      "位于桐乡的新基地采用了全自动化的池窑拉丝生产线，单条线年产能达到8万吨，能耗降低20%...",
    summaryEn:
      "The new Tongxiang base runs fully automated tank-furnace drawing lines at 80 kt/yr each, cutting energy intensity by 20%...",
    category: "company",
    date: "2026-04-15",
    readTime: "4分钟",
    readTimeEn: "4 min",
  },
  {
    id: "4",
    title: "碳纤维复合材料在新能源汽车电池箱体中的应用取得突破性进展",
    titleEn:
      "Breakthrough: CFRP battery enclosures enter mass production for Chinese EVs",
    summary:
      "某国内车企成功将CFRP电池箱体量产上车，实现减重40%的同时通过了全部安全测试...",
    summaryEn:
      "A Chinese OEM has put a CFRP battery enclosure into series production, achieving 40% weight reduction while passing all safety tests...",
    category: "tech",
    date: "2026-04-14",
    readTime: "6分钟",
    readTimeEn: "6 min",
  },
  {
    id: "5",
    title: "第28届中国国际复合材料展览会将于9月在上海举办，规模创历史新高",
    titleEn:
      "28th China Composites Expo opens in Shanghai this September — record exhibition area",
    summary:
      "本届展览面积超过6万平方米，预计吸引800家参展企业和5万名专业观众，同期举办30余场技术论坛...",
    summaryEn:
      "Over 60,000 m² of floor space; 800 exhibitors and 50,000 trade visitors expected, with 30+ co-located technical forums...",
    category: "expo",
    date: "2026-04-13",
    readTime: "3分钟",
    readTimeEn: "3 min",
  },
  {
    id: "6",
    title: "真空导入工艺在大型风电叶片制造中的最新优化方案",
    titleEn:
      "Latest vacuum infusion optimizations for large wind blade manufacturing",
    summary:
      "通过优化导流介质布局和树脂注入策略，成功将80米级叶片的浸润时间缩短30%，孔隙率降至0.5%以下...",
    summaryEn:
      "Optimized flow-media layouts and resin-injection strategies cut infusion time by 30% on 80 m blades and pushed void content below 0.5%...",
    category: "tech",
    date: "2026-04-12",
    readTime: "7分钟",
    readTimeEn: "7 min",
  },
  {
    id: "7",
    title: "华东地区不饱和聚酯树脂价格小幅上涨，苯乙烯成本推动",
    titleEn:
      "East China UPR prices edge up on rising styrene feedstock costs",
    summary:
      "受上游苯乙烯价格波动影响，华东地区196#树脂出厂价上调200元/吨至8500元/吨...",
    summaryEn:
      "Driven by upstream styrene volatility, East China #196 UPR ex-works prices rose CNY 200/MT to CNY 8,500/MT...",
    category: "industry",
    date: "2026-04-11",
    readTime: "3分钟",
    readTimeEn: "3 min",
  },
  {
    id: "8",
    title: "工信部发布《复合材料行业绿色制造标准》征求意见稿",
    titleEn:
      "MIIT issues draft 'Green manufacturing standards for the composites industry' for consultation",
    summary:
      "标准涵盖原材料绿色采购、生产过程节能减排、废弃物回收利用等全生命周期环保要求...",
    summaryEn:
      "The draft covers green sourcing, in-process energy and emissions reduction, and end-of-life recycling — full life-cycle environmental requirements...",
    category: "policy",
    date: "2026-04-10",
    readTime: "4分钟",
    readTimeEn: "4 min",
  },
  {
    id: "9",
    title: "光伏组件边框加速\"以塑代铝\"：FRP 拉挤型材量产落地",
    titleEn:
      "Solar module frames pivot from aluminum to FRP — pultruded profiles enter mass production",
    summary:
      "头部组件厂商小批量验证完成，玻纤增强不饱和聚酯拉挤边框在成本、绝缘、耐候三项关键指标上已达铝边框替代门槛，2026 年规模化渗透率预计突破 8%...",
    summaryEn:
      "Tier-1 module makers have completed pilot validation. Glass-reinforced UPR pultruded frames now match aluminum on cost, insulation, and weathering — 2026 penetration is forecast to exceed 8%...",
    category: "industry",
    date: "2026-04-09",
    readTime: "6分钟",
    readTimeEn: "6 min",
  },
];
