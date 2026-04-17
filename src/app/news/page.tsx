import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { newsList, newsCategories } from "@/lib/data/news";
import Link from "next/link";

export const metadata: Metadata = {
  title: "资讯中心 - FRP复合材料行业新闻",
  description:
    "FRP复合材料行业最新资讯，涵盖行业动态、政策法规、技术前沿、企业新闻和展会活动。",
};

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    industry: "行业动态",
    policy: "政策法规",
    tech: "技术前沿",
    company: "企业新闻",
    expo: "展会活动",
  };
  return map[category] || category;
}

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">资讯中心</h1>
        <p className="mt-2 text-muted-foreground">
          FRP复合材料行业最新动态和深度报道
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {newsCategories.map((cat) => (
          <Badge
            key={cat.id}
            variant={cat.id === "all" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {newsList.map((news) => (
          <Card key={news.id} className="flex flex-col transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getCategoryLabel(news.category)}
                </Badge>
                {news.hot && (
                  <Badge variant="destructive" className="text-xs">
                    热门
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base leading-snug line-clamp-2">
                {news.title}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {news.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{news.date}</span>
                <span>阅读 {news.readTime}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-lg font-semibold">订阅行业资讯</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          每周精选FRP行业重要新闻、价格变动和技术文章，直达您的邮箱
        </p>
        <div className="mx-auto mt-4 flex max-w-md gap-2">
          <input
            type="email"
            placeholder="输入您的邮箱地址"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            订阅
          </Link>
        </div>
      </div>
    </div>
  );
}
