"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Icon } from "@/components/icon";
import { useProgressiveList } from "@/lib/hooks/use-progressive-list";

export type SerializedMaterial = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  subCategory: string;
  brand: string;
  model: string;
  properties: Record<string, string>;
  applications: string[];
  description: string;
};

type Category = { id: string; name: string; nameEn?: string; iconKey: string; count?: number };

const PROP_KEYS = [
  "density",
  "tensileStrength",
  "flexuralStrength",
  "flexuralModulus",
  "hdt",
  "elongation",
  "hardness",
  "flameRetardant",
  "waterAbsorption",
] as const;

const COMPARE_MAX = 4;

export function MaterialsClient({
  materials,
  categories,
}: {
  materials: SerializedMaterial[];
  categories: Category[];
}) {
  const t = useTranslations("Materials");
  const tp = useTranslations("Materials.props");
  const locale = useLocale();
  const isEn = locale === "en";
  const catLabel = (c: Category) => (isEn && c.nameEn ? c.nameEn : c.name);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const stats = useMemo(() => {
    const cats = new Set(materials.map((m) => m.category).filter(Boolean));
    const brands = new Set(materials.map((m) => m.brand).filter(Boolean));
    const fibers = materials.filter((m) => m.category.startsWith("fiber-")).length;
    return {
      total: materials.length,
      categories: cats.size,
      brands: brands.size,
      fibers,
    };
  }, [materials]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "all" || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, search, activeCategory]);

  const { visible: visibleFiltered, remaining, expand } = useProgressiveList(filtered, 50);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= COMPARE_MAX) return prev;
      return [...prev, id];
    });
  }

  const compareItems = useMemo(
    () => materials.filter((m) => selectedIds.includes(m.id)),
    [materials, selectedIds]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("pageTitleFull")}</h1>
          <p className="mt-2 text-muted-foreground">{t("headline")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={selectedIds.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            {t("compare")} {selectedIds.length}/{COMPARE_MAX}
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="ghost" onClick={() => setSelectedIds([])}>
              {t("clearAll")}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.total.toLocaleString()}</div><div className="mt-1 text-xs text-muted-foreground">{t("statTotal")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.categories}</div><div className="mt-1 text-xs text-muted-foreground">{t("statCategories")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.brands}</div><div className="mt-1 text-xs text-muted-foreground">{t("statBrands")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold tabular-nums">{stats.fibers.toLocaleString()}</div><div className="mt-1 text-xs text-muted-foreground">{t("statFibers")}</div></CardContent></Card>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setActiveCategory("all")}
          >
            {t("all")}
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-1 gap-1.5"
              onClick={() => setActiveCategory(cat.id)}
            >
              <Icon name={cat.iconKey} size={12} />
              {catLabel(cat)}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("colCategory")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("colBrand")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("colModel")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("colDensity")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("colTensile")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("colFlexural")}
                  </TableHead>
                  <TableHead className="w-[70px]">{t("colDetail")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleFiltered.map((m) => {
                  const checked = selectedIds.includes(m.id);
                  const disabled =
                    !checked && selectedIds.length >= COMPARE_MAX;
                  return (
                    <TableRow key={m.id} data-selected={checked || undefined}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleSelect(m.id)}
                          aria-label={t("selectAria", { name: m.name })}
                          className="h-4 w-4 rounded border-border accent-foreground disabled:opacity-40"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {isEn && m.nameEn ? m.nameEn : m.name}
                        </div>
                        {m.nameEn && m.name !== m.nameEn && (
                          <div className="text-xs text-muted-foreground">
                            {isEn ? m.name : m.nameEn}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {m.subCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {m.brand}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-sm">
                        {m.model}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-sm">
                        {m.properties.density || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-sm">
                        {m.properties.tensileStrength || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-sm">
                        {m.properties.flexuralStrength || "-"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/materials/${encodeURIComponent(m.id)}` as never}
                          className={buttonVariants({ variant: "link", size: "sm" })}
                        >
                          {t("viewDetail")}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {remaining > 0 && (
            <div className="mt-6 flex justify-center border-t pt-4">
              <Button variant="outline" onClick={expand}>
                展开剩余 {remaining} 条
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {t("rowHint", { shown: filtered.length, total: materials.length })}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 text-sm">
            <span>
              {t("selected")} {selectedIds.length}
            </span>
            <Button
              size="sm"
              disabled={selectedIds.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              {t("compare")}
            </Button>
          </div>
        </div>
      )}

      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-4xl overflow-y-auto p-4 sm:p-6"
        >
          <SheetHeader>
            <SheetTitle>{t("compareTitle")}</SheetTitle>
            <SheetDescription>
              {t("compareDescription", { count: compareItems.length })}
            </SheetDescription>
          </SheetHeader>

          {compareItems.length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("compareNeedMore")}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">{t("propAttr")}</TableHead>
                    {compareItems.map((m) => (
                      <TableHead key={m.id} className="min-w-[180px]">
                        <div className="font-semibold">
                          {isEn && m.nameEn ? m.nameEn : m.name}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {m.brand} {m.model}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {t("propCategory")}
                    </TableCell>
                    {compareItems.map((m) => (
                      <TableCell key={m.id}>{m.subCategory}</TableCell>
                    ))}
                  </TableRow>
                  {PROP_KEYS.map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{tp(key)}</TableCell>
                      {compareItems.map((m) => (
                        <TableCell
                          key={m.id}
                          className="font-mono text-sm"
                        >
                          {m.properties[key] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">
                      {t("propApplications")}
                    </TableCell>
                    {compareItems.map((m) => (
                      <TableCell key={m.id}>
                        <div className="flex flex-wrap gap-1">
                          {m.applications.map((a) => (
                            <Badge
                              key={a}
                              variant="secondary"
                              className="text-xs"
                            >
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
