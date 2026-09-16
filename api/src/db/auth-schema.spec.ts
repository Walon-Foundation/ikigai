import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  authAccounts,
  authRateLimit,
  authSessions,
  authVerifications,
  users,
} from './schema.js';

/**
 * docs/02-auth.md asks for exactly these checks, and each one exists because
 * getting it wrong fails at RUNTIME rather than at compile time — the Better
 * Auth adapter looks columns up by name.
 */
describe('Better Auth schema', () => {
  const userCols = getTableColumns(users);

  it('adopts the existing users table rather than a new one', () => {
    // If this ever becomes a separate `user` table, every foreign key across
    // the schema is pointing at rows Better Auth does not create.
    expect(users).toBeDefined();
    expect(userCols.id.columnType).toBe('PgUUID');
  });

  it('clerk_id is nullable', () => {
    // Better Auth inserts a user without it, and this was the only NOT NULL
    // column with no default — its first signup would have failed.
    expect(userCols.clerkId.notNull).toBe(false);
  });

  it('emailVerified is a boolean, not a timestamp', () => {
    // A timestamp here is Auth.js, not Better Auth. Getting it wrong means the
    // adapter writes a boolean into a timestamp column at signup.
    expect(userCols.emailVerified.columnType).toBe('PgBoolean');
    expect(userCols.emailVerified.notNull).toBe(true);
  });

  it('users carries the createdAt/updatedAt Better Auth requires', () => {
    expect(userCols.createdAt.notNull).toBe(true);
    expect(userCols.updatedAt.notNull).toBe(true);
  });

  describe('userId columns are uuid, not text', () => {
    // The generator emits text ids. Ours must be uuid or they cannot reference
    // users.id at all.
    for (const [name, table] of [
      ['session', authSessions],
      ['account', authAccounts],
    ] as const) {
      it(name, () => {
        expect(getTableColumns(table).userId.columnType).toBe('PgUUID');
      });
    }
  });

  describe('every auth table mints its own id', () => {
    // advanced.database.generateId is GLOBAL, so Postgres has to supply an id
    // for all of them — not just users.
    for (const [name, table] of [
      ['session', authSessions],
      ['account', authAccounts],
      ['verification', authVerifications],
      ['rate_limit', authRateLimit],
    ] as const) {
      it(name, () => {
        const id = getTableColumns(table).id;
        expect(id.columnType).toBe('PgUUID');
        expect(id.hasDefault).toBe(true);
      });
    }
  });

  it('rate_limit.lastRequest is epoch milliseconds, not a timestamp', () => {
    // This one cost real debugging. The limiter writes a NUMBER; declared as
    // timestamp() it type-checks and then throws "value.toISOString is not a
    // function" — and only on the HTTP path, because a direct auth.api call
    // skips rate limiting entirely.
    expect(getTableColumns(authRateLimit).lastRequest.columnType).toBe(
      'PgBigInt53',
    );
  });

  it('no auth column name contains an uppercase character', () => {
    // Locks in the casing fix permanently. db.ts sets casing: "snake_case" and
    // drizzle.config.ts now matches; a camelCase SQL name here would mean the
    // runtime queries "userId" while the migration created user_id.
    for (const table of [
      users,
      authSessions,
      authAccounts,
      authVerifications,
      authRateLimit,
    ]) {
      for (const col of Object.values(getTableColumns(table))) {
        expect(col.name).toBe(col.name.toLowerCase());
      }
    }
  });
});
