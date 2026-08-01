import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { cache } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Factory,
  FileCheck2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld";
import { JsonLd } from "@/components/json-ld";
import { db } from "@/lib/db";
import {
  enterprises,
  materials as materialsTable,
  supplierListings,
} from "@/lib/db/schema";
import {
  getSupplierCategoryPage,
  SUPPLIER_CATEGORY_SLUGS,
  supplierMatchesCategory,
  type SupplierCategoryPage,
} from "@/lib/data/supplier-category-pages";
import { provincesEn } from "@/lib/data/suppliers";
import { alternates, og } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import {
  getSupplierRegionByName,
  getSupplierRegionPage,
  SUPPLIER_REGION_SLUGS,
  type SupplierRegionPage,
} from "@/lib/data/supplier-region-pages";

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [...SUPPLIER_CATEGORY_SLUGS, ...SUPPLIER_REGION_SLUGS].map((id) => ({ id }));
}

type NetworkRow = {
  id: string;
  name: string;
  nameEn: string | null;
  verified: boolean | null;
  province: string | null;
  category: string | null;
  productsEn: string[] | null;
  capabilities: string[] | null;
  processListEn: string[] | null;
  certificationsEn: string[] | null;
  scaleTier: string | null;
  exportReady: boolean;
};

type SupplierProfile = {
  supplier: typeof supplierListings.$inferSelect;
  enterprise: typeof enterprises.$inferSelect | null;
};

const loadSupplierProfile = cache(async (id: string): Promise<SupplierProfile | null> => {
  try {
    const [row] = await db
      .select({ supplier: supplierListings, enterprise: enterprises })
      .from(supplierListings)
      .leftJoin(enterprises, eq(supplierListings.enterpriseId, enterprises.id))
      .where(
        and(
          eq(supplierListings.id, id),
          eq(supplierListings.verified, true),
          isNotNull(supplierListings.enterpriseId),
        ),
      )
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
});

function categoryLabel(category: string | null, isEn: boolean): string {
  const labels: Record<string, [string, string]> = {
    manufacturer: ["复合材料产品供应商", "Composite product supplier"],
    fiber: ["纤维供应商", "Fiber supplier"],
    resin: ["树脂供应商", "Resin supplier"],
    additive: ["助剂供应商", "Additives supplier"],
    equipment: ["设备供应商", "Equipment supplier"],
    mold: ["模具制造商", "Mold maker"],
    tooling: ["工装与检测装备", "Tooling / NDT equipment"],
    service: ["检测与认证服务", "Testing / certification service"],
  };
  const value = category ? labels[category] : undefined;
  return value ? value[isEn ? 1 : 0] : category ?? (isEn ? "Supplier" : "供应商");
}

function renderSupplierProfile(profile: SupplierProfile, locale: string) {
  const { supplier, enterprise } = profile;
  const isEn = locale === "en";
  const name = (isEn ? supplier.nameEn : supplier.name) ?? supplier.name;
  const legalName = enterprise?.name ?? supplier.name;
  const description =
    (isEn ? supplier.descriptionEn : supplier.description) ??
    supplier.description ??
    enterprise?.description ??
    "";
  const location =
    (isEn ? supplier.locationEn : supplier.location) ??
    supplier.location ??
    [enterprise?.city, enterprise?.province].filter(Boolean).join(", ");
  const products = ((isEn ? supplier.productsEn : supplier.products) ?? supplier.products ?? []) as string[];
  const processes = ((isEn ? supplier.processListEn : supplier.processList) ?? supplier.processList ?? []) as string[];
  const certifications = ((isEn ? supplier.certificationsEn : supplier.certifications) ?? supplier.certifications ?? []) as string[];
  const productsServicesSummary =
    (isEn
      ? supplier.productsServicesSummaryEn
      : supplier.productsServicesSummary) ??
    supplier.productsServicesSummary ??
    description;
  const ecatalogs = supplier.ecatalogs ?? [];
  const website = supplier.website ?? enterprise?.website ?? null;
  const logo = enterprise?.logo ?? null;
  const pageUrl = `${CURRENT_SITE_URL}/suppliers/${supplier.id}`;
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    name: `${name} — ${isEn ? "verified company profile" : "已认证企业主页"}`,
    inLanguage: isEn ? "en" : "zh-CN",
    mainEntity: {
      "@type": "Organization",
      "@id": `${pageUrl}#organization`,
      name,
      legalName,
      url: website ?? pageUrl,
      sameAs: website ? [website] : undefined,
      logo: logo ?? undefined,
      foundingDate: supplier.established ? String(supplier.established) : undefined,
      description,
      email: enterprise?.contactEmail ?? undefined,
      telephone: enterprise?.contactPhone ? `+86-${enterprise.contactPhone}` : undefined,
      address: location
        ? {
            "@type": "PostalAddress",
            streetAddress: enterprise?.address ?? undefined,
            addressLocality: location,
            addressCountry: "CN",
          }
        : undefined,
      knowsAbout: products,
      hasOfferCatalog: ecatalogs.length
        ? {
            "@type": "OfferCatalog",
            name: `${name} eCatalog`,
            itemListElement: ecatalogs.map((catalog) => ({
              "@type": "CreativeWork",
              name: (isEn ? catalog.titleEn : catalog.title) ?? catalog.title,
              url: catalog.url,
              encodingFormat: catalog.format ?? "application/pdf",
            })),
          }
        : undefined,
    },
  };

  const labels = isEn
    ? {
        home: "Home",
        suppliers: "Suppliers",
        eyebrow: "VERIFIED COMPANY PROFILE",
        verified: "Verified business profile",
        legal: "Legal entity",
        established: "Legal entity established",
        location: "Location",
        category: "Business type",
        about: "Company overview",
        products: "Products and supply scope",
        processes: "Capabilities and services",
        certifications: "Document-backed certifications",
        noCerts: "No company-level certification is published without supporting documentation.",
        productsServices: "Products & services summary",
        ecatalog: "eCatalog",
        ecatalogSub: "Company catalogs and technical guides published by the supplier.",
        openCatalog: "Open catalog",
        contact: "Official company contact",
        contactSupplier: "Contact supplier",
        website: "Visit official website",
        verification: "What GetFRP verified",
        verifyItems: [
          "The business identity is linked to an approved GetFRP enterprise record.",
          "The official website and company-domain contact match this profile.",
          "Product and certification claims remain subject to document-level review.",
        ],
        note:
          "The verified badge covers the business identity and official-domain association. It does not certify every product, standard or performance claim.",
      }
    : {
        home: "首页",
        suppliers: "供应商目录",
        eyebrow: "已认证企业主页",
        verified: "企业身份已审核",
        legal: "法律主体",
        established: "法律主体成立年份",
        location: "所在地",
        category: "企业类型",
        about: "企业简介",
        products: "产品与供应范围",
        processes: "能力与服务",
        certifications: "有文件佐证的认证",
        noCerts: "未提供佐证文件的企业级认证不会在此展示。",
        productsServices: "产品与服务总结",
        ecatalog: "电子样本",
        ecatalogSub: "由企业公开发布的产品目录与技术手册。",
        openCatalog: "打开样本",
        contact: "企业官方联系方式",
        contactSupplier: "通过平台联系企业",
        website: "访问企业官网",
        verification: "复材站核验范围",
        verifyItems: [
          "该企业身份已关联至审核通过的企业记录。",
          "企业官网与公司域名联系方式已完成匹配。",
          "产品与认证主张仍须逐份文件审核。",
        ],
        note: "认证标识仅覆盖企业身份与官网关联，不代表对每项产品、标准或性能主张的认证。",
      };

  return (
    <main>
      <JsonLd data={profileJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: labels.home, url: `${CURRENT_SITE_URL}/` },
          { name: labels.suppliers, url: `${CURRENT_SITE_URL}/suppliers` },
          { name, url: pageUrl },
        ]}
      />

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">{labels.home}</Link>
            <span className="mx-2">›</span>
            <Link href="/suppliers" className="hover:text-foreground">{labels.suppliers}</Link>
            <span className="mx-2">›</span>
            <span>{name}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="flex items-start gap-5">
                {logo ? (
                  // Supplier logos are user-managed remote assets. Keep the
                  // original image URL rather than proxying it through GetFRP.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={`${name} logo`}
                    className="h-20 w-32 shrink-0 rounded-xl border border-border/70 bg-white object-contain p-2 sm:h-24 sm:w-40"
                  />
                ) : (
                  <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted text-2xl font-semibold sm:h-24 sm:w-40">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {labels.eyebrow}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">{name}</h1>
                    <Badge className="gap-1.5"><ShieldCheck size={13} />{labels.verified}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{legalName}{location ? ` · ${location}` : ""}</div>
                </div>
              </div>
              <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">{description}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link
                  href={`/rfq?supplier=${encodeURIComponent(supplier.id)}` as never}
                  className={buttonVariants()}
                >
                  {labels.contactSupplier} <ArrowRight size={15} />
                </Link>
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    {labels.website} <ExternalLink size={15} />
                  </a>
                )}
                {enterprise?.contactPhone && (
                  <a href={`tel:+86${enterprise.contactPhone}`} className={buttonVariants({ variant: "outline" })}>
                    <Phone size={15} /> +86 {enterprise.contactPhone}
                  </a>
                )}
              </div>
            </div>

            <aside className="rounded-xl border border-border/70 bg-muted/20 p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{labels.verification}</div>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                {labels.verifyItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border/70 pt-4 text-[11px] leading-relaxed text-muted-foreground">{labels.note}</p>
            </aside>
          </div>
        </div>
      </section>

      <nav className="border-b border-border/80 bg-background" aria-label="Company profile sections">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-3 text-sm font-medium sm:px-6">
          <a href="#company-profile" className="whitespace-nowrap hover:text-primary">{labels.about}</a>
          <a href="#products-services" className="whitespace-nowrap hover:text-primary">{labels.productsServices}</a>
          <a href="#ecatalog" className="whitespace-nowrap hover:text-primary">{labels.ecatalog}</a>
          <a href="#contact" className="whitespace-nowrap hover:text-primary">{labels.contact}</a>
        </div>
      </nav>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-background p-5"><Building2 size={18} /><div className="mt-3 text-xs text-muted-foreground">{labels.legal}</div><div className="mt-1 text-sm font-semibold">{legalName}</div></div>
          <div className="rounded-xl border border-border/70 bg-background p-5"><CalendarDays size={18} /><div className="mt-3 text-xs text-muted-foreground">{labels.established}</div><div className="mt-1 text-sm font-semibold">{supplier.established ?? "—"}</div></div>
          <div className="rounded-xl border border-border/70 bg-background p-5"><MapPin size={18} /><div className="mt-3 text-xs text-muted-foreground">{labels.location}</div><div className="mt-1 text-sm font-semibold">{location || "China"}</div></div>
          <div className="rounded-xl border border-border/70 bg-background p-5"><Factory size={18} /><div className="mt-3 text-xs text-muted-foreground">{labels.category}</div><div className="mt-1 text-sm font-semibold">{categoryLabel(supplier.category, isEn)}</div></div>
        </div>
      </section>

      <section id="company-profile" className="scroll-mt-20 border-b border-border/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{labels.about}</div><p className="mt-4 text-[15px] leading-7 text-muted-foreground">{description}</p></div>
            <div id="products-services" className="scroll-mt-20">
              <h2 className="text-xl font-semibold">{labels.productsServices}</h2>
              <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{productsServicesSummary}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div><h3 className="text-sm font-semibold">{labels.products}</h3><div className="mt-3 flex flex-wrap gap-2">{products.map((item) => <Badge key={item} variant="outline" className="px-3 py-1.5">{item}</Badge>)}</div></div>
                <div><h3 className="text-sm font-semibold">{labels.processes}</h3><div className="mt-3 flex flex-wrap gap-2">{processes.map((item) => <Badge key={item} variant="secondary" className="px-3 py-1.5">{item}</Badge>)}</div></div>
              </div>
            </div>
            <div><h2 className="text-xl font-semibold">{labels.certifications}</h2>{certifications.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{certifications.map((item) => <Badge key={item} variant="outline" className="border-amber-400 px-3 py-1.5 text-amber-700">{item}</Badge>)}</div> : <p className="mt-3 text-sm text-muted-foreground">{labels.noCerts}</p>}</div>

            <div id="ecatalog" className="scroll-mt-20">
              <h2 className="text-xl font-semibold">{labels.ecatalog}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{labels.ecatalogSub}</p>
              {ecatalogs.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {ecatalogs.map((catalog) => {
                    const catalogTitle = (isEn ? catalog.titleEn : catalog.title) ?? catalog.title;
                    const catalogDescription = (isEn ? catalog.descriptionEn : catalog.description) ?? catalog.description;
                    return (
                      <a
                        key={catalog.url}
                        href={catalog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-xl border border-border/70 bg-background p-5 transition-colors hover:border-foreground/40"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <FileCheck2 size={20} className="shrink-0" />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{catalog.format ?? "PDF"}</span>
                        </div>
                        <h3 className="mt-4 font-semibold group-hover:underline">{catalogTitle}</h3>
                        {catalogDescription && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{catalogDescription}</p>}
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium">{labels.openCatalog}<ExternalLink size={12} /></span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{isEn ? "No eCatalog has been published yet." : "企业暂未发布电子样本。"}</p>
              )}
            </div>
          </div>

          <aside id="contact" className="h-fit scroll-mt-20 rounded-xl border border-border/70 bg-background p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{labels.contact}</div>
            <Link href={`/rfq?supplier=${encodeURIComponent(supplier.id)}` as never} className={`${buttonVariants()} mt-5 w-full`}>
              {labels.contactSupplier} <ArrowRight size={15} />
            </Link>
            <div className="mt-5 space-y-4 text-sm">
              {website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:underline"><Globe2 size={16} className="mt-0.5 shrink-0" /><span>{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span></a>}
              {enterprise?.contactEmail && <a href={`mailto:${enterprise.contactEmail}`} className="flex items-start gap-3 hover:underline"><Mail size={16} className="mt-0.5 shrink-0" /><span>{enterprise.contactEmail}</span></a>}
              {enterprise?.contactPhone && <a href={`tel:+86${enterprise.contactPhone}`} className="flex items-start gap-3 hover:underline"><Phone size={16} className="mt-0.5 shrink-0" /><span>+86 {enterprise.contactPhone}</span></a>}
              {enterprise?.address && <div className="flex items-start gap-3 text-muted-foreground"><MapPin size={16} className="mt-0.5 shrink-0" /><span>{enterprise.address}</span></div>}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

async function loadCategoryNetwork(
  category: SupplierCategoryPage,
): Promise<NetworkRow[]> {
  try {
    const rows = await db
      .select({
        id: supplierListings.id,
        name: supplierListings.name,
        nameEn: supplierListings.nameEn,
        verified: supplierListings.verified,
        province: supplierListings.province,
        category: supplierListings.category,
        productsEn: supplierListings.productsEn,
        capabilities: supplierListings.capabilities,
        processListEn: supplierListings.processListEn,
        certificationsEn: supplierListings.certificationsEn,
        scaleTier: supplierListings.scaleTier,
        exportReady: supplierListings.exportReady,
      })
      .from(supplierListings)
      .orderBy(
        desc(supplierListings.verified),
        desc(supplierListings.exportReady),
        desc(supplierListings.brandPriority),
        desc(supplierListings.viewCount),
      );
    return rows.filter((row) => supplierMatchesCategory(category, row));
  } catch {
    return [];
  }
}

function normalizedCerts(row: NetworkRow): string[] {
  return Array.from(
    new Set(
      (row.certificationsEn ?? [])
        .map((cert) => cert.trim())
        .filter(Boolean),
    ),
  );
}

function scaleLabel(tier: string | null): string {
  switch (tier) {
    case "XL":
      return "Major scale";
    case "L":
      return "Large scale";
    case "M":
      return "Mid scale";
    case "S":
      return "Specialist scale";
    default:
      return "Scale under review";
  }
}

const CATEGORY_SEO_TITLES: Record<string, string> = {
  "frp-grating": "FRP Grating Suppliers China — 38 Verified Factories | getfrp",
  "pultruded-profiles": "Pultruded FRP Profiles Suppliers China — 29 Verified Factories | getfrp",
  "fiberglass-sheet": "Fiberglass Sheet Suppliers China — 19 Verified Factories | getfrp",
  "frp-rebar": "FRP Rebar Suppliers China — Verified Fiberglass Rebar Factories | getfrp",
  "frp-pipe": "FRP Pipe Suppliers China — Verified Fiberglass Pipe Factories | getfrp",
  "smc-bmc": "SMC BMC Manufacturers China — Verified Composite Molders | getfrp",
  "resin-gelcoat": "FRP Resin & Gelcoat Manufacturers China — Verified Suppliers | getfrp",
  "fiber-glass": "Fiberglass Fiber Suppliers China — Verified E-Glass Producers | getfrp",
};

const CATEGORY_STANDARD_LINKS: Record<string, Array<{ id: string; label: string }>> = {
  "frp-grating": [
    { id: "cn-002", label: "GB/T 1447 — tensile properties of FRP" },
    { id: "cn-004", label: "GB/T 1449 — flexural properties of FRP" },
  ],
  "pultruded-profiles": [
    { id: "cn-006", label: "GB/T 1451 — short-beam strength" },
    { id: "cn-009", label: "GB/T 3354 — tensile properties of carbon fibre" },
  ],
  "fiberglass-sheet": [
    { id: "cn-002", label: "GB/T 1447 — tensile properties of FRP" },
    { id: "cn-004", label: "GB/T 1449 — flexural properties of FRP" },
  ],
  "frp-rebar": [
    { id: "cn-002", label: "GB/T 1447 — tensile properties of FRP" },
    { id: "cn-005", label: "GB/T 1450.1 — shear strength" },
  ],
  "frp-pipe": [
    { id: "cn-003", label: "GB/T 1448 — compression properties of FRP" },
    { id: "cn-006", label: "GB/T 1451 — short-beam strength" },
  ],
  "smc-bmc": [
    { id: "cn-002", label: "GB/T 1447 — tensile properties of FRP" },
    { id: "cn-004", label: "GB/T 1449 — flexural properties of FRP" },
  ],
  "resin-gelcoat": [
    { id: "cn-001", label: "GB/T 1446 — general test methods" },
    { id: "cn-010", label: "GB/T 3355 — compressive properties of carbon fibre" },
  ],
  "fiber-glass": [
    { id: "cn-007", label: "GB/T 1458 — winding-tube tensile test" },
    { id: "cn-009", label: "GB/T 3354 — tensile properties of carbon fibre" },
  ],
};

type RelatedMaterial = { id: string; name: string; category: string | null };

async function loadRelatedMaterials(category: SupplierCategoryPage): Promise<RelatedMaterial[]> {
  try {
    const rows = await db
      .select({
        id: materialsTable.id,
        name: materialsTable.nameEn,
        category: materialsTable.category,
      })
      .from(materialsTable)
      .where(
        and(
          eq(materialsTable.status, "verified"),
          isNotNull(materialsTable.nameEn),
          ne(materialsTable.nameEn, ""),
        ),
      )
      .limit(400);
    const terms = category.match.keywords.map((term) => term.toLowerCase());
    return rows
      .filter((row) => {
        const haystack = `${row.name ?? ""} ${row.category ?? ""}`.toLowerCase();
        return terms.some((term) => haystack.includes(term));
      })
      .slice(0, 6)
      .map((row) => ({
        id: row.id,
        name: row.name ?? row.id,
        category: row.category,
      }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const category = getSupplierCategoryPage(id);
  const region = getSupplierRegionPage(id);
  if (locale === "en" && region) {
    const title = `FRP & Composite Manufacturers in ${region.name}, China — Verified Directory | getfrp`;
    return {
      title: { absolute: title },
      description: region.summary,
      alternates: alternates(`/suppliers/${region.slug}`),
      openGraph: og(`/suppliers/${region.slug}`, { title, description: region.summary }),
    };
  }
  if (locale === "en" && category) {
    const title = CATEGORY_SEO_TITLES[category.slug] ??
      `${category.name} Suppliers China — ${category.snapshotCount} Verified Factories | getfrp`;
    return {
      title: { absolute: title },
      description: category.summary,
      alternates: alternates(`/suppliers/${category.slug}`),
      openGraph: og(`/suppliers/${category.slug}`, {
        title,
        description: category.summary,
      }),
    };
  }
  const profile = await loadSupplierProfile(id);
  if (!profile) {
    return {
      robots: { index: false, follow: false },
      alternates: alternates(`/suppliers/${id}`),
    };
  }
  const supplierName =
    (locale === "en" ? profile.supplier.nameEn : profile.supplier.name) ??
    profile.supplier.name;
  const description =
    (locale === "en" ? profile.supplier.descriptionEn : profile.supplier.description) ??
    profile.supplier.description ??
    `${supplierName} supplier profile.`;
  const title = locale === "en"
    ? `${supplierName} — Verified FRP Supplier Profile | getfrp`
    : `${supplierName}｜已认证复材企业主页`;
  return {
    title: { absolute: title },
    description,
    alternates: alternates(`/suppliers/${id}`),
    openGraph: og(`/suppliers/${id}`, {
      title,
      description,
    }),
  };
}

async function loadRegionNetwork(region: SupplierRegionPage): Promise<NetworkRow[]> {
  try {
    return await db
      .select({
        id: supplierListings.id,
        name: supplierListings.name,
        nameEn: supplierListings.nameEn,
        verified: supplierListings.verified,
        province: supplierListings.province,
        category: supplierListings.category,
        productsEn: supplierListings.productsEn,
        capabilities: supplierListings.capabilities,
        processListEn: supplierListings.processListEn,
        certificationsEn: supplierListings.certificationsEn,
        scaleTier: supplierListings.scaleTier,
        exportReady: supplierListings.exportReady,
      })
      .from(supplierListings)
      .where(
        and(
          eq(supplierListings.province, region.provinceToken),
        ),
      )
      .orderBy(
        desc(supplierListings.verified),
        desc(supplierListings.exportReady),
        desc(supplierListings.brandPriority),
        desc(supplierListings.viewCount),
      );
  } catch {
    return [];
  }
}

async function renderRegionPage(region: SupplierRegionPage) {
  const network = await loadRegionNetwork(region);
  const provinceCount = network.length || region.snapshotCount;
  const certCount = network.filter((row) => normalizedCerts(row).length > 0).length;
  const exportReadyCount = network.filter((row) => row.exportReady).length;
  const featured = network;
  const pageUrl = `${CURRENT_SITE_URL}/suppliers/${region.slug}`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: region.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `FRP & Composite Manufacturers in ${region.name}, China`,
    description: region.summary,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: { "@id": `${CURRENT_SITE_URL}/#website` },
    about: { "@type": "Place", name: `${region.name}, China` },
    mainEntity: {
      "@type": "ItemList",
      name: `Verified FRP capability records in ${region.name}`,
      numberOfItems: provinceCount,
    },
  };

  return (
    <main>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${CURRENT_SITE_URL}/` },
          { name: "Suppliers", url: `${CURRENT_SITE_URL}/suppliers` },
          { name: region.name, url: pageUrl },
        ]}
      />
      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/suppliers" className="hover:text-foreground">Suppliers</Link>
            <span className="mx-2">›</span>
            <span>{region.name}</span>
          </nav>
          <div className="mt-6 max-w-4xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              VERIFIED REGIONAL CLUSTER
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
              FRP &amp; Composite Manufacturers in {region.name}, China
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
              {region.summary}
            </p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background p-5"><Factory size={18} strokeWidth={1.5} /><div className="mt-4 text-3xl font-semibold">{provinceCount}</div><div className="mt-1 text-xs text-muted-foreground">Verified regional records</div></div>
            <div className="rounded-xl border border-border/70 bg-background p-5"><MapPin size={18} strokeWidth={1.5} /><div className="mt-4 text-3xl font-semibold">{region.categoryFocus.length}+</div><div className="mt-1 text-xs text-muted-foreground">Priority categories</div></div>
            <div className="rounded-xl border border-border/70 bg-background p-5"><FileCheck2 size={18} strokeWidth={1.5} /><div className="mt-4 text-3xl font-semibold">{certCount || "RFQ"}</div><div className="mt-1 text-xs text-muted-foreground">Records with documents</div></div>
            <div className="rounded-xl border border-border/70 bg-background p-5"><ShieldCheck size={18} strokeWidth={1.5} /><div className="mt-4 text-3xl font-semibold">{exportReadyCount || "QA"}</div><div className="mt-1 text-xs text-muted-foreground">Export-ready matches</div></div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Public regional records are searchable here. Verification status and certificate scope are rechecked against the requested product before release.</p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">REGIONAL CAPABILITY OVERVIEW</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">How to use the {region.name} cluster</h2>
          <div className="mt-5 max-w-4xl space-y-4 text-[15px] leading-7 text-muted-foreground">
            {region.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">PRIORITY CATEGORIES</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Move from province to product specification</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {region.categoryFocus.map((focus) => (
              <Link key={focus.slug} href={`/suppliers/${focus.slug}` as "/suppliers/[id]"} className="rounded-xl border border-border/70 bg-background p-5 transition-colors hover:border-foreground/40">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{focus.label}</span><ArrowRight size={15} /></div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{focus.note}</p>
                <span className="mt-4 inline-block text-xs underline underline-offset-4">View public network</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link href="/standards" className="rounded-md border border-border px-4 py-2 hover:bg-background">GB ↔ ASTM ↔ ISO ↔ EN crosswalk</Link>
            <Link href="/source-from-china" className="rounded-md border border-border px-4 py-2 hover:bg-background">China sourcing playbook</Link>
            <Link href="/materials" className="rounded-md border border-border px-4 py-2 hover:bg-background">Browse material specifications</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">PUBLIC NETWORK COMPOSITION</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Capability records in the {region.name} cluster</h2>
          {featured.length > 0 ? <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featured.map((row, index) => {
            const products = [...(row.capabilities ?? []), ...(row.productsEn ?? [])].filter(Boolean).slice(0, 4);
            const certs = normalizedCerts(row).slice(0, 3);
            return <article key={row.id} className="rounded-xl border border-border/70 bg-background p-6">
              <div className="flex items-center justify-between gap-3"><Badge variant="outline">{row.verified ? "Verified" : "Public"} {region.slug.slice(0, 3).toUpperCase()}-{String(index + 1).padStart(3, "0")}</Badge>{row.exportReady && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Export-ready</span>}</div>
              <div className="mt-5 text-base font-semibold">{row.nameEn ?? row.name}</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium"><MapPin size={14} />{region.name}, China</div>
              <div className="mt-2 text-xs text-muted-foreground">{scaleLabel(row.scaleTier)}</div>
              {products.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{products.map((product) => <span key={product} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">{product}</span>)}</div>}
              <div className="mt-4 border-t border-border/60 pt-4 text-[12px] leading-relaxed text-muted-foreground">{certs.length > 0 ? `Documents on file: ${certs.join(" · ")}` : "Product evidence reviewed during RFQ matching."}</div>
            </article>;
          })}</div> : <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">Live capability cards are refreshed against the public network when a specification is submitted.</p>}
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">REGIONAL FAQ</div>
          <div className="mt-7 divide-y divide-border/70 border-y border-border/70">{region.faqs.map((faq) => <article key={faq.question} className="py-6"><h3 className="text-base font-semibold">{faq.question}</h3><p className="mt-2 text-[14px] leading-7 text-muted-foreground">{faq.answer}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-foreground py-14 text-background"><div className="mx-auto max-w-3xl px-4 text-center sm:px-6"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/65">MATCHED WITHIN 24 HOURS</div><h2 className="mt-3 text-3xl font-semibold tracking-tight">Need a {region.name} capability checked?</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-background/75">Send the product, standards, quantity, destination and evidence requirements. We compare the regional cluster with the wider verified network and return a controlled shortlist.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/rfq" className={buttonVariants({ size: "lg", variant: "secondary" })}>Submit RFQ <ArrowRight size={15} /></Link><Link href="/suppliers" className="inline-flex items-center rounded-md border border-background/30 px-5 py-2.5 text-sm hover:bg-background/10">Browse all suppliers</Link></div></div></section>
    </main>
  );
}

export default async function SupplierCategoryPageRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const category = getSupplierCategoryPage(id);
  const region = getSupplierRegionPage(id);
  if (region) {
    if (locale !== "en") notFound();
    return renderRegionPage(region);
  }
  if (!category) {
    const profile = await loadSupplierProfile(id);
    if (!profile) notFound();
    return renderSupplierProfile(profile, locale);
  }
  if (locale !== "en") notFound();

  const network = await loadCategoryNetwork(category);
  const relatedMaterials = await loadRelatedMaterials(category);
  const provinceCounts = new Map<string, number>();
  for (const row of network) {
    if (!row.province) continue;
    const label = provincesEn[row.province] ?? row.province;
    provinceCounts.set(label, (provinceCounts.get(label) ?? 0) + 1);
  }
  const provinces = [...provinceCounts.entries()].sort((a, b) => b[1] - a[1]);
  const provinceCount =
    provinces.length || Object.keys(category.provinceNotes).length;
  const liveCeCount = network.filter((row) =>
    normalizedCerts(row).some((cert) => /\bce\b/i.test(cert)),
  ).length;
  const liveIsoCount = network.filter((row) =>
    normalizedCerts(row).some((cert) => /iso\s*9001/i.test(cert)),
  ).length;
  const featured = network;

  const pageUrl = `${CURRENT_SITE_URL}/suppliers/${category.slug}`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: category.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `China ${category.name} Manufacturers — Verified Supply Network`,
    description: category.summary,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: { "@id": `${CURRENT_SITE_URL}/#website` },
    about: {
      "@type": "Thing",
      name: `${category.name} manufacturing in China`,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `Public ${category.name} supplier records`,
      numberOfItems: network.length || category.snapshotCount,
    },
  };

  return (
    <main>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${CURRENT_SITE_URL}/` },
          { name: "Suppliers", url: `${CURRENT_SITE_URL}/suppliers` },
          { name: category.shortName, url: pageUrl },
        ]}
      />

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/suppliers" className="hover:text-foreground">Suppliers</Link>
            <span className="mx-2">›</span>
            <span>{category.shortName}</span>
          </nav>
          <div className="mt-6 max-w-4xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              VERIFIED CHINA SUPPLY NETWORK
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
              China {category.name} Manufacturers — Verified Supply Network
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
              {category.summary}
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <Factory size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">{network.length || category.snapshotCount}</div>
              <div className="mt-1 text-xs text-muted-foreground">Public supplier records</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <MapPin size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">{provinceCount}</div>
              <div className="mt-1 text-xs text-muted-foreground">Production clusters covered</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <FileCheck2 size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">
                {category.certifiedSnapshot?.count ?? liveIsoCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {category.certifiedSnapshot?.label ?? "ISO 9001 records in live match"}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <ShieldCheck size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">
                {liveCeCount || "RFQ"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {liveCeCount ? "CE records in live match" : "Evidence rechecked before release"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Public records are searchable before an RFQ. Verification status,
            certificate scope and validity are rechecked against the offered
            product before each commercial shortlist.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              CAPABILITY OVERVIEW
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              What to compare before requesting prices
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-7 text-muted-foreground">
              {category.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-xl border border-border/70 bg-muted/20 p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MATCHING PRINCIPLE
            </div>
            <h2 className="mt-2 text-lg font-semibold">
              Capability and identity, visible from the start.
            </h2>
            <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
              {[
                "Factory legal identity and manufacturing status checked",
                "Product and process capability matched to the RFQ",
                "Certificate scope and validity reviewed before reliance",
                "Samples and inspection criteria tied to one specification",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            TYPICAL SPECIFICATIONS
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Build a quote sheet factories can answer consistently
          </h2>
          <div className="mt-7 overflow-hidden rounded-xl border border-border/70 bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-border/70 bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Field</th>
                    <th className="px-5 py-3 font-medium">Typical range</th>
                    <th className="px-5 py-3 font-medium">Sourcing note</th>
                  </tr>
                </thead>
                <tbody>
                  {category.specifications.map((spec) => (
                    <tr key={spec.field} className="border-b border-border/50 last:border-0">
                      <th className="px-5 py-4 font-medium text-foreground">{spec.field}</th>
                      <td className="px-5 py-4 text-foreground/85">{spec.typicalRange}</td>
                      <td className="px-5 py-4 text-muted-foreground">{spec.sourcingNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-10">
            <h3 className="text-lg font-semibold tracking-tight">
              Procurement checks before supplier release
            </h3>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {category.buyingChecks.map((check) => (
                <li
                  key={check}
                  className="flex gap-3 rounded-lg border border-border/70 bg-background p-4 text-[13px] leading-relaxed text-muted-foreground"
                >
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0 text-foreground"
                  />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            NETWORK COMPOSITION
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Public supplier profiles from the composite network
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These cards expose supplier names, production location and capability
            evidence for first-pass comparison. Verification status remains
            visible so buyers can distinguish public records from records checked
            by the sourcing team.
          </p>

          {featured.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((row, index) => {
                const products = [
                  ...(row.capabilities ?? []),
                  ...(row.productsEn ?? []),
                ].filter(Boolean).slice(0, 4);
                const certs = normalizedCerts(row).slice(0, 4);
                return (
                  <article
                    key={row.id}
                    className="rounded-xl border border-border/70 bg-background p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">
                        {row.verified ? "Verified" : "Public"} #{category.slug.slice(0, 3).toUpperCase()}-{String(index + 1).padStart(3, "0")}
                      </Badge>
                      {row.exportReady && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Export-ready
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-sm font-medium">
                      <MapPin size={14} />
                      {provincesEn[row.province ?? ""] ?? row.province ?? "China"}
                    </div>
                    <div className="mt-2 text-base font-semibold">
                      {row.nameEn ?? row.name}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {scaleLabel(row.scaleTier)}
                    </div>
                    {products.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {products.map((product) => (
                          <span key={product} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                            {product}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 border-t border-border/60 pt-4 text-[12px] leading-relaxed text-muted-foreground">
                      {certs.length > 0
                        ? `Documents on file: ${certs.join(" · ")}`
                        : "Product evidence reviewed during RFQ matching."}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
              Live capability cards are being refreshed. The public records and
              sourcing specification above remain available; submit
              an RFQ to receive a current evidence-based shortlist.
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            PROVINCE DISTRIBUTION
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            China production clusters in this category
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(category.provinceNotes).map(([province, note]) => (
              <article key={province} className="rounded-xl border border-border/70 bg-background p-5">
                <div className="flex items-center justify-between gap-3">
                  {getSupplierRegionByName(province) ? (
                    <Link
                      href={`/suppliers/${getSupplierRegionByName(province)!.slug}` as "/suppliers/[id]"}
                      className="font-semibold hover:underline"
                    >
                      {province} cluster
                    </Link>
                  ) : (
                    <h3 className="font-semibold">{province}</h3>
                  )}
                  {provinceCounts.has(province) && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {provinceCounts.get(province)} matched
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            RELATED EVIDENCE
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Materials and standards to check with this category
          </h2>
          <div className="mt-7 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold">Material specifications</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Move from a supplier capability to a defined material or grade
                before asking for a price. These verified material records are
                the specification layer used during matching.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {relatedMaterials.map((material) => (
                  <Link
                    key={material.id}
                    href={`/materials/${encodeURIComponent(material.id)}` as never}
                    className="rounded-md border border-border bg-background px-3 py-2 text-xs hover:border-foreground/50"
                  >
                    {material.name}
                  </Link>
                ))}
                <Link href="/materials" className="rounded-md border border-border bg-background px-3 py-2 text-xs hover:border-foreground/50">
                  Browse all materials →
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold">Standards cross-reference</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Confirm the test method and certificate scope before treating a
                factory claim as a compliance result. Start with the relevant
                GB records, then compare the project’s ASTM, ISO or EN call-up.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(CATEGORY_STANDARD_LINKS[category.slug] ?? []).map((standard) => (
                  <Link
                    key={standard.id}
                    href={`/standards/${standard.id}` as never}
                    className="rounded-md border border-border bg-background px-3 py-2 text-xs hover:border-foreground/50"
                  >
                    {standard.label}
                  </Link>
                ))}
                <Link href="/standards" className="rounded-md border border-border bg-background px-3 py-2 text-xs hover:border-foreground/50">
                  Open standards crosswalk →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            BUYER FAQ
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Questions specific to sourcing {category.shortName}
          </h2>
          <div className="mt-7 divide-y divide-border/70 border-y border-border/70">
            {category.faqs.map((faq) => (
              <article key={faq.question} className="py-6">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-[14px] leading-7 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground py-14 text-background">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/65">
            MATCHED WITHIN 24 HOURS
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Need this category? Submit one controlled RFQ.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-background/75">
            Send the specification, quantity, destination and required
            documentation. We compare the public supplier network, flag gaps and
            return a shortlist without exposing your request to an open marketplace.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={"/rfq" as never}
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              Submit RFQ <ArrowRight size={15} />
            </Link>
            <Link
              href="/suppliers"
              className="inline-flex items-center rounded-md border border-background/30 px-5 py-2.5 text-sm hover:bg-background/10"
            >
              Browse all categories
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
