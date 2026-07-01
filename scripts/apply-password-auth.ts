// Idempotent DDL for getfrp email+password auth: add users.password_hash.
// Run BEFORE deploying the password-auth code:
//   pnpm tsx --env-file=.env.local scripts/apply-password-auth.ts
// Uses the app HTTP driver (see reference_f1frp_neon_migration).
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;`);
  console.log("✓ users.password_hash applied");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
