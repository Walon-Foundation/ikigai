"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { verifyMentee } from "./actions";

// Approve / reject controls for one mentee, inline in the queue.
//
// Inline rather than on a detail page of its own, unlike the mentor queue: a
// mentor application is a set of vetting documents that has to be opened and
// read, while a mentee application is the profile already shown on the card.
// Sending an admin through a second screen to see nothing new is friction with
// no decision behind it.
//
// The asymmetry from the mentor screen is kept, though — rejection asks for a
// reason first, approval does not. Rejection is the decision that is harder to
// walk back, and it is the one the friction belongs on.
export function MenteeDecision({
  menteeId,
  menteeName,
  alreadyRejected = false,
}: {
  menteeId: string;
  menteeName: string;
  alreadyRejected?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [pending, startTransition] = useTransition();
  const trimmedReason = reason.trim();

  function decide(action: "approved" | "rejected") {
    setFailed(false);
    setBusy(action);
    startTransition(async () => {
      try {
        await verifyMentee({
          menteeId,
          action,
          reason: action === "rejected" ? trimmedReason : undefined,
        });
        setConfirming(false);
        router.refresh();
      } catch {
        setFailed(true);
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={pending}
          aria-busy={busy === "approved"}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          <BusyLabel pending={busy === "approved"} busy="Approving…">
            <Check className="size-3.5" />
            {alreadyRejected ? "Approve anyway" : "Approve"}
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
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-50"
          >
            <X className="size-3.5" />
            {alreadyRejected ? "Update reason" : "Reject"}
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <label
            htmlFor={`reason-${menteeId}`}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Reason (required)
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            An internal note for whoever follows up with {menteeName}. They are
            not shown this — they are told the team will be in touch.
          </p>
          <textarea
            id={`reason-${menteeId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={pending}
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide("rejected")}
              disabled={pending || !trimmedReason}
              aria-busy={busy === "rejected"}
              className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              <BusyLabel pending={busy === "rejected"} busy="Saving…">
                Yes, reject
              </BusyLabel>
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {failed && (
        <p className="mt-2 text-xs font-semibold text-destructive">
          Couldn&apos;t save that — nothing was changed. Try again.
        </p>
      )}
    </div>
  );
}
