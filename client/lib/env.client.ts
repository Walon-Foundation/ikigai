// Client-safe environment values. Only NEXT_PUBLIC_ variables may appear here,
// and each must be referenced as a literal `process.env.NEXT_PUBLIC_*` expression
// so Next.js can inline the value into the browser bundle at build time —
// dynamic lookups are not inlined.
//
// Server code should import `env` from "@/lib/env" instead, which re-exports
// these values alongside the validated server-only variables.

const appHostname =
  process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.localhost:3000";

const schemeFor = (host: string) =>
  host.includes("localhost") ? "http" : "https";

export const clientEnv = {
  /** Hostname of the PWA, e.g. "app.findingyourikigai.org" or "app.localhost:3000". */
  appHostname,
  /** Absolute base URL of the PWA, derived from the hostname. */
  appUrl: `${schemeFor(appHostname)}://${appHostname}`,
  /**
   * Where the marketing site sends people to get the app: its Google Play
   * listing (the app is Android first). Override with
   * NEXT_PUBLIC_APP_DOWNLOAD_URL if the listing moves or iOS ships.
   */
  appDownloadUrl:
    process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ??
    "https://play.google.com/store/apps/details?id=org.walonfoundation.ikigai",
  /** Absolute URL of the marketing site. */
  marketingUrl:
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000",
  /** VAPID public key for Web Push subscription. Empty string = push disabled. */
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
};
