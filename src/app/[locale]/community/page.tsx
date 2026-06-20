import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/community"),
  };
}

type L = { zh: string; en: string };
const tr = (v: L, locale: string) => (locale === "en" ? v.en : v.zh);

const questions: Array<{
  id: string;
  title: L;
  author: L;
  answers: number;
  views: number;
  category: L;
  date: string;
  hot: boolean;
}> = [
  {
    id: "q1",
    title: { zh: "真空导入时树脂流速太慢，如何优化导流介质布局？", en: "Vacuum infusion resin flows too slowly — how to optimize the flow-media layout?" },
    author: { zh: "老王玻璃钢", en: "Old Wang FRP" },
    answers: 12,
    views: 356,
    category: { zh: "工艺问题", en: "Process" },
    date: "2026-04-16",
    hot: true,
  },
  {
    id: "q2",
    title: { zh: "196#树脂做手糊制品表面发粘不固化，是什么原因？", en: "Hand layup with #196 resin — sticky, won't cure. What's wrong?" },
    author: { zh: "初学者小李", en: "Newcomer Li" },
    answers: 8,
    views: 245,
    category: { zh: "工艺问题", en: "Process" },
    date: "2026-04-15",
    hot: true,
  },
  {
    id: "q3",
    title: { zh: "碳纤维管用缠绕还是卷制工艺好？各有什么优缺点？", en: "Carbon fiber tubes — filament winding vs roll wrapping: trade-offs?" },
    author: { zh: "碳纤维工程师", en: "Carbon Fiber Engineer" },
    answers: 15,
    views: 423,
    category: { zh: "材料选型", en: "Material selection" },
    date: "2026-04-15",
    hot: false,
  },
  {
    id: "q4",
    title: { zh: "FRP格栅和钢格栅的承载力对比，有实测数据吗？", en: "FRP vs steel grating load capacity — any real test data?" },
    author: { zh: "结构设计师", en: "Structural Designer" },
    answers: 6,
    views: 189,
    category: { zh: "材料选型", en: "Material selection" },
    date: "2026-04-14",
    hot: false,
  },
  {
    id: "q5",
    title: { zh: "拉挤模具入口处经常堵料，怎么解决？", en: "Pultrusion die inlet keeps clogging — how to fix?" },
    author: { zh: "拉挤老师傅", en: "Pultrusion Veteran" },
    answers: 9,
    views: 312,
    category: { zh: "设备模具", en: "Equipment & tooling" },
    date: "2026-04-13",
    hot: false,
  },
  {
    id: "q6",
    title: { zh: "乙烯基酯树脂和不饱和聚酯树脂防腐性能差异有多大？", en: "Vinyl ester vs UPR — how big is the corrosion-resistance gap?" },
    author: { zh: "防腐工程师", en: "Corrosion Engineer" },
    answers: 11,
    views: 398,
    category: { zh: "材料选型", en: "Material selection" },
    date: "2026-04-12",
    hot: true,
  },
];

const experts: Array<{ name: L; title: L; org: L; answers: number }> = [
  {
    name: { zh: "张教授", en: "Prof. Zhang" },
    title: { zh: "复合材料力学专家", en: "Composites mechanics expert" },
    org: { zh: "哈尔滨工业大学", en: "Harbin Institute of Technology" },
    answers: 156,
  },
  {
    name: { zh: "李工", en: "Engineer Li" },
    title: { zh: "风电叶片工艺工程师", en: "Wind blade process engineer" },
    org: { zh: "某大型风电企业", en: "Major wind energy OEM" },
    answers: 243,
  },
  {
    name: { zh: "王总工", en: "Chief Engineer Wang" },
    title: { zh: "FRP防腐设计专家", en: "FRP anti-corrosion design expert" },
    org: { zh: "某化工设计院", en: "Chemical engineering institute" },
    answers: 198,
  },
  {
    name: { zh: "陈师傅", en: "Master Chen" },
    title: { zh: "缠绕成型资深技师", en: "Senior filament-winding technician" },
    org: { zh: "30年行业经验", en: "30 years industry experience" },
    answers: 312,
  },
];

const jobs: Array<{ title: L; company: L; location: L; salary: string }> = [
  {
    title: { zh: "复合材料工艺工程师", en: "Composites Process Engineer" },
    company: { zh: "某新能源汽车公司", en: "EV manufacturer" },
    location: { zh: "上海", en: "Shanghai" },
    salary: "20-35K",
  },
  {
    title: { zh: "FRP结构设计师", en: "FRP Structural Designer" },
    company: { zh: "某海工装备企业", en: "Offshore equipment company" },
    location: { zh: "青岛", en: "Qingdao" },
    salary: "15-25K",
  },
  {
    title: { zh: "拉挤车间主任", en: "Pultrusion Shop Manager" },
    company: { zh: "某型材制造企业", en: "Profile manufacturer" },
    location: { zh: "南通", en: "Nantong" },
    salary: "12-18K",
  },
];

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Community" });

  const inLanguage = locale === "en" ? "en" : "zh-CN";
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    url: `https://f1frp.com/${locale}/community`,
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: tr(q.title, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text:
          locale === "en"
            ? `Discussed in the f1frp community — ${q.answers} answers, ${q.views} views. Open the platform for full thread.`
            : `本问题由复材站社区讨论，已有 ${q.answers} 条回答，浏览量 ${q.views}。请前往平台查看详细解答。`,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={faqJsonLd} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("h1")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button>{t("postQuestion")}</Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="hot">
            <TabsList>
              <TabsTrigger value="hot">{t("tabHot")}</TabsTrigger>
              <TabsTrigger value="latest">{t("tabLatest")}</TabsTrigger>
              <TabsTrigger value="unanswered">{t("tabUnanswered")}</TabsTrigger>
            </TabsList>

            <TabsContent value="hot" className="mt-4 space-y-3">
              {questions.map((q) => (
                <Card key={q.id} className="transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {tr(q.category, locale)}
                      </Badge>
                      {q.hot && (
                        <Badge
                          variant="destructive"
                          className="text-[10px]"
                        >
                          {t("hot")}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium leading-snug">
                      {tr(q.title, locale)}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{tr(q.author, locale)}</span>
                      <span>{t("answers", { count: q.answers })}</span>
                      <span>{t("views", { count: q.views })}</span>
                      <span>{q.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="latest" className="mt-4">
              <div className="py-10 text-center text-muted-foreground">
                {t("loading")}
              </div>
            </TabsContent>

            <TabsContent value="unanswered" className="mt-4">
              <div className="py-10 text-center text-muted-foreground">
                {t("loading")}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Experts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("expertsTitle")}</CardTitle>
              <CardDescription>{t("expertsSub")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {experts.map((expert) => (
                <div
                  key={expert.name.zh}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {tr(expert.name, locale)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tr(expert.title, locale)} · {tr(expert.org, locale)}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {t("expertAnswers", { count: expert.answers })}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("jobsTitle")}</CardTitle>
              <CardDescription>{t("jobsSub")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.title.zh}
                  className="rounded-md border p-3"
                >
                  <div className="text-sm font-medium">
                    {tr(job.title, locale)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tr(job.company, locale)}</span>
                    <span>·</span>
                    <span>{tr(job.location, locale)}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-primary">
                    {job.salary}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* WeChat */}
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center">
              <MessageCircle size={28} strokeWidth={1.25} className="mx-auto text-foreground" />
              <h3 className="mt-3 font-semibold">{t("wechatTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("wechatSub")}
              </p>
              <Button variant="outline" className="mt-3" size="sm">
                {t("wechatBtn")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
