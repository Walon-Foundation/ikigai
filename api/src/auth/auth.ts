import { betterAuth } from 'better-auth';
import { and, eq, isNull } from 'drizzle-orm';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { db } from '../db/db.js';
import * as schema from '../db/schema.js';
import { env } from '../env.js';

/**
 * Better Auth, mounted in the API — the single auth origin for every surface.
 *
 * Expo authenticates with a bearer token, the web client and admin panel with a
 * cookie on the parent domain. One server issues and validates both, which is
 * the whole reason auth lives here rather than in the Next.js app. See
 * docs/02-auth.md.
 *
 * This adopts the EXISTING `users` table. users.id stays the primary key, so
 * every foreign key across 46 tables keeps pointing at the same rows: no data
 * migration, no orphans, no downtime for domain data.
 *
 * Do NOT run Better Auth's official Clerk migration script. It creates new rows
 * keyed on Clerk's `user_xxx` strings, which would duplicate every user and
 * orphan every foreign key. Account linking on a verified email does the same
 * job with no scripting, and IS the migration path.
 */
export const auth = betterAuth({
  baseURL: env.authBaseUrl,
  secret: env.authSecret,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      // Keyed by MODEL NAME, not by Better Auth's default model name. Because
      // the config below sets modelName 'users' and 'rate_limit', those are the
      // keys the adapter looks up — passing `user:` and `rateLimit:` here fails
      // at runtime with "Drizzle schema mismatch: missing tables users,
      // rate_limit", not at compile time.
      users: schema.users,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
      rate_limit: schema.authRateLimit,
    },
  }),

  // Every surface may sign in from a different origin, and the admin panel
  // POSTs to /api/auth/* from its own host.
  trustedOrigins: [env.appUrl, env.adminUrl, env.marketingUrl],

  emailAndPassword: {
    enabled: true,
    // Mentees may be 13, and the credential population is tiny, which makes a
    // stricter floor essentially free.
    minPasswordLength: 10,
    // Flipped on only after a week of green sends. With it true and SMTP
    // broken, every new signup is locked out — and sendMail currently returns
    // success while sending nothing when SMTP is unset. docs/02-auth.md Phase 4.
    requireEmailVerification: false,
  },

  socialProviders: env.googleClientId
    ? {
        google: {
          clientId: env.googleClientId,
          clientSecret: env.googleClientSecret ?? '',
        },
      }
    : {},

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      // MUST stay false. Implicit linking on a verified email is what migrates
      // every existing user: they sign in with Google, the address matches an
      // existing row, and an account row attaches to the id their data already
      // hangs off. Disabling it would create duplicates instead.
      disableImplicitLinking: false,
    },
  },

  user: {
    modelName: 'users',
    // displayName/avatarUrl appear across 51 files and 146 references in the
    // client. Mapping is two lines; renaming would be a 146-site refactor
    // inside an already-large migration. Keys are JS property names, not SQL
    // column names — the adapter indexes the Drizzle table object.
    fields: { name: 'displayName', image: 'avatarUrl' },
    // NO additionalFields, deliberately.
    //
    // docs/02-auth.md proposed declaring role and verifiedAt here with
    // input:false so a signup body could not set role:"admin". Not declaring
    // them at all is strictly stronger: Better Auth never reads or writes those
    // columns, so there is no field to get the flag wrong on. `role` keeps its
    // database default of 'mentee', and onboarding's SELF_ASSIGNABLE_ROLES
    // remains the only path that changes it.
    //
    // Nothing needs them on the session anyway: ActorService reads role and
    // verifiedAt LIVE from the database on every call, which is what a revoked
    // mentor's access depends on.
  },

  session: {
    modelName: 'session',
    // Load-bearing, not an optimisation: without it every authenticated request
    // gains a database round-trip, paid by users on metered mobile data.
    //
    // But it is stale by up to maxAge, so NEVER authorize off it. ActorService
    // reads verifiedAt live for exactly this reason — a mentor rejected
    // mid-incident must lose access on their next action, not when a cache
    // expires.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  verification: { modelName: 'verification' },

  rateLimit: {
    enabled: true,
    // Database, not the in-memory default: on more than one instance that is
    // per-instance and close to useless. See Risk 4 in docs/02-auth.md.
    storage: 'database',
    modelName: 'rate_limit',
  },

  plugins: [
    // Accept `Authorization: Bearer <token>` as well as the session cookie.
    //
    // This is what makes the Expo app work: React Native has no cookie jar, so
    // the token lives in expo-secure-store and travels in a header. Without
    // this plugin getSession returns null for every mobile request while the
    // browser works perfectly — which looks like a mobile bug rather than a
    // missing server capability.
    bearer(),
  ],

  advanced: {
    // Postgres owns ids. users.id is uuid defaultRandom() and every foreign key
    // in 46 tables already points at it; letting Better Auth mint string ids
    // would break all of them.
    database: { generateId: false },
    // One cookie across the apex, app.* and admin.*. Unset in production is a
    // hard boot failure — see env.ts. That single guard is the most important
    // line in this migration.
    crossSubDomainCookies: env.authCookieDomain
      ? { enabled: true, domain: env.authCookieDomain }
      : { enabled: false },
  },

  databaseHooks: {
    user: {
      create: {
        /**
         * Refuse a signup whose email already belongs to a live account.
         *
         * Account linking should have matched them already, so reaching here
         * means linking FAILED and we are one insert away from a duplicate that
         * orphans every foreign key pointing at the original. A blocked signup
         * is recoverable; a split account is not.
         *
         * This is also where the deleted Clerk webhook's reasoning survives.
         * That endpoint re-linked by email with none of these guards — no
         * verified-email check, no admin exclusion, no deleted check — so
         * signing up with an admin's address inherited the admin row.
         */
        before: async (user: { email?: string | null }) => {
          if (!user.email) return;
          const [existing] = await db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(
              and(
                eq(schema.users.email, user.email.toLowerCase()),
                isNull(schema.users.deletedAt),
              ),
            )
            .limit(1);
          if (existing) {
            throw new Error(
              'An account already exists for this email address.',
            );
          }
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
