"use client";

import { Check, Loader2, ShieldQuestion, X } from "lucide-react";
import { useState, useTransition } from "react";
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
          onClick={() =>
            startTransition(async () => {
              await acceptGuardianLink(request.id);
              setResolved("accepted");
            })
          }
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Accept
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await declineGuardianLink(request.id);
              setResolved("declined");
            })
          }
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <X className="size-4" /> Decline
        </button>
      </div>
    </div>
  );
}
