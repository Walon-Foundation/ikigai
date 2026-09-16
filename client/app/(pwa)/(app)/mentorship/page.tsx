import { and, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db/db";
import { mentorships, users } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { matchScore } from "@/lib/match";
import { MentorMessages } from "./mentor-messages";
import { MentorshipClient } from "./mentorship-client";

export default async function MentorshipPage() {
  const user = await requireRole(["mentee", "mentor"]);

  // Mentors get their conversation list; the match flow below is mentee-only.
  if (user.role === "mentor") {
    return <MentorMessages mentorId={user.id} />;
  }

  // Joining the mentor onto the mentorship collapses what used to be one
  // query per row (N+1) into a single round-trip, and running it alongside
  // the suggested-mentors query lets both go out in the same wave.
  const mentorshipRowsQuery = db
    .select({
      id: mentorships.id,
      status: mentorships.status,
      matchScore: mentorships.matchScore,
      lastActivityAt: mentorships.lastActivityAt,
      mentorId: mentorships.mentorId,
      mentorDisplayName: users.displayName,
      mentorAvatarUrl: users.avatarUrl,
      mentorBio: users.bio,
      mentorInterestTags: users.interestTags,
    })
    .from(mentorships)
    .leftJoin(users, eq(mentorships.mentorId, users.id))
    .where(eq(mentorships.menteeId, user.id));

  const allMentorsQuery = db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      interestTags: users.interestTags,
    })
    .from(users)
    // Suggest only ikigai-approved mentors.
    .where(
      and(
        eq(users.role, "mentor"),
        ne(users.id, user.id),
        isNotNull(users.verifiedAt),
      ),
    )
    .limit(20);

  const [mentorshipRows, allMentors] = await Promise.all([
    mentorshipRowsQuery,
    allMentorsQuery,
  ]);

  const myMentorships = mentorshipRows.map((m) => ({
    id: m.id,
    status: m.status,
    matchScore: m.matchScore,
    lastActivityAt: m.lastActivityAt?.toISOString() ?? null,
    mentor: m.mentorId
      ? {
          id: m.mentorId,
          displayName: m.mentorDisplayName,
          avatarUrl: m.mentorAvatarUrl,
          bio: m.mentorBio,
          interestTags: m.mentorInterestTags,
        }
      : null,
  }));

  const connectedMentorIds = mentorshipRows
    .map((m) => m.mentorId)
    .filter((id): id is string => !!id);

  // Real similarity score per mentor, best matches first.
  const suggestedMentors = allMentors
    .filter((m) => !connectedMentorIds.includes(m.id))
    .map((m) => ({
      ...m,
      matchScore: matchScore(user.interestTags, m.interestTags),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <MentorshipClient
      myMentorships={myMentorships}
      suggestedMentors={suggestedMentors}
    />
  );
}
