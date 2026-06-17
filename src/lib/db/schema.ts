import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uuid,
  varchar,
  index,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════

export const userRoleEnum = pgEnum("user_role", [
  "individual",
  "enterprise_admin",
  "enterprise_member",
  "moderator",
  "admin",
]);

export const enterpriseStatusEnum = pgEnum("enterprise_status", [
  "pending",
  "verified",
  "rejected",
  "suspended",
]);

export const postTypeEnum = pgEnum("post_type", [
  "buy",
  "sell",
  "question",
  "article",
  "case_study",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "pending",
  "published",
  "closed",
  "removed",
]);

export const membershipTierEnum = pgEnum("membership_tier", [
  "free",
  "basic",
  "pro",
  "enterprise",
]);

export const downloadTypeEnum = pgEnum("download_type", [
  "pdf",
  "revit",
  "sketchup",
  "rhino",
  "dwg",
  "step",
  "zip",
  "other",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

// ═══════════════════════════════════════════
// Users — created by self-built phone/WeChat auth (see src/lib/auth)
// ═══════════════════════════════════════════

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // clerkId 为历史遗留字段(已迁移到自建手机/微信认证);新用户无 Clerk 账号 → 可空。
    clerkId: varchar("clerk_id", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    name: varchar("name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    // 自建会话版本号 — 递增即可让该用户所有已签发 cookie 失效(全端登出)。
    sessionVersion: integer("session_version").default(0).notNull(),
    role: userRoleEnum("role").default("individual").notNull(),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id),
    wechatOpenId: varchar("wechat_open_id", { length: 255 }),
    wechatUnionId: varchar("wechat_union_id", { length: 255 }),
    miniProgramOpenId: varchar("mini_program_open_id", { length: 255 }),
    membershipTier: membershipTierEnum("membership_tier").default("free").notNull(),
    membershipExpiry: timestamp("membership_expiry"),
    // ── Subscription / billing ──
    studentVerified: boolean("student_verified").default(false).notNull(),
    studentEmail: varchar("student_email", { length: 255 }),
    trialUntil: timestamp("trial_until"),
    subscriptionStatus: varchar("subscription_status", { length: 32 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    // ── Profile ──
    bio: text("bio"),
    location: varchar("location", { length: 100 }),
    specialty: text("specialty"),
    postCount: integer("post_count").default(0).notNull(),
    answerCount: integer("answer_count").default(0).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_clerk_id_idx").on(table.clerkId),
    // 手机号 / 微信 unionid 作为自建认证的唯一身份锚点(部分唯一索引 → 允许多个 NULL)。
    uniqueIndex("users_phone_uniq").on(table.phone).where(sql`phone is not null`),
    uniqueIndex("users_wechat_union_uniq")
      .on(table.wechatUnionId)
      .where(sql`wechat_union_id is not null`),
    index("users_enterprise_idx").on(table.enterpriseId),
    index("users_stripe_customer_idx").on(table.stripeCustomerId),
  ]
);

// ═══════════════════════════════════════════
// Enterprises — company profiles (UGC-submitted)
// ═══════════════════════════════════════════

export const enterprises = pgTable(
  "enterprises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    shortName: varchar("short_name", { length: 50 }),
    logo: text("logo"),
    status: enterpriseStatusEnum("status").default("pending").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    province: varchar("province", { length: 20 }),
    city: varchar("city", { length: 50 }),
    address: text("address"),
    contactName: varchar("contact_name", { length: 50 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactWechat: varchar("contact_wechat", { length: 100 }),
    website: varchar("website", { length: 255 }),
    established: integer("established"),
    employeeCount: varchar("employee_count", { length: 50 }),
    annualRevenue: varchar("annual_revenue", { length: 50 }),
    description: text("description"),
    products: jsonb("products").$type<string[]>(),
    processes: jsonb("processes").$type<string[]>(),
    certifications: jsonb("certifications").$type<string[]>(),
    serviceAreas: jsonb("service_areas").$type<string[]>(),
    businessLicense: text("business_license"),
    membershipTier: membershipTierEnum("membership_tier").default("free").notNull(),
    membershipExpiry: timestamp("membership_expiry"),
    // ── Featured slot management (per-category top 10) ──
    featuredCategory: varchar("featured_category", { length: 50 }),
    featuredOrder: integer("featured_order"),
    viewCount: integer("view_count").default(0).notNull(),
    inquiryCount: integer("inquiry_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("enterprises_status_idx").on(table.status),
    index("enterprises_category_idx").on(table.category),
    index("enterprises_province_idx").on(table.province),
    index("enterprises_tier_idx").on(table.membershipTier),
    index("enterprises_featured_idx").on(table.featuredCategory, table.featuredOrder),
  ]
);

// ═══════════════════════════════════════════
// Knowledge Libraries (from curated TS data)
// ═══════════════════════════════════════════

export const materials = pgTable(
  "materials",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }),
    category: varchar("category", { length: 50 }).notNull(),
    subCategory: varchar("sub_category", { length: 100 }),
    subCategoryEn: varchar("sub_category_en", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    brandEn: varchar("brand_en", { length: 100 }),
    model: varchar("model", { length: 100 }),
    modelEn: varchar("model_en", { length: 100 }),
    properties: jsonb("properties").$type<Record<string, string>>(),
    propertiesEn: jsonb("properties_en").$type<Record<string, string>>(),
    applications: jsonb("applications").$type<string[]>(),
    applicationsEn: jsonb("applications_en").$type<string[]>(),
    description: text("description"),
    descriptionEn: text("description_en"),
    // UGC 入库(企业注册上传产品 → AI 结构化):
    //   source: curated=官方策展 | ugc=企业贡献; enterpriseId=贡献企业(curated 为 null)
    //   status: verified | pending | rejected — 公开读路径只显 verified;
    //   ugc 默认 pending 需后台审核通过(并嵌入 RAG)后才可见。
    enterpriseId: uuid("enterprise_id"),
    source: varchar("source", { length: 16 }).default("curated").notNull(),
    status: varchar("status", { length: 16 }).default("verified").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("materials_category_idx").on(table.category),
    index("materials_brand_idx").on(table.brand),
    index("materials_status_idx").on(table.status),
  ]
);

export const formulas = pgTable(
  "formulas",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    processId: varchar("process_id", { length: 50 }),
    process: varchar("process", { length: 100 }),
    category: varchar("category", { length: 50 }),
    application: varchar("application", { length: 200 }),
    applicationEn: varchar("application_en", { length: 200 }),
    difficulty: varchar("difficulty", { length: 20 }),
    description: text("description"),
    descriptionEn: text("description_en"),
    nameEn: varchar("name_en", { length: 200 }),
    processEn: varchar("process_en", { length: 100 }),
    resinSystem: jsonb("resin_system").$type<unknown[]>(),
    resinSystemEn: jsonb("resin_system_en").$type<unknown[]>(),
    reinforcement: jsonb("reinforcement").$type<unknown[]>(),
    reinforcementEn: jsonb("reinforcement_en").$type<unknown[]>(),
    auxiliaries: jsonb("auxiliaries").$type<unknown[]>(),
    auxiliariesEn: jsonb("auxiliaries_en").$type<unknown[]>(),
    processing: jsonb("processing").$type<unknown[]>(),
    processingEn: jsonb("processing_en").$type<unknown[]>(),
    properties: jsonb("properties").$type<unknown[]>(),
    propertiesEn: jsonb("properties_en").$type<unknown[]>(),
    tips: jsonb("tips").$type<string[]>(),
    tipsEn: jsonb("tips_en").$type<string[]>(),
    safetyNotes: jsonb("safety_notes").$type<string[]>(),
    safetyNotesEn: jsonb("safety_notes_en").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("formulas_process_idx").on(table.processId),
    index("formulas_category_idx").on(table.category),
  ]
);

export const standards = pgTable(
  "standards",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    country: varchar("country", { length: 50 }),
    countryEn: varchar("country_en", { length: 50 }),
    countryCode: varchar("country_code", { length: 10 }),
    category: varchar("category", { length: 50 }),
    categoryEn: varchar("category_en", { length: 50 }),
    process: jsonb("process").$type<string[]>(),
    processEn: jsonb("process_en").$type<string[]>(),
    year: varchar("year", { length: 10 }),
    status: varchar("status", { length: 20 }),
    statusEn: varchar("status_en", { length: 20 }),
    description: text("description"),
    descriptionEn: text("description_en"),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("standards_country_idx").on(table.countryCode),
    index("standards_category_idx").on(table.category),
    index("standards_code_idx").on(table.code),
  ]
);

export const standardSections = pgTable(
  "standard_sections",
  {
    id: varchar("id", { length: 150 }).primaryKey(),
    standardId: varchar("standard_id", { length: 100 })
      .notNull()
      .references(() => standards.id, { onDelete: "cascade" }),
    chapterNo: varchar("chapter_no", { length: 20 }).notNull(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    body: text("body").notNull(),
    bodyEn: text("body_en"),
    keyPoints: jsonb("key_points").$type<string[]>(),
    keyPointsEn: jsonb("key_points_en").$type<string[]>(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("standard_sections_standard_idx").on(table.standardId),
    index("standard_sections_sort_idx").on(table.standardId, table.sortOrder),
  ]
);

// ═══════════════════════════════════════════
// Papers — 学术论文库
// ═══════════════════════════════════════════

export const papers = pgTable(
  "papers",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    slug: varchar("slug", { length: 200 }).unique(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    authors: jsonb("authors").$type<string[]>().notNull(),
    affiliation: text("affiliation"),
    affiliationEn: text("affiliation_en"),
    journal: varchar("journal", { length: 200 }),
    journalEn: varchar("journal_en", { length: 200 }),
    year: integer("year"),
    volume: varchar("volume", { length: 30 }),
    issue: varchar("issue", { length: 30 }),
    pages: varchar("pages", { length: 50 }),
    doi: varchar("doi", { length: 150 }),
    abstract: text("abstract"),
    abstractEn: text("abstract_en"),
    // Gemini-generated Chinese engineer-facing commentary (~500-800 chars).
    // Backfilled by ingestPaper; nullable so existing rows stay valid.
    commentary: text("commentary"),
    commentaryEn: text("commentary_en"),
    keywords: jsonb("keywords").$type<string[]>(),
    keywordsEn: jsonb("keywords_en").$type<string[]>(),
    category: varchar("category", { length: 50 }),
    categoryEn: varchar("category_en", { length: 50 }),
    language: varchar("language", { length: 10 }),
    citationCount: integer("citation_count").default(0),
    sourceUrl: text("source_url"),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("papers_year_idx").on(table.year),
    index("papers_category_idx").on(table.category),
    index("papers_journal_idx").on(table.journal),
  ]
);

// ═══════════════════════════════════════════
// Reports — 行业研报库（付费）
// ═══════════════════════════════════════════

export const reportCategoryEnum = pgEnum("report_category", [
  "industry",
  "application",
  "single_customer",
  "full_chain",
]);

export const reportPurchaseStatusEnum = pgEnum("report_purchase_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).unique().notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    category: reportCategoryEnum("category").notNull(),
    summary: text("summary").notNull(),
    tableOfContents: jsonb("table_of_contents").$type<string[]>(),
    coverUrl: text("cover_url"),
    pageCount: integer("page_count"),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    priceCents: integer("price_cents").notNull(),
    proDiscountBps: integer("pro_discount_bps").default(7000).notNull(),
    pdfPath: text("pdf_path").notNull(),
    pdfSizeBytes: integer("pdf_size_bytes"),
    previewPdfPath: text("preview_pdf_path"),
    tags: jsonb("tags").$type<string[]>(),
    keywords: jsonb("keywords").$type<string[]>(),
    isPublished: boolean("is_published").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    purchaseCount: integer("purchase_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("reports_category_idx").on(table.category),
    index("reports_published_idx").on(table.isPublished, table.publishedAt),
  ]
);

export const reportPurchases = pgTable(
  "report_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    reportId: uuid("report_id").references(() => reports.id).notNull(),
    priceCentsOriginal: integer("price_cents_original").notNull(),
    priceCentsPaid: integer("price_cents_paid").notNull(),
    discountApplied: varchar("discount_applied", { length: 32 }),
    userTierAtPurchase: membershipTierEnum("user_tier_at_purchase").notNull(),
    paymentProvider: varchar("payment_provider", { length: 32 }),
    providerOrderId: varchar("provider_order_id", { length: 200 }),
    providerTradeNo: varchar("provider_trade_no", { length: 200 }),
    status: reportPurchaseStatusEnum("status").default("pending").notNull(),
    paidAt: timestamp("paid_at"),
    downloadCount: integer("download_count").default(0).notNull(),
    lastDownloadedAt: timestamp("last_downloaded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("report_purchases_user_idx").on(table.userId),
    index("report_purchases_report_idx").on(table.reportId),
    index("report_purchases_status_idx").on(table.status),
    index("report_purchases_order_idx").on(table.providerOrderId),
  ]
);

// ═══════════════════════════════════════════
// Patents — 专利库
// ═══════════════════════════════════════════

export const patentStatusEnum = pgEnum("patent_status", [
  "pending",
  "granted",
  "expired",
  "withdrawn",
]);

export const patents = pgTable(
  "patents",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    slug: varchar("slug", { length: 200 }).unique(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    applicationNo: varchar("application_no", { length: 50 }),
    publicationNo: varchar("publication_no", { length: 50 }),
    grantNo: varchar("grant_no", { length: 50 }),
    applicant: text("applicant"),
    applicantEn: text("applicant_en"),
    inventors: jsonb("inventors").$type<string[]>(),
    inventorsEn: jsonb("inventors_en").$type<string[]>(),
    filingDate: varchar("filing_date", { length: 20 }),
    publicationDate: varchar("publication_date", { length: 20 }),
    grantDate: varchar("grant_date", { length: 20 }),
    classification: jsonb("classification").$type<string[]>(),
    // Gemini-generated Chinese engineer-facing commentary (~400-700 chars).
    commentary: text("commentary"),
    commentaryEn: text("commentary_en"),
    status: patentStatusEnum("status"),
    country: varchar("country", { length: 30 }),
    countryEn: varchar("country_en", { length: 30 }),
    countryCode: varchar("country_code", { length: 10 }),
    abstract: text("abstract"),
    abstractEn: text("abstract_en"),
    claims: text("claims"),
    claimsEn: text("claims_en"),
    category: varchar("category", { length: 50 }),
    categoryEn: varchar("category_en", { length: 50 }),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("patents_status_idx").on(table.status),
    index("patents_country_idx").on(table.countryCode),
    index("patents_category_idx").on(table.category),
    index("patents_filing_date_idx").on(table.filingDate),
  ]
);

// ═══════════════════════════════════════════
// Knowledge chunks — 统一 RAG 向量库（materials / standards / papers / patents / formulas / articles）
// 每条目可多 chunk（标题、摘要、关键参数等）→ embed 后做语义检索
// ═══════════════════════════════════════════

export const knowledgeSourceEnum = pgEnum("knowledge_source", [
  "material",
  "standard",
  "paper",
  "patent",
  "formula",
  "article",
  "supplier",
]);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: varchar("id", { length: 200 }).primaryKey(),
    sourceType: knowledgeSourceEnum("source_type").notNull(),
    sourceId: varchar("source_id", { length: 200 }).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    url: text("url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    // Google text-embedding-004 → 768 dims
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chunks_source_idx").on(table.sourceType, table.sourceId),
    // HNSW index on cosine — built by migration script after embed
  ]
);

export const processes = pgTable(
  "processes",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    nameEn: varchar("name_en", { length: 100 }),
    description: text("description"),
    descriptionEn: text("description_en"),
    advantages: jsonb("advantages").$type<string[]>(),
    advantagesEn: jsonb("advantages_en").$type<string[]>(),
    disadvantages: jsonb("disadvantages").$type<string[]>(),
    disadvantagesEn: jsonb("disadvantages_en").$type<string[]>(),
    applications: jsonb("applications").$type<string[]>(),
    applicationsEn: jsonb("applications_en").$type<string[]>(),
    keyParameters: jsonb("key_parameters").$type<string[]>(),
    keyParametersEn: jsonb("key_parameters_en").$type<string[]>(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const supplierListings = pgTable(
  "supplier_listings",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }),
    location: varchar("location", { length: 100 }),
    locationEn: varchar("location_en", { length: 100 }),
    province: varchar("province", { length: 20 }),
    category: varchar("category", { length: 50 }),
    products: jsonb("products").$type<string[]>(),
    productsEn: jsonb("products_en").$type<string[]>(),
    processList: jsonb("process_list").$type<string[]>(),
    processListEn: jsonb("process_list_en").$type<string[]>(),
    established: integer("established"),
    verified: boolean("verified").default(false),
    description: text("description"),
    descriptionEn: text("description_en"),
    certifications: jsonb("certifications").$type<string[]>(),
    certificationsEn: jsonb("certifications_en").$type<string[]>(),
    website: varchar("website", { length: 255 }),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id),
    scaleTier: varchar("scale_tier", { length: 10 }),
    brandPriority: integer("brand_priority").default(0).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    // ── Sourcing Desk (getfrp P0) — structured capability + export-readiness ──
    // capabilities: coarse product families (profile/grating/rebar/rod/tube/
    //   panel/custom) for buyer-spec feasibility matching.
    // standardsSupported: structured standard codes the factory documents
    //   (e.g. ASTM D3039 / EN 13706 / GB/T 1447).
    // exportReady: domestic-side screening flag — only true rows surface to
    //   getfrp.com feasibility_match (the 国内筛选→海外消费 flywheel gate).
    capabilities: jsonb("capabilities").$type<string[]>(),
    standardsSupported: jsonb("standards_supported").$type<string[]>(),
    moqKg: integer("moq_kg"),
    leadTimeDays: integer("lead_time_days"),
    exportReady: boolean("export_ready").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("supplier_listings_category_idx").on(table.category),
    index("supplier_listings_province_idx").on(table.province),
    index("supplier_listings_name_en_idx").on(table.nameEn),
    index("supplier_listings_brand_priority_idx").on(table.brandPriority),
    index("supplier_listings_scale_tier_idx").on(table.scaleTier),
    index("supplier_listings_export_ready_idx").on(table.exportReady),
  ]
);

// ═══════════════════════════════════════════
// Supplier claims — 企业认领申请
// ═══════════════════════════════════════════

export const supplierClaims = pgTable(
  "supplier_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supplierListingId: varchar("supplier_listing_id", { length: 50 })
      .references(() => supplierListings.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    contactTitle: varchar("contact_title", { length: 100 }),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    businessLicenseUrl: text("business_license_url"),
    note: text("note"),
    status: claimStatusEnum("status").default("pending").notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("supplier_claims_supplier_idx").on(table.supplierListingId),
    index("supplier_claims_user_idx").on(table.userId),
    index("supplier_claims_status_idx").on(table.status),
  ]
);

// ═══════════════════════════════════════════
// Saved items — engineer workbench bookmarks across the six libraries
// ═══════════════════════════════════════════

export const savedItemSourceEnum = pgEnum("saved_item_source", [
  "material",
  "formula",
  "standard",
  "paper",
  "patent",
  "supplier",
  "article",
]);

export const savedItems = pgTable(
  "saved_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: savedItemSourceEnum("source_type").notNull(),
    sourceId: varchar("source_id", { length: 200 }).notNull(),
    title: text("title").notNull(),
    url: text("url"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("saved_items_user_idx").on(table.userId),
    uniqueIndex("saved_items_user_source_uniq").on(
      table.userId,
      table.sourceType,
      table.sourceId
    ),
  ]
);

// ═══════════════════════════════════════════
// Content — Articles / News / Case Studies
// ═══════════════════════════════════════════

export const authors = pgTable("authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).unique().notNull(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    excerpt: text("excerpt"),
    excerptEn: text("excerpt_en"),
    body: text("body"),
    bodyEn: text("body_en"),
    category: varchar("category", { length: 50 }),
    coverUrl: text("cover_url"),
    authorId: uuid("author_id").references(() => authors.id),
    tags: jsonb("tags").$type<string[]>(),
    readTime: varchar("read_time", { length: 20 }),
    hot: boolean("hot").default(false),
    // P2-⑥ geo flags — default both true (existing content visible everywhere).
    // Set forZh=false to hide from f1frp.com (国内站); forEn=false to hide from getfrp.com.
    // Use this for articles like 国内补贴/地方政策 解读 that shouldn't surface to overseas buyers,
    // or English-only buyer guides that shouldn't surface to domestic suppliers.
    forZh: boolean("for_zh").default(true).notNull(),
    forEn: boolean("for_en").default(true).notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("articles_slug_idx").on(table.slug),
    index("articles_category_idx").on(table.category),
    index("articles_published_idx").on(table.publishedAt),
  ]
);

export const cases = pgTable(
  "cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).unique().notNull(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    description: text("description"),
    descriptionEn: text("description_en"),
    location: varchar("location", { length: 100 }),
    locationEn: varchar("location_en", { length: 100 }),
    year: integer("year"),
    industry: varchar("industry", { length: 50 }),
    industryEn: varchar("industry_en", { length: 50 }),
    imageUrls: jsonb("image_urls").$type<string[]>(),
    materialIds: jsonb("material_ids").$type<string[]>(),
    supplierIds: jsonb("supplier_ids").$type<string[]>(),
    processId: varchar("process_id", { length: 50 }),
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id),
    featured: boolean("featured").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cases_industry_idx").on(table.industry),
    index("cases_year_idx").on(table.year),
  ]
);

// ═══════════════════════════════════════════
// Downloads — CAD / BIM / PDF assets (ThomasNet-style)
// ═══════════════════════════════════════════

export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).unique().notNull(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    description: text("description"),
    descriptionEn: text("description_en"),
    type: downloadTypeEnum("type").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    previewUrl: text("preview_url"),
    materialId: varchar("material_id", { length: 100 }).references(() => materials.id),
    supplierId: varchar("supplier_id", { length: 50 }).references(() => supplierListings.id),
    requiredTier: membershipTierEnum("required_tier").default("free").notNull(),
    downloadCount: integer("download_count").default(0).notNull(),
    tags: jsonb("tags").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("downloads_type_idx").on(table.type),
    index("downloads_tier_idx").on(table.requiredTier),
  ]
);

export const downloadLogs = pgTable(
  "download_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    downloadId: uuid("download_id").references(() => downloads.id).notNull(),
    userId: uuid("user_id").references(() => users.id),
    userTier: membershipTierEnum("user_tier"),
    downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  },
  (table) => [
    index("download_logs_download_idx").on(table.downloadId),
    index("download_logs_user_idx").on(table.userId),
  ]
);

// ═══════════════════════════════════════════
// Community — Posts / Comments / Inquiries
// ═══════════════════════════════════════════

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id").references(() => users.id).notNull(),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id),
    type: postTypeEnum("type").notNull(),
    status: postStatusEnum("status").default("pending").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 50 }),
    tags: jsonb("tags").$type<string[]>(),
    images: jsonb("images").$type<string[]>(),
    quantity: varchar("quantity", { length: 100 }),
    unit: varchar("unit", { length: 20 }),
    priceRange: varchar("price_range", { length: 100 }),
    location: varchar("location", { length: 100 }),
    urgent: boolean("urgent").default(false),
    expiresAt: timestamp("expires_at"),
    viewCount: integer("view_count").default(0).notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    isPinned: boolean("is_pinned").default(false),
    isHot: boolean("is_hot").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("posts_author_idx").on(table.authorId),
    index("posts_type_status_idx").on(table.type, table.status),
    index("posts_category_idx").on(table.category),
    index("posts_created_idx").on(table.createdAt),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
    authorId: uuid("author_id").references(() => users.id).notNull(),
    parentId: uuid("parent_id"),
    content: text("content").notNull(),
    images: jsonb("images").$type<string[]>(),
    likeCount: integer("like_count").default(0).notNull(),
    isAccepted: boolean("is_accepted").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("comments_post_idx").on(table.postId),
    index("comments_author_idx").on(table.authorId),
  ]
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").references(() => posts.id),
    fromUserId: uuid("from_user_id").references(() => users.id).notNull(),
    toUserId: uuid("to_user_id").references(() => users.id).notNull(),
    toEnterpriseId: uuid("to_enterprise_id").references(() => enterprises.id),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }),
    contactWechat: varchar("contact_wechat", { length: 100 }),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("inquiries_to_user_idx").on(table.toUserId),
    index("inquiries_from_user_idx").on(table.fromUserId),
  ]
);

// ═══════════════════════════════════════════
// WeChat tokens
// ═══════════════════════════════════════════

export const wechatTokens = pgTable("wechat_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ═══════════════════════════════════════════
// Phone OTP codes — 自建手机验证码登录
// ═══════════════════════════════════════════

export const phoneOtps = pgTable(
  "phone_otps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phone: varchar("phone", { length: 20 }).notNull(),
    // sha256(code + phone + AUTH_SESSION_SECRET) — 不落明文验证码
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("phone_otps_phone_idx").on(table.phone),
    index("phone_otps_created_idx").on(table.createdAt),
  ]
);

// ═══════════════════════════════════════════
// Subscriptions — payment / invoice history
// ═══════════════════════════════════════════

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 32 }).notNull(), // pro_monthly, pro_yearly
    tier: membershipTierEnum("tier").notNull(),
    provider: varchar("provider", { length: 32 }).notNull(), // stripe, wechat_pay, alipay, manual
    providerSubId: varchar("provider_sub_id", { length: 255 }),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("CNY"),
    status: varchar("status", { length: 32 }).notNull(), // active, canceled, past_due, trialing, refunded
    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    cancelledAt: timestamp("cancelled_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_idx").on(table.userId),
    index("subscriptions_enterprise_idx").on(table.enterpriseId),
    index("subscriptions_status_idx").on(table.status),
    index("subscriptions_provider_sub_idx").on(table.providerSubId),
  ]
);

// ═══════════════════════════════════════════
// RFQ dispatches — log which suppliers got each RFQ + delivery state
// (P0-① flywheel: real supplier reach + foundation for P0-② billing)
// ═══════════════════════════════════════════

export const rfqDispatchStatusEnum = pgEnum("rfq_dispatch_status", [
  "pending",
  "sent",
  "failed",
  "fallback",
]);

export const rfqDispatches = pgTable(
  "rfq_dispatches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rfqId: varchar("rfq_id", { length: 80 }).notNull(),
    materialId: varchar("material_id", { length: 80 }),
    category: varchar("category", { length: 50 }),
    supplierListingId: varchar("supplier_listing_id", { length: 50 }).references(
      () => supplierListings.id,
      { onDelete: "set null" },
    ),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id, {
      onDelete: "set null",
    }),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    isFallback: boolean("is_fallback").default(false).notNull(),
    status: rfqDispatchStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => [
    index("rfq_dispatches_rfq_idx").on(table.rfqId),
    index("rfq_dispatches_supplier_idx").on(table.supplierListingId),
    index("rfq_dispatches_enterprise_idx").on(table.enterpriseId),
    index("rfq_dispatches_status_idx").on(table.status),
  ],
);

// ═══════════════════════════════════════════
// RFQ billing — P0-② skeleton (Stripe wired but not enabled in production yet)
// One row per Stripe Checkout Session created for a given RFQ.
// ═══════════════════════════════════════════

export const rfqBillingStatusEnum = pgEnum("rfq_billing_status", [
  "pending",
  "paid",
  "expired",
  "refunded",
  "voided",
]);

export const rfqBilling = pgTable(
  "rfq_billing",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rfqId: varchar("rfq_id", { length: 80 }).notNull().unique(),
    payerEmail: varchar("payer_email", { length: 255 }).notNull(),
    payerType: varchar("payer_type", { length: 20 }).notNull(), // 'buyer' | 'supplier'
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 8 }).default("usd").notNull(),
    stripeSessionId: varchar("stripe_session_id", { length: 200 }),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 200 }),
    status: rfqBillingStatusEnum("status").default("pending").notNull(),
    paidAt: timestamp("paid_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("rfq_billing_rfq_idx").on(table.rfqId),
    index("rfq_billing_status_idx").on(table.status),
    index("rfq_billing_session_idx").on(table.stripeSessionId),
  ],
);

// ═══════════════════════════════════════════
// Offline payments — 国内支付通道（银行对公转账 / 支付宝 / 微信）
// 复用一张表覆盖 RFQ / 研报 / Pro 会员 / 代理保证金等多种 order_type。
// 收款方：平台运营方对公账户（运营主体见隐私 / 条款披露）。
// ═══════════════════════════════════════════

export const offlinePaymentMethodEnum = pgEnum("offline_payment_method", [
  "bank_transfer",
  "alipay",
  "wechat",
]);

export const offlinePaymentStatusEnum = pgEnum("offline_payment_status", [
  "pending_transfer", // 订单已建，等待用户实际转账
  "awaiting_review",  // 用户已提交转账凭证，等待人工核对
  "confirmed",        // 已对账，订单生效
  "rejected",         // 转账金额/信息不符，驳回
  "refunded",         // 已退款
  "expired",          // 超时未支付
]);

export const offlineOrderTypeEnum = pgEnum("offline_order_type", [
  "rfq",
  "report",
  "pro_membership",
  "agency_deposit",
  "other",
]);

export const offlinePayments = pgTable(
  "offline_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNo: varchar("order_no", { length: 40 }).unique().notNull(),
    orderType: offlineOrderTypeEnum("order_type").notNull(),
    relatedId: varchar("related_id", { length: 120 }), // rfqId / reportId / clerkId 等
    payerName: varchar("payer_name", { length: 100 }).notNull(),
    payerEmail: varchar("payer_email", { length: 255 }).notNull(),
    payerPhone: varchar("payer_phone", { length: 40 }),
    payerCompany: varchar("payer_company", { length: 200 }),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 8 }).default("CNY").notNull(),
    paymentMethod: offlinePaymentMethodEnum("payment_method").notNull(),
    payerTransferNote: text("payer_transfer_note"),
    payerTransferAmountCents: integer("payer_transfer_amount_cents"),
    payerTransferAt: timestamp("payer_transfer_at"),
    proofImagePath: varchar("proof_image_path", { length: 500 }), // OSS object key, e.g. payment-proofs/{orderNo}/{ts}-{file}
    proofImageContentType: varchar("proof_image_content_type", { length: 100 }),
    status: offlinePaymentStatusEnum("status").default("pending_transfer").notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("offline_payments_order_no_idx").on(table.orderNo),
    index("offline_payments_status_idx").on(table.status),
    index("offline_payments_order_type_idx").on(table.orderType),
    index("offline_payments_payer_email_idx").on(table.payerEmail),
  ],
);

// ═══════════════════════════════════════════
// Type exports
// ═══════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Enterprise = typeof enterprises.$inferSelect;
export type NewEnterprise = typeof enterprises.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
export type Formula = typeof formulas.$inferSelect;
export type NewFormula = typeof formulas.$inferInsert;
export type Paper = typeof papers.$inferSelect;
export type NewPaper = typeof papers.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportPurchase = typeof reportPurchases.$inferSelect;
export type NewReportPurchase = typeof reportPurchases.$inferInsert;
export type Patent = typeof patents.$inferSelect;
export type NewPatent = typeof patents.$inferInsert;
export type StandardSection = typeof standardSections.$inferSelect;
export type NewStandardSection = typeof standardSections.$inferInsert;
export type Standard = typeof standards.$inferSelect;
export type NewStandard = typeof standards.$inferInsert;
export type Process = typeof processes.$inferSelect;
export type NewProcess = typeof processes.$inferInsert;
export type SupplierListing = typeof supplierListings.$inferSelect;
export type NewSupplierListing = typeof supplierListings.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Author = typeof authors.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type Download = typeof downloads.$inferSelect;
export type SupplierClaim = typeof supplierClaims.$inferSelect;
export type NewSupplierClaim = typeof supplierClaims.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type RfqDispatch = typeof rfqDispatches.$inferSelect;
export type NewRfqDispatch = typeof rfqDispatches.$inferInsert;
export type RfqBilling = typeof rfqBilling.$inferSelect;
export type NewRfqBilling = typeof rfqBilling.$inferInsert;
export type OfflinePayment = typeof offlinePayments.$inferSelect;
export type NewOfflinePayment = typeof offlinePayments.$inferInsert;
export type PhoneOtp = typeof phoneOtps.$inferSelect;
export type NewPhoneOtp = typeof phoneOtps.$inferInsert;

// ═══════════════════════════════════════════
// Factory product (S2 AI 询盘助手 — v4.1 主现金流)
// ═══════════════════════════════════════════
//
// Three tables form the inquiry-handler product:
//   1. factory_waitlist  → pre-payment signups from /factories/onboard
//   2. factory_inquiries → external buyer inquiries the factory receives
//   3. factory_inquiry_drafts → versioned AI reply drafts (+ human edits)
//
// Why separate from the existing user-to-user `inquiries` table:
//   - external buyer emails aren't a getfrp user; can't satisfy fromUserId
//   - drafts need versioning + AI metadata not present in inquiries
//   - inquiry-handler is a paid SKU with distinct UX; modeling separately
//     keeps both surfaces easy to evolve without coupling

export const factoryWaitlistStatusEnum = pgEnum("factory_waitlist_status", [
  "new",
  "contacted",
  "trial",
  "paying",
  "declined",
  "churned",
]);

export const factoryWaitlistTierEnum = pgEnum("factory_waitlist_tier", [
  "s1_starter",
  "s2_pro",
  "s5_enterprise",
  "undecided",
]);

export const factoryWaitlist = pgTable(
  "factory_waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 32 }),
    contactEmail: varchar("contact_email", { length: 200 }).notNull(),
    contactWechat: varchar("contact_wechat", { length: 100 }),
    factoryWebsite: varchar("factory_website", { length: 255 }),
    province: varchar("province", { length: 32 }),
    category: varchar("category", { length: 50 }),
    monthlyInquiryEstimate: integer("monthly_inquiry_estimate"),
    interestedTier: factoryWaitlistTierEnum("interested_tier")
      .default("undecided")
      .notNull(),
    source: varchar("source", { length: 64 }),
    note: text("note"),
    status: factoryWaitlistStatusEnum("status").default("new").notNull(),
    convertedToUserId: uuid("converted_to_user_id").references(() => users.id),
    contactedAt: timestamp("contacted_at"),
    convertedAt: timestamp("converted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("factory_waitlist_status_idx").on(table.status),
    index("factory_waitlist_email_idx").on(table.contactEmail),
    index("factory_waitlist_created_idx").on(table.createdAt),
  ],
);

export const factoryInquiryStatusEnum = pgEnum("factory_inquiry_status", [
  "new",
  "drafting",
  "drafted",
  "sent",
  "replied_by_buyer",
  "won",
  "lost",
  "spam",
]);

export const factoryInquirySourceEnum = pgEnum("factory_inquiry_source", [
  "email_imap",
  "email_forward",
  "web_form",
  "manual_paste",
  "api",
]);

export const factoryInquiries = pgTable(
  "factory_inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The factory user receiving the inquiry. Clerk-authenticated user that
    // owns the dashboard.
    factoryUserId: uuid("factory_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    // Optional enterprise mapping — if the factory owns a verified supplier
    // listing this points to it so we can show their canonical profile.
    factoryEnterpriseId: uuid("factory_enterprise_id").references(
      () => enterprises.id,
    ),
    source: factoryInquirySourceEnum("source").notNull(),
    // Raw buyer side — keep both name + email + country so the draft can
    // address them by name and adapt formality.
    buyerName: varchar("buyer_name", { length: 200 }),
    buyerEmail: varchar("buyer_email", { length: 200 }),
    buyerCountry: varchar("buyer_country", { length: 80 }),
    buyerCompany: varchar("buyer_company", { length: 200 }),
    // The original message (email body or web-form question text). Kept
    // verbatim so we can re-parse with a new model later.
    originalText: text("original_text").notNull(),
    originalSubject: varchar("original_subject", { length: 300 }),
    // AI-extracted structured fields. All nullable — the parser runs after
    // ingestion and overwrites as new model versions ship.
    parsedProduct: varchar("parsed_product", { length: 200 }),
    parsedSpec: text("parsed_spec"),
    parsedQuantity: varchar("parsed_quantity", { length: 100 }),
    parsedIncoterm: varchar("parsed_incoterm", { length: 32 }),
    parsedDeadline: varchar("parsed_deadline", { length: 80 }),
    parsedTargetCountry: varchar("parsed_target_country", { length: 80 }),
    // 0-100 confidence the AI has in this being a real, parseable inquiry
    // (vs spam / wrong-product / unanswerable). Drives auto-triage UI.
    aiConfidence: integer("ai_confidence"),
    status: factoryInquiryStatusEnum("status").default("new").notNull(),
    sentAt: timestamp("sent_at"),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("factory_inquiries_factory_idx").on(table.factoryUserId),
    index("factory_inquiries_status_idx").on(table.status),
    index("factory_inquiries_created_idx").on(table.createdAt),
  ],
);

export const factoryInquiryDrafts = pgTable(
  "factory_inquiry_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inquiryId: uuid("inquiry_id")
      .references(() => factoryInquiries.id, { onDelete: "cascade" })
      .notNull(),
    version: integer("version").default(1).notNull(),
    // The drafted reply body — Markdown-ish, ready to copy/paste to email.
    content: text("content").notNull(),
    // Model + prompt fingerprint so we can correlate quality regressions
    // with a specific provider / prompt version.
    generatedBy: varchar("generated_by", { length: 100 }),
    promptVersion: varchar("prompt_version", { length: 40 }),
    // Human edits captured as the difference between AI draft and what
    // the factory ultimately sent — this is the eval signal that feeds
    // the prompt-tuning loop.
    humanEditedContent: text("human_edited_content"),
    editDistance: integer("edit_distance"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("factory_inquiry_drafts_inquiry_idx").on(table.inquiryId),
    uniqueIndex("factory_inquiry_drafts_version_uniq").on(
      table.inquiryId,
      table.version,
    ),
  ],
);

export type FactoryWaitlist = typeof factoryWaitlist.$inferSelect;
export type NewFactoryWaitlist = typeof factoryWaitlist.$inferInsert;
export type FactoryInquiry = typeof factoryInquiries.$inferSelect;
export type NewFactoryInquiry = typeof factoryInquiries.$inferInsert;
export type FactoryInquiryDraft = typeof factoryInquiryDrafts.$inferSelect;
export type NewFactoryInquiryDraft = typeof factoryInquiryDrafts.$inferInsert;

// ═══════════════════════════════════════════
// Quote logs — AI 粗测型材报价工具产生的请求 / 结果落盘
//
// 战略目的:这张表是 v4.1 Layer 1 引流到 Layer 5 工厂 SaaS"AI 报价器"的
// 训练种子。每次粗测都记录:
//   - 输入参数(geometry / fiber / resin / quantity / ...)
//   - 引擎输出(区间价格 / breakdown / 警告)
//   - AI 抽取过程(原始用户文本 / 抽取置信度)
//   - 留资状态(匿名 / 留电话 / 转 RFQ)
// 跑 3 个月后能回答:
//   - 最常询的型材尺寸 TOP 50
//   - 哪些价位区间被反复试探
//   - 留资转化漏斗各环节流失率
// ═══════════════════════════════════════════

export const quoteSourceEnum = pgEnum("quote_source", [
  "nl_chat",      // 自然语言对话入口
  "form",         // 表单入口
  "api",          // 外部 API 调用(将来给小程序 / 微信公众号)
]);

export const quoteConversionEnum = pgEnum("quote_conversion", [
  "anonymous",      // 只看了区间,没留资
  "phone_provided", // 留手机号看了详细 breakdown
  "rfq_created",    // 转成正式 RFQ 工单
  "abandoned",      // 进了表单但没提交
]);

export const quoteLogs = pgTable(
  "quote_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // 用户身份 — 匿名也给一个 fingerprint;登录用户填 userId
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    anonFingerprint: varchar("anon_fingerprint", { length: 128 }),
    // 请求侧
    source: quoteSourceEnum("source").default("form").notNull(),
    locale: varchar("locale", { length: 8 }).default("zh").notNull(),
    host: varchar("host", { length: 100 }),
    ipRegion: varchar("ip_region", { length: 80 }),
    userAgent: text("user_agent"),
    // AI 抽取(NL 模式才有)
    rawUserText: text("raw_user_text"),
    extractConfidence: integer("extract_confidence"),
    extractMissing: jsonb("extract_missing").$type<string[]>(),
    // 结构化输入 — 完整 QuoteInput
    input: jsonb("input").$type<Record<string, unknown>>().notNull(),
    // 引擎输出 — 完整 QuoteResult,便于回放
    output: jsonb("output").$type<Record<string, unknown>>().notNull(),
    engineVersion: varchar("engine_version", { length: 80 }).notNull(),
    // 展示给用户的解释文本(快照,模型切换后历史仍可读)
    aiExplanation: text("ai_explanation"),
    // 转化漏斗 — 创建时 anonymous,后续 UPDATE 更新
    conversion: quoteConversionEnum("conversion").default("anonymous").notNull(),
    convertedRfqId: varchar("converted_rfq_id", { length: 80 }),
    convertedAt: timestamp("converted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("quote_logs_user_idx").on(table.userId),
    index("quote_logs_fingerprint_idx").on(table.anonFingerprint),
    index("quote_logs_conversion_idx").on(table.conversion),
    index("quote_logs_created_idx").on(table.createdAt),
    index("quote_logs_source_idx").on(table.source),
  ],
);

export type QuoteLog = typeof quoteLogs.$inferSelect;
export type NewQuoteLog = typeof quoteLogs.$inferInsert;
