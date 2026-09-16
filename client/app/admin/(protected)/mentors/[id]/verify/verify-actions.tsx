"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { verifyMentor } from "./actions";

export function VerifyActions({
  mentorId,
  mentorName,
  alreadyRejected = false,
}: {
  mentorId: string;
  mentorName: string;
  /** Already-rejected applicants land here to have the decision reviewed. */
  alreadyRejected?: boolean;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  // Which button is spinning. A single `loading` flag would spin both.
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  // Rejection asks first; approval does not. The two used to be siblings of
  // equal weight — same size, side by side, both firing instantly on one click
  // — even though only one of them wrote a decision no admin screen could undo.
  // The friction here is deliberately asymmetric: it sits on the action that is
  // harder to walk back, and stays off the one an admin takes all day.
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const trimmedReason = reason.trim();

  function decide(action: "approved" | "rejected") {
    setFailed(false);
    setBusy(action);
    startTransition(async () => {
      try {
        await verifyMentor({
          mentorId,
          action,
          reason: action === "rejected" ? trimmedReason : undefined,
        });
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
            : "They have been notified in the app and by email. They stay on the mentors page under Rejected, with your reason — reopen them there to approve later."}
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
            {alreadyRejected ? "Approve Anyway" : "Approve Mentor"}
          </BusyLabel>
        </button>
        {!confirming && (
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setConfirming(true);
            }}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive py-4 font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <X className="size-5" />
            {alreadyRejected ? "Update Rejection" : "Reject"}
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive">
            Reject {mentorName}?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            They&apos;ll be emailed to say the team will follow up, and they
            move to Rejected on the mentors page. Nothing about their account is
            deleted, and you can approve them later from that page.
          </p>
          <label
            htmlFor="rejection-reason"
            className="mt-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Reason (required)
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            An internal note for whoever follows up — what was missing, or what
            didn&apos;t check out. The applicant isn&apos;t shown this.
          </p>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={pending}
            placeholder="e.g. Government ID not submitted; CV lists no work with young people."
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide("rejected")}
              // The reason gates the button, not a validation message after the
              // fact: the decision cannot be recorded without one.
              disabled={pending || !trimmedReason}
              aria-busy={busy === "rejected"}
              className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              <BusyLabel pending={busy === "rejected"} busy="Rejecting…">
                Yes, reject
              </BusyLabel>
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setFailed(false);
              }}
              disabled={pending}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
          {!trimmedReason && (
            <p className="mt-2 text-xs text-muted-foreground">
              Add a reason to enable Reject.
            </p>
          )}
        </div>
      )}

      {failed && (
        <p className="mt-3 text-center text-sm font-semibold text-destructive">
          Couldn&apos;t save that decision — nothing was changed. Try again.
        </p>
      )}
    </>
  );
}
