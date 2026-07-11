import { and, asc, eq, or } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Curriculum, type CurriculumItem } from "@/components/curriculum";
import { SharedMilestones } from "@/components/shared-milestones";
import { db } from "@/db/db";
import {
  curriculumItems,
  meetingVerifications,
  mentorships,
  users,
} from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

// Shared mentorship plan — the shared milestone track (starting with the
// Finding Yourself Picnic) and the curriculum. Visible to BOTH parties; the
// mentor can edit the curriculum, the mentee tracks progress.
export default async function MentorshipPlanPage({
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

  const isMentor = mentorship.mentorId === me.id;
  const peerId = isMentor ? mentorship.menteeId : mentorship.mentorId;

  const [peer] = peerId
    ? await db
        .select({ displayName: users.displayName, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, peerId))
        .limit(1)
    : [undefined];

  const [curriculumRows, verified] = await Promise.all([
    db
      .select()
      .from(curriculumItems)
      .where(eq(curriculumItems.mentorshipId, id))
      .orderBy(asc(curriculumItems.orderIndex)),
    db
      .select({
        meetingNumber: meetingVerifications.meetingNumber,
        verifiedAt: meetingVerifications.verifiedAt,
      })
      .from(meetingVerifications)
      .where(eq(meetingVerifications.mentorshipId, id)),
  ]);

  const verifiedNumbers = new Set(verified.map((v) => v.meetingNumber));

  const curriculum: CurriculumItem[] = curriculumRows.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    orderIndex: c.orderIndex,
    targetDate: c.targetDate?.toISOString() ?? null,
    completedAt: c.completedAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/mentorship/${id}`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to chat
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <Avatar
          name={peer?.displayName ?? "Partner"}
          src={peer?.avatarUrl}
          size={48}
        />
        <div>
          <h1 className="font-display text-xl font-black text-foreground">
            {peer?.displayName ?? (isMentor ? "Your mentee" : "Your mentor")}
          </h1>
          <p className="text-xs text-muted-foreground">
            Shared plan & progress
          </p>
        </div>
      </div>

      {/* Shared milestone track */}
      <div className="mb-4">
        <SharedMilestones
          mentorshipId={id}
          verifiedNumbers={[...verifiedNumbers]}
        />
      </div>

      {/* Shared curriculum */}
      <Curriculum
        mentorshipId={id}
        initialItems={curriculum}
        canEdit={isMentor}
      />
    </div>
  );
}
