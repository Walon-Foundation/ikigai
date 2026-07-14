"use client";

import { useState, useTransition } from "react";
import { BusyLabel } from "@/components/spinner";
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
  // Check in / Cancel RSVP / RSVP fire independently, so a single shared
  // pending flag would spin all of them at once — track which one is busy.
  const [busyAction, setBusyAction] = useState<
    "checkin" | "cancel" | "rsvp" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: "checkin" | "cancel" | "rsvp", fn: () => Promise<void>) {
    setError(null);
    setBusyAction(action);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setBusyAction(null);
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
          onClick={() => run("checkin", () => checkIn(eventId))}
          disabled={pending}
          aria-busy={busyAction === "checkin"}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          <BusyLabel pending={busyAction === "checkin"} busy="Checking in…">
            Check in
          </BusyLabel>
        </button>
        <button
          type="button"
          onClick={() => run("cancel", () => cancelRsvp(eventId))}
          disabled={pending}
          aria-busy={busyAction === "cancel"}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40"
        >
          <BusyLabel pending={busyAction === "cancel"} busy="Cancelling…">
            Cancel RSVP
          </BusyLabel>
        </button>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => run("rsvp", () => rsvp(eventId))}
        disabled={pending}
        aria-busy={busyAction === "rsvp"}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
      >
        <BusyLabel pending={busyAction === "rsvp"} busy="Registering…">
          RSVP
        </BusyLabel>
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
