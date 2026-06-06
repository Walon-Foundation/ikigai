"use client";

import { CalendarPlus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createEvent, deleteEvent, setAttendanceStatus } from "./actions";

const REGIONS = [
  { value: "", label: "No region" },
  { value: "freetown", label: "Freetown" },
  { value: "western_rural", label: "Western Rural" },
];

const EVENT_TYPES = [
  { value: "workshop", label: "Workshop" },
  { value: "training", label: "Training" },
  { value: "networking", label: "Networking" },
  { value: "wellness", label: "Wellness" },
  { value: "camp", label: "Leadership Camp" },
  { value: "picnic", label: "Finding Yourself Picnic" },
];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function EventCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createEvent({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          location: String(formData.get("location") ?? ""),
          region: String(formData.get("region") ?? ""),
          startsAt: String(formData.get("startsAt") ?? ""),
          endsAt: String(formData.get("endsAt") ?? ""),
          capacity: String(formData.get("capacity") ?? ""),
          type: String(formData.get("type") ?? ""),
          unlockAtPercent: String(formData.get("unlockAtPercent") ?? ""),
        });
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create event");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <CalendarPlus className="size-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">
          Create Event
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="ev-title" className={labelClass}>
            Title
          </label>
          <input
            id="ev-title"
            name="title"
            required
            placeholder="Career skills workshop"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="ev-desc" className={labelClass}>
            Description
          </label>
          <textarea
            id="ev-desc"
            name="description"
            rows={3}
            placeholder="What's this event about?"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-location" className={labelClass}>
              Location
            </label>
            <input
              id="ev-location"
              name="location"
              placeholder="Venue / address"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ev-region" className={labelClass}>
              Region
            </label>
            <select id="ev-region" name="region" className={inputClass}>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-starts" className={labelClass}>
              Starts
            </label>
            <input
              id="ev-starts"
              name="startsAt"
              type="datetime-local"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ev-ends" className={labelClass}>
              Ends (optional)
            </label>
            <input
              id="ev-ends"
              name="endsAt"
              type="datetime-local"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-type" className={labelClass}>
              Type
            </label>
            <select id="ev-type" name="type" className={inputClass}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ev-capacity" className={labelClass}>
              Capacity (optional)
            </label>
            <input
              id="ev-capacity"
              name="capacity"
              type="number"
              min="1"
              placeholder="Unlimited"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="ev-unlock" className={labelClass}>
            Unlock at roadmap % (optional)
          </label>
          <input
            id="ev-unlock"
            name="unlockAtPercent"
            type="number"
            min="0"
            max="100"
            placeholder="0 = open to all (Picnic is typically 50)"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-40 transition-colors"
        >
          <CalendarPlus className="size-4" />
          {pending ? "Creating…" : done ? "Created! ✓" : "Create Event"}
        </button>
      </div>
    </form>
  );
}

const ATTENDANCE_OPTIONS = [
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No show" },
];

export function AttendanceControls({
  attendanceId,
  status,
}: {
  attendanceId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      await setAttendanceStatus({ attendanceId, status: next });
    });
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
    >
      {ATTENDANCE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(eventId);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Delete event"
      >
        <Trash2 className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Confirm delete"}
    </button>
  );
}
