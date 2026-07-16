"use client";

import { Check, ShieldQuestion, X } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { acceptGuardianLink, declineGuardianLink } from "./guardian-actions";

export type GuardianRequest = {
  id: string;
  parentName: string;
  relationship: string | null;
};

export function GuardianConsent({ requests }: { requests: GuardianRequest[] }) {
  if (requests.length === 0) return null;
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <ConsentCard key={r.id} request={r} />
      ))}
    </div>
  );
}

function ConsentCard({ request }: { request: GuardianRequest }) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<"accepted" | "declined" | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  // Keyed, not a shared boolean: one isPending for both buttons spun "Accept"
  // when the user pressed "Decline".
  const [busy, setBusy] = useState<"accepted" | "declined" | null>(null);

  function decide(choice: "accepted" | "declined") {
    setFailed(false);
    setBusy(choice);
    startTransition(async () => {
      try {
        if (choice === "accepted") {
          await acceptGuardianLink(request.id);
        } else {
          await declineGuardianLink(request.id);
        }
        // Only after the write returns. This is a consent decision about who
        // can watch a child's progress — reporting it as done when it failed
        // is not an option.
        setResolved(choice);
      } catch {
        setFailed(true);
      } finally {
        setBusy(null);
      }
    });
  }

  if (resolved) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {resolved === "accepted"
          ? `${request.parentName} can now follow your progress.`
          : "Request declined."}
      </div>
    );
  }

  const rel = request.relationship ?? "guardian";

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent-pale/40 p-5">
      <div className="flex items-start gap-3">
        <ShieldQuestion className="mt-0.5 size-5 shrink-0 text-earth" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Guardian link request
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {request.parentName}
            </span>{" "}
            wants to link as your {rel} and follow your growth and progress.
            Only accept if you know this person.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          aria-busy={busy === "accepted"}
          onClick={() => decide("accepted")}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <BusyLabel pending={busy === "accepted"} busy="Accepting…">
            <Check className="size-4" />
            Accept
          </BusyLabel>
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-busy={busy === "declined"}
          onClick={() => decide("declined")}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <BusyLabel pending={busy === "declined"} busy="Declining…">
            <X className="size-4" />
            Decline
          </BusyLabel>
        </button>
      </div>
      {failed && (
        <p className="mt-2 text-xs font-semibold text-destructive">
          Couldn&apos;t save that — nothing was changed. Try again.
        </p>
      )}
    </div>
  );
}
