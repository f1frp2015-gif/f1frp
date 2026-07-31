import type { Metadata } from "next";
import { desc, asc, eq, isNotNull, sql } from "drizzle-orm";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { supplierListings } from "@/lib/db/schema";
import { supplierCategories, provinces } from "@/lib/data/suppliers";
import { SuppliersClient, type SerializedSupplier } from "./suppliers-client";
import { JsonLd } from "@/components/json-ld";
import { AskAiButton } from "@/components/ask-ai-button";
import { alternates } from "@/lib/seo";
import { CURRENT_SITE_URL } from "@/lib/sites";
import { SUPPLIER_CATEGORY_PAGES } from "@/lib/data/supplier-category-pages";
import { SUPPLIER_REGION_PAGES } from "@/lib/data/supplier-region-pages";
import { SupplierCategoryCardImage } from "@/components/supplier-category-card-image";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Suppliers" });
  if (locale === "en") {
    return {
      title: {
        absolute:
          "FRP & Composite Suppliers China — Verified Factory Directory (199+ Factories) | getfrp",
      },
      description:
        "Browse verified China FRP suppliers by grating, pultruded profile, fiberglass sheet, rebar, pipe, SMC/BMC, resin and fiber capability.",
      alternates: alternates("/suppliers"),
    };
  }
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/suppliers"),
  };
}

function NetStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[#d9e3e8] bg-white p-4 text-center shadow-sm">
      <div className="text-2xl font-bold tracking-tight text-[#071A2B]">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-[#58717d]">
        {label}
      </div>
    </div>
  );
}

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Suppliers");

  // ── getfrp.com (en / overseas): anonymized network / credibility view ──────
  // Never expose individual factory identities to overseas buyers (that would
  // disintermediate the F1 sourcing desk). Present the vetted network in
  // aggregate and funnel to the RFQ. f1frp.com (zh) keeps the full named
  // directory below, unchanged.
  if (locale === "en") {
    const netRows = await (async () => {
      try {
        return await db
          .select({
            province: supplierListings.province,
            category: supplierListings.category,
          })
          .from(supplierListings)
          .where(eq(supplierListings.verified, true));
      } catch {
        return [];
      }
    })();
    const factoryCount = netRows.length || 199;
    const provinceCount = new Set(
      netRows.map((r) => r.province).filter(Boolean),
    ).size;
    const catCounts = new Map<string, number>();
    for (const r of netRows) {
      if (r.category)
        catCounts.set(r.category, (catCounts.get(r.category) ?? 0) + 1);
    }
    const catChips = supplierCategories
      .filter((c) => catCounts.has(c.id))
      .map((c) => ({ label: c.nameEn, count: catCounts.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
    const networkJsonLd = {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "China FRP sourcing & supplier vetting",
      provider: { "@type": "Organization", name: "getfrp" },
      areaServed: "Worldwide",
      description: `An audited network of ${factoryCount} verified Chinese FRP factories${provinceCount ? ` across ${provinceCount} provinces` : ""}, sourced as a principal — factory selection, QA and accountability handled by one desk.`,
      url: `${CURRENT_SITE_URL}/suppliers`,
    };
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <JsonLd data={networkJsonLd} />
        <section className="relative overflow-hidden rounded-2xl bg-[#071A2B] px-6 py-10 text-white shadow-xl shadow-[#071A2B]/10 sm:px-10 sm:py-12">
        <Image
          src="/images/getfrp-supply-chain-hero.png"
          alt="Composite materials and FRP supplier network"
          fill
          sizes="(max-width: 1024px) 100vw, 1100px"
          className="pointer-events-none object-cover object-right opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071A2B] via-[#071A2B]/95 to-[#071A2B]/45" />
        <div className="relative">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9fc2ce]">
          Vetted supply network
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          China Composite Materials Suppliers Directory
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#c3d4da]">
          Browse an audited China composite materials directory organized by
          product category, production cluster and documented capability. Factory
          identities stay private during discovery; getfrp shortlists and stands
          behind the right plant for your specification through one accountable,
          English-speaking sourcing desk.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NetStat value={`${factoryCount}`} label="Verified factories" />
          <NetStat
            value={provinceCount ? `${provinceCount}` : "Multi-region"}
            label="Provinces covered"
          />
          <NetStat value={`${catChips.length}`} label="Supply categories" />
          <NetStat value="1 desk" label="Accountable contact" />
        </div>
        </div>
        </section>

        <section className="mt-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            BROWSE BY PRODUCT
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Eight focused China FRP supply networks
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Each category page includes a buyer-ready specification table,
            anonymous capability profiles, production-cluster coverage and
            product-specific sourcing questions.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPLIER_CATEGORY_PAGES.map((category) => (
              <Link
                key={category.slug}
                href={`/suppliers/${category.slug}` as "/suppliers/[id]"}
                className="group overflow-hidden rounded-xl border border-[#d9e3e8] border-t-2 border-t-[#00A6A6] bg-white transition-all hover:-translate-y-0.5 hover:border-[#00A6A6] hover:shadow-lg hover:shadow-[#00A6A6]/10"
              >
                <SupplierCategoryCardImage slug={category.slug} />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#071A2B]">
                      {category.shortName}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#00A6A6]">
                      FRP
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    {category.snapshotCount} verified factories
                  </div>
                  <div className="mt-4 text-xs text-foreground group-hover:underline">
                    View capability network →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-border/70 pt-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            CHINA COMPOSITE MATERIALS DIRECTORY
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            A sourcing map organized around the way RFQs are actually written
          </h2>
          <div className="mt-5 max-w-4xl space-y-4 text-[15px] leading-7 text-muted-foreground">
            <p>
              A useful composite materials directory should do more than return a
              long list of company names. It should show which factories work with
              the requested process, resin, reinforcement, geometry, standard and
              destination documentation. getfrp organizes the China supply base
              into eight product networks so a buyer can begin with a real
              requirement—FRP grating, pultruded profiles, fiberglass sheet, FRP
              rebar, pipe, SMC/BMC, resin and gelcoat, or fiber and glass—then move
              to the specification and evidence that control the purchase.
            </p>
            <p>
              The directory is deliberately capability-led. During initial
              discovery, anonymous records expose province, process, scale tier,
              certifications on file and export-readiness signals without turning
              the site into an open marketplace that strips away accountability.
              Once the specification is stable, the sourcing desk rechecks the
              legal entity, certificate scope, current documents, sample route and
              inspection criteria before releasing a matched commercial shortlist.
              This distinction matters because a certificate logo or a broad
              catalogue does not prove that the quoted plant can make the exact
              product under the required conditions.
            </p>
            <p>
              Use the regional pages to understand production clusters, not to
              treat geography as a quality grade. Jiangsu is useful for resin,
              pultrusion and downstream grating; Shandong for reinforcement,
              industrial FRP and pipe; Zhejiang for flexible engineered profiles,
              sheets and fibre conversion; Guangdong for electrical, automotive,
              marine and moulded applications; Hebei for wound pipe, tanks and
              anti-corrosion systems. Every route still ends with the same
              controlled RFQ: drawing or grade, quantity, standards, tolerances,
              packaging, destination and acceptance evidence.
            </p>
          </div>
          <h3 className="mt-10 text-lg font-semibold">Browse by production cluster</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SUPPLIER_REGION_PAGES.map((region) => (
              <Link
                key={region.slug}
                href={`/suppliers/${region.slug}` as "/suppliers/[id]"}
                className="rounded-xl border border-[#d9e3e8] bg-[#f4f7f8] p-4 transition-all hover:-translate-y-0.5 hover:border-[#E7A93B] hover:bg-white"
              >
                <div className="font-semibold">{region.name}</div>
                <div className="mt-2 font-mono text-xs text-muted-foreground">
                  {region.snapshotCount} verified records
                </div>
                <div className="mt-3 text-xs underline underline-offset-4">View cluster →</div>
              </Link>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Choose a capability", "Start with the category page and state the process, material, geometry and destination standard."],
              ["02", "Check evidence", "Use the standards and material links to compare test methods, certificate scope and documentation gaps."],
              ["03", "Submit one controlled RFQ", "We match the specification to the verified network and reply with a focused shortlist within 24 hours."],
            ].map(([step, title, body]) => (
              <div key={step} className="rounded-xl border border-border/70 bg-background p-5">
                <div className="font-mono text-xs text-muted-foreground">{step}</div>
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link href="/source-from-china" className="rounded-md border border-border px-4 py-2 hover:bg-muted">How to source FRP from China →</Link>
            <Link href="/standards" className="rounded-md border border-border px-4 py-2 hover:bg-muted">GB ↔ ASTM ↔ ISO ↔ EN standards →</Link>
            <Link href="/rfq" className="rounded-md bg-foreground px-4 py-2 text-background hover:bg-foreground/90">Submit RFQ →</Link>
          </div>
        </section>

        {catChips.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Capability coverage
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {catChips.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-[13px]"
                >
                  {c.label}
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {c.count}
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              Certifications on file across the network include ISO 9001 / ISO
              14001, CE and EN 13706 — verified per factory against scope and
              renewal before any order.
            </p>
          </div>
        )}

        <div className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
          <h3 className="text-xl font-bold">Tell us what you need to source</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Submit a spec and our bilingual sourcing engineers shortlist the
            right plant, walk the floor for QA, and manage the order. First reply
            within 24 hours, no account required.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={"/rfq" as never}
              className={buttonVariants({ size: "lg" })}
            >
              Submit an RFQ
            </Link>
            <AskAiButton
              prompt={`I want to source [product / fiber type] from China to [standard, e.g. EN 13706 / ASTM], approx volume [MOQ]. Is it feasible, which standards can be met, and what's the next step?`}
              label="Ask AI to check feasibility"
            />
          </div>
        </div>
      </div>
    );
  }

  // On English deployments, hide records that don't have an English name yet.
  // Existing Chinese-only rows stay on f1frp.com (zh) until backfilled.
  const isEn = locale === "en";
  const baseQuery = db.select().from(supplierListings);
  const tierRank = sql`CASE ${supplierListings.scaleTier} WHEN 'XL' THEN 4 WHEN 'L' THEN 3 WHEN 'M' THEN 2 WHEN 'S' THEN 1 ELSE 0 END`;
  // EN 侧 SSR payload 砍到 top 200 (按 verified+brand+规模+热度排序). 旧实现把
  // 459 家供应商全部塞进 HTML, /suppliers SSR 体积 3.2MB → LCP 拖累, 移动端
  // 首字节后还要解析 3MB 字符串. 200 已经覆盖全部 verified + 高优先级品牌,
  // 普通搜索/过滤场景没有体验差异; 后续若需要看完整 459 家, 加 "Load all"
  // 按钮做 client-side fetch 即可。ZH 侧无此问题, 保留全量。
  const rows = await (isEn
    ? baseQuery
        .where(isNotNull(supplierListings.nameEn))
        .orderBy(
          desc(supplierListings.verified),
          desc(supplierListings.brandPriority),
          desc(tierRank),
          desc(supplierListings.viewCount),
          asc(supplierListings.nameEn),
        )
        .limit(200)
    : baseQuery.orderBy(
        desc(supplierListings.verified),
        desc(supplierListings.brandPriority),
        desc(tierRank),
        desc(supplierListings.viewCount),
        asc(supplierListings.name),
      ));

  const inLanguage = isEn ? "en" : "zh-CN";
  const top20Verified = rows.filter((s) => s.verified).slice(0, 20);
  const suppliersItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `${CURRENT_SITE_URL}/suppliers`,
    inLanguage,
    name: t("pageDirectoryTitle"),
    numberOfItems: top20Verified.length,
    itemListElement: top20Verified.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: (isEn ? s.nameEn : s.name) ?? s.name,
        description: (isEn ? s.descriptionEn : s.description) ?? undefined,
        address: (isEn ? s.locationEn : s.location)
          ? {
              "@type": "PostalAddress",
              addressLocality: (isEn ? s.locationEn : s.location) as string,
              addressCountry: "CN",
            }
          : undefined,
        url: `${CURRENT_SITE_URL}/suppliers#${s.id}`,
      },
    })),
  };

  const serialized: SerializedSupplier[] = rows.map((s) => ({
    id: s.id,
    name: (isEn ? s.nameEn : s.name) ?? s.name,
    category: s.category ?? "",
    location: (isEn ? s.locationEn : s.location) ?? "",
    established: s.established ?? null,
    description: (isEn ? s.descriptionEn : s.description) ?? "",
    products: ((isEn ? s.productsEn : s.products) ?? []) as string[],
    processList: ((isEn ? s.processListEn : s.processList) ?? []) as string[],
    certifications: ((isEn ? s.certificationsEn : s.certifications) ?? []) as string[],
    verified: Boolean(s.verified),
    enterpriseId: s.enterpriseId ?? null,
    website: s.website ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={suppliersItemListJsonLd} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("pageDirectoryTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AskAiButton
            prompt={
              isEn
                ? `Match me a verified Chinese supplier. I'm looking for [fiber type / product category] with [certification, e.g. CE, ISO 9001, EN 13706] and approximate volume [MOQ]. Suggest 3-5 candidates ranked by scale tier and certification fit.`
                : `按工况帮我匹配 3-5 家国内复材供应商：[纤维/树脂/产品品类]、需要[认证]、年用量[数量]。按规模与匹配度排序。`
            }
            label={isEn ? "Ask AI to match a supplier" : "AI 智能匹配供应商"}
          />
          {/* getfrp（en）侧无会员/收费体系，海外买家走 /rfq 给 sourcing desk；
              dashboard/enterprise 仅对 zh 侧的中国工厂开放 */}
          {isEn ? (
            <Link href={"/rfq" as never} className={buttonVariants()}>
              Submit an RFQ
            </Link>
          ) : (
            <Link
              href={"/dashboard/enterprise" as "/dashboard"}
              className={buttonVariants()}
            >
              {t("ctaFreeList")}
            </Link>
          )}
        </div>
      </div>

      <SuppliersClient
        suppliers={serialized}
        categories={supplierCategories}
        provinces={provinces.slice(0, 12)}
      />

      <div className="mt-10 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">
          {isEn ? "Ready to source?" : t("ctaBoxTitle")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn
            ? "Email tech support with what you need. First reply within 24 hours, no account required."
            : t("ctaBoxSub")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {isEn ? (
            <>
              <Link
                href={"/rfq" as never}
                className={buttonVariants({ size: "lg" })}
              >
                Submit an RFQ
              </Link>
              <a
                href="mailto:f1frp2015@gmail.com"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Email tech support
              </a>
            </>
          ) : (
            <>
              <Link
                href={"/dashboard/enterprise" as "/dashboard"}
                className={buttonVariants({ size: "lg" })}
              >
                {t("ctaFreeEnroll")}
              </Link>
              <a
                href="mailto:f1frp2015@gmail.com?subject=%E4%BE%9B%E5%BA%94%E5%95%86%E5%85%A5%E9%A9%BB%E5%92%A8%E8%AF%A2"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                联系咨询
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
