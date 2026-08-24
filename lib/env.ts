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
    // Web Push (VAPID). The public key is exposed via NEXT_PUBLIC_VAPID_PUBLIC_KEY
    // (see env.client.ts). When keys are unset, push send is a no-op — the in-app
    // notification feed still works. Generate with `web-push generate-vapid-keys`.
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().default("mailto:hello@findingyourikigai.org"),
    // UploadThing (profile photos). Required for avatar uploads to work.
    UPLOADTHING_TOKEN: z.string().optional(),
    // Shared secret for the scheduled purge endpoint. Optional so dev and
    // preview boot without it — the route refuses to run when it's unset
    // rather than running unauthenticated.
    CRON_SECRET: z.string().optional(),
    // Email (nodemailer) — all optional so dev boots without SMTP. When unset,
    // sendMail logs to console instead of sending — see lib/email.ts.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
  });

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
  vapidPrivateKey: parsed.data.VAPID_PRIVATE_KEY,
  vapidSubject: parsed.data.VAPID_SUBJECT,
  uploadthingToken: parsed.data.UPLOADTHING_TOKEN,
  cronSecret: parsed.data.CRON_SECRET,
  smtpHost: parsed.data.SMTP_HOST,
  smtpPort: parsed.data.SMTP_PORT,
  smtpUser: parsed.data.SMTP_USER,
  smtpPass: parsed.data.SMTP_PASS,
  smtpFrom: parsed.data.SMTP_FROM,
  smtpSecure: parsed.data.SMTP_SECURE,
  // appHostname, appUrl, marketingUrl, vapidPublicKey — public values shared
  // with the client.
  ...clientEnv,
};
