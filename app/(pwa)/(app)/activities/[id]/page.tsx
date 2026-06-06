import { and, count, eq } from "drizzle-orm";
import { CalendarDays, ChevronLeft, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db/db";
import { eventAttendance, events } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { getMenteeProgress } from "@/lib/progress";
import { RsvpButton } from "../activities-client";

function fmt(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  if (!event) notFound();

  const [[{ taken }], [mine], progress] = await Promise.all([
    db
      .select({ taken: count() })
      .from(eventAttendance)
      .where(eq(eventAttendance.eventId, id)),
    db
      .select({ status: eventAttendance.status })
      .from(eventAttendance)
      .where(
        and(
          eq(eventAttendance.eventId, id),
          eq(eventAttendance.userId, user.id),
        ),
      )
      .limit(1),
    user.role === "mentee" ? getMenteeProgress(user) : null,
  ]);

  const percent = progress?.percent ?? 100;
  const unlockAt = event.unlockAtPercent ?? 0;
  const locked = user.role === "mentee" && unlockAt > 0 && percent < unlockAt;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/activities"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Activities
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
          {event.type}
        </span>
        <h1 className="mt-3 font-display text-2xl font-black text-foreground">
          {event.title}
        </h1>

        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4" /> {fmt(event.startsAt)}
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <MapPin className="size-4" /> {event.location}
              {event.region ? ` · ${event.region.replace(/_/g, " ")}` : ""}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Users className="size-4" /> {Number(taken)}
            {event.capacity ? `/${event.capacity}` : ""} registered
          </p>
        </div>

        {event.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {event.description}
          </p>
        )}

        <div className="mt-6">
          <RsvpButton
            eventId={event.id}
            registered={!!mine}
            checkedIn={mine?.status === "attended"}
            locked={locked}
            lockLabel={`Unlocks at ${unlockAt}% roadmap completion`}
          />
        </div>
      </div>
    </div>
  );
}
