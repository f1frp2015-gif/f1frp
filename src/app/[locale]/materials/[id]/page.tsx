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
import { AskAiButton } from "@/components/ask-ai-button";
import { resolveViewer, isSaved } from "@/lib/saved";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";

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
  const [m] = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, id), eq(materials.status, "verified")))
    .limit(1);
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
      nameEn: formulasTable.nameEn,
      process: formulasTable.process,
      processEn: formulasTable.processEn,
      application: formulasTable.application,
      applicationEn: formulasTable.applicationEn,
      resinSystem: formulasTable.resinSystem,
      resinSystemEn: formulasTable.resinSystemEn,
      reinforcement: formulasTable.reinforcement,
      reinforcementEn: formulasTable.reinforcementEn,
      auxiliaries: formulasTable.auxiliaries,
      auxiliariesEn: formulasTable.auxiliariesEn,
    })
    .from(formulasTable);
  type Ing = { name: string; role?: string };
  const hits: Array<{
    id: string;
    name: string;
    nameEn: string | null;
    process: string | null;
    processEn: string | null;
    application: string | null;
    applicationEn: string | null;
    section: SectionKey;
    role?: string;
    roleEn?: string;
  }> = [];
  for (const f of rows) {
    // En ingredient arrays are positionally parallel to the zh ones, so the
    // matched index lets us recover the English role label for getfrp.com.
    const buckets: Array<[Ing[] | null, Ing[] | null, SectionKey]> = [
      [(f.resinSystem as Ing[] | null) ?? null, (f.resinSystemEn as Ing[] | null) ?? null, "resin"],
      [(f.reinforcement as Ing[] | null) ?? null, (f.reinforcementEn as Ing[] | null) ?? null, "reinforcement"],
      [(f.auxiliaries as Ing[] | null) ?? null, (f.auxiliariesEn as Ing[] | null) ?? null, "auxiliary"],
    ];
    let matched = false;
    for (const [list, listEn, section] of buckets) {
      if (!list) continue;
      for (let idx = 0; idx < list.length; idx++) {
        const ing = list[idx];
        if (!ing?.name) continue;
        if (matchIngredient(ing.name, index)) {
          hits.push({
            id: f.id,
            name: f.name,
            nameEn: f.nameEn,
            process: f.process,
            processEn: f.processEn,
            application: f.application,
            applicationEn: f.applicationEn,
            section,
            role: ing.role,
            roleEn: listEn?.[idx]?.role,
          });
          matched = true;
          break;
        }
      }
      if (matched) break;
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
  const isEn = locale === "en";
  if (!m || (isEn && !(m.nameEn && m.nameEn.trim())))
    return { title: t("notFound"), robots: { index: false, follow: false } };
  const name = isEn ? m.nameEn ?? "" : m.name;
  const description = isEn
    ? m.descriptionEn ?? t("metaDescription", { name })
    : m.description ?? t("metaDescription", { name });
  return {
    title: t("metaTitle", { name }),
    description,
    alternates: alternates(`/materials/${m.id}`),
    openGraph: og(`/materials/${m.id}`, {
      title: t("metaTitle", { name }),
      description,
    }),
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

  const mRaw = await loadMaterial(id);
  if (!mRaw) notFound();
  const isEn = locale === "en";
  // EN 侧缺英文名一律 404, 避免页面回退到中文内容 → Google 把整站归到 zh
  if (isEn && !(mRaw.nameEn && mRaw.nameEn.trim())) notFound();
  const m = {
    ...mRaw,
    name: isEn ? mRaw.nameEn ?? mRaw.name : mRaw.name,
    subCategory: isEn ? mRaw.subCategoryEn ?? null : mRaw.subCategory ?? null,
    brand: isEn ? mRaw.brandEn ?? null : mRaw.brand ?? null,
    model: isEn ? mRaw.modelEn ?? null : mRaw.model ?? null,
    properties: isEn ? mRaw.propertiesEn ?? null : mRaw.properties ?? null,
    applications: isEn ? mRaw.applicationsEn ?? null : mRaw.applications ?? null,
    description: isEn ? mRaw.descriptionEn ?? null : mRaw.description ?? null,
  };

  const viewer = await resolveViewer();
  const alreadySaved =
    viewer.userId != null
      ? await isSaved(viewer.userId, "material", m.id)
      : false;

  const [suppliers, dls, relatedFormulas] = await Promise.all([
    loadRelatedSuppliers(m.category),
    loadDownloads(m.id),
    loadRelatedFormulas(mRaw),
  ]);

  // getfrp.com (en): drop related rows whose English fields are empty so we
  // never render Chinese names/titles in the related-content cards.
  const suppliersView = isEn
    ? suppliers.filter((s) => s.nameEn && s.nameEn.trim())
    : suppliers;
  const dlsView = isEn ? dls.filter((d) => d.titleEn && d.titleEn.trim()) : dls;
  const relatedFormulasView = isEn
    ? relatedFormulas.filter((f) => f.nameEn && f.nameEn.trim())
    : relatedFormulas;

  const props = (m.properties ?? {}) as Record<string, string>;
  const applications = (m.applications ?? []) as string[];
  const propEntries = Object.entries(props).filter(([, v]) => v);

  const inLanguage = locale === "en" ? "en" : "zh-CN";
  // canonicalUrl must point at the current deploy, not always f1frp.com.
  // Was: `https://f1frp.com/${locale}/materials/${m.id}` — wrong on getfrp.com
  // and added a /{locale} segment that doesn't exist in the URL structure.
  const canonicalUrl = `${CURRENT_SITE_URL}/materials/${m.id}`;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    url: canonicalUrl,
    inLanguage,
    name: isEn ? mRaw.nameEn ?? mRaw.name : mRaw.name,
    description: m.description ?? undefined,
    mpn: m.model ?? undefined,
    category: m.subCategory ?? m.category,
    brand: m.brand
      ? { "@type": "Brand", name: m.brand }
      : undefined,
    manufacturer: (isEn ? suppliersView[0]?.nameEn : suppliersView[0]?.name)
      ? {
          "@type": "Organization",
          name: isEn ? suppliersView[0]?.nameEn : suppliersView[0]?.name,
        }
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
        <div className="flex flex-wrap items-center gap-2">
          <AskAiButton
            prompt={
              locale === "en"
                ? `Tell me about ${m.name}${m.brand ? ` from ${m.brand}` : ""}${m.model ? ` (${m.model})` : ""} — typical applications, equivalent grades from Western brands, and which Chinese suppliers offer it. Reply in SI and Imperial.`
                : `${m.name}${m.brand ? `（${m.brand}）` : ""}${m.model ? ` ${m.model}` : ""} 的主要应用、国外等效牌号、国内供应渠道。`
            }
          />
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

          {relatedFormulasView.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("relatedFormulas")}</CardTitle>
                <CardDescription>
                  {t("relatedFormulasSub", { count: relatedFormulasView.length })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {relatedFormulasView.map((f) => {
                  const fName = isEn ? f.nameEn ?? f.name : f.name;
                  const fProcess = isEn ? f.processEn : f.process;
                  const fApplication = isEn ? f.applicationEn : f.application;
                  const fRole = isEn ? f.roleEn : f.role;
                  return (
                    <Link
                      key={f.id}
                      href={`/formulas#${f.id}` as "/formulas"}
                      className="block rounded-md border bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/60"
                    >
                      <div className="font-medium">{fName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {fProcess && (
                          <Badge variant="outline" className="text-[10px]">
                            {fProcess}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {ts(f.section)}
                          {fRole ? `${isEn ? ": " : "："}${fRole}` : ""}
                        </Badge>
                        {fApplication && <span>· {fApplication}</span>}
                      </div>
                    </Link>
                  );
                })}
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
              {dlsView.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noDownloads")}
                </p>
              ) : (
                dlsView.map((d) => (
                  <a
                    key={d.id}
                    href={`/api/downloads/${d.id}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span className="truncate">{isEn ? d.titleEn ?? d.title : d.title}</span>
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
              {suppliersView.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noSuppliers")}
                </p>
              ) : (
                suppliersView.map((s) => (
                  <Link
                    key={s.id}
                    href={`/suppliers#${s.id}` as "/suppliers"}
                    className="block rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{isEn ? s.nameEn ?? s.name : s.name}</div>
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
                      {(isEn ? s.locationEn : s.location) ?? ""}
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
