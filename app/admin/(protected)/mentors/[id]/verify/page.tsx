import { and, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ChevronLeft,
  CreditCard,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UTApi } from "uploadthing/server";
import { db } from "@/db/db";
import { mentorDocuments, users } from "@/db/schema";
import { VerifyActions } from "./verify-actions";

type MentorOnboarding = { personalStatement?: string } | null;

const DOCUMENT_KINDS = [
  { kind: "government_id", label: "Government ID", icon: CreditCard },
  { kind: "cv", label: "CV / Resume", icon: FileText },
] as const;

/** Signed links live just long enough for the admin to open them. */
const LINK_TTL_SECONDS = 15 * 60;

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

  // The stored files are private, so there is no URL to render — one is minted
  // here, per view, and expires. generateSignedURL is local (it signs the key
  // rather than calling UploadThing), so this costs no round-trip. The bytes
  // still never touch this backend: the admin's own browser fetches the file
  // from storage with the signed link.
  const rows = await db
    .select({
      kind: mentorDocuments.kind,
      fileKey: mentorDocuments.fileKey,
      fileName: mentorDocuments.fileName,
    })
    .from(mentorDocuments)
    .where(eq(mentorDocuments.userId, id));

  const utapi = new UTApi();
  const documents = await Promise.all(
    rows.map(async (row) => {
      try {
        const { ufsUrl } = await utapi.generateSignedURL(row.fileKey, {
          expiresIn: LINK_TTL_SECONDS,
        });
        return { ...row, url: ufsUrl };
      } catch {
        // A document we can't produce a link for must read as unavailable, not
        // as absent — and certainly not as verified.
        return { ...row, url: null };
      }
    }),
  );

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
          This card used to render a HARDCODED array claiming "Government ID —
          ✓ Uploaded" and "CV — ✓ Uploaded" for every mentor, with no document
          storage behind it. On the screen where an admin decides whether to
          approve an adult who will be paired with a child, that was fabricated
          compliance evidence. It reads real state now, and says so plainly when
          a document is missing. */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Submitted Documents
        </p>
        <div className="space-y-3">
          {DOCUMENT_KINDS.map((doc) => {
            const found = documents.find((d) => d.kind === doc.kind);
            return (
              <div
                key={doc.kind}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <doc.icon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {doc.label}
                  </span>
                  {found?.fileName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {found.fileName}
                    </p>
                  )}
                </div>
                {found?.url ? (
                  <a
                    href={found.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    View
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-earth">
                    <AlertTriangle className="size-3" />
                    Not submitted
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Links are private and expire after 15 minutes.
        </p>
      </div>

      <VerifyActions
        mentorId={id}
        mentorName={mentor.displayName ?? "This mentor"}
      />
    </div>
  );
}
