// 5-card "Full Value Chain" section for getfrp.com (English homepage).
// Pulls live counts from supplier_listings and materials. Categories that
// have no rows yet show "Coming soon" — honest signal we're filling them in.

import { sql, inArray, isNotNull, and } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import {
  materials as materialsTable,
  supplierListings,
} from "@/lib/db/schema";
import { Link } from "@/i18n/navigation";

const RAW_MATERIAL_CATS = [
  "fiber-yarn",
  "fiber-fabric",
  "fiber-mat",
  "resin",
  "gelcoat",
  "auxiliary",
  "core",
];
const RAW_SUPPLIER_CATS = ["fiber", "resin"];
const FINISHED_MAT_CATS = ["composite"];
const FINISHED_SUPPLIER_CATS = ["manufacturer"];

async function countMatBy(cats: string[]): Promise<number> {
  if (cats.length === 0) return 0;
  try {
    const rows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(materialsTable)
      .where(inArray(materialsTable.category, cats));
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

async function countSupBy(cats: string[], enOnly: boolean): Promise<number> {
  if (cats.length === 0) return 0;
  try {
    const where = enOnly
      ? and(
          inArray(supplierListings.category, cats),
          isNotNull(supplierListings.nameEn),
        )
      : inArray(supplierListings.category, cats);
    const rows = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierListings)
      .where(where);
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

export async function ValueChainSection({ enOnly = true }: { enOnly?: boolean } = {}) {
  const t = await getTranslations("Home");

  const [rawMat, rawSup, equipSup, toolSup, moldSup, finMat, finSup] =
    await Promise.all([
      countMatBy(RAW_MATERIAL_CATS),
      countSupBy(RAW_SUPPLIER_CATS, enOnly),
      countSupBy(["equipment"], enOnly),
      countSupBy(["tooling", "tool"], enOnly),
      countSupBy(["mold", "mould"], enOnly),
      countMatBy(FINISHED_MAT_CATS),
      countSupBy(FINISHED_SUPPLIER_CATS, enOnly),
    ]);

  type Card = {
    key: "raw" | "equipment" | "tooling" | "molds" | "finished";
    primary: number;
    primaryUnit: string;
    secondary?: { value: number; unit: string };
  };

  const cards: Card[] = [
    {
      key: "raw",
      primary: rawMat,
      primaryUnit: "grades",
      secondary: { value: rawSup, unit: "suppliers" },
    },
    { key: "equipment", primary: equipSup, primaryUnit: "suppliers" },
    { key: "tooling", primary: toolSup, primaryUnit: "suppliers" },
    { key: "molds", primary: moldSup, primaryUnit: "suppliers" },
    {
      key: "finished",
      primary: finMat,
      primaryUnit: "models",
      secondary: { value: finSup, unit: "manufacturers" },
    },
  ];

  return (
    <section className="border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="border-b border-border/70 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("valueChainEyebrow")}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {t("valueChainTitle")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {t("valueChainSubtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => {
            const isEmpty = card.primary === 0;
            return (
              <div
                key={card.key}
                className="flex flex-col rounded-lg border border-border/70 bg-background p-5 transition-colors hover:border-foreground/40"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {String(cards.findIndex((c) => c.key === card.key) + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 text-base font-semibold tracking-tight">
                  {t(`valueChain.${card.key}.title`)}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {t(`valueChain.${card.key}.desc`)}
                </p>
                <div className="mt-auto pt-4">
                  {isEmpty ? (
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t("valueChainComing")}
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tabular-nums">
                        {card.primary.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {card.primaryUnit}
                      </span>
                      {card.secondary && card.secondary.value > 0 && (
                        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                          + {card.secondary.value} {card.secondary.unit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/suppliers"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("valueChainCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
