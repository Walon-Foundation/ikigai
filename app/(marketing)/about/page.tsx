import { Avatar } from "@/components/avatar";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionReveal } from "@/components/marketing/section-reveal";
import { getCopy, getTeam } from "@/lib/cms";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "About · Ikigai",
  description:
    "Ikigai is a youth-led organization helping young people in Sierra Leone discover purpose, build skills, and lead change.",
};

export default async function AboutPage() {
  const [mission, vision, values, team] = await Promise.all([
    getCopy("mission"),
    getCopy("vision"),
    getCopy("values"),
    getTeam(),
  ]);

  const valueItems = Array.isArray(values?.items)
    ? (values.items as string[])
    : ["Purpose", "Growth", "Community", "Inclusion", "Empowerment"];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Header */}
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              About Ikigai
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              A youth movement built on purpose.
            </h1>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-24">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 sm:grid-cols-2">
            <SectionReveal>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  Our mission
                </p>
                <p className="text-lg leading-relaxed text-foreground">
                  {(mission?.body as string) ??
                    "To help young people discover who they are, develop their abilities, improve their wellbeing, and become leaders who transform their communities."}
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
                  Our vision
                </p>
                <p className="text-lg leading-relaxed text-foreground">
                  {(vision?.body as string) ??
                    "A Sierra Leone where every young person knows their purpose and has the support, skills and confidence to pursue it."}
                </p>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* Values */}
        <section className="bg-secondary py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading
              eyebrow="What we stand for"
              title="Our values."
              center
            />
            <div className="flex flex-wrap justify-center gap-3">
              {valueItems.map((v) => (
                <span
                  key={v}
                  className="rounded-full border border-border bg-card px-6 py-3 font-display text-lg font-bold text-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        {team.length > 0 && (
          <section className="py-24">
            <div className="mx-auto max-w-6xl px-6">
              <SectionHeading eyebrow="Our people" title="The team." center />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((m) => (
                  <div key={m.id} className="text-center">
                    <div className="mx-auto mb-4 w-fit">
                      <Avatar name={m.name} src={m.photoUrl} size={96} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {m.name}
                    </h3>
                    {m.role && (
                      <p className="text-sm font-medium text-primary">
                        {m.role}
                      </p>
                    )}
                    {m.bio && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {m.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
