"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export type SerializedStandard = {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  country: string;
  countryCode: string;
  category: string;
  process: string[];
  year: string;
  status: "现行" | "废止" | "即将实施";
  description: string;
};

type CountryFilter = { id: string; name: string; nameEn?: string; flag?: string };

const COUNTRY_CODE: Record<string, string> = {
  all: "ALL",
  CN: "CN",
  ISO: "ISO",
  US: "US",
  EU: "EU",
  DE: "DE",
};
type CategoryOption = { id: string; name: string; nameEn?: string };
type ProcessTag = { id: string; name: string; nameEn?: string };

export function StandardsClient({
  standards,
  countryFilters,
  standardCategories,
  processTagOptions,
}: {
  standards: SerializedStandard[];
  countryFilters: CountryFilter[];
  standardCategories: CategoryOption[];
  processTagOptions: ProcessTag[];
}) {
  const t = useTranslations("Standards");
  const locale = useLocale();
  const isEn = locale === "en";
  const optLabel = (o: { name: string; nameEn?: string }) =>
    isEn && o.nameEn ? o.nameEn : o.name;
  const [search, setSearch] = useState("");
  const [activeCountry, setActiveCountry] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeProcess, setActiveProcess] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return standards.filter((s) => {
      const matchSearch =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        (s.titleEn && s.titleEn.toLowerCase().includes(q));
      const matchCountry = activeCountry === "all" || s.countryCode === activeCountry;
      const matchCategory = activeCategory === "all" || s.category === activeCategory;
      const matchProcess = activeProcess === "all" || s.process.includes(activeProcess);
      return matchSearch && matchCountry && matchCategory && matchProcess;
    });
  }, [standards, search, activeCountry, activeCategory, activeProcess]);

  const countryStats = useMemo(() => {
    const map: Record<string, number> = {};
    standards.forEach((s) => {
      if (s.countryCode) map[s.countryCode] = (map[s.countryCode] || 0) + 1;
    });
    return map;
  }, [standards]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((s) => {
      if (s.category) map[s.category] = (map[s.category] || 0) + 1;
    });
    return map;
  }, [filtered]);

  const hasFilter =
    activeCountry !== "all" ||
    activeCategory !== "all" ||
    activeProcess !== "all" ||
    search;

  const summary = useMemo(() => {
    const countries = new Set(standards.map((s) => s.countryCode).filter(Boolean));
    const cats = new Set(standards.map((s) => s.category).filter(Boolean));
    const active = standards.filter((s) => s.status === "现行").length;
    return {
      total: standards.length,
      countries: countries.size,
      categories: cats.size,
      active,
    };
  }, [standards]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{summary.total.toLocaleString()}</div><div className="mt-1 text-xs text-muted-foreground">{t("statTotal")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{summary.countries}</div><div className="mt-1 text-xs text-muted-foreground">{t("statCountries")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{summary.categories}</div><div className="mt-1 text-xs text-muted-foreground">{t("statCategories")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{summary.active}</div><div className="mt-1 text-xs text-muted-foreground">{t("statActive")}</div></CardContent></Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {countryFilters.filter((c) => c.id !== "all").map((c) => (
          <Card
            key={c.id}
            className={`cursor-pointer transition-colors hover:border-primary/50 ${activeCountry === c.id ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setActiveCountry(activeCountry === c.id ? "all" : c.id)}
          >
            <CardContent className="p-3 text-center">
              <div className="mx-auto inline-flex h-6 min-w-[40px] items-center justify-center rounded-sm border border-border bg-muted px-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                {COUNTRY_CODE[c.id] ?? c.id.toUpperCase()}
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight">{countryStats[c.id] || 0}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{optLabel(c)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 space-y-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-lg"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("filterCategory")}</span>
          {standardCategories.map((c) => (
            <Badge
              key={c.id}
              variant={activeCategory === c.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setActiveCategory(c.id)}
            >
              {optLabel(c)}
              {c.id !== "all" && categoryStats[c.id] ? ` (${categoryStats[c.id]})` : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("filterProcess")}</span>
          {processTagOptions.map((p) => (
            <Badge
              key={p.id}
              variant={activeProcess === p.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setActiveProcess(p.id)}
            >
              {optLabel(p)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t.rich("resultCount", {
            count: filtered.length,
            b: (chunks) => <b className="text-foreground">{chunks}</b>,
          })}
          {hasFilter ? ` ${t("resultFiltered", { total: standards.length })}` : ""}
        </span>
        {hasFilter && (
          <button
            onClick={() => {
              setSearch("");
              setActiveCountry("all");
              setActiveCategory("all");
              setActiveProcess("all");
            }}
            className="text-xs text-primary hover:underline"
          >
            {t("clearFilter")}
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t("colCode")}</TableHead>
                  <TableHead>{t("colTitle")}</TableHead>
                  <TableHead className="hidden md:table-cell w-[80px]">{t("colCountry")}</TableHead>
                  <TableHead className="hidden lg:table-cell w-[100px]">{t("colCategory")}</TableHead>
                  <TableHead className="hidden lg:table-cell w-[100px]">{t("colProcess")}</TableHead>
                  <TableHead className="hidden sm:table-cell w-[60px]">{t("colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((std) => (
                  <TableRow
                    key={std.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => {
                      window.location.href = `/standards/${std.id}`;
                    }}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs font-semibold">
                      <Link
                        href={`/standards/${std.id}` as "/standards/[id]"}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {std.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {isEn && std.titleEn ? std.titleEn : std.title}
                      </div>
                      {std.titleEn && std.title !== std.titleEn && (
                        <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                          {isEn ? std.title : std.titleEn}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="inline-flex h-4 items-center rounded-sm border border-border bg-muted px-1 font-mono text-[9px] tracking-[0.1em] text-muted-foreground">
                          {COUNTRY_CODE[std.countryCode] ?? std.countryCode.toUpperCase()}
                        </span>
                        {std.country}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="whitespace-nowrap text-[10px]">
                        {(() => {
                          const c = standardCategories.find((x) => x.id === std.category);
                          return c ? optLabel(c) : std.category;
                        })()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-0.5">
                        {std.process.slice(0, 2).map((p) => (
                          <Badge key={p} variant="outline" className="px-1 py-0 text-[9px]">
                            {processTagOptions.find((pt) => pt.id === p)?.name ?? p}
                          </Badge>
                        ))}
                        {std.process.length > 2 && (
                          <Badge variant="outline" className="px-1 py-0 text-[9px]">
                            +{std.process.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={std.status === "现行" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {std.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="inline-flex h-5 items-center rounded-sm border border-border bg-muted px-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">CN</div>
            <h3 className="mt-3 font-bold">{t("cnStdTitle")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.raw("cnStdDesc") as string }} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="inline-flex h-5 items-center rounded-sm border border-border bg-muted px-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">US</div>
            <h3 className="mt-3 font-bold">{t("usStdTitle")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.raw("usStdDesc") as string }} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="inline-flex h-5 items-center rounded-sm border border-border bg-muted px-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">EU</div>
            <h3 className="mt-3 font-bold">{t("euStdTitle")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.raw("euStdDesc") as string }} />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-10" />

      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-bold">{t("updateTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("updateSub")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("updateEmail")}</p>
      </div>
    </div>
  );
}
