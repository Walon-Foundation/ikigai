import { Users } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getPublicClubs } from "@/lib/clubs";

// Rendered per request rather than prerendered at build.
//
// Clubs publish the instant a mentee creates one — that is the programme rule —
// and a page baked at build time would hold yesterday's list until the next
// deploy. It also means the build does not need a database that already has
// every column in it.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clubs · Ikigai",
  description:
    "Clubs started by the young people of Ikigai, in Freetown and the Western Rural Area.",
};

const STAGE_LABELS: Record<string, string> = {
  discover: "Discover",
  thrive: "Thrive",
  build: "Build",
  lead: "Lead",
};

// The public face of the clubs mentees create in the app.
//
// Everything here is written by a young person, published without an approval
// step, so this page shows only what a club IS — its name, what it is about,
// how many have joined. It never names the mentee who started it or anyone in
// it: a club is a public thing, its members are not.
export default async function ClubsPage() {
  const clubs = await getPublicClubs();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Clubs
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Started by our young people.
            </h1>
            <p className="mt-6 text-lg text-primary-muted">
              Every club on this page was created by a mentee on the Ikigai
              platform — their idea, their subject, their invitation to everyone
              else.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          {clubs.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No clubs have been started yet. Check back soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="card-lift flex flex-col rounded-2xl border border-border bg-card p-6"
                >
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {club.name}
                  </h2>
                  {club.description && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {club.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {club.stage && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {STAGE_LABELS[club.stage] ?? club.stage}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      {club.memberCount}{" "}
                      {club.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
