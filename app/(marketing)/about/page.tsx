import { Footer } from "@/components/marketing/footer";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { SectionReveal } from "@/components/marketing/section-reveal";

const WHO_WE_SERVE = [
  {
    title: "Mentees",
    body: "Youth seeking purpose, guidance, and personal growth. Complete the Ikigai assessment, follow your structured roadmap, connect with a verified mentor, and build the confidence to become who you are meant to be.",
    accent: "border-primary",
  },
  {
    title: "Mentors",
    body: "Experienced professionals and community leaders ready to guide the next generation. You are carefully verified, thoughtfully matched, and given the tools to make a measurable difference in a young person's life.",
    accent: "border-accent",
  },
  {
    title: "Schools & Clubs",
    body: "Student leaders and teachers setting up Ikigai clubs on campus. Bring structured mentorship, purpose discovery, and personal development to your entire school community.",
    accent: "border-earth",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Vision & Mission */}
        <section className="bg-primary pb-24 pt-40">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              About Ikigai
            </p>
            <h1 className="font-display mb-8 text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Our Vision
            </h1>
            <blockquote className="mb-10 border-l-4 border-accent pl-6">
              <p className="font-display text-2xl font-bold leading-snug text-primary-foreground sm:text-3xl">
                "To build a generation of confident, emotionally healthy,
                purpose-driven, and socially responsible young people across
                Africa."
              </p>
            </blockquote>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-muted">
                  Our Mission
                </p>
                <p className="text-lg leading-relaxed text-primary-foreground/80">
                  To connect young people with the guidance, opportunities,
                  tools, and community they need to discover who they are and
                  become who they are meant to be.
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-muted">
                  Where We Are
                </p>
                <p className="text-lg leading-relaxed text-primary-foreground/80">
                  Ikigai is based in Sierra Leone, building technology
                  for African youth. We serve youth, mentors, parents, schools,
                  and organisations across Freetown and Western Rural Area.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionReveal>
              <div className="mb-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  Who We Serve
                </p>
                <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
                  Three ways to join the movement.
                </h2>
              </div>
            </SectionReveal>
            <div className="grid gap-4 sm:grid-cols-3">
              {WHO_WE_SERVE.map((item, i) => (
                <SectionReveal key={item.title} delay={i * 0.1}>
                  <div
                    className={`rounded-r-2xl border-l-4 bg-card px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.accent}`}
                  >
                    <h3 className="font-display mb-3 text-xl font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* The Platform */}
        <section className="bg-secondary py-24">
          <SectionReveal>
            <div className="mx-auto max-w-3xl px-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                The Platform
              </p>
              <h2 className="font-display mb-6 text-4xl font-black text-foreground">
                Technology meets human connection.
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Ikigai combines artificial intelligence, mentorship,
                  self-discovery, structured learning, wellness tools, and
                  community engagement into a single ecosystem designed for
                  African youth.
                </p>
                <p>
                  Unlike traditional mentorship programmes that rely on informal
                  relationships and manual matching, Ikigai creates a
                  structured, accountable, and scalable experience through
                  AI-powered matching, developmental roadmaps, activity
                  participation, and progress tracking.
                </p>
                <p>
                  Every interaction — a mentorship session, a journal entry, a
                  workshop, a community project — is tracked, visualised, and
                  celebrated. We believe that when young people can see their
                  growth, they keep growing.
                </p>
              </div>
            </div>
          </SectionReveal>
        </section>

        <InstallCta
          headline="Be part of the movement."
          body="Join hundreds of youth, mentors, and schools already building the next generation of African leaders."
        />
      </main>
      <Footer />
    </div>
  );
}
