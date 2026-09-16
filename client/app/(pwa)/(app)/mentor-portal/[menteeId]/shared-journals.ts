import "server-only";
import { apiFetch } from "@/lib/api";

// NOT a server action — this module deliberately has no "use server" directive.
// Every exported async function in such a file becomes a public HTTP endpoint,
// callable by anyone holding the action id, with no session at all.
//
// The authorization property is now stronger than it was. This used to take
// `mentorId` as an argument and join on it, which meant its only check was
// against a value the caller passed in — no check at all. The API takes the
// mentor from the SESSION, so the join is a real boundary: a mentor without an
// active mentorship to this mentee matches no rows, and no argument can change
// that.

export type SharedJournal = {
  id: string;
  content: string;
  visibility: string | null;
  createdAt: string | null;
  feedback: { id: string; comment: string; createdAt: string | null }[];
};

export async function getSharedJournals(menteeId: string, mentorId: string) {
  return apiFetch<SharedJournal[]>(`/journal/shared/${menteeId}`, {
    userId: mentorId,
  });
}
