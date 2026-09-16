import { describe, expect, it } from 'vitest';
import { auth } from './auth.js';

/**
 * Invariants of the Better Auth configuration.
 *
 * docs/02-auth.md calls the first of these the most important line in the
 * migration, and it is the sort of thing that regresses in a merge without
 * anything failing to compile.
 */
describe('Better Auth config', () => {
  const options = (auth as unknown as { options: Record<string, any> }).options;

  it('does not expose role or verifiedAt as writable user fields', () => {
    // The plan proposed declaring them with input:false. Not declaring them at
    // all is stronger: there is no field for the flag to be wrong on, so a
    // signup body can never reach users.role — which is the single column the
    // entire authorization system turns on.
    const additional = options.user?.additionalFields ?? {};
    expect(Object.keys(additional)).toHaveLength(0);
  });

  it('maps onto the existing users table', () => {
    // A separate `user` table would orphan every foreign key in the schema.
    expect(options.user?.modelName).toBe('users');
  });

  it('maps name and image without renaming the columns', () => {
    // displayName/avatarUrl appear across 51 files and 146 references.
    expect(options.user?.fields).toEqual({
      name: 'displayName',
      image: 'avatarUrl',
    });
  });

  it('lets Postgres mint ids', () => {
    // users.id is uuid defaultRandom() and 46 tables reference it; string ids
    // from the library would break all of them.
    expect(options.advanced?.database?.generateId).toBe(false);
  });

  it('keeps implicit account linking enabled', () => {
    // Linking on a verified email IS the migration path for existing users.
    // Disabling it would create duplicates instead of attaching to their rows.
    expect(options.account?.accountLinking?.enabled).toBe(true);
    expect(options.account?.accountLinking?.disableImplicitLinking).toBe(false);
  });

  it('stores rate limits in the database, not in memory', () => {
    // The in-memory default is per-instance and close to useless. A public
    // sign-in endpoint with no effective limit, on a platform holding
    // safeguarding records about minors, is a real regression.
    expect(options.rateLimit?.storage).toBe('database');
  });

  it('accepts the bearer transport', () => {
    // Without this, every Expo request gets a null session while cookies work
    // perfectly — which reads as a mobile bug rather than a missing capability.
    const plugins: { id?: string }[] = options.plugins ?? [];
    expect(plugins.some((p) => p?.id === 'bearer')).toBe(true);
  });

  it('requires a password long enough for a 13-year-old to still be safe', () => {
    expect(options.emailAndPassword?.minPasswordLength).toBeGreaterThanOrEqual(10);
  });

  it('trusts only our own origins', () => {
    const origins: string[] = options.trustedOrigins ?? [];
    expect(origins.length).toBeGreaterThan(0);
    expect(origins.every((o) => !o.includes('*'))).toBe(true);
  });
});
