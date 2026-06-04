import { eq } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorships } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";

export default async function MentorPortalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "mentor") redirect("/dashboard");

  const rows = await db
    .select({
      id: mentorships.id,
      status: mentorships.status,
      menteeId: mentorships.menteeId,
      lastActivityAt: mentorships.lastActivityAt,
    })
    .from(mentorships)
    .where(eq(mentorships.mentorId, user.id));

  return (
    <>
      <PageHeader title="My Mentees" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No active mentees yet. Once your account is verified, mentees can
            connect with you.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((m) => (
              <Link
                key={m.id}
                href={`/mentor-portal/${m.menteeId}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted/30 font-display text-sm font-bold text-primary">
                  M
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Mentee</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {m.status} ·{" "}
                    {m.lastActivityAt
                      ? new Date(m.lastActivityAt).toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
