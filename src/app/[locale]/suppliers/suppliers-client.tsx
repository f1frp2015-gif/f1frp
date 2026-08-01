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
const PRODUCT_PREVIEW_LIMIT = 4;
const PROCESS_PREVIEW_LIMIT = 3;
const CERTIFICATION_PREVIEW_LIMIT = 2;
const CERTIFICATION_FILTERS = [
  { id: "iso-9001", label: "ISO 9001", pattern: /iso\s*9001/i },
  { id: "iso-14001", label: "ISO 14001", pattern: /iso\s*14001/i },
  { id: "iatf-16949", label: "IATF 16949", pattern: /iatf\s*16949/i },
  { id: "ce", label: "CE", pattern: /(^|\W)ce($|\W)/i },
  { id: "ul", label: "UL", pattern: /(^|\W)ul($|\W)/i },
] as const;

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
  const [certification, setCertification] = useState("all");
  const [profileStatus, setProfileStatus] = useState("all");
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
      const certRule = CERTIFICATION_FILTERS.find(
        (item) => item.id === certification,
      );
      const hitCertification =
        !certRule ||
        s.certifications.some((item) => certRule.pattern.test(item));
      const hitProfileStatus =
        profileStatus === "all" ||
        (profileStatus === "published" && s.profilePublished) ||
        (profileStatus === "verified" && s.verified);
      return hitSearch && hitCat && hitRegion && hitCertification && hitProfileStatus;
    });
  }, [suppliers, search, cat, region, certification, profileStatus]);

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
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            {isEn ? "Certification" : "认证"}
            <select
              value={certification}
              onChange={(event) => {
                setCertification(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal"
            >
              <option value="all">{isEn ? "Any certification" : "全部认证"}</option>
              {CERTIFICATION_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            {isEn ? "Profile status" : "档案状态"}
            <select
              value={profileStatus}
              onChange={(event) => {
                setProfileStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal"
            >
              <option value="all">{isEn ? "All records" : "全部档案"}</option>
              <option value="published">{isEn ? "Company profile available" : "有企业主页"}</option>
              <option value="verified">{isEn ? "Verified business" : "已认证企业"}</option>
            </select>
          </label>
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
                className="h-[34rem] transition-colors hover:border-primary/50"
              >
                <CardHeader className="shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="min-w-0 line-clamp-2 text-base">
                      {s.name}
                    </CardTitle>
                    {s.verified && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-green-500 text-[10px] text-green-600"
                      >
                        {t("verified")}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="max-w-full text-[10px]">
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

                <CardContent className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
                    {s.description && (
                      <p
                        title={s.description}
                        className="line-clamp-3 text-sm leading-5 text-muted-foreground"
                      >
                        {s.description}
                      </p>
                    )}

                    {s.products.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          {t("products")}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {s.products
                            .slice(0, PRODUCT_PREVIEW_LIMIT)
                            .map((product) => (
                              <Badge
                                key={product}
                                title={product}
                                variant="outline"
                                className="max-w-full truncate text-[10px]"
                              >
                                {product}
                              </Badge>
                            ))}
                          {s.products.length > PRODUCT_PREVIEW_LIMIT && (
                            <Badge
                              variant="outline"
                              aria-label={t("moreItems", {
                                count:
                                  s.products.length - PRODUCT_PREVIEW_LIMIT,
                              })}
                              title={t("moreItems", {
                                count:
                                  s.products.length - PRODUCT_PREVIEW_LIMIT,
                              })}
                              className="text-[10px]"
                            >
                              +{s.products.length - PRODUCT_PREVIEW_LIMIT}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {s.processList.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          {t("processes")}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {s.processList
                            .slice(0, PROCESS_PREVIEW_LIMIT)
                            .map((process) => (
                              <Badge
                                key={process}
                                title={process}
                                variant="secondary"
                                className="max-w-full truncate text-[10px]"
                              >
                                {process}
                              </Badge>
                            ))}
                          {s.processList.length > PROCESS_PREVIEW_LIMIT && (
                            <Badge
                              variant="secondary"
                              aria-label={t("moreItems", {
                                count:
                                  s.processList.length - PROCESS_PREVIEW_LIMIT,
                              })}
                              title={t("moreItems", {
                                count:
                                  s.processList.length - PROCESS_PREVIEW_LIMIT,
                              })}
                              className="text-[10px]"
                            >
                              +{s.processList.length - PROCESS_PREVIEW_LIMIT}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {s.certifications.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          {t("certifications")}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {s.certifications
                            .slice(0, CERTIFICATION_PREVIEW_LIMIT)
                            .map((certification) => (
                              <Badge
                                key={certification}
                                title={certification}
                                variant="outline"
                                className="max-w-full truncate border-amber-400 text-[10px] text-amber-600"
                              >
                                {certification}
                              </Badge>
                            ))}
                          {s.certifications.length >
                            CERTIFICATION_PREVIEW_LIMIT && (
                            <Badge
                              variant="outline"
                              aria-label={t("moreItems", {
                                count:
                                  s.certifications.length -
                                  CERTIFICATION_PREVIEW_LIMIT,
                              })}
                              title={t("moreItems", {
                                count:
                                  s.certifications.length -
                                  CERTIFICATION_PREVIEW_LIMIT,
                              })}
                              className="border-amber-400 text-[10px] text-amber-600"
                            >
                              +
                              {s.certifications.length -
                                CERTIFICATION_PREVIEW_LIMIT}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {(s.website ||
                    (isEn && s.profilePublished) ||
                    s.enterpriseId ||
                    !isEn) && (
                    <div className="mt-4 shrink-0 space-y-2 border-t pt-3">
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="flex min-w-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink size={12} className="shrink-0" />
                          <span className="truncate">
                            {s.website
                              .replace(/^https?:\/\//, "")
                              .replace(/\/$/, "")}
                          </span>
                        </a>
                      )}

                      {isEn && s.profilePublished && (
                        <a
                          href={`/suppliers/${encodeURIComponent(s.id)}`}
                          className="flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                        >
                          <span className="truncate">
                            {s.verified
                              ? "View verified company profile"
                              : "View public company profile"}
                          </span>
                          <ArrowRight size={12} className="shrink-0" />
                        </a>
                      )}

                      {(s.enterpriseId || !isEn) && (
                        <div className="flex items-center justify-between gap-2">
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
