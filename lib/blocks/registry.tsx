import { ArrowRight, Smartphone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Field } from "@/components/admin/resource-manager";
import {
  EventCard,
  ImpactCounter,
  PartnerLogo,
  ProgrammeCard,
  StoryCard,
} from "@/components/marketing/cards";
import { GlowCard } from "@/components/marketing/glow-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionReveal } from "@/components/marketing/section-reveal";
import {
  getFeaturedProgrammes,
  getImpactStats,
  getPartners,
  getPillarsWithProgrammes,
  getStories,
  getUpcomingPublicEvents,
} from "@/lib/cms";
import { clientEnv } from "@/lib/env.client";

// The block registry behind the drag-and-drop page builder (/admin/page-builder).
//
// A marketing page is a stack of `page_blocks` rows, each naming a `type` key
// here. Every block owns three things: an admin `fields` schema (the same
// `Field[]` shape /admin/cms forms already use), a `defaultConfig` for when an
// admin adds a fresh instance, and a `Render` server component that turns
// `config` into markup using the SAME on-brand components the old hand-written
// homepage used — GlowCard, SectionHeading, the card components, etc. An admin
// can reorder and fill in text; they cannot introduce a new layout or a stray
// style, because there is no such field to fill in.
//
// Two kinds of block:
//   - Copy blocks (hero, about_intro, app_cta, final_cta) hold real inline
//     text in `config` — the block IS the content.
//   - List blocks (four_pillars, impact_stats, featured_programmes,
//     upcoming_events, stories, partners) render a live list that is already
//     admin-editable from its own /admin/cms screen; `config` here only ever
//     overrides the heading above that list. Deleting one of these blocks
//     removes it from the page, not the underlying pillars/programmes/etc.
//
// Adding a new block type is: write the Render function, describe its fields,
// register it below. Nothing else needs to change — the renderer
// (components/marketing/page-blocks.tsx) and the admin UI both iterate this
// registry generically.

export type BlockConfig = Record<string, unknown>;

export type BlockDefinition = {
  label: string;
  /** Shown in the admin "add block" picker and above the block's edit form. */
  description: string;
  fields: Field[];
  defaultConfig: BlockConfig;
  Render: (props: { config: BlockConfig }) => Promise<ReactNode>;
};

/** A trimmed string config value, or `fallback` when absent/blank. */
function str(config: BlockConfig, key: string, fallback: string): string {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

const ACCENTS = ["green", "amber", "earth", "sage"] as const;
type Accent = (typeof ACCENTS)[number];

function asAccent(value: string | null | undefined, i: number): Accent {
  return (ACCENTS as readonly string[]).includes(value ?? "")
    ? (value as Accent)
    : ACCENTS[i % ACCENTS.length];
}

const headingFields: Field[] = [
  { type: "text", name: "eyebrow", label: "Eyebrow (optional)" },
  { type: "text", name: "title", label: "Title (optional)" },
];

async function HeroBlock({ config }: { config: BlockConfig }) {
  const headline = str(
    config,
    "headline",
    "Helping young people discover purpose, build skills, and create change.",
  );
  const body = str(
    config,
    "body",
    "Ikigai is a youth-led organization empowering young people through personal development, wellbeing, mentorship, skills development and community action.",
  );
  const primaryLabel = str(config, "primaryLabel", "Join a programme");
  const primaryHref = str(config, "primaryHref", "/get-involved");
  const secondaryLabel = str(config, "secondaryLabel", "Partner with us");
  const secondaryHref = str(config, "secondaryHref", "/get-involved#partner");

  return (
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
          {body}
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
  );
}

async function AboutIntroBlock({ config }: { config: BlockConfig }) {
  const body = typeof config.body === "string" ? config.body.trim() : "";
  if (!body) return null;

  return (
    <section className="bg-background pb-8">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="font-display text-2xl font-medium leading-relaxed text-foreground sm:text-3xl">
          {body}
        </p>
      </div>
    </section>
  );
}

async function FourPillarsBlock({ config }: { config: BlockConfig }) {
  const pillars = await getPillarsWithProgrammes();
  if (pillars.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "What we do");
  const title = str(config, "title", "Four ways we help young people grow.");

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow={eyebrow} title={title} center />
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
  );
}

async function ImpactStatsBlock({ config }: { config: BlockConfig }) {
  const stats = await getImpactStats();
  if (stats.length === 0) return null;

  const label = str(config, "label", "Our impact so far");

  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-primary-muted/70">
          {label}
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <ImpactCounter key={s.id} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function FeaturedProgrammesBlock({ config }: { config: BlockConfig }) {
  const featured = await getFeaturedProgrammes();
  if (featured.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "Programmes");
  const title = str(config, "title", "Our initiatives.");

  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between gap-4">
          <SectionHeading eyebrow={eyebrow} title={title} />
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
  );
}

async function UpcomingEventsBlock({ config }: { config: BlockConfig }) {
  const events = await getUpcomingPublicEvents(3);
  if (events.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "Events");
  const title = str(config, "title", "What's coming up.");

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between gap-4">
          <SectionHeading eyebrow={eyebrow} title={title} />
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
  );
}

async function StoriesBlock({ config }: { config: BlockConfig }) {
  const stories = await getStories(3);
  if (stories.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "Stories");
  const title = str(config, "title", "Voices from Ikigai.");

  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between gap-4">
          <SectionHeading eyebrow={eyebrow} title={title} />
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
  );
}

async function PartnersBlock({ config }: { config: BlockConfig }) {
  const partners = await getPartners();
  if (partners.length === 0) return null;

  const label = str(config, "label", "In partnership with");

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {partners.map((p) => (
            <PartnerLogo key={p.id} partner={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function AppCtaBlock({ config }: { config: BlockConfig }) {
  const title = str(config, "title", "There's an app for your journey.");
  const body = str(
    config,
    "body",
    "Mentees and mentors use the Ikigai app to track goals, meet, and grow together. Join a programme first, then sign in — it installs to your phone like any other app.",
  );
  const ctaLabel = str(config, "ctaLabel", "Open the app");

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center gap-8 rounded-3xl border border-border bg-secondary/50 p-10 text-center sm:flex-row sm:p-12 sm:text-left">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="size-8" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{body}</p>
          </div>
          <a
            href={clientEnv.appUrl}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {ctaLabel} <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

async function FinalCtaBlock({ config }: { config: BlockConfig }) {
  const title = str(config, "title", "Your journey starts here.");
  const body = str(
    config,
    "body",
    "Whether you want to grow, give your time, or partner with us — there's a place for you at Ikigai.",
  );
  const primaryLabel = str(config, "primaryLabel", "Get involved");
  const primaryHref = str(config, "primaryHref", "/get-involved");
  const secondaryLabel = str(config, "secondaryLabel", "Explore our work");
  const secondaryHref = str(config, "secondaryHref", "/what-we-do");

  return (
    <section className="bg-primary py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl font-black text-primary-foreground sm:text-5xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-primary-muted">
          {body}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-8 py-4 text-base font-semibold text-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export const BLOCK_REGISTRY = {
  hero: {
    label: "Hero",
    description: "The page-opening headline, body copy and two buttons.",
    fields: [
      { type: "textarea", name: "headline", label: "Headline", rows: 2 },
      { type: "textarea", name: "body", label: "Body", rows: 3 },
      { type: "text", name: "primaryLabel", label: "Primary button label" },
      { type: "text", name: "primaryHref", label: "Primary button link" },
      {
        type: "text",
        name: "secondaryLabel",
        label: "Secondary button label",
      },
      { type: "text", name: "secondaryHref", label: "Secondary button link" },
    ],
    defaultConfig: {
      headline:
        "Helping young people discover purpose, build skills, and create change.",
      body: "Ikigai is a youth-led organization empowering young people through personal development, wellbeing, mentorship, skills development and community action.",
      primaryLabel: "Join a programme",
      primaryHref: "/get-involved",
      secondaryLabel: "Partner with us",
      secondaryHref: "/get-involved#partner",
    },
    Render: HeroBlock,
  },
  about_intro: {
    label: "About intro",
    description:
      "A short centred paragraph. Leave the body blank to hide this block.",
    fields: [
      {
        type: "textarea",
        name: "body",
        label: "Body",
        rows: 4,
        placeholder: "Leave blank to hide this block",
      },
    ],
    defaultConfig: {
      body: "Ikigai exists to help young people understand who they are, discover their purpose, and develop the confidence and skills needed to create meaningful impact in their communities.",
    },
    Render: AboutIntroBlock,
  },
  four_pillars: {
    label: "Four pillars",
    description:
      "Shows the published pillars from CMS → Pillars. This block only sets the heading above them.",
    fields: headingFields,
    defaultConfig: {
      eyebrow: "What we do",
      title: "Four ways we help young people grow.",
    },
    Render: FourPillarsBlock,
  },
  impact_stats: {
    label: "Impact stats",
    description: "Shows the published stats from CMS → Impact.",
    fields: [
      {
        type: "text",
        name: "label",
        label: "Label above the numbers (optional)",
      },
    ],
    defaultConfig: { label: "Our impact so far" },
    Render: ImpactStatsBlock,
  },
  featured_programmes: {
    label: "Featured programmes",
    description:
      "Shows programmes marked Featured in CMS → Programmes. This block only sets the heading above them.",
    fields: headingFields,
    defaultConfig: { eyebrow: "Programmes", title: "Our initiatives." },
    Render: FeaturedProgrammesBlock,
  },
  upcoming_events: {
    label: "Upcoming events",
    description:
      "Shows the next 3 public upcoming events from CMS → Events. This block only sets the heading above them.",
    fields: headingFields,
    defaultConfig: { eyebrow: "Events", title: "What's coming up." },
    Render: UpcomingEventsBlock,
  },
  stories: {
    label: "Stories",
    description:
      "Shows the 3 latest published stories from CMS → Stories. This block only sets the heading above them.",
    fields: headingFields,
    defaultConfig: { eyebrow: "Stories", title: "Voices from Ikigai." },
    Render: StoriesBlock,
  },
  partners: {
    label: "Partners",
    description: "Shows published partners from CMS → Partners.",
    fields: [
      {
        type: "text",
        name: "label",
        label: "Label above the logos (optional)",
      },
    ],
    defaultConfig: { label: "In partnership with" },
    Render: PartnersBlock,
  },
  app_cta: {
    label: "App promo",
    description: "The 'there's an app for your journey' card.",
    fields: [
      { type: "text", name: "title", label: "Title" },
      { type: "textarea", name: "body", label: "Body", rows: 3 },
      { type: "text", name: "ctaLabel", label: "Button label" },
    ],
    defaultConfig: {
      title: "There's an app for your journey.",
      body: "Mentees and mentors use the Ikigai app to track goals, meet, and grow together. Join a programme first, then sign in — it installs to your phone like any other app.",
      ctaLabel: "Open the app",
    },
    Render: AppCtaBlock,
  },
  final_cta: {
    label: "Final call to action",
    description: "The closing banner with two buttons.",
    fields: [
      { type: "text", name: "title", label: "Title" },
      { type: "textarea", name: "body", label: "Body", rows: 3 },
      { type: "text", name: "primaryLabel", label: "Primary button label" },
      { type: "text", name: "primaryHref", label: "Primary button link" },
      {
        type: "text",
        name: "secondaryLabel",
        label: "Secondary button label",
      },
      { type: "text", name: "secondaryHref", label: "Secondary button link" },
    ],
    defaultConfig: {
      title: "Your journey starts here.",
      body: "Whether you want to grow, give your time, or partner with us — there's a place for you at Ikigai.",
      primaryLabel: "Get involved",
      primaryHref: "/get-involved",
      secondaryLabel: "Explore our work",
      secondaryHref: "/what-we-do",
    },
    Render: FinalCtaBlock,
  },
} satisfies Record<string, BlockDefinition>;

export type BlockType = keyof typeof BLOCK_REGISTRY;

export function isBlockType(value: string): value is BlockType {
  return value in BLOCK_REGISTRY;
}
