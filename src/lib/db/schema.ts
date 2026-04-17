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
} from "drizzle-orm/pg-core";

// ═════════════════════════════════════���═════
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
    bio: text("bio"),
    location: varchar("location", { length: 100 }),
    specialty: text("specialty"),
    postCount: integer("post_count").default(0).notNull(),
    answerCount: integer("answer_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_clerk_id_idx").on(table.clerkId),
    index("users_phone_idx").on(table.phone),
    index("users_wechat_union_idx").on(table.wechatUnionId),
    index("users_enterprise_idx").on(table.enterpriseId),
  ]
);

// ═══════════════════════════════════════════
// Enterprises — company profiles
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
    viewCount: integer("view_count").default(0).notNull(),
    inquiryCount: integer("inquiry_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("enterprises_status_idx").on(table.status),
    index("enterprises_category_idx").on(table.category),
    index("enterprises_province_idx").on(table.province),
  ]
);

// ═══════════════════════════════════════════
// Posts — supply/demand + Q&A + articles
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
    // Supply/demand specific
    quantity: varchar("quantity", { length: 100 }),
    unit: varchar("unit", { length: 20 }),
    priceRange: varchar("price_range", { length: 100 }),
    location: varchar("location", { length: 100 }),
    urgent: boolean("urgent").default(false),
    expiresAt: timestamp("expires_at"),
    // Engagement
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

// ═══════════════════════════════════════════
// Comments / Replies
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// Inquiries — private messages between buyer/seller
// ═══════════════════════════════════════════

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
// WeChat tokens — for official account & mini-program
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
// Type exports for API usage
// ═══════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Enterprise = typeof enterprises.$inferSelect;
export type NewEnterprise = typeof enterprises.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
