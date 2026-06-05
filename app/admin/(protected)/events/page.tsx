import { desc, eq } from "drizzle-orm";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { db } from "@/db/db";
import { eventAttendance, events, users } from "@/db/schema";
import {
  AttendanceControls,
  DeleteEventButton,
  EventCreateForm,
} from "./events-client";

function fmt(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminEventsPage() {
  const [eventRows, attendanceRows] = await Promise.all([
    db.select().from(events).orderBy(desc(events.startsAt)),
    db
      .select({
        id: eventAttendance.id,
        eventId: eventAttendance.eventId,
        status: eventAttendance.status,
        userName: users.displayName,
      })
      .from(eventAttendance)
      .leftJoin(users, eq(eventAttendance.userId, users.id)),
  ]);

  const byEvent = new Map<string, typeof attendanceRows>();
  for (const a of attendanceRows) {
    const list = byEvent.get(a.eventId) ?? [];
    list.push(a);
    byEvent.set(a.eventId, list);
  }

  const now = Date.now();
  const upcoming = eventRows.filter(
    (e) => e.startsAt && e.startsAt.getTime() >= now,
  );
  const past = eventRows.filter(
    (e) => !e.startsAt || e.startsAt.getTime() < now,
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground">
          Events
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organise activities and track attendance
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <EventCreateForm />
        </div>

        <div className="space-y-8">
          <EventList
            title="Upcoming"
            events={upcoming}
            byEvent={byEvent}
            empty="No upcoming events."
          />
          <EventList
            title="Past"
            events={past}
            byEvent={byEvent}
            empty="No past events."
          />
        </div>
      </div>
    </div>
  );
}

function EventList({
  title,
  events: list,
  byEvent,
  empty,
}: {
  title: string;
  events: (typeof events.$inferSelect)[];
  byEvent: Map<
    string,
    { id: string; status: string; userName: string | null }[]
  >;
  empty: string;
}) {
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold text-foreground">
        {title}
      </h2>
      {list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((ev) => {
            const attendees = byEvent.get(ev.id) ?? [];
            const attended = attendees.filter(
              (a) => a.status === "attended",
            ).length;
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <DeleteEventButton eventId={ev.id} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {fmt(ev.startsAt)}
                  </span>
                  {ev.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {ev.location}
                      {ev.region ? ` · ${ev.region.replace(/_/g, " ")}` : ""}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {attendees.length}
                    {ev.capacity ? `/${ev.capacity}` : ""} registered ·{" "}
                    {attended} attended
                  </span>
                </div>

                {attendees.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    {attendees.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground">
                          {a.userName ?? "Unknown"}
                        </span>
                        <AttendanceControls
                          attendanceId={a.id}
                          status={a.status}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
