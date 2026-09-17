import {
  ArrowRight,
  BookOpen,
  House,
  ShieldCheck,
  Sprout,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Field } from "@/components/admin/resource-manager";
import {
  EventCard,
  MoreLink,
  PartnerLogo,
  ProgrammeCard,
  StoryCard,
} from "@/components/marketing/cards";
import {
  Overline,
  SectionHeading,
} from "@/components/marketing/section-heading";
import { buttonClass } from "@/components/system/button";
import { PhoneFrame } from "@/components/system/phone-frame";
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
// `config` into markup using the design system's components
// (docs/05-design-guide.md) — SectionHeading, the cards, buttonClass. An admin
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

// Pillar accents are stored as token names (see db/schema.ts), so they map onto
// whatever the palette is. On the site they are a small marker, never a ground.
const ACCENT_DOT: Record<string, string> = {
  green: "bg-primary",
  amber: "bg-(--w-sun)",
  earth: "bg-(--w-orange)",
  sage: "bg-(--w-leaf)",
};
const ACCENT_ORDER = ["green", "amber", "earth", "sage"];

const headingFields: Field[] = [
  { type: "text", name: "eyebrow", label: "Eyebrow (optional)" },
  { type: "text", name: "title", label: "Title (optional)" },
];

/** Wraps words between asterisks in an <em>, which the hero sets in gold italic. */
function withEmphasis(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of one string
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      part
    ),
  );
}

const Container = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`mx-auto max-w-7xl px-6 ${className}`}>{children}</div>;

/** A heading row with an optional "All …" link on the right. */
function HeadingRow({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <SectionHeading eyebrow={eyebrow} title={title} className="mb-0" />
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        {linkLabel}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
      </Link>
    </div>
  );
}

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
  // The impact numbers sit in the hero's foot, so the page opens on its proof
  // instead of repeating it in a row further down (see page-blocks.tsx).
  const stats = await getImpactStats();

  return (
    <section className="mx-2 mt-[72px] overflow-hidden rounded-[18px] bg-(--w-green-deep) text-white sm:mx-4 sm:rounded-3xl">
      <Container className="grid items-center gap-10 pt-14 pb-12 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-20">
        <div>
          <Overline onDeep rule className="web-rise">
            Sierra Leone · Youth Organization
          </Overline>
          <h1 className="web-rise mt-5 font-display text-[clamp(2.6rem,5.6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] [&_em]:text-(--w-sun)">
            {withEmphasis(headline)}
          </h1>
          <p className="web-rise mt-6 max-w-[44ch] text-[18.5px] leading-relaxed text-(--w-on-deep-strong)">
            {body}
          </p>
          <div className="web-rise mt-9 flex flex-wrap gap-3">
            <Link href={primaryHref} className={buttonClass("light")}>
              {primaryLabel}
            </Link>
            <Link href={secondaryHref} className={buttonClass("outline-light")}>
              {secondaryLabel}
            </Link>
          </div>
        </div>
        <div className="relative grid place-items-center">
          {/* A soft light behind the phone, lifting it off the green. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(169_196_178/0.22),transparent)]"
          />
          <PhoneFrame
            src="/marketing/app-screen-welcome-hd.webp"
            alt="The Ikigai app's welcome screen"
            priority
            className="web-rise relative w-[210px] sm:w-[250px]"
          />
        </div>
      </Container>
      {stats.length > 0 && (
        <div className="border-t border-(--w-on-deep)/20 bg-black/20">
          <Container>
            <dl className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex flex-col-reverse gap-1 py-6 pr-4 ${i % 2 ? "border-l border-(--w-on-deep)/20 pl-5 lg:pl-7" : ""} ${i >= 2 ? "border-t border-(--w-on-deep)/20 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-7" : ""}`}
                >
                  <dt className="text-[14.5px] text-(--w-on-deep)">
                    {s.label}
                  </dt>
                  <dd className="font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-semibold leading-none text-white tabular-nums">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </div>
      )}
    </section>
  );
}

async function AboutIntroBlock({ config }: { config: BlockConfig }) {
  const body = typeof config.body === "string" ? config.body.trim() : "";
  if (!body) return null;

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <Overline rule>Our mission</Overline>
        <p className="mt-5 max-w-[34ch] font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-[1.18] tracking-[-0.015em] text-(--w-green-deep)">
          {body}
        </p>
      </Container>
    </section>
  );
}

async function FourPillarsBlock({ config }: { config: BlockConfig }) {
  const pillars = await getPillarsWithProgrammes();
  if (pillars.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "What we do");
  const title = str(config, "title", "Four ways we help young people grow.");

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => (
            <Link
              key={pillar.id}
              href="/what-we-do"
              className="group flex flex-col gap-3 border-t border-(--w-green-deep) pt-6 sm:pr-6 lg:[&:not(:first-child)]:pl-6 [&_h3]:transition-colors hover:[&_h3]:text-primary"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${ACCENT_DOT[pillar.accent ?? ""] ?? ACCENT_DOT[ACCENT_ORDER[i % 4]]}`}
                />
                {pillar.name}
              </span>
              <h3 className="font-display text-[22px] font-semibold leading-snug text-(--w-green-deep)">
                {pillar.tagline ?? pillar.name}
              </h3>
              {pillar.description && (
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

async function ImpactStatsBlock({ config }: { config: BlockConfig }) {
  const stats = await getImpactStats();
  if (stats.length === 0) return null;

  const label = str(config, "label", "Our impact so far");

  return (
    <section className="pt-20 sm:pt-24">
      <Container>
        <Overline>{label}</Overline>
        <dl className="mt-4 grid grid-cols-2 border-y border-(--w-line-strong) lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.id}
              className={`flex flex-col-reverse gap-1 py-7 pr-4 ${i % 2 ? "border-l border-border pl-5 lg:pl-7" : ""} ${i >= 2 ? "border-t border-border lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-7" : ""}`}
            >
              <dt className="text-[14.5px] text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-none text-(--w-green-deep) tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

async function FeaturedProgrammesBlock({ config }: { config: BlockConfig }) {
  const featured = await getFeaturedProgrammes();
  if (featured.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "Programmes");
  const title = str(config, "title", "Our initiatives.");
  const [lead, ...rest] = featured;

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <HeadingRow
          eyebrow={eyebrow}
          title={title}
          href="/programmes"
          linkLabel="All programmes"
        />
        <div
          className={`grid gap-4 ${rest.length ? "lg:grid-cols-[1.3fr_1fr]" : ""}`}
        >
          <Link
            href={`/programmes/${lead.slug}`}
            className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-8 transition-[border-color,box-shadow] hover:border-primary hover:shadow-(--w-lift) sm:p-10"
          >
            <Overline className="mb-0">Featured programme</Overline>
            <h3 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-(--w-green-deep)">
              {lead.name}
            </h3>
            {lead.summary && (
              <p className="max-w-[52ch] text-[17px] leading-relaxed text-muted-foreground">
                {lead.summary}
              </p>
            )}
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
              {lead.impactValue ? (
                <p className="text-sm text-muted-foreground">
                  <span className="mr-2 font-display text-3xl font-semibold text-(--w-green-deep)">
                    {lead.impactValue}
                  </span>
                  {lead.impactLabel}
                </p>
              ) : (
                <span />
              )}
              <MoreLink />
            </div>
          </Link>
          {rest.length > 0 && (
            <div className="grid gap-4">
              {rest.slice(0, 2).map((p) => (
                <ProgrammeCard
                  key={p.id}
                  programme={{ ...p, heroImageUrl: null }}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

async function UpcomingEventsBlock({ config }: { config: BlockConfig }) {
  const events = await getUpcomingPublicEvents(3);
  if (events.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "Events");
  const title = str(config, "title", "What's coming up.");

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <HeadingRow
          eyebrow={eyebrow}
          title={title}
          href="/events"
          linkLabel="All events"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </Container>
    </section>
  );
}

async function StoriesBlock({ config }: { config: BlockConfig }) {
  const stories = await getStories(3);
  if (stories.length === 0) return null;

  const eyebrow = str(config, "eyebrow", "Stories");
  const title = str(config, "title", "Voices from Ikigai.");

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <HeadingRow
          eyebrow={eyebrow}
          title={title}
          href="/stories"
          linkLabel="All stories"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </Container>
    </section>
  );
}

async function PartnersBlock({ config }: { config: BlockConfig }) {
  const partners = await getPartners();
  if (partners.length === 0) return null;

  const label = str(config, "label", "In partnership with");

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <div className="border-y border-border py-10">
          <Overline className="mb-8 justify-center">{label}</Overline>
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
            {partners.map((p) => (
              <PartnerLogo key={p.id} partner={p} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

// The app's real features, which are product facts rather than marketing copy
// (docs/PRODUCT.md), so they live here rather than in the block's config.
const APP_FEATURES = [
  {
    Icon: BookOpen,
    title: "A private journal",
    body: "Works offline and syncs when you're back online.",
  },
  {
    Icon: Sprout,
    title: "Your Growth Tree",
    body: "Milestones that grow a new branch as you reach them.",
  },
  {
    Icon: UserCheck,
    title: "Verified mentors",
    body: "Chat one to one, and with your school club.",
  },
  {
    Icon: ShieldCheck,
    title: "Pad Her Power",
    body: "Safety information and places to get support.",
  },
];

async function AppCtaBlock({ config }: { config: BlockConfig }) {
  const title = str(config, "title", "There's an app for your journey.");
  const body = str(
    config,
    "body",
    "Mentees and mentors use the Ikigai app to track goals, meet, and grow together. Join a programme first, then sign in — it installs to your phone like any other app.",
  );
  const ctaLabel = str(config, "ctaLabel", "Open the app");

  return (
    <section className="mt-28 border-y border-border bg-card sm:mt-36">
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <SectionHeading
            eyebrow="The app"
            title={title}
            intro={body}
            className="mb-6"
          />
          <ul className="border-b border-border">
            {APP_FEATURES.map(({ Icon, title: t, body: b }) => (
              <li
                key={t}
                className="grid grid-cols-[28px_1fr] gap-x-3.5 border-t border-border py-4"
              >
                <Icon
                  aria-hidden
                  className="row-span-2 mt-0.5 size-[22px] text-primary"
                  strokeWidth={1.6}
                />
                <span className="font-semibold">{t}</span>
                <span className="text-[15px] text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
          <a
            href={clientEnv.appUrl}
            className={buttonClass("primary", { className: "mt-8" })}
          >
            {ctaLabel}
          </a>
        </div>
        <div
          aria-hidden
          className="relative flex justify-center overflow-hidden rounded-2xl bg-background px-6 pt-12"
        >
          <PhoneFrame
            src="/marketing/app-screen-sign-in-hd.webp"
            alt=""
            className="-mb-24 w-[220px] sm:w-[250px]"
          />
        </div>
      </Container>
    </section>
  );
}

async function SafeByDesignBlock({ config }: { config: BlockConfig }) {
  const eyebrow = str(config, "eyebrow", "Safe by design");
  const title = str(
    config,
    "title",
    "Built for young people, and the adults who look out for them.",
  );
  const items = [
    {
      Icon: House,
      title: str(config, "item1Title", "Guardians stay informed"),
      body: str(
        config,
        "item1Body",
        "Young people under 18 join with a guardian's consent, and guardians can follow their child's journey.",
      ),
    },
    {
      Icon: UserCheck,
      title: str(config, "item2Title", "Every mentor is verified"),
      body: str(
        config,
        "item2Body",
        "Mentors are checked by our team before they can work with a young person.",
      ),
    },
    {
      Icon: ShieldCheck,
      title: str(config, "item3Title", "Concerns reach a person"),
      body: str(
        config,
        "item3Body",
        "Anyone can raise a safety concern, and it goes straight to our safeguarding team.",
      ),
    },
  ];

  return (
    <section className="pt-28 sm:pt-36">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="grid gap-y-10 md:grid-cols-3">
          {items.map(({ Icon, title: t, body: b }) => (
            <div
              key={t}
              className="flex flex-col gap-3 border-t border-(--w-line-strong) pt-6 md:pr-6 md:[&:not(:first-child)]:pl-6"
            >
              <Icon
                aria-hidden
                className="size-[22px] text-primary"
                strokeWidth={1.6}
              />
              <h3 className="font-display text-[21px] font-semibold text-(--w-green-deep)">
                {t}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {b}
              </p>
            </div>
          ))}
        </div>
      </Container>
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
    <section className="pt-28 sm:pt-36">
      <Container>
        <div className="grid items-center gap-8 rounded-2xl bg-(--w-green-deep) px-8 py-12 text-white sm:px-14 sm:py-14 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em]">
              {title}
            </h2>
            <p className="mt-3 max-w-[52ch] text-[16.5px] text-(--w-on-deep)">
              {body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryHref} className={buttonClass("light")}>
              {primaryLabel}
            </Link>
            <Link href={secondaryHref} className={buttonClass("outline-light")}>
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export const BLOCK_REGISTRY = {
  hero: {
    label: "Hero",
    description: "The page-opening headline, body copy and two buttons.",
    fields: [
      {
        type: "textarea",
        name: "headline",
        label: "Headline (put *asterisks* around words to highlight them)",
        rows: 2,
      },
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
    description:
      "Shows the published stats from CMS → Impact. Not shown on a page that has a Hero, which already includes these numbers.",
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
    description:
      "The app section: your title and text beside the app's features and real screenshots.",
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
  safe_by_design: {
    label: "Safe by design",
    description:
      "Three short points on how Ikigai keeps young people safe. Only describe what the product really does.",
    fields: [
      ...headingFields,
      { type: "text", name: "item1Title", label: "Point 1 title" },
      { type: "textarea", name: "item1Body", label: "Point 1 text", rows: 2 },
      { type: "text", name: "item2Title", label: "Point 2 title" },
      { type: "textarea", name: "item2Body", label: "Point 2 text", rows: 2 },
      { type: "text", name: "item3Title", label: "Point 3 title" },
      { type: "textarea", name: "item3Body", label: "Point 3 text", rows: 2 },
    ],
    defaultConfig: {
      eyebrow: "Safe by design",
      title: "Built for young people, and the adults who look out for them.",
      item1Title: "Guardians stay informed",
      item1Body:
        "Young people under 18 join with a guardian's consent, and guardians can follow their child's journey.",
      item2Title: "Every mentor is verified",
      item2Body:
        "Mentors are checked by our team before they can work with a young person.",
      item3Title: "Concerns reach a person",
      item3Body:
        "Anyone can raise a safety concern, and it goes straight to our safeguarding team.",
    },
    Render: SafeByDesignBlock,
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
