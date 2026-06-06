"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { groupMembers, groups, messages } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { flagsConcern } from "@/lib/journal";

const MAX_NAME = 80;
const MAX_DESC = 500;
const MAX_MESSAGE = 2_000;

export async function createGroup(data: {
  name: string;
  description?: string;
}) {
  const me = await getDbUser();
  if (!me) throw new Error("Unauthenticated");

  const name =
    typeof data.name === "string" ? data.name.trim().slice(0, MAX_NAME) : "";
  if (!name) throw new Error("Group name is required");
  const description =
    typeof data.description === "string"
      ? data.description.trim().slice(0, MAX_DESC) || null
      : null;

  const [group] = await db
    .insert(groups)
    .values({ name, description, createdBy: me.id })
    .returning({ id: groups.id });

  await db
    .insert(groupMembers)
    .values({ groupId: group.id, userId: me.id })
    .onConflictDoNothing();

  revalidatePath("/groups");
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
