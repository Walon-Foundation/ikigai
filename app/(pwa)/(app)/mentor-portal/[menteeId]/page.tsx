import { eq } from "drizzle-orm";
import { ChevronLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { mentorships, milestones, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

export default async function MenteeDetailPage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const { menteeId } = await params;
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "mentor") redirect("/dashboard");

  const [mentee] = await db
    .select({
      displayName: users.displayName,
      growthLevel: users.growthLevel,
      interestTags: users.interestTags,
    })
    .from(users)
    .where(eq(users.id, menteeId))
    .limit(1);

  if (!mentee) redirect("/mentor-portal");

  const milestoneRows = await db
    .select({ type: milestones.type, completedAt: milestones.completedAt })
    .from(milestones)
    .where(eq(milestones.userId, menteeId));

  const [mentorship] = await db
    .select({ id: mentorships.id, status: mentorships.status })
    .from(mentorships)
    .where(eq(mentorships.menteeId, menteeId))
    .limit(1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/mentor-portal"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> My Mentees
      </Link>

      <div className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-xl font-bold">
          {mentee.displayName
            ?.split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("") ?? "M"}
        </div>
        <p className="mt-3 font-display text-2xl font-black">
          {mentee.displayName ?? "Mentee"}
        </p>
        <p className="text-sm text-primary-muted">
          Level {mentee.growthLevel ?? 1} · {milestoneRows.length} milestones
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Milestones
          </p>
          {milestoneRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            <div className="space-y-2">
              {milestoneRows.map((m) => (
                <div key={m.type} className="flex items-center gap-3 text-sm">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="flex-1 capitalize text-foreground">
                    {m.type?.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {m.completedAt
                      ? new Date(m.completedAt).toLocaleDateString("en-GB")
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {mentorship && (
          <Link
            href={`/mentorship/${mentorship.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <MessageCircle className="size-4" /> Open Chat
          </Link>
        )}
      </div>
    </div>
  );
}
