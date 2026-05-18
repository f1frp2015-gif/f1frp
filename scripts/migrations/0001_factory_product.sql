-- S2 AI 询盘助手产品 — v4.1 主现金流支撑
-- Adds three tables (factory_waitlist / factory_inquiries / factory_inquiry_drafts)
-- + four enums. None of these touch existing tables; safe to apply alongside
-- live traffic on Neon.

CREATE TYPE "public"."factory_waitlist_status" AS ENUM (
  'new',
  'contacted',
  'trial',
  'paying',
  'declined',
  'churned'
);

CREATE TYPE "public"."factory_waitlist_tier" AS ENUM (
  's1_starter',
  's2_pro',
  's5_enterprise',
  'undecided'
);

CREATE TYPE "public"."factory_inquiry_status" AS ENUM (
  'new',
  'drafting',
  'drafted',
  'sent',
  'replied_by_buyer',
  'won',
  'lost',
  'spam'
);

CREATE TYPE "public"."factory_inquiry_source" AS ENUM (
  'email_imap',
  'email_forward',
  'web_form',
  'manual_paste',
  'api'
);

CREATE TABLE IF NOT EXISTS "factory_waitlist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_name" varchar(200) NOT NULL,
  "contact_name" varchar(100) NOT NULL,
  "contact_phone" varchar(32),
  "contact_email" varchar(200) NOT NULL,
  "contact_wechat" varchar(100),
  "factory_website" varchar(255),
  "province" varchar(32),
  "category" varchar(50),
  "monthly_inquiry_estimate" integer,
  "interested_tier" "factory_waitlist_tier" DEFAULT 'undecided' NOT NULL,
  "source" varchar(64),
  "note" text,
  "status" "factory_waitlist_status" DEFAULT 'new' NOT NULL,
  "converted_to_user_id" uuid REFERENCES "users"("id"),
  "contacted_at" timestamp,
  "converted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "factory_waitlist_status_idx" ON "factory_waitlist" ("status");
CREATE INDEX IF NOT EXISTS "factory_waitlist_email_idx" ON "factory_waitlist" ("contact_email");
CREATE INDEX IF NOT EXISTS "factory_waitlist_created_idx" ON "factory_waitlist" ("created_at");

CREATE TABLE IF NOT EXISTS "factory_inquiries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "factory_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "factory_enterprise_id" uuid REFERENCES "enterprises"("id"),
  "source" "factory_inquiry_source" NOT NULL,
  "buyer_name" varchar(200),
  "buyer_email" varchar(200),
  "buyer_country" varchar(80),
  "buyer_company" varchar(200),
  "original_text" text NOT NULL,
  "original_subject" varchar(300),
  "parsed_product" varchar(200),
  "parsed_spec" text,
  "parsed_quantity" varchar(100),
  "parsed_incoterm" varchar(32),
  "parsed_deadline" varchar(80),
  "parsed_target_country" varchar(80),
  "ai_confidence" integer,
  "status" "factory_inquiry_status" DEFAULT 'new' NOT NULL,
  "sent_at" timestamp,
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "factory_inquiries_factory_idx" ON "factory_inquiries" ("factory_user_id");
CREATE INDEX IF NOT EXISTS "factory_inquiries_status_idx" ON "factory_inquiries" ("status");
CREATE INDEX IF NOT EXISTS "factory_inquiries_created_idx" ON "factory_inquiries" ("created_at");

CREATE TABLE IF NOT EXISTS "factory_inquiry_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "inquiry_id" uuid NOT NULL REFERENCES "factory_inquiries"("id") ON DELETE CASCADE,
  "version" integer DEFAULT 1 NOT NULL,
  "content" text NOT NULL,
  "generated_by" varchar(100),
  "prompt_version" varchar(40),
  "human_edited_content" text,
  "edit_distance" integer,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "factory_inquiry_drafts_inquiry_idx" ON "factory_inquiry_drafts" ("inquiry_id");
CREATE UNIQUE INDEX IF NOT EXISTS "factory_inquiry_drafts_version_uniq" ON "factory_inquiry_drafts" ("inquiry_id", "version");
