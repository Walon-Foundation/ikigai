"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { resolveReport } from "./actions";

export function ResolveActions({
  reportId,
  initialResolved,
  resolvedAt,
  initialNotes,
}: {
  reportId: string;
  initialResolved: boolean;
  resolvedAt: string | null;
  initialNotes: string;
}) {
  const [resolved, setResolved] = useState(initialResolved);
  const [failed, setFailed] = useState(false);
  const [adminNotes, setAdminNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();

  function resolve() {
    setFailed(false);
    startTransition(async () => {
      try {
        // The notes go with it. They used to live only in this component's
        // state — the request sent { reportId } and nothing else, so the
        // admin's account of what they did about a safeguarding report was
        // thrown away the moment they navigated.
        await resolveReport({ reportId, adminNotes });
        setResolved(true);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Notes
        </p>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          disabled={resolved}
          placeholder="Add notes about the action taken..."
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-70"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Saved with the report when you mark it resolved.
        </p>
      </div>

      {!resolved ? (
        <>
          <button
            type="button"
            onClick={resolve}
            disabled={pending}
            aria-busy={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            <BusyLabel pending={pending} busy="Resolving…">
              <Check className="size-5" />
              Mark as Resolved
            </BusyLabel>
          </button>
          {failed && (
            <p className="mt-3 text-center text-sm font-semibold text-destructive">
              Couldn&apos;t resolve — your notes are still here, try again.
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-full border border-primary py-4 text-sm font-semibold text-primary">
          <Check className="size-5" />
          Resolved
          {resolvedAt
            ? ` on ${new Date(resolvedAt).toLocaleDateString("en-GB")}`
            : ""}
        </div>
      )}
    </>
  );
}
