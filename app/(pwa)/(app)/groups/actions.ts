"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { groupMembers, groups, messages } from "@/db/schema";
import { reserveClubSlug } from "@/lib/clubs";
import { getDbUser } from "@/lib/db-user";
import { flagsConcern } from "@/lib/journal";
import type { SkillStage } from "@/lib/skill-stages";

const MAX_NAME = 80;
const MAX_DESC = 500;
const MAX_MESSAGE = 2_000;

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 40;
const STAGES: SkillStage[] = ["discover", "thrive", "build", "lead"];

function boundedTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
        .filter(Boolean),
    ),
  ].slice(0, MAX_TAGS);
}

/**
 * Create a club.
 *
 * Two things happen here that did not before. The club gets a slug and its own
 * interest tags, because it goes straight onto the public website and into the
 * recommendation engine — a club with no tags can still be found, but it is a
 * club nobody is matched to.
 *
 * And its text is run through the same safeguarding keyword check the journal
 * and group messages use. Publication is automatic by programme rule, so
 * nothing stands between a mentee's typing and a public page; `keywordFlag` is
 * what puts a flagged one in front of the safeguarding team afterwards, and
 * `hiddenAt` is how they take it down.
 */
export async function createGroup(data: {
  name: string;
  description?: string;
  interestTags?: string[];
  stage?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  // Approved mentees only.
  //
  // This gate did not exist while a group was an internal discussion thread
  // that only signed-in users could see. It has to exist now, because creating
  // one publishes attacker-controlled text to a public page on the charity's
  // own domain, linked from the site nav and the sitemap — and sign-up is
  // self-service, so "any authenticated user" means anyone on the internet who
  // filled in a form. A server action is reachable regardless of which page
  // rendered it, so hiding the button would not have been a gate at all.
  //
  // Same standard as requesting a mentor (mentorship/actions.ts): approved
  // means an admin has looked at this person. `club_lead` rides along because
  // the rest of the app already treats it as a mentee.
  if (me.role !== "mentee" && me.role !== "club_lead") {
    throw new Error("Only mentees can start a club.");
  }
  if (!me.verifiedAt) {
    throw new Error(
      "Your account is still being reviewed. You'll be able to start a club once the ikigai team approves it.",
    );
  }

  const name =
    typeof data.name === "string" ? data.name.trim().slice(0, MAX_NAME) : "";
  if (!name) throw new Error("Group name is required");
  const description =
    typeof data.description === "string"
      ? data.description.trim().slice(0, MAX_DESC) || null
      : null;

  const interestTags = boundedTags(data.interestTags);
  const stage = STAGES.includes(data.stage as SkillStage)
    ? (data.stage as SkillStage)
    : null;

  const [group] = await db
    .insert(groups)
    .values({
      name,
      slug: await reserveClubSlug(name),
      description,
      interestTags,
      stage,
      createdBy: me.id,
      keywordFlag: flagsConcern(`${name} ${description ?? ""}`),
    })
    .returning({ id: groups.id });

  await db
    .insert(groupMembers)
    .values({ groupId: group.id, userId: me.id })
    .onConflictDoNothing();

  revalidatePath("/groups");
  // The public listing is a static-ish page; it has to be told the club exists.
  revalidatePath("/clubs");
  return { groupId: group.id };
}

export async function joinGroup(groupId: string) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof groupId !== "string" || !groupId) throw new Error("Invalid group");

  await db
    .insert(groupMembers)
    .values({ groupId, userId: me.id })
    .onConflictDoNothing();

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
}

export async function postGroupMessage(data: {
  groupId: string;
  content: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");
  if (typeof data.groupId !== "string" || !data.groupId) {
    throw new Error("Invalid group");
  }
  const content =
    typeof data.content === "string"
      ? data.content.trim().slice(0, MAX_MESSAGE)
      : "";
  if (!content) throw new Error("Empty message");

  // Must be a member to post.
  const [member] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, data.groupId),
        eq(groupMembers.userId, me.id),
      ),
    )
    .limit(1);
  if (!member) throw new Error("Join the group to post");

  await db.insert(messages).values({
    groupId: data.groupId,
    senderId: me.id,
    content,
    keywordFlag: flagsConcern(content),
  });

  revalidatePath(`/groups/${data.groupId}`);
}
