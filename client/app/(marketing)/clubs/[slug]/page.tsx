import { Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { buttonClass } from "@/components/system/button";
import { getPublicClub } from "@/lib/clubs";
import { pageMetadata } from "@/lib/seo";

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
  if (!club) return { title: "Club not found" };
  return pageMetadata({
    title: `${club.name} · Clubs`,
    description:
      club.description ?? `${club.name}, a club started by an Ikigai mentee.`,
    path: `/clubs/${slug}`,
  });
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
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero
          back={{ href: "/clubs", label: "All clubs" }}
          title={club.name}
        >
          <div className="flex flex-wrap items-center gap-3">
            {club.stage && (
              <span className="rounded-full bg-(--w-leaf-soft) px-3 py-1 text-xs font-semibold text-primary">
                {STAGE_LABELS[club.stage] ?? club.stage} stage
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" />
              {club.memberCount} {club.memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </PageHero>

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

          <div className="mt-12 rounded-xl border border-border bg-card p-6">
            <p className="font-display text-lg font-semibold text-(--w-green-deep)">
              Want to join?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clubs are for young people on the Ikigai programme. Join Ikigai
              and you can join this club from inside the app.
            </p>
            <Link
              href="/get-involved"
              className={buttonClass("primary", { className: "mt-4" })}
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
