import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  MapPin,
  Shield,
  Sparkles,
  Star,
  TreePine,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GrowthTree } from "@/components/growth-tree";

export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Mission />
        <Features />
        <ForWho />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-black text-primary"
          >
            Ikigai
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#for-mentors"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              For Mentors
            </a>
            <a
              href="#schools"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Schools
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-muted/15 via-background to-accent-pale/25" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary-muted/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Text column */}
          <div>
            {/* Location badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-muted/60 bg-primary-muted/20 px-4 py-2 text-sm font-medium text-primary">
              <MapPin className="size-3.5" />
              <span>For Youth in Sierra Leone</span>
            </div>

            {/* Headline */}
            <h1 className="font-display mb-6 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Find your reason to{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                wake up
              </span>{" "}
              every morning.
            </h1>

            {/* Value prop */}
            <p className="mb-10 max-w-xl text-xl leading-relaxed text-muted-foreground">
              Ikigai connects ambitious young people in Freetown and Western
              Rural Area with verified mentors, growth tools, and a community
              that believes in their potential.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-light hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                Start Your Journey
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sign-up?role=mentor"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary-muted/20"
              >
                Become a Mentor
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-14 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <div className="flex">
                  <Star className="size-3.5 fill-accent text-accent" />
                  <Star className="size-3.5 fill-accent text-accent" />
                  <Star className="size-3.5 fill-accent text-accent" />
                  <Star className="size-3.5 fill-accent text-accent" />
                  <Star className="size-3.5 fill-accent text-accent" />
                </div>
                <span>Trusted by youth across Freetown</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <Shield className="size-3.5 text-primary" />
                <span>Safe &amp; verified mentors only</span>
              </div>
            </div>
          </div>

          {/* Visual column — GrowthTree demo */}
          <div className="hidden lg:flex lg:justify-center">
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary-muted/30 to-accent-pale/40 blur-xl" />
              <div className="relative rounded-3xl border border-primary-muted/30 bg-card/80 p-8 shadow-2xl backdrop-blur-sm">
                <GrowthTree completedCount={6} level={3} />
                <p className="mt-4 text-center text-xs font-medium text-muted-foreground">
                  Your growth, visualised
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: "500+", label: "Youth registered", icon: Users },
    { value: "200+", label: "Verified mentors", icon: TreePine },
    { value: "20+", label: "School clubs", icon: GraduationCap },
  ];

  return (
    <section className="bg-primary">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/10 px-6 py-8 text-center backdrop-blur-sm"
            >
              <stat.icon className="size-6 text-primary-muted/80" />
              <div className="font-display text-5xl font-black text-primary-foreground">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-primary-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mission() {
  const pillars = [
    {
      icon: Sparkles,
      title: "Purpose Discovery",
      desc: "Guided quizzes and reflections help you uncover what makes you uniquely alive. Build your ikigai, step by step.",
      iconBg: "bg-primary-muted/30",
      iconColor: "text-primary",
      accent: "border-l-primary",
    },
    {
      icon: Users,
      title: "Mentorship",
      desc: "Get matched with a verified mentor who shares your interests and goals. Real relationships that help you grow.",
      iconBg: "bg-[#D6EAF8]/60",
      iconColor: "text-[#4A90D9]",
      accent: "border-l-[#4A90D9]",
    },
    {
      icon: BookOpen,
      title: "Mental Wellness",
      desc: "Private journaling, progress tracking, and safety resources — all in one place, offline-ready.",
      iconBg: "bg-accent-pale/60",
      iconColor: "text-earth",
      accent: "border-l-earth",
    },
  ];

  return (
    <section className="bg-background py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            What is Ikigai?
          </div>
          <h2 className="font-display mb-5 text-4xl font-black text-foreground sm:text-5xl">
            Purpose isn't found.
            <br />
            It's built.
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Ikigai (ee-kee-guy) is the Japanese concept of "reason for being" —
            the intersection of what you love, what you're good at, what the
            world needs, and what you can be paid for. We've built a platform to
            help Sierra Leone's youth discover theirs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className={`rounded-2xl border border-border border-l-4 ${pillar.accent} bg-card p-8`}
            >
              <div
                className={`mb-5 inline-flex rounded-xl ${pillar.iconBg} p-3`}
              >
                <pillar.icon className={`size-5 ${pillar.iconColor}`} />
              </div>
              <h3 className="font-display mb-3 text-xl font-bold text-foreground">
                {pillar.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      id: "growth-tree",
      icon: TreePine,
      iconBg: "bg-primary-muted/30 text-primary",
      eyebrow: "Track your journey",
      title: "Growth Tree",
      desc: "Watch your progress come alive as an animated tree. Every milestone — purpose quiz, first journal entry, mentorship connection — grows a new branch.",
    },
    {
      id: "vibe-match",
      icon: Users,
      iconBg: "bg-[#D6EAF8]/60 text-[#4A90D9]",
      eyebrow: "Find your perfect mentor",
      title: "Vibe-Match",
      desc: "Our algorithm matches you with mentors who share your interests, goals, and communication style. A 3-day icebreaker phase lets you build a real connection before committing.",
    },
    {
      id: "journal",
      icon: BookOpen,
      iconBg: "bg-accent-pale/60 text-earth",
      eyebrow: "Reflect daily, grow always",
      title: "Private Journal",
      desc: "Write freely in your private journal — works offline and syncs when you're back online. Share entries selectively with your mentor when you're ready.",
    },
    {
      id: "safety",
      icon: Shield,
      iconBg: "bg-earth-light/20 text-earth",
      eyebrow: "Always protected",
      title: "Safety First",
      desc: "Crisis resources are cached and always available, even without internet. Anonymous reporting, admin-reviewed safety reports, and every mentor verified before they can match.",
    },
  ];

  return (
    <section id="features" className="bg-muted py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </div>
          <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
            Everything you need to grow.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="rounded-2xl border border-border bg-card p-8 transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-5 inline-flex rounded-xl p-3 ${feature.iconBg}`}
              >
                <feature.icon className="size-5" />
              </div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {feature.eyebrow}
              </div>
              <h3 className="font-display mb-3 text-2xl font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForWho() {
  const audiences = [
    {
      id: "mentee",
      emoji: "🌱",
      eyebrow: "Mentee",
      headline: "I'm ready to grow.",
      desc: "A student who wants to discover their purpose, connect with a mentor, and build confidence — one step at a time.",
      cta: "Join as Mentee",
      href: "/sign-up?role=mentee",
      cardClass: "bg-primary",
      eyebrowClass: "text-primary-muted/70",
      headlineClass: "text-primary-foreground",
      descClass: "text-primary-muted",
      ctaClass:
        "bg-card text-primary hover:bg-primary-muted/80 transition-colors",
    },
    {
      id: "mentor",
      emoji: "🤝",
      eyebrow: "Mentor",
      headline: "I want to give back.",
      desc: "A professional or university student ready to guide the next generation. Verified, carefully matched, making real impact.",
      cta: "Join as Mentor",
      href: "/sign-up?role=mentor",
      cardClass: "bg-card border border-border",
      eyebrowClass: "text-muted-foreground",
      headlineClass: "text-foreground",
      descClass: "text-muted-foreground",
      ctaClass:
        "bg-primary text-primary-foreground hover:bg-primary-light transition-colors",
    },
    {
      id: "club-lead",
      emoji: "🏫",
      eyebrow: "Club Lead",
      headline: "I'm building community.",
      desc: "A student leader setting up an Ikigai club at your school. Bring purpose and mentorship to your entire campus.",
      cta: "Register Your School",
      href: "/sign-up?role=club_lead",
      cardClass: "bg-accent-pale border border-accent/20",
      eyebrowClass: "text-muted-foreground",
      headlineClass: "text-foreground",
      descClass: "text-muted-foreground",
      ctaClass: "bg-earth text-white hover:bg-earth-light transition-colors",
    },
  ];

  return (
    <section id="for-mentors" id-also="schools" className="bg-background py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Who is it for?
          </div>
          <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
            Three ways to join the movement.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {audiences.map((aud) => (
            <div
              key={aud.id}
              className={`flex flex-col rounded-2xl p-8 ${aud.cardClass}`}
            >
              <div className="mb-5 text-4xl">{aud.emoji}</div>
              <div
                className={`mb-1 text-xs font-semibold uppercase tracking-wider ${aud.eyebrowClass}`}
              >
                {aud.eyebrow}
              </div>
              <h3
                className={`font-display mb-4 text-2xl font-bold ${aud.headlineClass}`}
              >
                {aud.headline}
              </h3>
              <p className={`mb-8 flex-1 leading-relaxed ${aud.descClass}`}>
                {aud.desc}
              </p>
              <Link
                href={aud.href}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${aud.ctaClass}`}
              >
                {aud.cta}
                <ChevronRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-primary py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <div className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary-muted">
          Ready?
        </div>
        <h2 className="font-display mb-6 text-4xl font-black text-primary-foreground sm:text-5xl md:text-6xl">
          Join the movement.
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-primary-muted">
          Young people across Sierra Leone are discovering their ikigai. Your
          story starts here — and it starts today.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-accent-warm"
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary-muted/40 px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:border-primary-muted"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <div className="font-display mb-3 text-2xl font-black text-primary">
              Ikigai
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Empowering youth to discover purpose, build confidence, and
              prioritize mental wellness.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Built with love for Sierra Leone 🇸🇱
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-foreground">Platform</span>
              <a
                href="#features"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#for-mentors"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                For Mentors
              </a>
              <a
                href="#schools"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Schools
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-foreground">Support</span>
              <Link
                href="/safety/help"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Crisis Resources
              </Link>
              <Link
                href="/sign-in"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ikigai Digital. Built for the youth of
          Freetown &amp; Western Rural Area, Sierra Leone.
        </div>
      </div>
    </footer>
  );
}
