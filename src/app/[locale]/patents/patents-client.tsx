"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CurationNotice } from "@/components/curation-notice";
import { useProgressiveList } from "@/lib/hooks/use-progressive-list";

export type SerializedPatent = {
  id: string;
  title: string;
  titleEn: string;
  applicationNo: string;
  publicationNo: string;
  grantNo: string;
  applicant: string;
  inventors: string[];
  filingDate: string;
  publicationDate: string;
  grantDate: string;
  classification: string[];
  status: "pending" | "granted" | "expired" | "withdrawn";
  country: string;
  countryCode: string;
  category: string;
  abstract: string;
};

type Opt = { id: string; name: string; nameEn?: string };

export function PatentsClient({
  patents,
  categories,
  countries,
  statusLabels,
  locale,
}: {
  patents: SerializedPatent[];
  categories: Opt[];
  countries: Opt[];
  statusLabels: Record<SerializedPatent["status"], string>;
  locale: string;
}) {
  const t = useTranslations("Patents");
  const isEn = locale === "en";
  const optLabel = (o: Opt) => (isEn && o.nameEn ? o.nameEn : o.name);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [country, setCountry] = useState("all");
  const [status, setStatus] = useState<"all" | SerializedPatent["status"]>(
    "all"
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patents.filter((p) => {
      const hitSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.applicant.toLowerCase().includes(q) ||
        p.applicationNo.toLowerCase().includes(q) ||
        p.publicationNo.toLowerCase().includes(q) ||
        p.classification.some((c) => c.toLowerCase().includes(q));
      const hitCat = cat === "all" || p.category === cat;
      const hitCountry = country === "all" || p.countryCode === country;
      const hitStatus = status === "all" || p.status === status;
      return hitSearch && hitCat && hitCountry && hitStatus;
    });
  }, [patents, search, cat, country, status]);

  const { visible: visibleFiltered, remaining, expand } = useProgressiveList(filtered, 50);

  const catStats = useMemo(() => {
    const m: Record<string, number> = {};
    patents.forEach((p) => {
      if (p.category) m[p.category] = (m[p.category] || 0) + 1;
    });
    return m;
  }, [patents]);

  const countryStats = useMemo(() => {
    const m: Record<string, number> = {};
    patents.forEach((p) => {
      if (p.countryCode) m[p.countryCode] = (m[p.countryCode] || 0) + 1;
    });
    return m;
  }, [patents]);

  const statusVariant = (s: SerializedPatent["status"]) =>
    s === "granted"
      ? "default"
      : s === "pending"
        ? "secondary"
        : "outline";

  const stats = useMemo(() => {
    const granted = patents.filter((p) => p.status === "granted").length;
    const countries = new Set(patents.map((p) => p.countryCode).filter(Boolean));
    const cats = new Set(patents.map((p) => p.category).filter(Boolean));
    return {
      total: patents.length,
      granted,
      countries: countries.size,
      categories: cats.size,
    };
  }, [patents]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.total.toLocaleString()}</div><div className="mt-1 text-xs text-muted-foreground">{t("statTotal")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.granted}</div><div className="mt-1 text-xs text-muted-foreground">{t("statGranted")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.countries}</div><div className="mt-1 text-xs text-muted-foreground">{t("statCountries")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.categories}</div><div className="mt-1 text-xs text-muted-foreground">{t("statCategories")}</div></CardContent></Card>
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
              variant={cat === c.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setCat(c.id)}
            >
              {optLabel(c)}
              {c.id !== "all" && catStats[c.id] ? ` (${catStats[c.id]})` : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">
            {t("filterRegion")}
          </span>
          {countries.map((c) => (
            <Badge
              key={c.id}
              variant={country === c.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setCountry(c.id)}
            >
              {optLabel(c)}
              {c.id !== "all" && countryStats[c.id]
                ? ` (${countryStats[c.id]})`
                : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">
            {t("filterStatus")}
          </span>
          {(
            [
              { id: "all", name: t("statusAll") },
              { id: "pending", name: statusLabels.pending },
              { id: "granted", name: statusLabels.granted },
              { id: "expired", name: statusLabels.expired },
            ] as Array<{
              id: "all" | SerializedPatent["status"];
              name: string;
            }>
          ).map((s) => (
            <Badge
              key={s.id}
              variant={status === s.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-0.5 text-[10px]"
              onClick={() => setStatus(s.id)}
            >
              {s.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {t.rich("resultCount", {
          count: filtered.length,
          total: patents.length,
          b: (chunks) => <b className="text-foreground">{chunks}</b>,
        })}
      </div>

      <div className="grid gap-4">
        {visibleFiltered.map((p) => (
          <Link
            key={p.id}
            href={`/patents/${encodeURIComponent(p.id)}` as never}
            className="block"
          >
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.category && (
                    <Badge variant="secondary" className="text-[10px]">
                      {(() => {
                        const c = categories.find((x) => x.id === p.category);
                        return c ? optLabel(c) : p.category;
                      })()}
                    </Badge>
                  )}
                  {p.country && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.country}
                    </Badge>
                  )}
                  <Badge
                    variant={statusVariant(p.status)}
                    className="text-[10px]"
                  >
                    {statusLabels[p.status]}
                  </Badge>
                  {p.filingDate && (
                    <Badge variant="outline" className="text-[10px]">
                      {p.filingDate}
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
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {p.applicant && (
                    <span>
                      {t("applicant")}
                      {p.applicant}
                    </span>
                  )}
                  {p.publicationNo && (
                    <span className="font-mono">
                      {t("publicNo")}
                      {p.publicationNo}
                    </span>
                  )}
                  {p.grantNo && !p.publicationNo && (
                    <span className="font-mono">
                      {t("grantNo")}
                      {p.grantNo}
                    </span>
                  )}
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

        {remaining > 0 && (
          <div className="mt-2 flex justify-center">
            <Button variant="outline" onClick={expand}>
              展开剩余 {remaining} 条
            </Button>
          </div>
        )}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {t("noResults")}
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-10" />
      <CurationNotice scope={t("detail.curation")} />
    </div>
  );
}
