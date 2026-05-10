import Link from "next/link";
import { ChevronLeft, FileText, CreditCard, Check } from "lucide-react";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { VerifyActions } from "./verify-actions";

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
            {(mentor.displayName ?? "?").split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {mentor.displayName ?? "Unknown"}
            </h2>
            <p className="text-sm text-muted-foreground">{mentor.email ?? "—"}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bio
          </p>
          <p className="text-sm text-foreground">{mentor.bio ?? "No bio provided."}</p>
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

      {/* Submitted Documents */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Submitted Documents
        </p>
        <div className="space-y-3">
          {[
            { icon: CreditCard, label: "Government ID", status: "Uploaded" },
            { icon: FileText, label: "CV / Resume", status: "Uploaded" },
          ].map((doc) => (
            <div
              key={doc.label}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <doc.icon className="size-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">
                {doc.label}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                <Check className="size-3" />
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <VerifyActions
        mentorId={id}
        mentorName={mentor.displayName ?? "This mentor"}
      />
    </div>
  );
}
