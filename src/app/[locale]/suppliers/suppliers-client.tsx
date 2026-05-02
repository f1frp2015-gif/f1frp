"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupplierClaimButton } from "@/components/supplier-claim-button";
import { ProgressiveCollapse } from "@/components/progressive-collapse";
import { provincesEn } from "@/lib/data/suppliers";
import { ExternalLink } from "lucide-react";

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
  enterpriseId: string | null;
  website: string | null;
};

type Opt = { id: string; name: string; nameEn?: string };

const ALL_REGIONS_TOKEN = "__all__";

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
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-lg"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t("typeLabel")}</span>
          <Badge
            variant={cat === "all" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setCat("all")}
          >
            {t("all")}
          </Badge>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={cat === c.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setCat(c.id)}
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
            onClick={() => setRegion(ALL_REGIONS_TOKEN)}
          >
            {t("allRegions")}
          </Badge>
          {provinces.map((p) => (
            <Badge
              key={p}
              variant={region === p ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setRegion(p)}
            >
              {isEn ? (provincesEn[p] ?? p) : p}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {t("resultCount", { filtered: filtered.length, total: suppliers.length })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {t("noResults")}
          </CardContent>
        </Card>
      ) : (
        <ProgressiveCollapse className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" pageSize={50}>
          {filtered.map((s) => (
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
        </ProgressiveCollapse>
      )}
    </>
  );
}
