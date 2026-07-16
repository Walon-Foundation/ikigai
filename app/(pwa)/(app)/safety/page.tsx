import { ChevronRight, Phone } from "lucide-react";
import Link from "next/link";
import { after } from "next/server";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { milestones } from "@/db/schema";
import { SAFETY_RESOURCES } from "@/lib/constants";
import { requireRole } from "@/lib/db-user";
import { ReportForm } from "./report-form";

// A server component. The whole page used to be `"use client"` for the sake of
// one form, so the crisis banner and the helpline numbers — the things someone
// in trouble is here for — waited on JavaScript to arrive before they existed.
// They're plain HTML now; only the report form is an island.
export default async function SafetyPage() {
  const user = await requireRole(["mentee"]);

  // Was a useEffect firing a server action on every single mount, purely to
  // write a row that is a no-op after the first time. It's deferred past the
  // response now, matching what pad-her-power already does.
  after(async () => {
    await db
      .insert(milestones)
      .values({ userId: user.id, type: "safety_module" })
      .onConflictDoNothing();
  });

  return (
    <>
      <PageHeader title="Safety" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Crisis banner */}
        <Link
          href="/safety/help"
          className="mb-6 flex items-center justify-between rounded-2xl bg-earth p-5 text-white"
        >
          <div className="flex items-center gap-3">
            <Phone className="size-6 text-earth-light" />
            <div>
              <p className="font-semibold">Need immediate help?</p>
              <p className="text-sm text-earth-light">
                View crisis helplines — always available
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-earth-light" />
        </Link>

        {/* Safety resources */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Helplines
          </p>
          <div className="space-y-3">
            {SAFETY_RESOURCES.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-muted/30">
                  <Phone className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <a
                  href={`tel:${r.phone.replace(/\s/g, "")}`}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>

        <ReportForm />
      </div>
    </>
  );
}
