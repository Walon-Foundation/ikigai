import { and, asc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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

  // This page is opened from the chat, so it should feel instant. It used to be
  // four round-trips deep — mentorship, then the peer, then the curriculum and
  // meetings — each waiting on the last. Over neon-http that chain *is* the load
  // time.
  //
  // Both sides of the mentorship are joined in up front (aliased, since `users`
  // appears twice), so the peer comes back with the mentorship rather than after
  // it. The curriculum and meetings restate the membership predicate as a join,
  // which both frees them from needing the mentorship row first and makes them
  // self-authorizing: a non-party matches no rows.
  const isParty = or(
    eq(mentorships.menteeId, me.id),
    eq(mentorships.mentorId, me.id),
  );
  const inThisMentorship = and(eq(mentorships.id, id), isParty);

  const menteeUser = alias(users, "mentee_user");
  const mentorUser = alias(users, "mentor_user");

  const [mentorshipRows, curriculumRows, verified] = await Promise.all([
    db
      .select({
        id: mentorships.id,
        menteeId: mentorships.menteeId,
        mentorId: mentorships.mentorId,
        menteeName: menteeUser.displayName,
        menteeAvatar: menteeUser.avatarUrl,
        mentorName: mentorUser.displayName,
        mentorAvatar: mentorUser.avatarUrl,
      })
      .from(mentorships)
      .leftJoin(menteeUser, eq(mentorships.menteeId, menteeUser.id))
      .leftJoin(mentorUser, eq(mentorships.mentorId, mentorUser.id))
      .where(inThisMentorship)
      .limit(1),
    db
      .select()
      .from(curriculumItems)
      .innerJoin(
        mentorships,
        and(eq(curriculumItems.mentorshipId, mentorships.id), inThisMentorship),
      )
      .orderBy(asc(curriculumItems.orderIndex)),
    db
      .select({
        meetingNumber: meetingVerifications.meetingNumber,
        verifiedAt: meetingVerifications.verifiedAt,
      })
      .from(meetingVerifications)
      .innerJoin(
        mentorships,
        and(
          eq(meetingVerifications.mentorshipId, mentorships.id),
          inThisMentorship,
        ),
      ),
  ]);

  const mentorship = mentorshipRows[0];
  if (!mentorship) notFound();

  const isMentor = mentorship.mentorId === me.id;
  const peer = isMentor
    ? { displayName: mentorship.menteeName, avatarUrl: mentorship.menteeAvatar }
    : {
        displayName: mentorship.mentorName,
        avatarUrl: mentorship.mentorAvatar,
      };

  const verifiedNumbers = new Set(verified.map((v) => v.meetingNumber));

  const curriculum: CurriculumItem[] = curriculumRows.map((row) => {
    const c = row.curriculum_items;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      orderIndex: c.orderIndex,
      targetDate: c.targetDate?.toISOString() ?? null,
      completedAt: c.completedAt?.toISOString() ?? null,
    };
  });

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
