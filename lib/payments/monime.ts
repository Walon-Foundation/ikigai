import "server-only";
import { createClient, type MonimeClient } from "monime-package";

// Monime client built from env credentials. Throws if misconfigured so we never
// silently fall through to a half-working state.
export function getMonimeClient(): MonimeClient {
  const monimeSpaceId = process.env.MONIME_SPACE_ID;
  const accessToken = process.env.MONIME_ACCESS_TOKEN;
  if (!monimeSpaceId || !accessToken) {
    throw new Error(
      "Monime is not configured — set MONIME_SPACE_ID and MONIME_ACCESS_TOKEN",
    );
  }
  return createClient({ monimeSpaceId, accessToken });
}

// True when Monime can actually be used (provider selected + credentials set).
export function monimeEnabled(): boolean {
  return (
    process.env.PAYMENT_PROVIDER === "monime" &&
    !!process.env.MONIME_SPACE_ID &&
    !!process.env.MONIME_ACCESS_TOKEN
  );
}

// Absolute base URL for building Monime success/cancel redirect targets.
export function appBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const host = process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.localhost:3000";
  const scheme = host.includes("localhost") ? "http" : "https";
  return `${scheme}://${host}`;
}
