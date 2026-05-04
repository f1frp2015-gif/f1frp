"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NewsItem } from "@/lib/data/news";

type Opt = { id: string; name: string; nameEn?: string };

const LABEL_ZH: Record<string, string> = {
  industry: "行业动态",
  policy: "政策法规",
  tech: "技术前沿",
  company: "企业新闻",
  expo: "展会活动",
};

const LABEL_EN: Record<string, string> = {
  industry: "Industry",
  policy: "Policy",
  tech: "Technology",
  company: "Company news",
  expo: "Expos & events",
};

export function NewsClient({
  newsList,
  categories,
}: {
  newsList: NewsItem[];
  categories: Opt[];
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const LABEL = isEn ? LABEL_EN : LABEL_ZH;
  const [cat, setCat] = useState("all");

  const filtered = useMemo(
    () => (cat === "all" ? newsList : newsList.filter((n) => n.category === cat)),
    [newsList, cat]
  );

  const catStats = useMemo(() => {
    const m: Record<string, number> = {};
    newsList.forEach((n) => {
      m[n.category] = (m[n.category] || 0) + 1;
    });
    return m;
  }, [newsList]);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge
            key={c.id}
            variant={cat === c.id ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setCat(c.id)}
          >
            {isEn ? c.nameEn ?? c.name : c.name}
            {c.id !== "all" && catStats[c.id] ? ` (${catStats[c.id]})` : ""}
          </Badge>
        ))}
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {isEn ? (
          <>
            <span className="font-bold text-foreground">{filtered.length}</span>{" "}
            items
          </>
        ) : (
          <>
            共 <span className="font-bold text-foreground">{filtered.length}</span> 条
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {isEn ? "No news in this category yet." : "该分类暂无资讯。"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((news) => (
            <Card
              key={news.id}
              className="flex flex-col transition-colors hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {LABEL[news.category] ?? news.category}
                  </Badge>
                  {news.hot && (
                    <Badge variant="destructive" className="text-xs">
                      {isEn ? "Hot" : "热门"}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base leading-snug line-clamp-2">
                  {isEn ? news.titleEn : news.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {isEn ? news.summaryEn : news.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{news.date}</span>
                  <span>{isEn ? `${news.readTimeEn} read` : `阅读 ${news.readTime}`}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
