import "server-only";
import { createClient, type MonimeClient } from "monime-package";
import { env } from "@/lib/env";

// Monime client built from env credentials. Throws if misconfigured so we never
// silently fall through to a half-working state.
export function getMonimeClient(): MonimeClient {
  const { monimeSpaceId, monimeAccessToken } = env;
  if (!monimeSpaceId || !monimeAccessToken) {
    throw new Error(
      "Monime is not configured — set MONIME_SPACE_ID and MONIME_ACCESS_TOKEN",
    );
  }
  return createClient({ monimeSpaceId, accessToken: monimeAccessToken });
}

// True when Monime can actually be used. env validation guarantees the
// credentials are set whenever the provider is "monime".
export function monimeEnabled(): boolean {
  return env.paymentProvider === "monime";
}
