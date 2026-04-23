"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  role: string;
  amount: string;
  note?: string;
};
export type ProcessingParam = {
  name: string;
  value: string;
  note?: string;
};
export type ExpectedProperty = {
  name: string;
  value: string;
  standard?: string;
  note?: string;
};
export type SerializedFormula = {
  id: string;
  name: string;
  processId: string;
  process: string;
  category: string;
  application: string;
  difficulty: "入门" | "中级" | "高级";
  description: string;
  resinSystem: FormulaIngredient[];
  reinforcement: FormulaIngredient[];
  auxiliaries: FormulaIngredient[];
  processing: ProcessingParam[];
  properties: ExpectedProperty[];
  tips: string[];
  safetyNotes: string[];
};

type FilterOption = { id: string; name: string; iconKey?: string };

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
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {matId ? (
                      <Link
                        href={`/materials/${matId}` as "/materials/[id]"}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        title={t("viewMaterial")}
                      >
                        {item.name}
                        <span className="text-[10px] opacity-60">↗</span>
                      </Link>
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {item.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.amount}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {item.note}
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
  return (
    <div className="space-y-5 pb-2">
      <p className="text-sm leading-relaxed text-muted-foreground">{formula.description}</p>

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
                  <span className="text-xs text-muted-foreground">{p.name}</span>
                  <span className="shrink-0 text-right text-xs font-medium">{p.value}</span>
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
                  <span className="text-xs text-muted-foreground">{p.name}</span>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium">{p.value}</span>
                    {p.standard && <span className="ml-1 text-[10px] text-muted-foreground">({p.standard})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {formula.tips?.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-xs text-amber-600">!</span>
            {t("sectionTips")}
          </h4>
          <ul className="space-y-1.5">
            {formula.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-amber-500">●</span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {formula.safetyNotes?.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">{t("sectionSafety")}</h4>
          <ul className="space-y-1">
            {formula.safetyNotes.map((note, i) => (
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
    return formulas.filter((f) => {
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.process.toLowerCase().includes(q) ||
        f.application.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q);
      const matchProcess = activeProcess === "all" || f.processId === activeProcess;
      const matchCategory = activeCategory === "all" || f.category === activeCategory;
      return matchSearch && matchProcess && matchCategory;
    });
  }, [formulas, search, activeProcess, activeCategory]);

  const groupedByProcess = useMemo(() => {
    return filtered.reduce<Record<string, SerializedFormula[]>>((acc, f) => {
      const key = f.process || "未分组";
      (acc[key] ||= []).push(f);
      return acc;
    }, {});
  }, [filtered]);

  const beginners = formulas.filter((f) => f.difficulty === "入门").length;
  const advanced = formulas.filter((f) => f.difficulty === "高级").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("h1")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{formulas.length}</div><div className="text-xs text-muted-foreground">{t("statTotal")}</div></CardContent></Card>
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
              {p.name}
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
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      {Object.entries(groupedByProcess).map(([processName, list]) => (
        <div key={processName} className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            {(() => {
              const k = processFilters.find((p) => p.name === processName)?.iconKey;
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
                    <span className="font-semibold">{f.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <DifficultyBadge level={f.difficulty} />
                      {f.application && (
                        <Badge variant="outline" className="text-[10px]">
                          {f.application.split("、")[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Separator className="mb-5" />
                  <FormulaDetail formula={f} materialMap={ingredientMaterialMap} />
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
