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
// Users — synced from Clerk via webhook
// ═══════════════════════════════════════════

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).unique().notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    name: varchar("name", { length: 100 }),
    avatarUrl: text("avatar_url"),
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
    index("users_phone_idx").on(table.phone),
    index("users_wechat_union_idx").on(table.wechatUnionId),
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
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),
    properties: jsonb("properties").$type<Record<string, string>>(),
    applications: jsonb("applications").$type<string[]>(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("materials_category_idx").on(table.category),
    index("materials_brand_idx").on(table.brand),
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
    difficulty: varchar("difficulty", { length: 20 }),
    description: text("description"),
    resinSystem: jsonb("resin_system").$type<unknown[]>(),
    reinforcement: jsonb("reinforcement").$type<unknown[]>(),
    auxiliaries: jsonb("auxiliaries").$type<unknown[]>(),
    processing: jsonb("processing").$type<unknown[]>(),
    properties: jsonb("properties").$type<unknown[]>(),
    tips: jsonb("tips").$type<string[]>(),
    safetyNotes: jsonb("safety_notes").$type<string[]>(),
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
    countryCode: varchar("country_code", { length: 10 }),
    category: varchar("category", { length: 50 }),
    process: jsonb("process").$type<string[]>(),
    year: varchar("year", { length: 10 }),
    status: varchar("status", { length: 20 }),
    description: text("description"),
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
    body: text("body").notNull(),
    keyPoints: jsonb("key_points").$type<string[]>(),
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
    journal: varchar("journal", { length: 200 }),
    year: integer("year"),
    volume: varchar("volume", { length: 30 }),
    issue: varchar("issue", { length: 30 }),
    pages: varchar("pages", { length: 50 }),
    doi: varchar("doi", { length: 150 }),
    abstract: text("abstract"),
    // Gemini-generated Chinese engineer-facing commentary (~500-800 chars).
    // Backfilled by ingestPaper; nullable so existing rows stay valid.
    commentary: text("commentary"),
    keywords: jsonb("keywords").$type<string[]>(),
    category: varchar("category", { length: 50 }),
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
    inventors: jsonb("inventors").$type<string[]>(),
    filingDate: varchar("filing_date", { length: 20 }),
    publicationDate: varchar("publication_date", { length: 20 }),
    grantDate: varchar("grant_date", { length: 20 }),
    classification: jsonb("classification").$type<string[]>(),
    // Gemini-generated Chinese engineer-facing commentary (~400-700 chars).
    commentary: text("commentary"),
    status: patentStatusEnum("status"),
    country: varchar("country", { length: 30 }),
    countryCode: varchar("country_code", { length: 10 }),
    abstract: text("abstract"),
    claims: text("claims"),
    category: varchar("category", { length: 50 }),
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
    advantages: jsonb("advantages").$type<string[]>(),
    disadvantages: jsonb("disadvantages").$type<string[]>(),
    applications: jsonb("applications").$type<string[]>(),
    keyParameters: jsonb("key_parameters").$type<string[]>(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("supplier_listings_category_idx").on(table.category),
    index("supplier_listings_province_idx").on(table.province),
    index("supplier_listings_name_en_idx").on(table.nameEn),
    index("supplier_listings_brand_priority_idx").on(table.brandPriority),
    index("supplier_listings_scale_tier_idx").on(table.scaleTier),
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
    excerpt: text("excerpt"),
    body: text("body"),
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
    description: text("description"),
    location: varchar("location", { length: 100 }),
    year: integer("year"),
    industry: varchar("industry", { length: 50 }),
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
    description: text("description"),
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
// Subscriptions — payment / invoice history
// ═══════════════════════════════════════════

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 32 }).notNull(), // pro_monthly, pro_yearly, team_yearly, supplier_verified, supplier_featured
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
// Supplier upgrade requests — Verified / Featured 申请
// ═══════════════════════════════════════════

export const supplierUpgradeRequests = pgTable(
  "supplier_upgrade_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    enterpriseId: uuid("enterprise_id").references(() => enterprises.id, { onDelete: "cascade" }).notNull(),
    targetTier: membershipTierEnum("target_tier").notNull(), // basic=Verified, pro=Featured
    targetCategory: varchar("target_category", { length: 50 }), // Featured 时指定品类
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    contactWechat: varchar("contact_wechat", { length: 100 }),
    note: text("note"),
    status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, approved, rejected, paid
    discountApplied: integer("discount_applied"), // 折扣百分比，例 50 = 半价
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("supplier_upgrade_status_idx").on(table.status),
    index("supplier_upgrade_user_idx").on(table.userId),
    index("supplier_upgrade_ent_idx").on(table.enterpriseId),
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
// Type exports
// ═══════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Enterprise = typeof enterprises.$inferSelect;
export type NewEnterprise = typeof enterprises.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SupplierUpgradeRequest = typeof supplierUpgradeRequests.$inferSelect;
export type NewSupplierUpgradeRequest = typeof supplierUpgradeRequests.$inferInsert;
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
