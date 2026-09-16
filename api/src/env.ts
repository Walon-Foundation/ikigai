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
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

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
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
};
