"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CurationNotice } from "@/components/curation-notice";

export type SerializedPaper = {
  id: string;
  title: string;
  titleEn: string;
  authors: string[];
  affiliation: string;
  journal: string;
  year: number | null;
  doi: string;
  abstract: string;
  keywords: string[];
  category: string;
  language: "zh" | "en" | null;
  citationCount: number;
  sourceUrl: string;
};

type CategoryOption = { id: string; name: string; nameEn?: string };

export function PapersClient({
  papers,
  categories,
}: {
  papers: SerializedPaper[];
  categories: CategoryOption[];
}) {
  const t = useTranslations("Papers");
  const locale = useLocale();
  const isEn = locale === "en";
  const catLabel = (c: CategoryOption) => (isEn && c.nameEn ? c.nameEn : c.name);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [activeLang, setActiveLang] = useState<"all" | "zh" | "en">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) => {
      const hitSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.authors.some((a) => a.toLowerCase().includes(q)) ||
        (p.journal ?? "").toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q));
      const hitCat = activeCat === "all" || p.category === activeCat;
      const hitLang = activeLang === "all" || p.language === activeLang;
      return hitSearch && hitCat && hitLang;
    });
  }, [papers, search, activeCat, activeLang]);

  const catStats = useMemo(() => {
    const m: Record<string, number> = {};
    papers.forEach((p) => {
      if (p.category) m[p.category] = (m[p.category] || 0) + 1;
    });
    return m;
  }, [papers]);

  const stats = useMemo(() => {
    const cats = new Set(papers.map((p) => p.category).filter(Boolean));
    const zhCount = papers.filter((p) => p.language === "zh").length;
    const years = papers
      .map((p) => p.year)
      .filter((y): y is number => typeof y === "number" && y > 0);
    return {
      total: papers.length,
      categories: cats.size,
      zh: zhCount,
      latestYear: years.length ? Math.max(...years) : null,
    };
  }, [papers]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.total.toLocaleString()}</div><div className="mt-1 text-xs text-muted-foreground">{t("statTotal")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.categories}</div><div className="mt-1 text-xs text-muted-foreground">{t("statCategories")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.zh}</div><div className="mt-1 text-xs text-muted-foreground">{t("statChinese")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.latestYear ?? "—"}</div><div className="mt-1 text-xs text-muted-foreground">{t("statLatestYear")}</div></CardContent></Card>
      </div>

      <div className="mb-6 space-y-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-lg"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">
            {t("filterDirection")}
          </span>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={activeCat === c.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setActiveCat(c.id)}
            >
              {catLabel(c)}
              {c.id !== "all" && catStats[c.id] ? ` (${catStats[c.id]})` : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">
            {t("filterLang")}
          </span>
          {[
            { id: "all", name: t("langAll") },
            { id: "zh", name: t("langZh") },
            { id: "en", name: t("langEn") },
          ].map((l) => (
            <Badge
              key={l.id}
              variant={activeLang === l.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() =>
                setActiveLang(l.id as "all" | "zh" | "en")
              }
            >
              {l.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {t.rich("resultCount", {
          count: filtered.length,
          total: papers.length,
          b: (chunks) => <b className="text-foreground">{chunks}</b>,
        })}
      </div>

      <div className="grid gap-4">
        {filtered.map((p) => (
          <Link key={p.id} href={`/papers/${encodeURIComponent(p.id)}` as never} className="block">
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.category && (
                    <Badge variant="secondary" className="text-[10px]">
                      {(() => {
                        const c = categories.find((x) => x.id === p.category);
                        return c ? catLabel(c) : p.category;
                      })()}
                    </Badge>
                  )}
                  {p.language && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.language === "zh" ? t("langZh") : "EN"}
                    </Badge>
                  )}
                  {p.year && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.year}
                    </Badge>
                  )}
                  {p.citationCount > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("cited", { count: p.citationCount.toLocaleString() })}
                    </Badge>
                  )}
                </div>
                <h2 className="mt-2 text-base font-semibold leading-snug">
                  {isEn && p.titleEn ? p.titleEn : p.title}
                </h2>
                {((isEn && p.titleEn && p.title !== p.titleEn) || (!isEn && p.titleEn)) && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {isEn ? p.title : p.titleEn}
                  </p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.authors.join(", ")}
                  {p.journal ? ` · ${p.journal}` : ""}
                  {p.year ? ` · ${p.year}` : ""}
                </div>
                {p.abstract && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">
                    {p.abstract}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {t("noResults")}
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-10" />
      <CurationNotice scope={t("h1")} />
    </div>
  );
}
