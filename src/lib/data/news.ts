export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  image?: string;
  readTime: string;
  hot?: boolean;
}

export const newsCategories = [
  { id: "all", name: "全部" },
  { id: "industry", name: "行业动态" },
  { id: "policy", name: "政策法规" },
  { id: "tech", name: "技术前沿" },
  { id: "company", name: "企业新闻" },
  { id: "expo", name: "展会活动" },
];

export const newsList: NewsItem[] = [
  {
    id: "1",
    title: "2026年中国复合材料市场规模预计突破3500亿，风电和新能源汽车成主要驱动力",
    summary: "据中国复合材料工业协会最新报告，2026年国内复合材料市场将延续两位数增长态势，其中风电叶片用复合材料需求预计增长15%以上...",
    category: "industry",
    date: "2026-04-17",
    readTime: "5分钟",
    hot: true,
  },
  {
    id: "2",
    title: "国家标准GB/T 31539-2026《纤维增强塑料拉挤型材》正式发布实施",
    summary: "新版国标在力学性能指标、耐候性测试方法和产品分类等方面进行了全面修订，将有效规范FRP拉挤型材市场...",
    category: "policy",
    date: "2026-04-16",
    readTime: "3分钟",
    hot: true,
  },
  {
    id: "3",
    title: "巨石集团年产30万吨高性能玻纤智能制造基地投产，全球产能跃居首位",
    summary: "位于桐乡的新基地采用了全自动化的池窑拉丝生产线，单条线年产能达到8万吨，能耗降低20%...",
    category: "company",
    date: "2026-04-15",
    readTime: "4分钟",
  },
  {
    id: "4",
    title: "碳纤维复合材料在新能源汽车电池箱体中的应用取得突破性进展",
    summary: "某国内车企成功将CFRP电池箱体量产上车，实现减重40%的同时通过了全部安全测试...",
    category: "tech",
    date: "2026-04-14",
    readTime: "6分钟",
  },
  {
    id: "5",
    title: "第28届中国国际复合材料展览会将于9月在上海举办，规模创历史新高",
    summary: "本届展览面积超过6万平方米，预计吸引800家参展企业和5万名专业观众，同期举办30余场技术论坛...",
    category: "expo",
    date: "2026-04-13",
    readTime: "3分钟",
  },
  {
    id: "6",
    title: "真空导入工艺在大型风电叶片制造中的最新优化方案",
    summary: "通过优化导流介质布局和树脂注入策略，成功将80米级叶片的浸润时间缩短30%，孔隙率降至0.5%以下...",
    category: "tech",
    date: "2026-04-12",
    readTime: "7分钟",
  },
  {
    id: "7",
    title: "华东地区不饱和聚酯树脂价格小幅上涨，苯乙烯成本推动",
    summary: "受上游苯乙烯价格波动影响，华东地区196#树脂出厂价上调200元/吨至8500元/吨...",
    category: "industry",
    date: "2026-04-11",
    readTime: "3分钟",
  },
  {
    id: "8",
    title: "工信部发布《复合材料行业绿色制造标准》征求意见稿",
    summary: "标准涵盖原材料绿色采购、生产过程节能减排、废弃物回收利用等全生命周期环保要求...",
    category: "policy",
    date: "2026-04-10",
    readTime: "4分钟",
  },
];
