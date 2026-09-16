import "server-only";

import { asc, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { moveInOrder } from "@/lib/cms-admin";
import { requireAdmin } from "@/lib/db-user";

// Generic delete / publish-toggle / reorder for the CMS tables.
//
// The `save` action is entity-specific (each table has different columns and
// slug rules) and lives in the entity's own actions.ts. These three operations
// are identical across every ordered+publishable table, so they live here once.
// Drizzle's types do not generalise cleanly across arbitrary tables, so the
// column handles are passed in explicitly and narrowed with local casts — the
// casts are contained to this file rather than spread across eight modules.
//
// Invalidation is just revalidatePath of the admin screen, so the editor sees
// their change. The PUBLIC pages need no invalidation: they are dynamic
// (server-rendered per request straight from the database — see lib/cms.ts), so
// an edit is already live on the next request.

type Cols = {
  table: PgTable;
  id: PgColumn;
  orderIndex: PgColumn;
  published: PgColumn;
};

// biome-ignore lint/suspicious/noExplicitAny: Drizzle cross-table generics; casts contained here.
type AnyTable = any;

/** Refresh the admin list view after a change. */
export function cmsInvalidate(adminPath: string) {
  revalidatePath(adminPath);
}

export async function cmsRemove(
  cols: Pick<Cols, "table" | "id">,
  adminPath: string,
  rowId: string,
): Promise<void> {
  await requireAdmin();
  if (typeof rowId !== "string" || !rowId) throw new Error("Invalid id");
  await db.delete(cols.table as AnyTable).where(eq(cols.id, rowId));
  cmsInvalidate(adminPath);
}

export async function cmsTogglePublish(
  cols: Pick<Cols, "table" | "id" | "published">,
  adminPath: string,
  rowId: string,
  next: boolean,
): Promise<void> {
  await requireAdmin();
  if (typeof rowId !== "string" || !rowId) throw new Error("Invalid id");
  await db
    .update(cols.table as AnyTable)
    .set({ published: next === true })
    .where(eq(cols.id, rowId));
  cmsInvalidate(adminPath);
}

export async function cmsMove(
  cols: Cols,
  adminPath: string,
  rowId: string,
  dir: "up" | "down",
): Promise<void> {
  await requireAdmin();
  const rows = (await db
    .select({ id: cols.id })
    .from(cols.table as AnyTable)
    .orderBy(asc(cols.orderIndex))) as { id: string }[];

  await moveInOrder({
    rows,
    id: rowId,
    dir,
    apply: (id, orderIndex) =>
      db
        .update(cols.table as AnyTable)
        .set({ orderIndex })
        .where(eq(cols.id, id))
        .then(() => undefined),
  });
  cmsInvalidate(adminPath);
}

/** The next orderIndex for an appended row: one past the current max. */
export async function nextOrderIndex(
  cols: Pick<Cols, "table" | "orderIndex">,
): Promise<number> {
  const rows = (await db
    .select({ orderIndex: cols.orderIndex })
    .from(cols.table as AnyTable)) as { orderIndex: number | null }[];
  return rows.reduce((max, r) => Math.max(max, (r.orderIndex ?? 0) + 1), 0);
}
