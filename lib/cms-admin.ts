import "server-only";

// Shared helpers for the CMS admin server actions.
//
// Every /admin/cms action clamps and trims its inputs the same way the events
// action does, and every one revalidates both the admin screen it lives on and
// the tagged public reader in lib/cms.ts. These helpers keep that consistent so
// a new screen cannot forget to invalidate the public cache — the single most
// likely CMS bug, because it looks like it works until someone else loads the
// page.

/** Trim to a max length; empty string becomes null for a nullable column. */
export function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/** A required string field. Throws with the field's name when empty. */
export function requiredText(
  value: unknown,
  max: number,
  label: string,
): string {
  const result = text(value, max);
  if (!result) throw new Error(`${label} is required`);
  return result;
}

/** Parse a bounded integer, defaulting when absent or invalid. */
export function int(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number.parseInt(value, 10)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** A checkbox / toggle value from a form. */
export function bool(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === "1";
}

/** A jsonb string[] field — split textarea lines, drop blanks, clamp count. */
export function lines(value: unknown, maxItems = 20, maxLen = 300): string[] {
  const raw =
    typeof value === "string"
      ? value.split("\n")
      : Array.isArray(value)
        ? value
        : [];
  return raw
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((line) => line.slice(0, maxLen));
}

/**
 * Swap one row's position with its neighbour in a manually-ordered list.
 *
 * The caller passes the rows it already fetched (ordered by orderIndex) and a
 * closure that writes one row's orderIndex — that keeps the table's Drizzle
 * typing in the entity's own action file while the swap logic lives here once.
 * Positions are normalised to their array index on every move, so a list that
 * started with duplicate or gappy orderIndex values self-heals.
 */
export async function moveInOrder(opts: {
  rows: { id: string }[];
  id: string;
  dir: "up" | "down";
  apply: (id: string, orderIndex: number) => Promise<void>;
}): Promise<void> {
  const { rows, id, dir, apply } = opts;
  const from = rows.findIndex((r) => r.id === id);
  if (from === -1) return;
  const to = dir === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= rows.length) return;

  const reordered = [...rows];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  // Only the two affected rows actually change index; write just those.
  await Promise.all([
    apply(reordered[from].id, from),
    apply(reordered[to].id, to),
  ]);
}

/**
 * Turn a title into a URL slug: lowercase, spaces to hyphens, punctuation
 * stripped. Generated once on create and then stored — a slug is a permanent
 * address, so it must not silently change when someone edits a title and breaks
 * every link that pointed at the old one.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
