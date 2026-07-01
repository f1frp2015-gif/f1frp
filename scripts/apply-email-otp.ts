// Idempotent DDL for getfrp email OTP auth: create email_otps table + indexes,
// and a partial-unique index on users.email (identity anchor for en/overseas).
// Run BEFORE deploying the email-auth code:
//   pnpm tsx --env-file=.env.local scripts/apply-email-otp.ts
// Uses the app HTTP driver (drizzle-kit push hangs on WS locally — see
// reference_f1frp_neon_migration).
//
// NOTE: users_email_uniq will FAIL if two existing users share a non-null email.
// That's intentional (surfaces the conflict loudly, no data loss). If it errors,
// dedupe those rows first, then re-run.
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "email_otps" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" varchar(255) NOT NULL,
      "code_hash" varchar(64) NOT NULL,
      "expires_at" timestamp NOT NULL,
      "attempts" integer NOT NULL DEFAULT 0,
      "consumed_at" timestamp,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "email_otps_email_idx" ON "email_otps" ("email");`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "email_otps_created_idx" ON "email_otps" ("created_at");`);
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uniq" ON "users" ("email") WHERE "email" IS NOT NULL;`,
  );
  console.log("✓ email_otps table + indexes + users_email_uniq applied");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
