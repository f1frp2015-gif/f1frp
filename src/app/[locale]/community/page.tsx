import type { Metadata } from "next";
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
import { buildAlternates } from "@/lib/seo";

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
    alternates: buildAlternates("/community", locale),
  };
}

const questions = [
  {
    id: "q1",
    title: "真空导入时树脂流速太慢，如何优化导流介质布局？",
    author: "老王玻璃钢",
    answers: 12,
    views: 356,
    category: "工艺问题",
    date: "2026-04-16",
    hot: true,
  },
  {
    id: "q2",
    title: "196#树脂做手糊制品表面发粘不固化，是什么原因？",
    author: "初学者小李",
    answers: 8,
    views: 245,
    category: "工艺问题",
    date: "2026-04-15",
    hot: true,
  },
  {
    id: "q3",
    title: "碳纤维管用缠绕还是卷制工艺好？各有什么优缺点？",
    author: "碳纤维工程师",
    answers: 15,
    views: 423,
    category: "材料选型",
    date: "2026-04-15",
    hot: false,
  },
  {
    id: "q4",
    title: "FRP格栅和钢格栅的承载力对比，有实测数据吗？",
    author: "结构设计师",
    answers: 6,
    views: 189,
    category: "材料选型",
    date: "2026-04-14",
    hot: false,
  },
  {
    id: "q5",
    title: "拉挤模具入口处经常堵料，怎么解决？",
    author: "拉挤老师傅",
    answers: 9,
    views: 312,
    category: "设备模具",
    date: "2026-04-13",
    hot: false,
  },
  {
    id: "q6",
    title: "乙烯基酯树脂和不饱和聚酯树脂防腐性能差异有多大？",
    author: "防腐工程师",
    answers: 11,
    views: 398,
    category: "材料选型",
    date: "2026-04-12",
    hot: true,
  },
];

const experts = [
  {
    name: "张教授",
    title: "复合材料力学专家",
    org: "哈尔滨工业大学",
    answers: 156,
  },
  {
    name: "李工",
    title: "风电叶片工艺工程师",
    org: "某大型风电企业",
    answers: 243,
  },
  {
    name: "王总工",
    title: "FRP防腐设计专家",
    org: "某化工设计院",
    answers: 198,
  },
  {
    name: "陈师傅",
    title: "缠绕成型资深技师",
    org: "30年行业经验",
    answers: 312,
  },
];

const jobs = [
  {
    title: "复合材料工艺工程师",
    company: "某新能源汽车公司",
    location: "上海",
    salary: "20-35K",
  },
  {
    title: "FRP结构设计师",
    company: "某海工装备企业",
    location: "青岛",
    salary: "15-25K",
  },
  {
    title: "拉挤车间主任",
    company: "某型材制造企业",
    location: "南通",
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
      name: q.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: `本问题由复材站社区讨论，已有 ${q.answers} 条回答，浏览量 ${q.views}。请前往平台查看详细解答。`,
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
                        {q.category}
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
                      {q.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{q.author}</span>
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
                  key={expert.name}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{expert.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {expert.title} · {expert.org}
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
                  key={job.title}
                  className="rounded-md border p-3"
                >
                  <div className="text-sm font-medium">{job.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{job.company}</span>
                    <span>·</span>
                    <span>{job.location}</span>
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
