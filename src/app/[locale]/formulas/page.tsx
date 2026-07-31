import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { asc, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import {
  materials as materialsTable,
  formulas as formulasTable,
} from "@/lib/db/schema";
import { FormulasClient, type SerializedFormula } from "./formulas-client";
import { processFilters, categoryFilters } from "@/lib/data/formulas";
import { buildMaterialIndex, matchIngredient } from "@/lib/material-matcher";
import { NewsletterSignup } from "@/components/newsletter-signup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Formulas" });
  let formulaCount = 0;
  if (locale === "en") {
    try {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(formulasTable);
      formulaCount = row?.count ?? 0;
    } catch {
      formulaCount = 0;
    }
  }
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/formulas"),
    ...(locale === "en" && formulaCount < 20
      ? { robots: { index: false, follow: true } }
      : {}),
  };
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
    (async () => {
      try {
        return await db
          .select()
          .from(formulasTable)
          .orderBy(asc(formulasTable.processId), asc(formulasTable.name));
      } catch {
        return [];
      }
    })(),
    (async () => {
      try {
        return await db
          .select({
            id: materialsTable.id,
            name: materialsTable.name,
            nameEn: materialsTable.nameEn,
            brand: materialsTable.brand,
            model: materialsTable.model,
            category: materialsTable.category,
          })
          .from(materialsTable);
      } catch {
        return [];
      }
    })(),
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

  if (locale === "en" && serialized.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          DATABASE BUILD IN PROGRESS
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
          FRP Formulations Database
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-7 text-muted-foreground">
          We are building a reviewed, application-led formulations library for
          composite manufacturing. Nine process categories are already defined;
          formulation records are being translated, checked and prepared for
          publication.
        </p>

        <div className="mt-10 space-y-5 text-[15px] leading-7 text-muted-foreground">
          <p>
            The database will cover pultrusion, filament winding, hand lay-up,
            spray-up, vacuum infusion, RTM, compression moulding, SMC/BMC and
            repair systems. Each record is intended to show more than a generic
            ingredient list. A useful production reference must identify the
            resin system, reinforcement, auxiliaries, processing window,
            expected properties, safety notes and the conditions under which the
            recipe was validated.
          </p>
          <p>
            Formulations are being held from the public index until enough
            complete records exist to support comparison. Publishing empty
            filters or isolated recipes would create a misleading technical
            resource. The first release will therefore focus on at least twenty
            reviewed entries with clear process context, English terminology and
            links to relevant materials and standards.
          </p>
          <p>
            A formulation is never a drop-in production instruction. Cure
            behaviour changes with raw-material batch, catalyst, temperature,
            humidity, part thickness, tooling and equipment. Every future record
            will carry an explicit trial requirement so engineers can use the
            library to structure development work without mistaking reference
            data for a guaranteed manufacturing result.
          </p>
          <p>
            The planned filters include process, resin family, reinforcement,
            application and difficulty. Where the evidence permits, records will
            link to material datasheets, test methods and supplier-capability
            categories. Commercial or safety-sensitive values will be labelled
            by source and review status rather than presented as anonymous
            “industry formulas.”
          </p>
          <p>
            If you operate a qualified composite process and want to contribute,
            send a non-confidential summary of the application, material system,
            processing window and validation method to the sourcing desk. We do
            not publish proprietary customer recipes, untraceable screenshots or
            formulations that omit basic safety and trial guidance.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["9", "Process categories defined"],
            ["20+", "Reviewed records before indexing"],
            ["English", "Technical terminology and safety notes"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-border/70 bg-muted/20 p-5">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <NewsletterSignup topic="formulas-database" className="mt-10" />
      </main>
    );
  }

  return (
    <FormulasClient
      formulas={serialized}
      processFilters={processFilters}
      categoryFilters={categoryFilters}
      ingredientMaterialMap={nameToMaterialId}
    />
  );
}
