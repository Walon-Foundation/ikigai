"use client";

import { useState, useTransition } from "react";
import { cancelRsvp, checkIn, rsvp } from "./actions";

export function RsvpButton({
  eventId,
  registered,
  checkedIn,
  locked,
  lockLabel,
}: {
  eventId: string;
  registered: boolean;
  checkedIn: boolean;
  locked: boolean;
  lockLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (checkedIn) {
    return (
      <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
        Checked in ✓
      </span>
    );
  }

  if (locked) {
    return (
      <span className="inline-flex rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
        {lockLabel ?? "Locked"}
      </span>
    );
  }

  if (registered) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run(() => checkIn(eventId))}
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {pending ? "…" : "Check in"}
        </button>
        <button
          type="button"
          onClick={() => run(() => cancelRsvp(eventId))}
          disabled={pending}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40"
        >
          Cancel RSVP
        </button>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => run(() => rsvp(eventId))}
        disabled={pending}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
      >
        {pending ? "…" : "RSVP"}
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
