import { type NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/db-user";
import { env } from "@/lib/env";

/**
 * Browser -> NestJS API.
 *
 * Server actions and Server Components call the API directly through
 * `lib/api.ts`. This route exists for the browser, which must never hold the
 * internal token — so the token is attached here, on the server, after this
 * app has authenticated the caller against its own session.
 *
 * That makes this the trust boundary: everything past it is authenticated, and
 * the API trusts the `x-user-id` this route sets. A browser cannot set it,
 * because whatever it sends is discarded and replaced below.
 *
 * Sits under /api/proxy rather than catching /api/* so it cannot shadow the
 * app's own routes — uploadthing, messages, notifications, the cron endpoints
 * and the Clerk webhook all live at /api/… and must keep resolving to
 * themselves.
 *
 * Transitional along with the rest of the internal-token scheme: once Better
 * Auth issues sessions the API can read, the browser can talk to it directly
 * and this route is deleted. See docs/02-auth.md.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const me = await getDbUser();
  if (!me) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  // `params` is a promise as of Next 15.
  const { path } = await params;
  const search = request.nextUrl.search;
  const target = `${env.apiUrl}/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  // Set last, unconditionally: these are the two headers a caller must not be
  // able to choose for themselves.
  headers.set("x-internal-token", env.internalApiToken);
  headers.set("x-user-id", me.id);

  const method = request.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
