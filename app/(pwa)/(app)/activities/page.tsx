import { eq, gte } from "drizzle-orm";
import { CalendarDays, Lock, MapPin, PartyPopper } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { eventAttendance, events } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { getMenteeProgress } from "@/lib/progress";

function fmt(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ActivitiesPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const now = new Date();
  const [upcoming, myAttendance, progress] = await Promise.all([
    db
      .select()
      .from(events)
      .where(gte(events.startsAt, now))
      .orderBy(events.startsAt),
    db
      .select({
        eventId: eventAttendance.eventId,
        status: eventAttendance.status,
      })
      .from(eventAttendance)
      .where(eq(eventAttendance.userId, user.id)),
    user.role === "mentee" ? getMenteeProgress(user) : null,
  ]);

  const attendanceByEvent = new Map(
    myAttendance.map((a) => [a.eventId, a.status]),
  );
  const percent = progress?.percent ?? 100;

  return (
    <>
      <PageHeader title="Activities" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
            <CalendarDays className="size-6 text-primary" />
            <p className="mt-4 font-semibold text-foreground">
              No upcoming activities
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Workshops, networking, wellness sessions and camps will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((ev) => {
              const status = attendanceByEvent.get(ev.id);
              const isPicnic = ev.type === "picnic";
              const locked =
                user.role === "mentee" &&
                (ev.unlockAtPercent ?? 0) > 0 &&
                percent < (ev.unlockAtPercent ?? 0);
              return (
                <Link
                  key={ev.id}
                  href={`/activities/${ev.id}`}
                  className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isPicnic && (
                          <PartyPopper className="size-4 text-accent" />
                        )}
                        <h3 className="font-semibold text-foreground">
                          {ev.title}
                        </h3>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {fmt(ev.startsAt)}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {ev.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                      {ev.type}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {status === "attended" ? (
                      <span className="text-xs font-semibold text-primary">
                        Checked in ✓
                      </span>
                    ) : status ? (
                      <span className="text-xs font-semibold text-accent">
                        Registered
                      </span>
                    ) : locked ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        Unlocks at {ev.unlockAtPercent}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Tap to RSVP
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
