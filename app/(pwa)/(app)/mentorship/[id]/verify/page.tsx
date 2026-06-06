import { and, eq, or } from "drizzle-orm";
import { Check, ChevronLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db/db";
import { meetingVerifications, mentorships } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { MEETINGS, meetingName } from "@/lib/verification";
import { VerifyMeetingButton } from "./verify-client";

export default async function VerifyMeetingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getDbUser();
  if (!me) redirect("/sign-in");

  const [mentorship] = await db
    .select({
      id: mentorships.id,
      menteeId: mentorships.menteeId,
      mentorId: mentorships.mentorId,
    })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.id, id),
        or(eq(mentorships.menteeId, me.id), eq(mentorships.mentorId, me.id)),
      ),
    )
    .limit(1);
  if (!mentorship) notFound();

  const verified = await db
    .select({
      meetingNumber: meetingVerifications.meetingNumber,
      method: meetingVerifications.method,
      verifiedAt: meetingVerifications.verifiedAt,
    })
    .from(meetingVerifications)
    .where(eq(meetingVerifications.mentorshipId, id));
  const byNumber = new Map(verified.map((v) => [v.meetingNumber, v]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/mentorship/${id}`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <GraduationCap className="size-5 text-primary" />
        <h1 className="font-display text-2xl font-black text-foreground">
          In-Person Meetings
        </h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Three in-person meetings complete the mentorship. Verify each one when
        you meet — in order.
      </p>

      <div className="space-y-3">
        {MEETINGS.map((m) => {
          const v = byNumber.get(m.number);
          const prevDone = m.number === 1 || byNumber.has(m.number - 1);
          return (
            <div
              key={m.number}
              className={`rounded-2xl border p-5 ${
                v
                  ? "border-primary/40 bg-primary-muted/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-full text-sm font-bold ${
                      v
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {v ? <Check className="size-5" /> : m.number}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {meetingName(m.number)}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.blurb}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {v ? (
                  <p className="text-xs text-muted-foreground">
                    Verified via {v.method} ·{" "}
                    {v.verifiedAt
                      ? new Date(v.verifiedAt).toLocaleDateString("en-GB")
                      : ""}
                  </p>
                ) : prevDone ? (
                  <VerifyMeetingButton
                    mentorshipId={id}
                    meetingNumber={m.number}
                    disabled={false}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Verify the previous meeting first.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
