"use server";

import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db/db";
import { curriculumItems, mentorships, users } from "@/db/schema";
import { notifyUser } from "@/lib/notify";

const MAX_TITLE = 200;
const MAX_DESC = 2_000;

type Caller = { id: string; role: string };

async function requireUser(): Promise<Caller> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [me] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!me) throw new Error("User not found");
  return { id: me.id, role: me.role };
}

// Resolve a mentorship the caller is part of, returning both party ids and
// which side the caller is. Throws if the caller isn't a member.
async function mentorshipContext(mentorshipId: string, me: Caller) {
  const [m] = await db
    .select({
      id: mentorships.id,
      mentorId: mentorships.mentorId,
      menteeId: mentorships.menteeId,
    })
    .from(mentorships)
    .where(eq(mentorships.id, mentorshipId))
    .limit(1);
  if (!m) throw new Error("Mentorship not found");
  const isMentor = m.mentorId === me.id;
  const isMentee = m.menteeId === me.id;
  if (!isMentor && !isMentee) throw new Error("Forbidden");
  return { ...m, isMentor, isMentee };
}

// Same, but resolved from a curriculum item id.
async function itemContext(itemId: string, me: Caller) {
  const [row] = await db
    .select({
      id: curriculumItems.id,
      status: curriculumItems.status,
      mentorshipId: curriculumItems.mentorshipId,
      mentorId: mentorships.mentorId,
      menteeId: mentorships.menteeId,
    })
    .from(curriculumItems)
    .innerJoin(mentorships, eq(curriculumItems.mentorshipId, mentorships.id))
    .where(eq(curriculumItems.id, itemId))
    .limit(1);
  if (!row) throw new Error("Item not found");
  const isMentor = row.mentorId === me.id;
  const isMentee = row.menteeId === me.id;
  if (!isMentor && !isMentee) throw new Error("Forbidden");
  return { ...row, isMentor, isMentee };
}

function clampTitle(value: unknown): string {
  const t = typeof value === "string" ? value.trim().slice(0, MAX_TITLE) : "";
  if (!t) throw new Error("Title is required");
  return t;
}

function clampDesc(value: unknown): string | null {
  const d = typeof value === "string" ? value.trim().slice(0, MAX_DESC) : "";
  return d || null;
}

// Mentor-only: append a new curriculum module.
export async function addCurriculumItem(input: {
  mentorshipId: string;
  title: string;
  description?: string;
  targetDate?: string | null;
}) {
  const me = await requireUser();
  const ctx = await mentorshipContext(input.mentorshipId, me);
  if (!ctx.isMentor) throw new Error("Only the mentor can edit the curriculum");

  const existing = await db
    .select({ orderIndex: curriculumItems.orderIndex })
    .from(curriculumItems)
    .where(eq(curriculumItems.mentorshipId, ctx.id))
    .orderBy(asc(curriculumItems.orderIndex));
  const nextIndex =
    existing.length > 0
      ? Math.max(...existing.map((e) => e.orderIndex)) + 1
      : 0;

  const title = clampTitle(input.title);
  await db.insert(curriculumItems).values({
    mentorshipId: ctx.id,
    title,
    description: clampDesc(input.description),
    orderIndex: nextIndex,
    targetDate: input.targetDate ? new Date(input.targetDate) : null,
  });

  if (ctx.menteeId) {
    const menteeId = ctx.menteeId;
    after(async () => {
      await notifyUser({
        userId: menteeId,
        title: "New curriculum step added",
        body: title,
        type: "task",
        url: "/mentorship",
      });
    });
    revalidatePath(`/mentor-portal/${ctx.menteeId}`);
  }
}

// Mentor-only: edit a module's title/description.
export async function editCurriculumItem(input: {
  id: string;
  title: string;
  description?: string;
}) {
  const me = await requireUser();
  const ctx = await itemContext(input.id, me);
  if (!ctx.isMentor) throw new Error("Only the mentor can edit the curriculum");

  await db
    .update(curriculumItems)
    .set({
      title: clampTitle(input.title),
      description: clampDesc(input.description),
    })
    .where(eq(curriculumItems.id, input.id));

  if (ctx.menteeId) revalidatePath(`/mentor-portal/${ctx.menteeId}`);
}

// Mentor-only: remove a module.
export async function deleteCurriculumItem(id: string) {
  const me = await requireUser();
  const ctx = await itemContext(id, me);
  if (!ctx.isMentor) throw new Error("Only the mentor can edit the curriculum");

  await db.delete(curriculumItems).where(eq(curriculumItems.id, id));
  if (ctx.menteeId) revalidatePath(`/mentor-portal/${ctx.menteeId}`);
}

// Mentor-only: move a module up/down by swapping order with its neighbour.
export async function moveCurriculumItem(id: string, direction: "up" | "down") {
  const me = await requireUser();
  const ctx = await itemContext(id, me);
  if (!ctx.isMentor) throw new Error("Only the mentor can edit the curriculum");

  const items = await db
    .select({ id: curriculumItems.id, orderIndex: curriculumItems.orderIndex })
    .from(curriculumItems)
    .where(eq(curriculumItems.mentorshipId, ctx.mentorshipId))
    .orderBy(asc(curriculumItems.orderIndex));

  const idx = items.findIndex((i) => i.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= items.length) return;

  const a = items[idx];
  const b = items[swapWith];
  await db
    .update(curriculumItems)
    .set({ orderIndex: b.orderIndex })
    .where(eq(curriculumItems.id, a.id));
  await db
    .update(curriculumItems)
    .set({ orderIndex: a.orderIndex })
    .where(eq(curriculumItems.id, b.id));

  if (ctx.menteeId) revalidatePath(`/mentor-portal/${ctx.menteeId}`);
}

// Either party can update progress. Notifies the other side, especially on
// completion, so the shared curriculum stays visible to both.
export async function setCurriculumItemStatus(input: {
  id: string;
  status: "planned" | "in_progress" | "done";
}) {
  const me = await requireUser();
  const ctx = await itemContext(input.id, me);

  await db
    .update(curriculumItems)
    .set({
      status: input.status,
      completedAt: input.status === "done" ? new Date() : null,
    })
    .where(eq(curriculumItems.id, input.id));

  // Tell the counterpart (the party who isn't the actor).
  const counterpart = ctx.isMentor ? ctx.menteeId : ctx.mentorId;
  if (counterpart && input.status === "done") {
    after(async () => {
      await notifyUser({
        userId: counterpart,
        title: "Curriculum step completed ✅",
        body: "A step in your shared curriculum was marked done.",
        type: "milestone",
        url: "/mentorship",
      });
    });
  }

  if (ctx.menteeId) revalidatePath(`/mentor-portal/${ctx.menteeId}`);
  revalidatePath(`/mentorship/${ctx.mentorshipId}`);
}
