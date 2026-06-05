import { and, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorships, users } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { acceptedChildForParent } from "@/lib/guardian";

export default async function ParentMentorsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "parent") redirect("/dashboard");

  const child = await acceptedChildForParent(user.id);

  let mentor: {
    displayName: string | null;
    bio: string | null;
    interestTags: string[] | null;
  } | null = null;

  if (child) {
    const [row] = await db
      .select({
        displayName: users.displayName,
        bio: users.bio,
        interestTags: users.interestTags,
      })
      .from(users)
      .innerJoin(
        mentorships,
        and(
          eq(mentorships.mentorId, users.id),
          eq(mentorships.menteeId, child.id),
          eq(mentorships.status, "active"),
        ),
      )
      .limit(1);
    mentor = row ?? null;
  }

  return (
    <>
      <PageHeader title="Mentor" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {!child ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Link to your child and have them accept before you can see their
            mentor.
          </div>
        ) : !mentor ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {child.displayName} has not been matched with a mentor yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary-muted/30 font-display text-lg font-bold text-primary">
                {mentor.displayName
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") ?? "M"}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">
                  {mentor.displayName}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-accent text-accent" /> Mentoring{" "}
                  {child.displayName}
                </p>
              </div>
            </div>
            {mentor.bio && (
              <p className="mt-4 text-sm text-muted-foreground">{mentor.bio}</p>
            )}
            {mentor.interestTags && mentor.interestTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {mentor.interestTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
