import { z } from "zod";
import { clientEnv } from "./env.client";

// Validated server environment. Parsed eagerly at import so a misconfigured
// deploy fails at boot with a readable error instead of an `undefined` deep
// inside a request. Client components must import "@/lib/env.client" instead.
//
// Not using the `server-only` package because this module is also imported by
// proxy.ts (middleware); the runtime guard below gives the same protection.
if (typeof window !== "undefined") {
  throw new Error(
    'lib/env.ts is server-only — import { clientEnv } from "@/lib/env.client" in client components',
  );
}

const schema = z
  .object({
    DATABASE_URL: z.url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    // Optional: the Clerk webhook route returns 500 at runtime when unset.
    CLERK_WEBHOOK_SECRET: z.string().optional(),
    ADMIN_HOSTNAME: z.string().default("admin.localhost:3000"),
    // "stub" settles payments instantly with no network — the dev default.
    PAYMENT_PROVIDER: z.enum(["stub", "monime"]).default("stub"),
    MONIME_SPACE_ID: z.string().optional(),
    MONIME_ACCESS_TOKEN: z.string().optional(),
    MONIME_FINANCIAL_ACCOUNT_ID: z.string().optional(),
  })
  .refine(
    (e) =>
      e.PAYMENT_PROVIDER !== "monime" ||
      (e.MONIME_SPACE_ID && e.MONIME_ACCESS_TOKEN),
    {
      message:
        'PAYMENT_PROVIDER is "monime" but MONIME_SPACE_ID / MONIME_ACCESS_TOKEN are not set',
    },
  );

// Empty strings (e.g. `MONIME_SPACE_ID=` in .env) should behave like unset.
const raw = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
);

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = {
  databaseUrl: parsed.data.DATABASE_URL,
  clerkPublishableKey: parsed.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerkSecretKey: parsed.data.CLERK_SECRET_KEY,
  clerkWebhookSecret: parsed.data.CLERK_WEBHOOK_SECRET,
  adminHostname: parsed.data.ADMIN_HOSTNAME,
  paymentProvider: parsed.data.PAYMENT_PROVIDER,
  monimeSpaceId: parsed.data.MONIME_SPACE_ID,
  monimeAccessToken: parsed.data.MONIME_ACCESS_TOKEN,
  monimeFinancialAccountId: parsed.data.MONIME_FINANCIAL_ACCOUNT_ID,
  // appHostname, appUrl, marketingUrl — public values shared with the client.
  ...clientEnv,
};
