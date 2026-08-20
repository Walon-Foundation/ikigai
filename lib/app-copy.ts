import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { appCopy } from "@/db/schema";

// The PWA counterpart to getCopy() in lib/cms.ts.
//
// The PWA doesn't need a `dynamic = "force-dynamic"` export the way the
// marketing pages do: every page that would use this already calls
// getDbUser()/requireRole()/requireAdmin(), which read the Clerk session via
// cookies() — a dynamic API that already opts the route out of static
// rendering. An edit made in /admin/app-copy is live on the next request with
// no extra wiring.
//
// Extending this to a new string is mechanical:
//   1. Add the key to BLOCKS in app/admin/(protected)/app-copy/page.tsx (and
//      its shape in actions.ts, if it's not a single `body` string).
//   2. Add the same key/shape to scripts/seed-app-copy.ts.
//   3. In the PWA page, replace the hard-coded string with:
//        const copy = await getAppCopy("my_key");
//        const title = (copy?.title as string) ?? "fallback text shipped in code";
//      The `??` fallback is required, not optional — a missing or not-yet-
//      seeded row must render the old hard-coded copy, never a blank space.

/**
 * A singleton PWA copy block. Returns null when unset so callers fall back to
 * the copy shipped in the component — a missing row must never render a hole.
 */
export async function getAppCopy(key: string) {
  const [row] = await db
    .select()
    .from(appCopy)
    .where(eq(appCopy.key, key))
    .limit(1);
  return (row?.value as Record<string, unknown> | undefined) ?? null;
}
