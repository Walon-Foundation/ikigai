import type { Metadata } from "next";
import { Avatar } from "@/components/avatar";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { SectionHeading } from "@/components/marketing/section-heading";
import { getTeam } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team · Ikigai",
  description:
    "Meet the team behind Ikigai — youth leaders, mentors, and organizers building purpose with young people in Sierra Leone.",
  openGraph: {
    title: "Team · Ikigai",
    description: "Meet the people building Ikigai in Sierra Leone.",
  },
};

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Our People
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              The team.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-muted">
              The mentors, organizers, and youth leaders who make Ikigai run —
              in Freetown, the Western Rural Area, and beyond.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            {team.length > 0 ? (
              <>
                <SectionHeading
                  eyebrow="Ikigai team"
                  title="People behind the work."
                  center
                />
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {team.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-border bg-card p-6 text-center"
                    >
                      <div className="mx-auto mb-4 w-fit">
                        <Avatar name={m.name} src={m.photoUrl} size={88} />
                      </div>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {m.name}
                      </h3>
                      {m.role && (
                        <p className="mt-1 text-sm font-medium text-primary">
                          {m.role}
                        </p>
                      )}
                      {m.bio && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {m.bio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
                <p className="font-display text-xl font-bold text-foreground">
                  Team coming soon
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We’re adding the people behind Ikigai — youth leaders,
                  mentors, and organizers. Check back soon to meet them.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
