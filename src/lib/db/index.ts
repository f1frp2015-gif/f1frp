import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

// --- Build-time resilience -------------------------------------------------
// Many ISR / prerendered pages query the DB during `next build` (static
// export). A single failed query otherwise aborts the WHOLE export, hard-
// blocking the deploy. When the build DB is transiently unreachable (e.g. a
// Neon compute-quota 402 or a brief outage) we don't want a routine deploy to
// die — these pages declare `revalidate` and render empty states gracefully,
// so during the BUILD PHASE ONLY a failed query resolves to an empty result
// set and the page refills on its first runtime revalidation.
//
// Scope is deliberately narrow:
//   * Only when NEXT_PHASE === 'phase-production-build' — never at runtime.
//   * drizzle-orm/neon-http binds the query fn ONCE at construction
//     (`this.clientQuery = client.query ?? client`), so we intercept the
//     `.query` *getter* and hand drizzle a wrapped fn. A call/apply trap or a
//     wrapper on the drizzle object would be captured-around and never fire.
//   * At runtime the raw client passes through untouched, so Next.js ISR keeps
//     serving the last-good cache on any revalidation error (safer than baking
//     empties into the export).
// Known limit: only SELECT-list shapes degrade cleanly (→ []). A build-phase
// aggregate that indexes row[0] could still throw — acceptable, since this
// only ever engages during an outage build, which we avoid deploying anyway.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function buildResilientClient(client: typeof sql): typeof sql {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== "query") return Reflect.get(target, prop, receiver);
      const realQuery = Reflect.get(target, prop, receiver).bind(target);
      return async (
        query: string,
        params?: unknown[],
        opts?: { arrayMode?: boolean; fullResults?: boolean },
      ) => {
        try {
          return await realQuery(query, params, opts);
        } catch (err) {
          console.warn(
            `[db] build-phase query failed → empty result set: ${
              (err as Error)?.message ?? String(err)
            }`,
          );
          // Shape mirrors neon's fullResults response so drizzle's mapResult
          // reads `.rows` and yields [].
          return {
            command: "SELECT",
            rowCount: 0,
            rows: [],
            fields: [],
            rowAsArray: Boolean(opts?.arrayMode),
          };
        }
      };
    },
  });
}

const client = isBuildPhase ? buildResilientClient(sql) : sql;

export const db = drizzle(client, { schema });
