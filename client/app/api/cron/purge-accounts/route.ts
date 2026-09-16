import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { purgeExpiredAccounts } from "@/lib/purge";

// Scheduled purge of accounts whose deletion grace period has expired.
//
// Fails closed: with no CRON_SECRET configured the endpoint refuses to run at
// all rather than running unauthenticated. This one deletes people's data — an
// open endpoint here is not a thing that should be possible to reach by
// forgetting an env var.
export async function GET(request: Request) {
  if (!env.cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purged = await purgeExpiredAccounts();
  return NextResponse.json({ purged: purged.length });
}
