"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type FormulaIngredient = {
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  amount: string;
  amountEn: string;
  note?: string;
  noteEn?: string;
};
export type ProcessingParam = {
  name: string;
  nameEn: string;
  value: string;
  valueEn: string;
  note?: string;
  noteEn?: string;
};
export type ExpectedProperty = {
  name: string;
  nameEn: string;
  value: string;
  valueEn: string;
  standard?: string;
  note?: string;
  noteEn?: string;
};
export type SerializedFormula = {
  id: string;
  name: string;
  nameEn: string;
  processId: string;
  process: string;
  processEn: string;
  category: string;
  categoryEn: string;
  application: string;
  applicationEn: string;
  difficulty: "入门" | "中级" | "高级";
  description: string;
  descriptionEn: string;
  resinSystem: FormulaIngredient[];
  reinforcement: FormulaIngredient[];
  auxiliaries: FormulaIngredient[];
  processing: ProcessingParam[];
  properties: ExpectedProperty[];
  tips: string[];
  tipsEn: string[];
  safetyNotes: string[];
  safetyNotesEn: string[];
};

type FilterOption = { id: string; name: string; nameEn?: string; iconKey?: string };

function DifficultyBadge({ level }: { level: string }) {
  const t = useTranslations("Formulas");
  // Map Chinese DB values to translation keys
  const key =
    level === "入门" ? "beginner" : level === "中级" ? "intermediate" : "advanced";
  const label = t(`difficulty.${key}`);
  const cls =
    level === "入门"
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : level === "中级"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function IngredientTable({
  title,
  num,
  items,
  amountHead,
  materialMap,
}: {
  title: string;
  num: number;
  items: FormulaIngredient[];
  amountHead: string;
  materialMap: Record<string, string>;
}) {
  const t = useTranslations("Formulas");
  const locale = useLocale();
  const isEn = locale === "en";
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">{num}</span>
        {title}
      </h4>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">{t("colMaterial")}</TableHead>
              <TableHead>{t("colRole")}</TableHead>
              <TableHead>{amountHead}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("colNote")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const matId = materialMap[item.name];
              const dispName = isEn ? item.nameEn ?? "" : item.name;
              const dispRole = isEn ? item.roleEn ?? "" : item.role;
              const dispAmount = isEn ? item.amountEn ?? "" : item.amount;
              const dispNote = isEn ? item.noteEn ?? "" : item.note;
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {matId ? (
                      <Link
                        href={`/materials/${matId}` as "/materials/[id]"}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        title={t("viewMaterial")}
                      >
                        {dispName}
                        <span className="text-[10px] opacity-60">↗</span>
                      </Link>
                    ) : (
                      dispName
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {dispRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{dispAmount}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {dispNote}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FormulaDetail({
  formula,
  materialMap,
}: {
  formula: SerializedFormula;
  materialMap: Record<string, string>;
}) {
  const t = useTranslations("Formulas");
  const locale = useLocale();
  const isEn = locale === "en";
  const tips = isEn ? formula.tipsEn ?? [] : formula.tips;
  const safetyNotes = isEn ? formula.safetyNotesEn ?? [] : formula.safetyNotes;
  return (
    <div className="space-y-5 pb-2">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {isEn ? formula.descriptionEn ?? "" : formula.description}
      </p>

      <IngredientTable title={t("sectionResin")} num={1} items={formula.resinSystem} amountHead={t("colAmount")} materialMap={materialMap} />
      <IngredientTable title={t("sectionReinforcement")} num={2} items={formula.reinforcement} amountHead={t("colAmountPos")} materialMap={materialMap} />
      <IngredientTable title={t("sectionAuxiliary")} num={3} items={formula.auxiliaries} amountHead={t("colAmount")} materialMap={materialMap} />

      <div className="grid gap-5 md:grid-cols-2">
        {formula.processing?.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">4</span>
              {t("sectionProcess")}
            </h4>
            <div className="space-y-1.5">
              {formula.processing.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">{isEn ? p.nameEn ?? "" : p.name}</span>
                  <span className="shrink-0 text-right text-xs font-medium">{isEn ? p.valueEn ?? "" : p.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {formula.properties?.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs text-primary">5</span>
              {t("sectionProperties")}
            </h4>
            <div className="space-y-1.5">
              {formula.properties.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">{isEn ? p.nameEn ?? "" : p.name}</span>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium">{isEn ? p.valueEn ?? "" : p.value}</span>
                    {p.standard && <span className="ml-1 text-[10px] text-muted-foreground">({p.standard})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {tips?.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-xs text-amber-600">!</span>
            {t("sectionTips")}
          </h4>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-amber-500">●</span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {safetyNotes?.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">{t("sectionSafety")}</h4>
          <ul className="space-y-1">
            {safetyNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <span className="mt-0.5 shrink-0">⚠</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {t("disclaimer")}
      </p>
    </div>
  );
}

export function FormulasClient({
  formulas,
  processFilters,
  categoryFilters,
  ingredientMaterialMap,
}: {
  formulas: SerializedFormula[];
  processFilters: FilterOption[];
  categoryFilters: FilterOption[];
  ingredientMaterialMap: Record<string, string>;
}) {
  const t = useTranslations("Formulas");
  const locale = useLocale();
  const isEn = locale === "en";
  // getfrp.com (en): only surface formulas that have an English name, so the
  // list / groups / stats never render Chinese. Untranslated rows are hidden
  // until backfilled (translate-all-zh.ts).
  const displayFormulas = isEn
    ? formulas.filter((f) => f.nameEn && f.nameEn.trim())
    : formulas;
  const [search, setSearch] = useState("");
  const [activeProcess, setActiveProcess] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Support deep-link via hash: /formulas#<formula-id>.
  // Used by the AI citations to link straight to a specific formula.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.slice(1);
    if (!raw) return;
    const targetId = decodeURIComponent(raw);
    const match = formulas.find((f) => f.id === targetId);
    if (!match) return;
    // Reset filters so the item is never hidden.
    setSearch("");
    setActiveProcess("all");
    setActiveCategory("all");
    setOpenItems([targetId]);
    // Let the DOM update before scrolling.
    const t = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => clearTimeout(t);
  }, [formulas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayFormulas.filter((f) => {
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.nameEn ?? "").toLowerCase().includes(q) ||
        f.process.toLowerCase().includes(q) ||
        (f.processEn ?? "").toLowerCase().includes(q) ||
        f.application.toLowerCase().includes(q) ||
        (f.applicationEn ?? "").toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.descriptionEn ?? "").toLowerCase().includes(q);
      const matchProcess = activeProcess === "all" || f.processId === activeProcess;
      const matchCategory = activeCategory === "all" || f.category === activeCategory;
      return matchSearch && matchProcess && matchCategory;
    });
  }, [displayFormulas, search, activeProcess, activeCategory]);

  const groupedByProcess = useMemo(() => {
    return filtered.reduce<Record<string, SerializedFormula[]>>((acc, f) => {
      const proc = isEn ? f.processEn ?? "" : f.process;
      const key = proc || (isEn ? "Ungrouped" : "未分组");
      (acc[key] ||= []).push(f);
      return acc;
    }, {});
  }, [filtered, isEn]);

  const beginners = displayFormulas.filter((f) => f.difficulty === "入门").length;
  const advanced = displayFormulas.filter((f) => f.difficulty === "高级").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{displayFormulas.length}</div><div className="text-xs text-muted-foreground">{t("statTotal")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{processFilters.length - 1}</div><div className="text-xs text-muted-foreground">{t("statProcesses")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{beginners}</div><div className="text-xs text-muted-foreground">{t("statBeginner")}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{advanced}</div><div className="text-xs text-muted-foreground">{t("statAdvanced")}</div></CardContent></Card>
      </div>

      <div className="mb-6 space-y-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t("filterProcess")}</span>
          {processFilters.map((p) => (
            <Badge
              key={p.id}
              variant={activeProcess === p.id ? "default" : "outline"}
              className="cursor-pointer px-2 py-1 text-xs gap-1.5"
              onClick={() => setActiveProcess(p.id)}
            >
              {p.iconKey && <Icon name={p.iconKey} size={12} />}
              {isEn && p.nameEn ? p.nameEn : p.name}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t("filterType")}</span>
          {categoryFilters.map((c) => (
            <Badge
              key={c.id}
              variant={activeCategory === c.id ? "default" : "outline"}
              className="cursor-pointer px-2.5 py-1 text-xs"
              onClick={() => setActiveCategory(c.id)}
            >
              {isEn && c.nameEn ? c.nameEn : c.name}
            </Badge>
          ))}
        </div>
      </div>

      {Object.entries(groupedByProcess).map(([processName, list]) => (
        <div key={processName} className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            {(() => {
              const k = processFilters.find(
                (p) => p.name === processName || p.nameEn === processName,
              )?.iconKey;
              return k ? <Icon name={k} size={20} className="text-muted-foreground" /> : null;
            })()}
            {processName}
            <Badge variant="secondary" className="text-xs">{t("formulaCount", { count: list.length })}</Badge>
          </h2>

          <Accordion
            className="w-full space-y-3"
            value={openItems}
            onValueChange={(v) => setOpenItems(v as string[])}
          >
            {list.map((f) => (
              <AccordionItem
                key={f.id}
                value={f.id}
                id={f.id}
                className="rounded-lg border bg-background px-5 scroll-mt-20"
              >
                <AccordionTrigger className="py-4">
                  <div className="flex flex-1 flex-col items-start gap-1.5 pr-4 text-left sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-semibold">{isEn ? f.nameEn ?? "" : f.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <DifficultyBadge level={f.difficulty} />
                      {(() => {
                        const app = isEn ? f.applicationEn ?? "" : f.application;
                        return app ? (
                          <Badge variant="outline" className="text-[10px]">
                            {app.split(isEn ? "," : "、")[0]}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* 仅展开时渲染详情:Accordion 的 Panel 是 keepMounted,若无条件渲染
                      会把全部 ~115 个配方详情塞进 SSR DOM(2.7MB),低端手机解析/水合卡死。
                      数据已在 props,展开即时渲染,无需请求。 */}
                  {openItems.includes(f.id) && (
                    <>
                      <Separator className="mb-5" />
                      <FormulaDetail formula={f} materialMap={ingredientMaterialMap} />
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          {t("noResults")}
        </div>
      )}

      <Separator className="my-10" />
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-bold">{t("contribute")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("contributeSub")}</p>
        <div className="mt-3 text-sm text-muted-foreground">{t("contributeContact")}</div>
      </div>
    </div>
  );
}
