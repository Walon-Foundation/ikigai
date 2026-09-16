import type { users } from '../db/schema.js';

/**
 * A row from `users`.
 *
 * In the client this type came from lib/db-user.ts, which also holds the Clerk
 * session lookup. Only the type was ever needed here, so it is derived from the
 * schema directly rather than dragging the auth layer across — that moves with
 * docs/02-auth.md.
 */
export type DbUser = typeof users.$inferSelect;
