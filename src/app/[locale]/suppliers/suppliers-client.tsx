"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupplierClaimButton } from "@/components/supplier-claim-button";
import { provincesEn } from "@/lib/data/suppliers";
import { ExternalLink, ArrowRight } from "lucide-react";

export type SerializedSupplier = {
  id: string;
  name: string;
  category: string;
  location: string;
  established: number | null;
  description: string;
  products: string[];
  processList: string[];
  certifications: string[];
  verified: boolean;
  profilePublished: boolean;
  enterpriseId: string | null;
  website: string | null;
};

type Opt = { id: string; name: string; nameEn?: string };

const ALL_REGIONS_TOKEN = "__all__";
const PAGE_SIZE = 20;

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

function paginationItems(current: number, total: number): PaginationItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "end-ellipsis", total];
  if (current >= total - 3) {
    return [
      1,
      "start-ellipsis",
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }
  return [
    1,
    "start-ellipsis",
    current - 1,
    current,
    current + 1,
    "end-ellipsis",
    total,
  ];
}

export function SuppliersClient({
  suppliers,
  categories,
  provinces,
}: {
  suppliers: SerializedSupplier[];
  categories: Opt[];
  provinces: string[];
}) {
  const t = useTranslations("Suppliers");
  const locale = useLocale();
  const isEn = locale === "en";
  const optLabel = (o: Opt) => (isEn && o.nameEn ? o.nameEn : o.name);

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [region, setRegion] = useState<string>(ALL_REGIONS_TOKEN);
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      const hitSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.products.some((p) => p.toLowerCase().includes(q)) ||
        s.processList.some((p) => p.toLowerCase().includes(q));
      const hitCat = cat === "all" || s.category === cat;
      const hitRegion =
        region === ALL_REGIONS_TOKEN ||
        (s.location && s.location.includes(region));
      return hitSearch && hitCat && hitRegion;
    });
  }, [suppliers, search, cat, region]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filtered, currentPage],
  );
  const pageItems = paginationItems(currentPage, totalPages);

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const catStats = useMemo(() => {
    const m: Record<string, number> = {};
    suppliers.forEach((s) => {
      if (s.category) m[s.category] = (m[s.category] || 0) + 1;
    });
    return m;
  }, [suppliers]);

  const getCatName = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? optLabel(c) : id;
  };

  return (
    <>
      <div className="mb-6 space-y-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-lg"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t("typeLabel")}</span>
          <Badge
            variant={cat === "all" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => {
              setCat("all");
              setPage(1);
            }}
          >
            {t("all")}
          </Badge>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={cat === c.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => {
                setCat(c.id);
                setPage(1);
              }}
            >
              {optLabel(c)}
              {catStats[c.id] ? ` (${catStats[c.id]})` : ""}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t("regionLabel")}</span>
          <Badge
            variant={region === ALL_REGIONS_TOKEN ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => {
              setRegion(ALL_REGIONS_TOKEN);
              setPage(1);
            }}
          >
            {t("allRegions")}
          </Badge>
          {provinces.map((p) => (
            <Badge
              key={p}
              variant={region === p ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => {
                setRegion(p);
                setPage(1);
              }}
            >
              {isEn ? (provincesEn[p] ?? p) : p}
            </Badge>
          ))}
        </div>
      </div>

      <div
        ref={listTopRef}
        className="mb-4 scroll-mt-20 text-sm text-muted-foreground"
      >
        {t("resultCount", { filtered: filtered.length, total: suppliers.length })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {t("noResults")}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((s) => (
              <Card
                key={s.id}
                id={s.id}
                className="flex flex-col transition-colors hover:border-primary/50"
              >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  {s.verified && (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-green-500 text-[10px] text-green-600"
                    >
                      {t("verified")}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {getCatName(s.category)}
                  </Badge>
                  <span>{s.location}</span>
                  {s.established && (
                    <>
                      <span>·</span>
                      <span>{t("established", { year: s.established })}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {s.description && (
                  <p className="text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}

                {s.products.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {t("products")}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.products.map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {s.processList.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {t("processes")}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.processList.map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {s.certifications.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {t("certifications")}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.certifications.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="border-amber-400 text-[10px] text-amber-600"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink size={12} />
                    {s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}

                {isEn && s.profilePublished && (
                  <a
                    href={`/suppliers/${encodeURIComponent(s.id)}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                  >
                    {s.verified ? "View verified company profile" : "View public company profile"}
                    <ArrowRight size={12} />
                  </a>
                )}

                {(s.enterpriseId || !isEn) && (
                  <div className="flex items-center justify-between border-t pt-3">
                    {s.enterpriseId ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("claimed")}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {t("areYouOwner")}
                      </span>
                    )}
                    {!s.enterpriseId && !isEn && (
                      <SupplierClaimButton
                        supplierId={s.id}
                        supplierName={s.name}
                      />
                    )}
                  </div>
                )}
              </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label={t("paginationLabel")}
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => changePage(currentPage - 1)}
              >
                {t("previousPage")}
              </Button>

              {pageItems.map((item) =>
                typeof item === "number" ? (
                  <Button
                    key={item}
                    type="button"
                    variant={item === currentPage ? "default" : "outline"}
                    size="sm"
                    aria-current={item === currentPage ? "page" : undefined}
                    aria-label={t("pageStatus", {
                      page: item,
                      total: totalPages,
                    })}
                    onClick={() => changePage(item)}
                    className="min-w-9"
                  >
                    {item}
                  </Button>
                ) : (
                  <span
                    key={item}
                    aria-hidden="true"
                    className="px-1 text-sm text-muted-foreground"
                  >
                    …
                  </span>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => changePage(currentPage + 1)}
              >
                {t("nextPage")}
              </Button>

              <span className="ml-1 text-xs text-muted-foreground">
                {t("pageStatus", {
                  page: currentPage,
                  total: totalPages,
                })}
              </span>
            </nav>
          )}
        </>
      )}
    </>
  );
}
