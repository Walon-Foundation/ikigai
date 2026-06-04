import { Footer } from "@/components/marketing/footer";
import { GlowCard } from "@/components/marketing/glow-card";
import { InstallCta } from "@/components/marketing/install-cta";
import { Nav } from "@/components/marketing/nav";
import { SectionReveal } from "@/components/marketing/section-reveal";
import { Hero } from "./hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <PlatformSection />
        <StatsBar />
        <InstallCta
          headline="Ready to start your journey?"
          body="Young people across Sierra Leone are discovering their ikigai. Your story starts here."
        />
      </main>
      <Footer />
    </div>
  );
}

const PROBLEMS = [
  {
    num: "01 — Mentorship",
    title: "No trusted mentors",
    body: "Matching is random, progress is untracked, and mentors are difficult to verify — relationships fade without accountability.",
    variant: "green" as const,
  },
  {
    num: "02 — Guidance",
    title: "Limited guidance",
    body: "Career direction, purpose discovery, and accountability structures are missing for most young people in Sierra Leone.",
    variant: "amber" as const,
  },
  {
    num: "03 — Engagement",
    title: "Declining engagement",
    body: "Without structured programmes, mentorship relationships and personal development efforts lose momentum over time.",
    variant: "earth" as const,
  },
] as const;

function ProblemSection() {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              The Challenge
            </p>
            <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
              Young people face real barriers.
            </h2>
          </div>
        </SectionReveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <SectionReveal key={p.title} delay={i * 0.08}>
              <GlowCard
                num={p.num}
                title={p.title}
                body={p.body}
                variant={p.variant}
              />
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLATFORM_FEATURES = [
  {
    num: "01 — Matching",
    title: "AI Mentor Matching",
    body: "Top 5 mentors matched by your interests, values, personality, and career goals. Browse the marketplace and start with a 3-day icebreaker.",
    variant: "green" as const,
  },
  {
    num: "02 — Purpose",
    title: "Purpose Discovery",
    body: "Complete the Ikigai framework assessment and receive a personalised Purpose Profile and Purpose Statement written just for you.",
    variant: "amber" as const,
  },
  {
    num: "03 — Roadmap",
    title: "Growth Roadmap",
    body: "Four structured phases — Find Yourself, Build Yourself, Discover Purpose, Create Impact — visualised as your personal Growth Tree.",
    variant: "earth" as const,
  },
  {
    num: "04 — Access",
    title: "Flexible Plans",
    body: "Mentor subscriptions, one-time packages, and sponsored scholarships — no one gets left behind due to financial barriers.",
    variant: "sage" as const,
  },
] as const;

function PlatformSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Platform
            </p>
            <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
              Everything in one place.
            </h2>
          </div>
        </SectionReveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLATFORM_FEATURES.map((f, i) => (
            <SectionReveal key={f.title} delay={i * 0.08}>
              <GlowCard
                num={f.num}
                title={f.title}
                body={f.body}
                variant={f.variant}
              />
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "500", label: "Youth to reach" },
  { value: "200", label: "Mentors to verify" },
  { value: "50", label: "School clubs" },
] as const;

function StatsBar() {
  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-primary-muted/70">
          Year 1 Goals
        </p>
        <div className="grid grid-cols-3 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-5xl font-black text-primary-foreground">
                {s.value}
              </div>
              <div className="mt-1 text-sm font-medium text-primary-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
