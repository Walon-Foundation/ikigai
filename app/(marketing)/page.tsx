import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  EventCard,
  ImpactCounter,
  PartnerLogo,
  ProgrammeCard,
  StoryCard,
} from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { GlowCard } from "@/components/marketing/glow-card";
import { Nav } from "@/components/marketing/nav";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionReveal } from "@/components/marketing/section-reveal";
import {
  getCopy,
  getFeaturedProgrammes,
  getImpactStats,
  getPartners,
  getPillarsWithProgrammes,
  getStories,
  getUpcomingPublicEvents,
} from "@/lib/cms";

// The public organisation homepage. Every section reads from the CMS through
// lib/cms.ts, with a code fallback for copy so an empty database still renders a
// coherent page rather than holes.

const ACCENTS = ["green", "amber", "earth", "sage"] as const;
type Accent = (typeof ACCENTS)[number];

function asAccent(value: string | null, i: number): Accent {
  return (ACCENTS as readonly string[]).includes(value ?? "")
    ? (value as Accent)
    : ACCENTS[i % ACCENTS.length];
}

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    hero,
    aboutIntro,
    pillars,
    stats,
    featured,
    events,
    stories,
    partners,
  ] = await Promise.all([
    getCopy("hero"),
    getCopy("about_intro"),
    getPillarsWithProgrammes(),
    getImpactStats(),
    getFeaturedProgrammes(),
    getUpcomingPublicEvents(3),
    getStories(3),
    getPartners(),
  ]);

  const headline =
    (hero?.headline as string) ??
    "Helping young people discover purpose, build skills, and create change.";
  const heroBody =
    (hero?.body as string) ??
    "Ikigai is a youth-led organization empowering young people through personal development, wellbeing, mentorship, skills development and community action.";
  const primaryLabel = (hero?.primaryLabel as string) ?? "Join a programme";
  const primaryHref = (hero?.primaryHref as string) ?? "/get-involved";
  const secondaryLabel = (hero?.secondaryLabel as string) ?? "Partner with us";
  const secondaryHref =
    (hero?.secondaryHref as string) ?? "/get-involved#partner";

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-background pb-24 pt-40">
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none font-black leading-none text-border/60"
            style={{
              fontSize: "clamp(120px, 18vw, 220px)",
              letterSpacing: "-0.06em",
            }}
          >
            IK
          </span>
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 flex animate-fade-up items-center justify-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Sierra Leone · Youth Organization
              </span>
            </div>
            <h1
              className="font-display mb-6 animate-fade-up text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl"
              style={{ animationDelay: "0.15s" }}
            >
              {headline}
            </h1>
            <p
              className="mx-auto mb-10 max-w-2xl animate-fade-up text-xl leading-relaxed text-muted-foreground"
              style={{ animationDelay: "0.3s" }}
            >
              {heroBody}
            </p>
            <div
              className="flex animate-fade-up flex-wrap justify-center gap-4"
              style={{ animationDelay: "0.45s" }}
            >
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                {secondaryLabel} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* About intro */}
        {aboutIntro?.body ? (
          <section className="bg-background pb-8">
            <div className="mx-auto max-w-3xl px-6 text-center">
              <p className="font-display text-2xl font-medium leading-relaxed text-foreground sm:text-3xl">
                {aboutIntro.body as string}
              </p>
            </div>
          </section>
        ) : null}

        {/* Four pillars */}
        {pillars.length > 0 && (
          <section className="bg-background py-24">
            <div className="mx-auto max-w-7xl px-6">
              <SectionHeading
                eyebrow="What we do"
                title="Four ways we help young people grow."
                center
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pillars.map((pillar, i) => (
                  <SectionReveal key={pillar.id} delay={i * 0.08}>
                    <Link href="/what-we-do" className="block h-full">
                      <GlowCard
                        num={`${pillar.icon ?? ""} ${pillar.name}`.trim()}
                        title={pillar.tagline ?? pillar.name}
                        body={
                          pillar.description ??
                          `${pillar.programmes.length} programmes`
                        }
                        variant={asAccent(pillar.accent, i)}
                        className="h-full"
                      />
                    </Link>
                  </SectionReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Impact dashboard */}
        {stats.length > 0 && (
          <section className="bg-primary py-16">
            <div className="mx-auto max-w-7xl px-6">
              <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-primary-muted/70">
                Our impact so far
              </p>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((s) => (
                  <ImpactCounter key={s.id} value={s.value} label={s.label} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured programmes */}
        {featured.length > 0 && (
          <section className="bg-secondary py-24">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-12 flex items-end justify-between gap-4">
                <SectionHeading eyebrow="Programmes" title="Our initiatives." />
                <Link
                  href="/programmes"
                  className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
                >
                  All programmes <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <ProgrammeCard key={p.id} programme={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <section className="bg-background py-24">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-12 flex items-end justify-between gap-4">
                <SectionHeading eyebrow="Events" title="What's coming up." />
                <Link
                  href="/events"
                  className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
                >
                  All events <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent stories */}
        {stories.length > 0 && (
          <section className="bg-secondary py-24">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-12 flex items-end justify-between gap-4">
                <SectionHeading eyebrow="Stories" title="Voices from Ikigai." />
                <Link
                  href="/stories"
                  className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
                >
                  All stories <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <section className="bg-background py-20">
            <div className="mx-auto max-w-7xl px-6">
              <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                In partnership with
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
                {partners.map((p) => (
                  <PartnerLogo key={p.id} partner={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="bg-primary py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-4xl font-black text-primary-foreground sm:text-5xl">
              Your journey starts here.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-muted">
              Whether you want to grow, give your time, or partner with us —
              there's a place for you at Ikigai.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/get-involved"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-8 py-4 text-base font-semibold text-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get involved
              </Link>
              <Link
                href="/what-we-do"
                className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Explore our work
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
