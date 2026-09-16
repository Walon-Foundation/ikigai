import "server-only";
import { env } from "@/lib/env";

/**
 * Server-side calls from this app to the NestJS API.
 *
 * This runs in server actions and Server Components, never in the browser — so
 * it talks to the API directly rather than through the /api/proxy route, which
 * exists for browser callers that cannot hold the internal token.
 *
 * Auth is transitional. This app still owns the Clerk session, so it resolves
 * the user itself and forwards the row id alongside a shared secret proving the
 * caller is us. When Better Auth lands in the API (docs/02-auth.md) the session
 * travels on its own and both headers go away.
 *
 * Errors surface as plain `Error`s carrying the API's message, because that is
 * exactly what the server actions being replaced already threw and what the
 * forms already render inline. Keeping the shape means no UI had to change.
 */
type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** users.id of the caller. Required — the API rejects a request without it. */
  userId: string;
  /** Forwarded to fetch; use "no-store" for anything a user just changed. */
  cache?: RequestCache;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, userId, cache = "no-store" }: ApiOptions,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      method,
      cache,
      headers: {
        "content-type": "application/json",
        "x-internal-token": env.internalApiToken,
        "x-user-id": userId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // A connection failure is an operational problem, not a user error, and
    // saying so beats a form field reporting "fetch failed".
    throw new Error("Could not reach the server. Please try again.", { cause });
  }

  if (!res.ok) {
    throw new Error(await messageFrom(res));
  }

  // 204, or any empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * Nest's exception filter returns { message, error, statusCode }, where
 * `message` is either a string or an array of them. Anything else — a proxy
 * error page, a crash — is not shown to the user verbatim.
 */
async function messageFrom(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    const m = data?.message;
    if (typeof m === "string" && m) return m;
    if (Array.isArray(m) && m.length) return m.join(", ");
  } catch {
    // fall through
  }
  return res.status >= 500
    ? "Something went wrong. Please try again."
    : "That request could not be completed.";
}
