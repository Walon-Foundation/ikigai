// Validation for a stored Web Push subscription.
//
// Lives here rather than in the settings action because two entry points write
// this column now: the Settings toggle, and /api/push/resubscribe when the
// browser rotates a subscription behind the user's back. Both must apply the
// same rules — a column that one path bounds and the other does not is an
// unbounded column.

/** A valid subscription is far under this; the cap is a guard, not a limit. */
export const MAX_SUBSCRIPTION_BYTES = 4_000;

/**
 * A browser PushSubscription serialises to an object with an https endpoint and
 * a keys pair. Reject anything that doesn't look like one so we don't persist
 * arbitrary client-supplied JSON into a column we later hand to web-push.
 */
export function isPushSubscription(
  value: unknown,
): value is { endpoint: string; keys?: unknown } {
  if (typeof value !== "object" || value === null) return false;
  const endpoint = (value as { endpoint?: unknown }).endpoint;
  return typeof endpoint === "string" && endpoint.startsWith("https://");
}

/** True when the subscription is well-formed and small enough to store. */
export function isStorableSubscription(value: unknown): boolean {
  if (!isPushSubscription(value)) return false;
  return JSON.stringify(value).length <= MAX_SUBSCRIPTION_BYTES;
}
