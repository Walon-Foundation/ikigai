import { aliasedTable, and, desc, eq, isNotNull } from "drizzle-orm";
import { ArrowLeft, Award, Briefcase, Globe, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorReviews, mentorships, users } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { RequestMentorButton, ReviewForm } from "./mentor-actions";

type MentorProfile = {
  expertise?: string[];
  industry?: string;
  yearsExperience?: number;
  languages?: string[];
  location?: string;
};

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireRole(["mentee", "parent"]);
  const { id } = await params;

  const [mentor] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      role: users.role,
      interestTags: users.interestTags,
      onboardingData: users.onboardingData,
    })
    .from(users)
    // Only ikigai-approved mentors are viewable in the marketplace.
    .where(
      and(
        eq(users.id, id),
        eq(users.role, "mentor"),
        isNotNull(users.verifiedAt),
      ),
    )
    .limit(1);
  if (!mentor) notFound();

  const author = aliasedTable(users, "author");
  const [reviews, existingRequest] = await Promise.all([
    db
      .select({
        id: mentorReviews.id,
        rating: mentorReviews.rating,
        comment: mentorReviews.comment,
        createdAt: mentorReviews.createdAt,
        authorId: mentorReviews.authorId,
        authorName: author.displayName,
      })
      .from(mentorReviews)
      .leftJoin(author, eq(mentorReviews.authorId, author.id))
      .where(eq(mentorReviews.mentorId, id))
      .orderBy(desc(mentorReviews.createdAt)),
    db
      .select({ id: mentorships.id })
      .from(mentorships)
      .where(and(eq(mentorships.menteeId, me.id), eq(mentorships.mentorId, id)))
      .limit(1),
  ]);

  const profile =
    (mentor.onboardingData as { mentorProfile?: MentorProfile })
      ?.mentorProfile ?? {};
  const myReview = reviews.find((r) => r.authorId === me.id);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <PageHeader title="Mentor" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <Link
          href="/mentors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to mentors
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <Avatar
              name={mentor.displayName ?? "Mentor"}
              src={mentor.avatarUrl}
              size={64}
              className="rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-black text-foreground">
                {mentor.displayName ?? "Mentor"}
              </h1>
              {reviews.length > 0 && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="size-4 fill-accent text-accent" />
                  {avgRating.toFixed(1)} · {reviews.length} review
                  {reviews.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {profile.industry && (
              <span className="flex items-center gap-1.5 capitalize">
                <Briefcase className="size-4" /> {profile.industry}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {profile.location}
              </span>
            )}
            {typeof profile.yearsExperience === "number" && (
              <span className="flex items-center gap-1.5">
                <Award className="size-4" /> {profile.yearsExperience} yrs
              </span>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Globe className="size-4" /> {profile.languages.join(", ")}
              </span>
            )}
          </div>

          {mentor.bio && (
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              {mentor.bio}
            </p>
          )}

          {(profile.expertise?.length || mentor.interestTags?.length) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                ...(profile.expertise ?? []),
                ...(mentor.interestTags ?? []),
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Request (mentees only) */}
        {me.role === "mentee" && (
          <RequestMentorButton
            mentorId={id}
            alreadyRequested={existingRequest.length > 0}
          />
        )}

        {/* Testimonials */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Testimonials
          </p>
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No reviews yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {r.authorName ?? "Anonymous"}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-accent">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed star icons
                          key={i}
                          className="size-3.5 fill-accent text-accent"
                        />
                      ))}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave a review */}
        <ReviewForm
          mentorId={id}
          initialRating={myReview?.rating ?? 0}
          initialComment={myReview?.comment ?? ""}
        />
      </div>
    </>
  );
}
