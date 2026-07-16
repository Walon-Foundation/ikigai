import { and, eq } from "drizzle-orm";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { VerifyActions } from "./verify-actions";

type MentorOnboarding = { personalStatement?: string } | null;

export default async function VerifyMentorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [mentor] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "mentor")))
    .limit(1);

  if (!mentor) notFound();

  const statement = (mentor.onboardingData as MentorOnboarding)
    ?.personalStatement;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/mentors"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Mentors
      </Link>

      <h1 className="font-display mb-6 text-3xl font-black text-foreground">
        Verify Mentor
      </h1>

      {/* Mentor Details */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
            {(mentor.displayName ?? "?")
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {mentor.displayName ?? "Unknown"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mentor.email ?? "—"}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bio
          </p>
          <p className="text-sm text-foreground">
            {mentor.bio ?? "No bio provided."}
          </p>
        </div>

        {mentor.interestTags && mentor.interestTags.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interest Areas
            </p>
            <div className="flex flex-wrap gap-2">
              {mentor.interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary"
                >
                  {tag.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {statement && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal Statement
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {statement}
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Submitted
          </p>
          <p className="text-sm text-foreground">
            {mentor.createdAt
              ? new Date(mentor.createdAt).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Submitted Documents.
          This card used to render a hardcoded array claiming "Government ID —
          ✓ Uploaded" and "CV — ✓ Uploaded" for EVERY mentor. No document
          storage exists in this codebase, so nothing had ever been uploaded and
          there was nothing behind the checkmarks. On the screen where an admin
          decides whether to approve an adult who will be paired with a child,
          that is fabricated compliance evidence: an admin checking that ID was
          submitted before approving was told yes, always.
          Until the real upload flow lands, this states the truth instead. */}
      <div className="mb-6 rounded-xl border border-earth/30 bg-earth-light/10 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-earth" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              No documents on file
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Document upload isn&apos;t built yet — mentors are told at
              onboarding that our team will contact them by email. Verify this
              mentor&apos;s ID and CV through that channel before approving.
            </p>
          </div>
        </div>
      </div>

      <VerifyActions
        mentorId={id}
        mentorName={mentor.displayName ?? "This mentor"}
      />
    </div>
  );
}
