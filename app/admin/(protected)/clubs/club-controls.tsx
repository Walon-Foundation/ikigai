"use client";

import { Check, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
import { clearClubFlag, setClubVisibility } from "./actions";

export function ClubControls({
  clubId,
  clubName,
  hidden,
  flagged,
}: {
  clubId: string;
  clubName: string;
  hidden: boolean;
  flagged: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const trimmed = reason.trim();

  function run(work: () => Promise<unknown>) {
    setFailed(false);
    startTransition(async () => {
      try {
        await work();
        setConfirming(false);
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {hidden ? (
          <button
            type="button"
            onClick={() =>
              run(() => setClubVisibility({ clubId, hidden: false }))
            }
            disabled={pending}
            aria-busy={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <BusyLabel pending={pending} busy="Restoring…">
              Put back on the website
            </BusyLabel>
          </button>
        ) : (
          !confirming && (
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                setConfirming(true);
              }}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-50"
            >
              <EyeOff className="size-3.5" />
              Hide from website
            </button>
          )
        )}

        {flagged && (
          <button
            type="button"
            onClick={() => run(() => clearClubFlag(clubId))}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-50"
          >
            <Check className="size-3.5" />
            Reviewed — clear flag
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <label
            htmlFor={`hide-${clubId}`}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Why (required)
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            {clubName} stays open for its members inside the app. Only the
            public listing goes away.
          </p>
          <textarea
            id={`hide-${clubId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            disabled={pending}
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                run(() =>
                  setClubVisibility({ clubId, hidden: true, reason: trimmed }),
                )
              }
              disabled={pending || !trimmed}
              aria-busy={pending}
              className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              <BusyLabel pending={pending} busy="Hiding…">
                Hide it
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
