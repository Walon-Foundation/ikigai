import type { Metadata } from "next";
import { Avatar } from "@/components/avatar";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
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
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero
          eyebrow="Our people"
          title="The team."
          lede="The mentors, organizers, and youth leaders who make Ikigai run — in Freetown, the Western Rural Area, and beyond."
        />

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
                      className="rounded-xl border border-border bg-card p-6 text-center"
                    >
                      <div className="mx-auto mb-4 w-fit">
                        <Avatar name={m.name} src={m.photoUrl} size={88} />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-(--w-green-deep)">
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
              <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-secondary/40 p-10 text-center">
                <p className="font-display text-xl font-semibold text-(--w-green-deep)">
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
