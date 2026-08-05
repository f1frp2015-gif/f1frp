import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
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
  supplierProducts,
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
import { taxonomyLabel } from "@/lib/supplier-products/taxonomy";

export const revalidate = 60;
export const dynamicParams = true;

// Preserve supplier URLs that have already been indexed or shared publicly.
// The database keeps a stable internal ID; the public route uses an SEO slug.
const SUPPLIER_PROFILE_ID_BY_SLUG: Record<string, string> = {
  "jiangsu-jiuding-new-materials": "sup-jiuding",
};

const SUPPLIER_PROFILE_SLUG_BY_ID = Object.fromEntries(
  Object.entries(SUPPLIER_PROFILE_ID_BY_SLUG).map(([slug, id]) => [id, slug]),
) as Record<string, string>;

function resolveSupplierProfileId(routeId: string): string {
  return SUPPLIER_PROFILE_ID_BY_SLUG[routeId] ?? routeId;
}

function supplierProfilePath(supplierId: string): string {
  return `/suppliers/${SUPPLIER_PROFILE_SLUG_BY_ID[supplierId] ?? supplierId}`;
}

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
  profilePublished: boolean;
};

type SupplierProfile = {
  supplier: typeof supplierListings.$inferSelect;
  enterprise: typeof enterprises.$inferSelect | null;
  structuredProducts: Array<{
    id: string;
    name: string;
    nameEn: string;
    description: string | null;
    descriptionEn: string | null;
    objectType: string;
    productFamily: string;
    form: string | null;
    processes: string[];
    materials: string[];
    resins: string[];
    applications: string[];
    standards: string[];
    specifications: Record<string, string>;
    classificationStatus: string;
  }>;
};

const loadSupplierProfile = cache(async (id: string): Promise<SupplierProfile | null> => {
  try {
    let row: Omit<SupplierProfile, "structuredProducts"> | undefined;
    let identityError: unknown;
    // A sleeping Neon compute can exceed the first HTTP-query window. Retry
    // once so a transient cold start does not become a cached supplier 404.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const [result] = await db
          .select({ supplier: supplierListings, enterprise: enterprises })
          .from(supplierListings)
          .leftJoin(enterprises, eq(supplierListings.enterpriseId, enterprises.id))
          .where(
            and(
              eq(supplierListings.id, id),
              eq(supplierListings.profilePublished, true),
            ),
          )
          .limit(1);
        row = result;
        identityError = undefined;
        break;
      } catch (error) {
        identityError = error;
      }
    }
    if (identityError) {
      console.error(
        "[supplier-profile] identity unavailable after retry:",
        identityError instanceof Error ? identityError.message : identityError,
      );
    }
    if (!row) return null;
    let structuredProducts: SupplierProfile["structuredProducts"] = [];
    try {
      structuredProducts = await db
        .select({
          id: supplierProducts.id,
          name: supplierProducts.name,
          nameEn: supplierProducts.nameEn,
          description: supplierProducts.description,
          descriptionEn: supplierProducts.descriptionEn,
          objectType: supplierProducts.objectType,
          productFamily: supplierProducts.productFamily,
          form: supplierProducts.form,
          processes: supplierProducts.processes,
          materials: supplierProducts.materials,
          resins: supplierProducts.resins,
          applications: supplierProducts.applications,
          standards: supplierProducts.standards,
          specifications: supplierProducts.specifications,
          classificationStatus: supplierProducts.classificationStatus,
        })
        .from(supplierProducts)
        .where(
          and(
            eq(supplierProducts.supplierListingId, id),
            eq(supplierProducts.publicationStatus, "published"),
          ),
        )
        .orderBy(desc(supplierProducts.createdAt));
    } catch (error) {
      // The public company identity remains available if a catalog migration
      // is temporarily unavailable; only the structured catalog is omitted.
      console.warn(
        "[supplier-profile] structured catalog unavailable:",
        error instanceof Error ? error.message : error,
      );
    }
    return { ...row, structuredProducts };
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
  const { supplier, enterprise, structuredProducts } = profile;
  const isEn = locale === "en";
  const isVerified = Boolean(supplier.verified && enterprise);
  const isClaimed = Boolean(enterprise);
  const name = (isEn ? supplier.nameEn : supplier.name) ?? supplier.name;
  const legalName = enterprise?.name ?? supplier.nameEn ?? supplier.name;
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
  const logo = supplier.logo ?? enterprise?.logo ?? null;
  const contactEmail = supplier.contactEmail ?? enterprise?.contactEmail ?? null;
  const contactPhone = supplier.contactPhone ?? enterprise?.contactPhone ?? null;
  const address = supplier.address ?? enterprise?.address ?? null;
  const phoneHref = contactPhone
    ? `tel:${contactPhone.trim().startsWith("+") ? contactPhone.replace(/[^\d+]/g, "") : `+86${contactPhone.replace(/\D/g, "")}`}`
    : null;
  const pageUrl = `${CURRENT_SITE_URL}${supplierProfilePath(supplier.id)}`;
  const profileKind = isVerified
    ? isEn ? "verified company profile" : "已认证企业主页"
    : isClaimed
      ? isEn ? "claimed company profile" : "已认领企业主页"
      : isEn ? "public company profile" : "公开企业档案";
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    name: `${name} — ${profileKind}`,
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
      email: contactEmail ?? undefined,
      telephone: contactPhone ?? undefined,
      address: location
        ? {
            "@type": "PostalAddress",
            streetAddress: address ?? undefined,
            addressLocality: location,
            addressCountry: "CN",
          }
        : undefined,
      knowsAbout: products,
      hasOfferCatalog: structuredProducts.length
        ? {
            "@type": "OfferCatalog",
            name: `${name} structured product catalog`,
            itemListElement: structuredProducts.map((product) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Product",
                name: isEn ? product.nameEn : product.name,
                description:
                  (isEn ? product.descriptionEn : product.description) ??
                  product.descriptionEn ??
                  product.description ??
                  undefined,
                category: taxonomyLabel("family", product.productFamily, isEn ? "en" : "zh"),
              },
            })),
          }
        : undefined,
    },
  };

  const labels = isEn
    ? {
        home: "Home",
        suppliers: "Suppliers",
        eyebrow: isVerified ? "VERIFIED COMPANY PROFILE" : isClaimed ? "CLAIMED COMPANY PROFILE" : "PUBLIC COMPANY PROFILE",
        verified: isVerified ? "Verified business profile" : isClaimed ? "Claimed company profile" : "Public profile · Not claimed",
        legal: "Legal entity",
        established: isVerified ? "Legal entity established" : "Manufacturing since (company statement)",
        location: "Location",
        category: "Business type",
        about: "Company overview",
        products: "Products and supply scope",
        processes: "Capabilities and services",
        certifications: isVerified ? "Document-backed certifications" : "Company-published certifications",
        noCerts: "No company-level certification is listed on this profile.",
        productsServices: "Products & services summary",
        structuredCatalog: "Structured product catalog",
        structuredCatalogSub: "Search-ready product records classified by product type, form, process, material and standard.",
        supplierConfirmed: "Supplier-confirmed classification",
        supplierConfirmedNote: "The supplier confirmed these classification fields. GetFRP has not independently verified product performance or standards compliance.",
        model: "Model",
        dimensions: "Dimensions",
        moq: "MOQ",
        leadTime: "Lead time",
        ecatalog: "eCatalog",
        ecatalogSub: "Official product catalogs, web directories and technical guides published by the supplier.",
        openCatalog: "Open catalog",
        contact: isVerified ? "Official company contact" : "Public company contact",
        contactSupplier: isVerified ? "Contact supplier" : "Send inquiry via GetFRP",
        website: "Visit official website",
        verification: isVerified ? "What GetFRP verified" : "Profile status",
        verifyItems: isVerified
          ? [
              "The business identity is linked to an approved GetFRP enterprise record.",
              "The official website and company-domain contact match this profile.",
              "Product and certification claims remain subject to document-level review.",
            ]
          : [
              "GetFRP compiled this profile from the company's official website.",
              "The website, company-domain emails and telephone are published as contact references.",
              "The company has not claimed or completed business-identity verification for this profile.",
            ],
        note: isVerified
          ? "The verified badge covers the business identity and official-domain association. It does not certify every product, standard or performance claim."
          : "Company, product and certification statements are attributed to the official website and have not been independently audited by GetFRP.",
      }
    : {
        home: "首页",
        suppliers: "供应商目录",
        eyebrow: isVerified ? "已认证企业主页" : isClaimed ? "已认领企业主页" : "公开企业档案",
        verified: isVerified ? "企业身份已审核" : isClaimed ? "企业已认领" : "公开档案 · 尚未认领",
        legal: "法律主体",
        established: isVerified ? "法律主体成立年份" : "开始制造年份（企业自述）",
        location: "所在地",
        category: "企业类型",
        about: "企业简介",
        products: "产品与供应范围",
        processes: "能力与服务",
        certifications: isVerified ? "有文件佐证的认证" : "企业官网公开的认证",
        noCerts: "本档案暂未列出企业级认证。",
        productsServices: "产品与服务总结",
        structuredCatalog: "结构化产品目录",
        structuredCatalogSub: "按产品类型、形态、工艺、材料和标准组织，可直接承接海外买家搜索。",
        supplierConfirmed: "供应商确认的分类",
        supplierConfirmedNote: "以下分类由供应商确认；GetFRP 尚未独立核验产品性能或标准符合性。",
        model: "型号",
        dimensions: "尺寸",
        moq: "起订量",
        leadTime: "交期",
        ecatalog: "电子样本",
        ecatalogSub: "企业官网公开的产品目录、网页目录与技术资料。",
        openCatalog: "打开样本",
        contact: isVerified ? "企业官方联系方式" : "企业公开联系方式",
        contactSupplier: isVerified ? "通过平台联系企业" : "通过 GetFRP 发送询盘",
        website: "访问企业官网",
        verification: isVerified ? "复材站核验范围" : "档案状态",
        verifyItems: isVerified
          ? [
              "该企业身份已关联至审核通过的企业记录。",
              "企业官网与公司域名联系方式已完成匹配。",
              "产品与认证主张仍须逐份文件审核。",
            ]
          : [
              "GetFRP 根据该企业官方网站整理本档案。",
              "官网、企业域名邮箱与电话作为公开联系信息展示。",
              "该企业尚未认领本档案，也未完成 GetFRP 企业身份认证。",
            ],
        note: isVerified
          ? "认证标识仅覆盖企业身份与官网关联，不代表对每项产品、标准或性能主张的认证。"
          : "公司、产品与认证表述均注明来源于企业官网，GetFRP 尚未进行独立审计。",
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
                    <Badge variant={isVerified ? "default" : "outline"} className="gap-1.5"><ShieldCheck size={13} />{labels.verified}</Badge>
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
                {contactPhone && phoneHref && (
                  <a href={phoneHref} className={buttonVariants({ variant: "outline" })}>
                    <Phone size={15} /> {contactPhone}
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
              {structuredProducts.length > 0 && (
                <div className="mt-10">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{labels.structuredCatalog}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{labels.structuredCatalogSub}</p>
                    </div>
                    <Badge variant="outline" className="gap-1.5">
                      <CheckCircle2 size={12} /> {labels.supplierConfirmed}
                    </Badge>
                  </div>
                  <div className="mt-5 grid gap-4">
                    {structuredProducts.map((product) => {
                      const productName = isEn ? product.nameEn : product.name;
                      const productDescription =
                        (isEn ? product.descriptionEn : product.description) ??
                        product.descriptionEn ??
                        product.description;
                      const language = isEn ? "en" : "zh";
                      const specs = [
                        [labels.model, product.specifications.model],
                        [labels.dimensions, product.specifications.dimensions],
                        [labels.moq, product.specifications.moq],
                        [labels.leadTime, product.specifications.lead_time],
                      ].filter((item): item is [string, string] => Boolean(item[1]));
                      return (
                        <article key={product.id} className="rounded-xl border border-border/70 bg-background p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold">{productName}</h4>
                              {productDescription && <p className="mt-2 text-sm leading-6 text-muted-foreground">{productDescription}</p>}
                            </div>
                            <Badge variant="secondary">{taxonomyLabel("family", product.productFamily, language)}</Badge>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {product.form && <Badge variant="outline">{taxonomyLabel("form", product.form, language)}</Badge>}
                            {product.processes.map((value) => <Badge key={`process-${value}`} variant="outline">{taxonomyLabel("process", value, language)}</Badge>)}
                            {product.materials.map((value) => <Badge key={`material-${value}`} variant="outline">{taxonomyLabel("material", value, language)}</Badge>)}
                            {product.resins.map((value) => <Badge key={`resin-${value}`} variant="outline">{taxonomyLabel("resin", value, language)}</Badge>)}
                            {product.standards.map((value) => <Badge key={`standard-${value}`} variant="outline">{value}</Badge>)}
                          </div>
                          {specs.length > 0 && <dl className="mt-4 grid gap-2 border-t border-border/70 pt-4 text-xs sm:grid-cols-2">{specs.map(([label, value]) => <div key={label} className="flex gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>}
                        </article>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{labels.supplierConfirmedNote}</p>
                </div>
              )}
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
              {contactEmail && <a href={`mailto:${contactEmail}`} className="flex items-start gap-3 hover:underline"><Mail size={16} className="mt-0.5 shrink-0" /><span>{contactEmail}</span></a>}
              {contactPhone && phoneHref && <a href={phoneHref} className="flex items-start gap-3 hover:underline"><Phone size={16} className="mt-0.5 shrink-0" /><span>{contactPhone}</span></a>}
              {address && <div className="flex items-start gap-3 text-muted-foreground"><MapPin size={16} className="mt-0.5 shrink-0" /><span>{address}</span></div>}
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
        profilePublished: supplierListings.profilePublished,
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
  "frp-grating": "FRP Grating Suppliers China — Manufacturer Directory | getfrp",
  "pultruded-profiles": "Pultruded FRP Profile Suppliers China — Manufacturer Directory | getfrp",
  "fiberglass-sheet": "Fiberglass Sheet Suppliers China — Manufacturer Directory | getfrp",
  "frp-rebar": "FRP Rebar Suppliers China — Manufacturer Directory | getfrp",
  "frp-pipe": "FRP Pipe Suppliers China — Manufacturer Directory | getfrp",
  "smc-bmc": "SMC BMC Manufacturers China — Supplier Directory | getfrp",
  "resin-gelcoat": "FRP Resin & Gelcoat Manufacturers China — Supplier Directory | getfrp",
  "fiber-glass": "Fiberglass & Composite Fiber Suppliers China | getfrp",
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
    const title = `FRP & Composite Manufacturers in ${region.name}, China — Supplier Directory | getfrp`;
    return {
      title: { absolute: title },
      description: region.summary,
      alternates: alternates(`/suppliers/${region.slug}`),
      openGraph: og(`/suppliers/${region.slug}`, { title, description: region.summary }),
    };
  }
  if (locale === "en" && category) {
    const title = CATEGORY_SEO_TITLES[category.slug] ??
      `${category.name} Suppliers China — Manufacturer Directory | getfrp`;
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
  const supplierId = resolveSupplierProfileId(id);
  const profile = await loadSupplierProfile(supplierId);
  if (!profile) {
    return {
      robots: { index: false, follow: false },
      alternates: alternates(supplierProfilePath(supplierId)),
    };
  }
  const supplierName =
    (locale === "en" ? profile.supplier.nameEn : profile.supplier.name) ??
    profile.supplier.name;
  const description =
    (locale === "en" ? profile.supplier.descriptionEn : profile.supplier.description) ??
    profile.supplier.description ??
    `${supplierName} supplier profile.`;
  const isVerifiedProfile = Boolean(profile.supplier.verified && profile.enterprise);
  const title = locale === "en"
    ? `${supplierName} — ${isVerifiedProfile ? "Verified" : "Public"} FRP Supplier Profile | getfrp`
    : `${supplierName}｜${isVerifiedProfile ? "已认证复材企业主页" : "公开复材企业档案"}`;
  return {
    title: { absolute: title },
    description,
    alternates: alternates(supplierProfilePath(supplierId)),
    openGraph: og(supplierProfilePath(supplierId), {
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
        profilePublished: supplierListings.profilePublished,
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
  const provinceCount = network.length;
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
      name: `Public FRP capability records in ${region.name}`,
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
            <div className="rounded-xl border border-border/70 bg-background p-5"><Factory size={18} strokeWidth={1.5} /><div className="mt-4 text-3xl font-semibold">{provinceCount}</div><div className="mt-1 text-xs text-muted-foreground">Public regional records</div></div>
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
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
                {row.profilePublished && <Link href={`/suppliers/${row.id}` as "/suppliers/[id]"} className="underline underline-offset-4">View company profile</Link>}
                <Link href={(row.profilePublished ? `/rfq?supplier=${encodeURIComponent(row.id)}` : `/rfq?product=${encodeURIComponent(products[0] ?? region.name)}`) as never} className="underline underline-offset-4">Send inquiry</Link>
              </div>
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
    const canonicalSlug = SUPPLIER_PROFILE_SLUG_BY_ID[id];
    if (canonicalSlug) permanentRedirect(`/suppliers/${canonicalSlug}`);
    const profile = await loadSupplierProfile(resolveSupplierProfileId(id));
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
  const documentedCount = network.filter(
    (row) => normalizedCerts(row).length > 0,
  ).length;
  const exportReadyCount = network.filter((row) => row.exportReady).length;
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
    name: `China ${category.name} Manufacturers — Public Supplier Network`,
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
      numberOfItems: network.length,
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
              PUBLIC CHINA SUPPLY NETWORK
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
              China {category.name} Manufacturers — Public Supplier Network
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-muted-foreground">
              {category.summary}
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <Factory size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">{network.length}</div>
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
                {documentedCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Records with published certifications
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-5">
              <ShieldCheck size={18} strokeWidth={1.5} />
              <div className="mt-4 text-3xl font-semibold">
                {exportReadyCount || "RFQ"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {exportReadyCount ? "Export-ready matches" : "Evidence rechecked before release"}
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
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
                      {row.profilePublished && (
                        <Link href={`/suppliers/${row.id}` as "/suppliers/[id]"} className="underline underline-offset-4">
                          View company profile
                        </Link>
                      )}
                      <Link
                        href={(row.profilePublished
                          ? `/rfq?supplier=${encodeURIComponent(row.id)}&product=${encodeURIComponent(category.shortName)}`
                          : `/rfq?product=${encodeURIComponent(category.shortName)}&category=${category.match.businessTypes.includes("manufacturer") ? "finished" : "raw"}`) as never}
                        className="underline underline-offset-4"
                      >
                        Send inquiry
                      </Link>
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
