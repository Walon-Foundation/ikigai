import { avg, count, eq, isNotNull } from "drizzle-orm";
import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { mentorReviews, users } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { cn } from "@/lib/utils";

type MentorProfile = {
  expertise?: string[];
  industry?: string;
  yearsExperience?: number;
  languages?: string[];
  location?: string;
};

export default async function MentorsMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string }>;
}) {
  await requireRole(["mentee", "parent"]);
  const { q, industry } = await searchParams;

  const [mentorRows, ratingRows] = await Promise.all([
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        bio: users.bio,
        interestTags: users.interestTags,
        onboardingData: users.onboardingData,
      })
      .from(users)
      .where(eq(users.role, "mentor")),
    db
      .select({
        mentorId: mentorReviews.mentorId,
        avgRating: avg(mentorReviews.rating),
        reviewCount: count(),
      })
      .from(mentorReviews)
      .where(isNotNull(mentorReviews.mentorId))
      .groupBy(mentorReviews.mentorId),
  ]);

  const ratings = new Map(
    ratingRows.map((r) => [
      r.mentorId,
      { avg: Number(r.avgRating ?? 0), count: Number(r.reviewCount) },
    ]),
  );

  const mentors = mentorRows.map((m) => {
    const profile = (m.onboardingData as { mentorProfile?: MentorProfile })
      ?.mentorProfile;
    const r = ratings.get(m.id);
    return {
      id: m.id,
      name: m.displayName ?? "Mentor",
      bio: m.bio,
      tags: m.interestTags ?? [],
      industry: profile?.industry ?? null,
      location: profile?.location ?? null,
      expertise: profile?.expertise ?? [],
      rating: r?.avg ?? 0,
      reviewCount: r?.count ?? 0,
    };
  });

  // Industry filter options from the data.
  const industries = [
    ...new Set(mentors.map((m) => m.industry).filter(Boolean)),
  ] as string[];

  const query = (q ?? "").toLowerCase();
  const filtered = mentors.filter((m) => {
    if (industry && m.industry !== industry) return false;
    if (!query) return true;
    const haystack = [m.name, m.industry ?? "", ...m.tags, ...m.expertise]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  return (
    <>
      <PageHeader title="Find a Mentor" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Search */}
        <form className="mb-4">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, skill or industry…"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
          />
        </form>

        {/* Industry chips */}
        {industries.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <Link
              href="/mentors"
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                !industry
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              All
            </Link>
            {industries.map((ind) => (
              <Link
                key={ind}
                href={`/mentors?industry=${encodeURIComponent(ind)}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium capitalize",
                  industry === ind
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {ind}
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No mentors match your search yet.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <Link
                key={m.id}
                href={`/mentors/${m.id}`}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {m.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{m.name}</p>
                    {m.reviewCount > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-accent text-accent" />
                        {m.rating.toFixed(1)} ({m.reviewCount})
                      </span>
                    )}
                  </div>
                  {m.industry && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.industry}
                      {m.location && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <MapPin className="size-3" />
                          {m.location}
                        </span>
                      )}
                    </p>
                  )}
                  {m.bio && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {m.bio}
                    </p>
                  )}
                  {m.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
