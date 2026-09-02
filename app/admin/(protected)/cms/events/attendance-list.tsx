"use client";

import { useTransition } from "react";
import type { events } from "@/db/schema";

type AttendanceRow = {
  id: string;
  eventId: string;
  status: string;
  userName: string | null;
  userEmail: string | null;
};

export function AttendanceList({
  rows,
  attendanceByEvent,
  setAttendanceStatus,
}: {
  rows: (typeof events.$inferSelect)[];
  attendanceByEvent: Map<string, AttendanceRow[]>;
  setAttendanceStatus: (data: { attendanceId: string; status: string }) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No events yet — create one above.
      </div>
    );
  }

  const hasAny = [...attendanceByEvent.values()].some((l) => l.length > 0);
  if (!hasAny) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No RSVPs yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((ev) => {
        const attendees = attendanceByEvent.get(ev.id) ?? [];
        if (attendees.length === 0) return null;
        return (
          <div key={ev.id} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">{ev.title}</h3>
              <span className="text-xs text-muted-foreground">
                {attendees.length} RSVP{attendees.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {a.userName ?? "Unknown"}
                    </p>
                    {a.userEmail && (
                      <p className="truncate text-xs text-muted-foreground">{a.userEmail}</p>
                    )}
                  </div>
                  <select
                    value={a.status}
                    disabled={pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        await setAttendanceStatus({ attendanceId: a.id, status: e.target.value });
                      })
                    }
                    className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="registered">Registered</option>
                    <option value="attended">Attended</option>
                    <option value="no_show">No show</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
