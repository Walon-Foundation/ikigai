import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { mentorships, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { MentorshipClient } from "./mentorship-client";

export default async function MentorshipPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const mentorshipRows = await db
    .select({
      id: mentorships.id,
      status: mentorships.status,
      matchScore: mentorships.matchScore,
      lastActivityAt: mentorships.lastActivityAt,
      mentorId: mentorships.mentorId,
    })
    .from(mentorships)
    .where(eq(mentorships.menteeId, user.id));

  const activeMentorships = await Promise.all(
    mentorshipRows.map(async (m) => {
      let mentor = null;
      if (m.mentorId) {
        const [mentorUser] = await db
          .select({
            id: users.id,
            displayName: users.displayName,
            bio: users.bio,
            interestTags: users.interestTags,
          })
          .from(users)
          .where(eq(users.id, m.mentorId))
          .limit(1);
        mentor = mentorUser ?? null;
      }
      return {
        id: m.id,
        status: m.status,
        matchScore: m.matchScore,
        lastActivityAt: m.lastActivityAt?.toISOString() ?? null,
        mentor,
      };
    }),
  );

  const connectedMentorIds = mentorshipRows
    .map((m) => m.mentorId)
    .filter((id): id is string => !!id);

  const allMentors = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      bio: users.bio,
      interestTags: users.interestTags,
    })
    .from(users)
    .where(and(eq(users.role, "mentor"), ne(users.id, user.id)))
    .limit(10);

  const suggestedMentors = allMentors
    .filter((m) => !connectedMentorIds.includes(m.id))
    .map((m) => ({ ...m, matchScore: 85 }));

  return (
    <MentorshipClient
      activeMentorships={activeMentorships}
      suggestedMentors={suggestedMentors}
    />
  );
}
