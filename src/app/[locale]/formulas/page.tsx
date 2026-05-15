import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import {
  materials as materialsTable,
  formulas as formulasTable,
} from "@/lib/db/schema";
import { FormulasClient, type SerializedFormula } from "./formulas-client";
import { processFilters, categoryFilters } from "@/lib/data/formulas";
import { buildMaterialIndex, matchIngredient } from "@/lib/material-matcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Formulas" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export const revalidate = 3600;

export default async function FormulasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [rows, materialRows] = await Promise.all([
    db
      .select()
      .from(formulasTable)
      .orderBy(asc(formulasTable.processId), asc(formulasTable.name)),
    db
      .select({
        id: materialsTable.id,
        name: materialsTable.name,
        nameEn: materialsTable.nameEn,
        brand: materialsTable.brand,
        model: materialsTable.model,
        category: materialsTable.category,
      })
      .from(materialsTable),
  ]);

  const index = buildMaterialIndex(materialRows);
  // Build a flat ingredient-name → material-id map for all ingredients across formulas
  const nameToMaterialId: Record<string, string> = {};
  for (const f of rows) {
    const lists = [f.resinSystem, f.reinforcement, f.auxiliaries].filter(
      Boolean
    ) as Array<Array<{ name: string }>>;
    for (const list of lists) {
      for (const item of list) {
        if (!item?.name || nameToMaterialId[item.name]) continue;
        const m = matchIngredient(item.name, index);
        if (m) nameToMaterialId[item.name] = m.id;
      }
    }
  }

  // Merge zh + en versions of nested arrays so the client's `item.nameEn`
  // lookup resolves to translated values when present.
  // Translator produces _en arrays whose items carry the SAME keys
  // (name/role/amount/note/value) but with English values — copy them
  // into nameEn/roleEn/amountEn/noteEn/valueEn slots.
  const mergeIngredients = (
    zh: unknown[] | null | undefined,
    en: unknown[] | null | undefined,
  ): SerializedFormula["resinSystem"] => {
    const zhArr = (zh ?? []) as Array<Record<string, unknown>>;
    const enArr = (en ?? []) as Array<Record<string, unknown>>;
    return zhArr.map((row, i) => {
      const e = enArr[i] ?? {};
      return {
        name: String(row.name ?? ""),
        nameEn: String((e.name ?? row.nameEn ?? "") as string),
        role: String(row.role ?? ""),
        roleEn: String((e.role ?? row.roleEn ?? "") as string),
        amount: String(row.amount ?? ""),
        amountEn: String((e.amount ?? row.amountEn ?? "") as string),
        note: row.note ? String(row.note) : undefined,
        noteEn: e.note ? String(e.note) : (row.noteEn as string | undefined),
      };
    }) as SerializedFormula["resinSystem"];
  };
  const mergeProcessing = (
    zh: unknown[] | null | undefined,
    en: unknown[] | null | undefined,
  ): SerializedFormula["processing"] => {
    const zhArr = (zh ?? []) as Array<Record<string, unknown>>;
    const enArr = (en ?? []) as Array<Record<string, unknown>>;
    return zhArr.map((row, i) => {
      const e = enArr[i] ?? {};
      return {
        name: String(row.name ?? ""),
        nameEn: String((e.name ?? row.nameEn ?? "") as string),
        value: String(row.value ?? ""),
        valueEn: String((e.value ?? row.valueEn ?? "") as string),
        note: row.note ? String(row.note) : undefined,
        noteEn: e.note ? String(e.note) : (row.noteEn as string | undefined),
      };
    }) as SerializedFormula["processing"];
  };
  const mergeProperties = (
    zh: unknown[] | null | undefined,
    en: unknown[] | null | undefined,
  ): SerializedFormula["properties"] => {
    const zhArr = (zh ?? []) as Array<Record<string, unknown>>;
    const enArr = (en ?? []) as Array<Record<string, unknown>>;
    return zhArr.map((row, i) => {
      const e = enArr[i] ?? {};
      return {
        name: String(row.name ?? ""),
        nameEn: String((e.name ?? row.nameEn ?? "") as string),
        value: String(row.value ?? ""),
        valueEn: String((e.value ?? row.valueEn ?? "") as string),
        standard: row.standard ? String(row.standard) : undefined,
        note: row.note ? String(row.note) : undefined,
        noteEn: e.note ? String(e.note) : (row.noteEn as string | undefined),
      };
    }) as SerializedFormula["properties"];
  };

  const serialized: SerializedFormula[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    nameEn: r.nameEn ?? "",
    processId: r.processId ?? "",
    process: r.process ?? "",
    processEn: r.processEn ?? "",
    category: r.category ?? "",
    categoryEn: r.category ?? "",
    application: r.application ?? "",
    applicationEn: r.applicationEn ?? "",
    difficulty: (r.difficulty ?? "入门") as SerializedFormula["difficulty"],
    description: r.description ?? "",
    descriptionEn: r.descriptionEn ?? "",
    resinSystem: mergeIngredients(r.resinSystem as unknown[] | null, r.resinSystemEn as unknown[] | null),
    reinforcement: mergeIngredients(r.reinforcement as unknown[] | null, r.reinforcementEn as unknown[] | null),
    auxiliaries: mergeIngredients(r.auxiliaries as unknown[] | null, r.auxiliariesEn as unknown[] | null),
    processing: mergeProcessing(r.processing as unknown[] | null, r.processingEn as unknown[] | null),
    properties: mergeProperties(r.properties as unknown[] | null, r.propertiesEn as unknown[] | null),
    tips: (r.tips ?? []) as string[],
    tipsEn: (r.tipsEn ?? []) as string[],
    safetyNotes: (r.safetyNotes ?? []) as string[],
    safetyNotesEn: (r.safetyNotesEn ?? []) as string[],
  }));

  return (
    <FormulasClient
      formulas={serialized}
      processFilters={processFilters}
      categoryFilters={categoryFilters}
      ingredientMaterialMap={nameToMaterialId}
    />
  );
}
