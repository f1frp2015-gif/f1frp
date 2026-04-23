import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import {
  formulas as formulasTable,
  materials as materialsTable,
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

  const serialized: SerializedFormula[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    processId: r.processId ?? "",
    process: r.process ?? "",
    category: r.category ?? "",
    application: r.application ?? "",
    difficulty: (r.difficulty ?? "入门") as SerializedFormula["difficulty"],
    description: r.description ?? "",
    resinSystem: (r.resinSystem ?? []) as SerializedFormula["resinSystem"],
    reinforcement: (r.reinforcement ?? []) as SerializedFormula["reinforcement"],
    auxiliaries: (r.auxiliaries ?? []) as SerializedFormula["auxiliaries"],
    processing: (r.processing ?? []) as SerializedFormula["processing"],
    properties: (r.properties ?? []) as SerializedFormula["properties"],
    tips: (r.tips ?? []) as string[],
    safetyNotes: (r.safetyNotes ?? []) as string[],
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
