import { ChevronLeft, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getPublicClub } from "@/lib/clubs";

const STAGE_LABELS: Record<string, string> = {
  discover: "Discover",
  thrive: "Thrive",
  build: "Build",
  lead: "Lead",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getPublicClub(slug);
  if (!club) return { title: "Club not found · Ikigai" };
  return {
    title: `${club.name} · Ikigai Clubs`,
    description:
      club.description ?? `${club.name}, a club started by an Ikigai mentee.`,
  };
}

export default async function ClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getPublicClub(slug);
  // getPublicClub already excludes hidden clubs, so a club an admin has taken
  // down 404s here rather than rendering — the same answer a visitor gets for a
  // club that never existed.
  if (!club) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <Link
              href="/clubs"
              className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-muted"
            >
              <ChevronLeft className="size-4" />
              All clubs
            </Link>
            <h1 className="font-display text-4xl font-black leading-[1.05] text-primary-foreground sm:text-5xl">
              {club.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {club.stage && (
                <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {STAGE_LABELS[club.stage] ?? club.stage} stage
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-primary-muted">
                <Users className="size-4" />
                {club.memberCount}{" "}
                {club.memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-14">
          {club.description ? (
            <p className="whitespace-pre-line text-lg leading-relaxed text-foreground">
              {club.description}
            </p>
          ) : (
            <p className="text-muted-foreground">
              This club hasn&apos;t added a description yet.
            </p>
          )}

          {club.interestTags && club.interestTags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {club.interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg font-bold text-foreground">
              Want to join?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clubs are for young people on the Ikigai programme. Join Ikigai
              and you can join this club from inside the app.
            </p>
            <Link
              href="/get-involved"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Get involved
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
