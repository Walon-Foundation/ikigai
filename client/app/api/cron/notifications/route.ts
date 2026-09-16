import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runNotificationJobs } from "@/lib/notifications/jobs";

// The daily notification run: inactivity nudges, stalled-milestone reminders,
// mentor check-in prompts, stage-readiness alerts and the weekly summaries.
//
// One route running every job rather than a cron entry per job, because Vercel
// allows two scheduled entries at daily granularity and the account purge holds
// the other. Adding a scheduled notification later means adding it to
// lib/notifications/jobs.ts, not adding a deployment.
//
// Auth is copied from the purge job on purpose: fails closed with no secret
// configured, rather than running unauthenticated. This one cannot delete
// anything, but an open endpoint here is a button that pushes a notification to
// every user on the platform.
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

  // Individual jobs report "failed" rather than throwing, so a broken one is
  // visible in the response and the logs without taking the rest down with it.
  const report = await runNotificationJobs();
  return NextResponse.json(report);
}
