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
}).refine(
  (v) =>
    v.NODE_ENV !== 'production' || v.INTERNAL_API_TOKEN !== 'dev-internal-token',
  {
    path: ['INTERNAL_API_TOKEN'],
    message:
      'must be set to a real secret in production, not left at the development default',
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

export const env = {
  databaseUrl: parsed.data.DATABASE_URL,
  internalApiToken: parsed.data.INTERNAL_API_TOKEN,
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
};
