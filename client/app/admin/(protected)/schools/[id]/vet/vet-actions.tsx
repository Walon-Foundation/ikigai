"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { vetSchool } from "./actions";

export function VetActions({
  schoolId,
  schoolName,
}: {
  schoolId: string;
  schoolName: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);

  function decide(action: "approved" | "rejected") {
    setFailed(false);
    setBusy(action);
    startTransition(async () => {
      try {
        await vetSchool({ schoolId, action });
        // Set from the write's result, not from the click. This screen used to
        // announce "rejected — the club lead has been notified" on top of a
        // request that wrote nothing and notified nobody.
        setDecision(action);
      } catch {
        setFailed(true);
      } finally {
        setBusy(null);
      }
    });
  }

  if (decision) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-5xl">
          {decision === "approved" ? "🏫" : "❌"}
        </div>
        <h2 className="font-display text-2xl font-black text-foreground">
          {decision === "approved"
            ? `${schoolName} approved`
            : `${schoolName} rejected`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {decision === "approved"
            ? "The clubhouse is active and the club lead has been notified."
            : "The club lead has been notified."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/schools")}
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Schools
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={pending}
          aria-busy={busy === "approved"}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          <BusyLabel pending={busy === "approved"} busy="Approving…">
            <Check className="size-5" />
            Approve School
          </BusyLabel>
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={pending}
          aria-busy={busy === "rejected"}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive py-4 font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <BusyLabel pending={busy === "rejected"} busy="Rejecting…">
            <X className="size-5" />
            Reject
          </BusyLabel>
        </button>
      </div>
      {failed && (
        <p className="mt-3 text-center text-sm font-semibold text-destructive">
          Couldn&apos;t save that decision — nothing was changed. Try again.
        </p>
      )}
    </>
  );
}
