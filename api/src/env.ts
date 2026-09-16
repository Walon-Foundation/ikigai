import 'dotenv/config';
import { z } from 'zod';

// dotenv is loaded explicitly rather than relying on the runtime: `bun run`
// reads .env on its own but `nest start` and `node dist/main` do not, so
// without this the server boots fine under one command and dies under another.
//
// Validated server environment, parsed eagerly at import so a misconfigured
// deploy fails at boot with a readable error rather than an `undefined` deep
// inside a request. Same approach as the client's lib/env.ts — deliberately, so
// the two behave alike when something is missing.

const schema = z.object({
  DATABASE_URL: z.url(),
  // Shared secret the Next.js client presents on every call — see
  // src/auth/internal-auth.guard.ts. Transitional, and deleted with that guard
  // when Better Auth lands.
  //
  // Defaulted in development so the API boots from a fresh clone, but REQUIRED
  // in production: the refinement below fails at boot rather than letting a
  // deploy come up with a guessable token in front of every user's data.
  INTERNAL_API_TOKEN: z.string().min(1).default('dev-internal-token'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // --- Better Auth -------------------------------------------------------
  // Signing secret. Defaulted in development so the API boots from a clone;
  // the refinement below makes it a hard boot failure in production, because a
  // guessable secret here forges any session.
  BETTER_AUTH_SECRET: z.string().min(32).default('dev-only-better-auth-secret-not-for-production-use'),
  // Absolute base URL of THIS server. Must be set explicitly or OAuth returns
  // redirect_uri_mismatch in production.
  BETTER_AUTH_URL: z.url().default('http://localhost:4000'),
  // Parent domain the session cookie is set on, so apex, app.* and admin.*
  // share one session. REQUIRED in production — see the refinement below.
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  MARKETING_URL: z.url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // --- Surface hostnames -------------------------------------------------
  // Notifications link to the surface the RECIPIENT uses, and the admin panel
  // is a different origin from the PWA — a relative "/reports" would resolve
  // against the wrong one. Same reasoning as the client's lib/env.ts.
  APP_HOSTNAME: z.string().default('app.localhost:3000'),
  ADMIN_HOSTNAME: z.string().default('admin.localhost:3000'),

  // --- Web Push (VAPID) — optional ---------------------------------------
  // Unset disables OS push; the in-app notification feed still works and
  // transport.ts logs one warning rather than failing silently.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:hello@findingyourikigai.org'),

  // --- Email (nodemailer) — optional -------------------------------------
  // See the note on `sendMail` in shared/email.ts: unset means mail is logged
  // and dropped, which is a live production bug this port carries over rather
  // than silently changes.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z
    .union([z.string(), z.boolean()])
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      const t = v.trim().toLowerCase();
      return t === 'true' || t === '1' || t === 'yes';
    })
    .optional(),

  // --- Uploads / jobs — optional -----------------------------------------
  UPLOADTHING_TOKEN: z.string().optional(),
  // The cron routes FAIL CLOSED when unset rather than running
  // unauthenticated: one of them deletes accounts.
  CRON_SECRET: z.string().optional(),
})
  .refine(
    (v) =>
      v.NODE_ENV !== 'production' ||
      v.INTERNAL_API_TOKEN !== 'dev-internal-token',
    {
      path: ['INTERNAL_API_TOKEN'],
      message:
        'must be set to a real secret in production, not left at the development default',
    },
  )
  .refine((v) => v.NODE_ENV !== 'production' || !!v.AUTH_COOKIE_DOMAIN, {
    path: ['AUTH_COOKIE_DOMAIN'],
    message:
      'is required in production — without it the session cookie is not shared across app.* and admin.*, which is the most common cause of a redirect loop',
  })
  .refine(
    (v) =>
      v.NODE_ENV !== 'production' ||
      !v.BETTER_AUTH_SECRET.startsWith('dev-only-'),
    {
      path: ['BETTER_AUTH_SECRET'],
      message:
        'must be set to a real secret in production — a guessable value here forges any session',
    },
  );

// Empty strings in a .env should behave like unset.
const raw = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === '' ? undefined : v]),
);

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

/** http for localhost, https everywhere else — matches the client's rule. */
function schemeFor(host: string): string {
  return host.includes('localhost') ? 'http' : 'https';
}

export const env = {
  databaseUrl: parsed.data.DATABASE_URL,
  internalApiToken: parsed.data.INTERNAL_API_TOKEN,
  authSecret: parsed.data.BETTER_AUTH_SECRET,
  authBaseUrl: parsed.data.BETTER_AUTH_URL,
  authCookieDomain: parsed.data.AUTH_COOKIE_DOMAIN,
  marketingUrl: parsed.data.MARKETING_URL,
  googleClientId: parsed.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
  appHostname: parsed.data.APP_HOSTNAME,
  appUrl: schemeFor(parsed.data.APP_HOSTNAME) + '://' + parsed.data.APP_HOSTNAME,
  adminHostname: parsed.data.ADMIN_HOSTNAME,
  adminUrl:
    schemeFor(parsed.data.ADMIN_HOSTNAME) + '://' + parsed.data.ADMIN_HOSTNAME,
  vapidPublicKey: parsed.data.VAPID_PUBLIC_KEY,
  vapidPrivateKey: parsed.data.VAPID_PRIVATE_KEY,
  vapidSubject: parsed.data.VAPID_SUBJECT,
  smtpHost: parsed.data.SMTP_HOST,
  smtpPort: parsed.data.SMTP_PORT,
  smtpUser: parsed.data.SMTP_USER,
  smtpPass: parsed.data.SMTP_PASS,
  smtpFrom: parsed.data.SMTP_FROM,
  smtpSecure: parsed.data.SMTP_SECURE,
  uploadthingToken: parsed.data.UPLOADTHING_TOKEN,
  cronSecret: parsed.data.CRON_SECRET,
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
};
