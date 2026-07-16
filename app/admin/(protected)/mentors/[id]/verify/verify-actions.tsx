"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { verifyMentor } from "./actions";

export function VerifyActions({
  mentorId,
  mentorName,
}: {
  mentorId: string;
  mentorName: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  // Which button is spinning. A single `loading` flag would spin both.
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);

  function decide(action: "approved" | "rejected") {
    setFailed(false);
    setBusy(action);
    startTransition(async () => {
      try {
        await verifyMentor({ mentorId, action });
        // Only claim the decision landed once the write actually returned. The
        // old code fired the request, ignored the response entirely, and set
        // this from the click — so an expired session or a 500 still showed
        // "approved" and the admin walked away believing it.
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
        <div
          className={`mb-4 flex size-16 items-center justify-center rounded-full ${
            decision === "approved" ? "bg-primary/10" : "bg-destructive/10"
          }`}
        >
          {decision === "approved" ? (
            <Check className="size-8 text-primary" />
          ) : (
            <X className="size-8 text-destructive" />
          )}
        </div>
        <h2 className="font-display text-2xl font-black text-foreground">
          {decision === "approved"
            ? `${mentorName} approved`
            : `${mentorName} rejected`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {decision === "approved"
            ? "They can now be matched with mentees."
            : "They have been notified in the app and by email."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/mentors")}
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Queue
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
            Approve Mentor
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
