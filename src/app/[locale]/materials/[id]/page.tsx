import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import {
  materials,
  supplierListings,
  downloads,
  formulas as formulasTable,
} from "@/lib/db/schema";
import { buildMaterialIndex, matchIngredient } from "@/lib/material-matcher";
import { JsonLd } from "@/components/json-ld";
import { InquiryButton } from "./inquiry-button";
import { SaveButton } from "@/components/save-button";
import { resolveViewer, isSaved } from "@/lib/saved";

export const revalidate = 3600;

const PROP_KEYS_ORDER = [
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

const CATEGORY_TO_SUPPLIER: Record<string, string[]> = {
  resin: ["resin"],
  fiber: ["fiber"],
  "fiber-yarn": ["fiber"],
  "fiber-mat": ["fiber"],
  "fiber-fabric": ["fiber"],
  core: ["manufacturer"],
  gelcoat: ["resin"],
  auxiliary: ["resin", "manufacturer"],
  composite: ["manufacturer"],
};

async function loadMaterial(id: string) {
  const [m] = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return m;
}

async function loadRelatedSuppliers(category: string) {
  const supplierCats = CATEGORY_TO_SUPPLIER[category] ?? ["manufacturer"];
  return db
    .select()
    .from(supplierListings)
    .where(
      and(
        inArray(supplierListings.category, supplierCats),
        eq(supplierListings.verified, true)
      )
    )
    .orderBy(desc(supplierListings.verified))
    .limit(6);
}

async function loadDownloads(materialId: string) {
  return db
    .select()
    .from(downloads)
    .where(eq(downloads.materialId, materialId))
    .limit(5);
}

type SectionKey = "resin" | "reinforcement" | "auxiliary";

async function loadRelatedFormulas(material: typeof materials.$inferSelect) {
  const index = buildMaterialIndex([
    {
      id: material.id,
      name: material.name,
      nameEn: material.nameEn,
      brand: material.brand,
      model: material.model,
      category: material.category,
    },
  ]);
  const rows = await db
    .select({
      id: formulasTable.id,
      name: formulasTable.name,
      process: formulasTable.process,
      application: formulasTable.application,
      resinSystem: formulasTable.resinSystem,
      reinforcement: formulasTable.reinforcement,
      auxiliaries: formulasTable.auxiliaries,
    })
    .from(formulasTable);
  type Ing = { name: string; role?: string };
  const hits: Array<{
    id: string;
    name: string;
    process: string | null;
    application: string | null;
    section: SectionKey;
    role?: string;
  }> = [];
  for (const f of rows) {
    const buckets: Array<[Ing[] | null, SectionKey]> = [
      [(f.resinSystem as Ing[] | null) ?? null, "resin"],
      [(f.reinforcement as Ing[] | null) ?? null, "reinforcement"],
      [(f.auxiliaries as Ing[] | null) ?? null, "auxiliary"],
    ];
    for (const [list, section] of buckets) {
      if (!list) continue;
      for (const ing of list) {
        if (!ing?.name) continue;
        if (matchIngredient(ing.name, index)) {
          hits.push({
            id: f.id,
            name: f.name,
            process: f.process,
            application: f.application,
            section,
            role: ing.role,
          });
          break;
        }
      }
      if (hits[hits.length - 1]?.id === f.id) break;
    }
  }
  return hits.slice(0, 8);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Materials.detail" });
  const m = await loadMaterial(id);
  if (!m) return { title: t("notFound") };
  return {
    title: t("metaTitle", { name: m.name }),
    description: m.description ?? t("metaDescription", { name: m.name }),
  };
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Materials.detail");
  const tp = await getTranslations("Materials.props");
  const ts = await getTranslations("Materials.detail.sections");
  const tSupplier = await getTranslations("Suppliers");

  const m = await loadMaterial(id);
  if (!m) notFound();

  const viewer = await resolveViewer();
  const alreadySaved =
    viewer.userId != null
      ? await isSaved(viewer.userId, "material", m.id)
      : false;

  const [suppliers, dls, relatedFormulas] = await Promise.all([
    loadRelatedSuppliers(m.category),
    loadDownloads(m.id),
    loadRelatedFormulas(m),
  ]);

  const props = (m.properties ?? {}) as Record<string, string>;
  const applications = (m.applications ?? []) as string[];
  const propEntries = Object.entries(props).filter(([, v]) => v);

  const inLanguage = locale === "en" ? "en" : "zh-CN";
  const canonicalUrl = `https://f1frp.com/${locale}/materials/${m.id}`;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    url: canonicalUrl,
    inLanguage,
    name: m.name,
    description: m.description ?? undefined,
    mpn: m.model ?? undefined,
    category: m.subCategory ?? m.category,
    brand: m.brand
      ? { "@type": "Brand", name: m.brand }
      : undefined,
    manufacturer: suppliers[0]?.name
      ? { "@type": "Organization", name: suppliers[0].name }
      : undefined,
    additionalProperty: propEntries.map(([key, value]) => ({
      "@type": "PropertyValue",
      name: key,
      value,
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd data={productJsonLd} />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/materials" className="hover:text-foreground">
          {t("breadcrumb")}
        </Link>
        <span className="mx-2">›</span>
        <span>{locale === "en" && m.nameEn ? m.nameEn : m.name}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {locale === "en" && m.nameEn ? m.nameEn : m.name}
          </h1>
          {m.nameEn && m.name !== m.nameEn && (
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "en" ? m.name : m.nameEn}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {m.subCategory && <Badge variant="outline">{m.subCategory}</Badge>}
            {m.brand && (
              <span className="text-muted-foreground">
                {t("brand")}：
                <span className="text-foreground">{m.brand}</span>
              </span>
            )}
            {m.model && (
              <span className="font-mono text-muted-foreground">
                {t("model")}：{m.model}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton
            sourceType="material"
            sourceId={m.id}
            title={m.name}
            url={`/materials/${encodeURIComponent(m.id)}`}
            signedIn={viewer.signedIn}
            initialSaved={alreadySaved}
          />
          <Link
            href="/materials"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("back")}
          </Link>
        </div>
      </div>

      {m.description && (
        <Card className="mb-6">
          <CardContent className="p-5 text-sm leading-relaxed">
            {m.description}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("techParams")}</CardTitle>
              <CardDescription>{t("techParamsFrom")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      {t("value") /* reuse attr */ && null}
                    </TableHead>
                    <TableHead>{t("value")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propEntries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        {t("noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    propEntries.map(([key, value]) => {
                      const isKnown = (PROP_KEYS_ORDER as readonly string[]).includes(key);
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {isKnown ? tp(key as (typeof PROP_KEYS_ORDER)[number]) : key}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {value}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("applications")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {applications.map((a) => (
                    <Badge key={a} variant="secondary">
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {relatedFormulas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("relatedFormulas")}</CardTitle>
                <CardDescription>
                  {t("relatedFormulasSub", { count: relatedFormulas.length })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {relatedFormulas.map((f) => (
                  <Link
                    key={f.id}
                    href={`/formulas#${f.id}` as "/formulas"}
                    className="block rounded-md border bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/60"
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {f.process && (
                        <Badge variant="outline" className="text-[10px]">
                          {f.process}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {ts(f.section)}
                        {f.role ? `：${f.role}` : ""}
                      </Badge>
                      {f.application && <span>· {f.application}</span>}
                    </div>
                  </Link>
                ))}
                <Link
                  href="/formulas"
                  className={buttonVariants({ size: "sm", variant: "outline" }) + " w-full"}
                >
                  {t("browseAllFormulas")}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <InquiryButton materialId={m.id} materialName={m.name} category={m.category} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("downloads")}</CardTitle>
              <CardDescription>{t("downloadsSub")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dls.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noDownloads")}
                </p>
              ) : (
                dls.map((d) => (
                  <a
                    key={d.id}
                    href={`/api/downloads/${d.id}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span className="truncate">{d.title}</span>
                    <Badge
                      variant="outline"
                      className="ml-2 shrink-0 text-[10px] uppercase"
                    >
                      {d.type}
                    </Badge>
                  </a>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("recommendedSuppliers")}
              </CardTitle>
              <CardDescription>{t("verifiedSuppliers")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noSuppliers")}
                </p>
              ) : (
                suppliers.map((s) => (
                  <Link
                    key={s.id}
                    href={`/suppliers#${s.id}` as "/suppliers"}
                    className="block rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{s.name}</div>
                      {s.verified && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-green-500 text-[10px] text-green-600"
                        >
                          {tSupplier("verified")}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.location}
                    </div>
                  </Link>
                ))
              )}
              <Link
                href="/suppliers"
                className={buttonVariants({ size: "sm" }) + " w-full"}
              >
                {t("viewAllSuppliers")}
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
