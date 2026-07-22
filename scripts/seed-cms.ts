import { db } from "@/db/db";
import { impactStats, pillars, programmes, siteCopy } from "@/db/schema";

// Seeds the public website with the four pillars, the programmes Ikigai
// actually runs, the impact numbers and the standing page copy — so /admin/cms
// opens onto real content rather than nine empty tables, and the public pages
// can be built against the shape they will really receive.
//
// Idempotent: every insert conflicts on its natural key and does nothing. Safe
// to run against a database that already has content — it will not overwrite an
// admin's edits.
//
// Run with:  bun scripts/seed-cms.ts

const PILLARS = [
  {
    slug: "discover",
    name: "Discover",
    icon: "🌱",
    accent: "green",
    tagline: "Understand yourself and find your purpose.",
    description:
      "Helping young people understand who they are, what they are good at, and what they want to build their lives around.",
    orderIndex: 0,
  },
  {
    slug: "thrive",
    name: "Thrive",
    icon: "❤️",
    accent: "amber",
    tagline: "Look after your mind, body and wellbeing.",
    description:
      "Supporting young people's mental, emotional and physical wellbeing, and creating the conversations that make asking for help normal.",
    orderIndex: 1,
  },
  {
    slug: "build",
    name: "Build",
    icon: "🚀",
    accent: "earth",
    tagline: "Gain the skills and confidence to go further.",
    description:
      "Preparing young people with practical skills, exposure to opportunity, and the confidence to take it.",
    orderIndex: 2,
  },
  {
    slug: "lead",
    name: "Lead",
    icon: "🤝",
    accent: "sage",
    tagline: "Speak up and change your community.",
    description:
      "Creating young leaders who advocate for change and act on what they see happening around them.",
    orderIndex: 3,
  },
];

// `published: false` marks a programme Ikigai intends to run but has not run
// yet. The brief describes these as future work, and a website that advertises
// a programme nobody can join is the kind of small dishonesty that costs an
// organisation its credibility with the young people it is asking to trust it.
// They are seeded so an admin can find and fill them in, not so they go live.
const PROGRAMMES = [
  {
    pillar: "discover",
    slug: "finding-yourself",
    name: "Finding Yourself",
    summary:
      "A personal development experience helping young people explore identity, goals, strengths and purpose.",
    about:
      "Finding Yourself is where most people meet Ikigai for the first time. Over a day together — often the Finding Yourself Picnic — young people work through who they are, what they care about, and what they might do with it, with people their own age asking the same questions.",
    objectives: [
      "Understand your own strengths, values and interests",
      "Set goals that are yours rather than inherited",
      "Leave with a clearer sense of direction and people to walk it with",
    ],
    activities: [
      "Finding Yourself Picnic",
      "Guided self-discovery sessions",
      "Small-group conversations",
    ],
    published: true,
    featured: true,
    orderIndex: 0,
  },
  {
    pillar: "discover",
    slug: "mentorship",
    name: "Mentorship Programme",
    summary:
      "Connecting young people with mentors who give real guidance, consistently.",
    about:
      "Matched one-to-one with a verified mentor, young people get structured guidance over months rather than a single conversation. Mentors are vetted before they ever meet a young person, and progress is tracked so relationships do not quietly fade.",
    objectives: [
      "Be matched with a mentor who fits your interests and goals",
      "Meet regularly, in person and in the app",
      "Work through a shared plan with someone who is accountable to you",
    ],
    activities: [
      "One-to-one mentorship sessions",
      "Career guidance",
      "Personal development conversations",
    ],
    impactValue: "50",
    impactLabel: "Young people mentored",
    ctaLabel: "Join the mentorship programme",
    ctaUrl: "/how-it-works",
    published: true,
    featured: true,
    orderIndex: 1,
  },
  {
    pillar: "thrive",
    slug: "mental-health",
    name: "Mental Health Awareness",
    summary:
      "Creating conversations around mental health, emotional wellbeing and support systems.",
    about:
      "A campaign to make mental health something young people in Sierra Leone can talk about openly — in schools, in communities, and among friends — and to point people towards support that exists.",
    objectives: [
      "Normalise talking about mental health",
      "Recognise when you or a friend needs support",
      "Know where to find help",
    ],
    activities: [
      "School and community campaigns",
      "Awareness sessions",
      "Peer support conversations",
    ],
    published: true,
    featured: true,
    orderIndex: 0,
  },
  {
    pillar: "thrive",
    slug: "padher",
    name: "PadHer Initiative",
    summary:
      "A menstrual health initiative improving awareness, education and support for girls.",
    about:
      "PadHer works with schools and communities on menstrual health: the education girls are not given, the products they cannot always get, and the stigma that keeps girls out of classrooms every month.",
    objectives: [
      "Give girls accurate information about their bodies",
      "Reduce the stigma that keeps girls out of school",
      "Improve access to menstrual health products and support",
    ],
    activities: [
      "School outreach",
      "Menstrual health education sessions",
      "Distribution with partner organisations",
    ],
    impactValue: "2,000+",
    impactLabel: "Girls reached",
    published: true,
    featured: true,
    orderIndex: 1,
  },
  {
    pillar: "thrive",
    slug: "girls-wellbeing",
    name: "Girls' Wellbeing Initiatives",
    summary:
      "Supporting girls through education, awareness and community engagement.",
    published: false,
    orderIndex: 2,
  },
  {
    pillar: "build",
    slug: "spark-the-stem",
    name: "Spark The STEM",
    summary:
      "Introducing girls to technology, science, innovation and the careers behind them.",
    about:
      "Spark The STEM puts girls in front of the science and technology they are rarely shown, and in front of the women already working in it. Hands-on workshops rather than lectures.",
    objectives: [
      "See what a career in STEM actually looks like",
      "Build something with your own hands",
      "Meet women already doing this work",
    ],
    activities: [
      "Hands-on STEM workshops",
      "Technology and innovation sessions",
      "Career exposure with partners",
    ],
    impactValue: "100",
    impactLabel: "Girls introduced to STEM",
    published: true,
    featured: true,
    orderIndex: 0,
  },
  {
    pillar: "build",
    slug: "entrepreneurship-skills",
    name: "Entrepreneurship & Skills Development",
    summary:
      "Business training, digital skills and career readiness for young people entering work.",
    published: false,
    orderIndex: 1,
  },
  {
    pillar: "lead",
    slug: "sexual-assault-awareness",
    name: "Sexual Assault Awareness Campaign",
    summary:
      "Awareness, education and conversation around preventing sexual violence and supporting survivors.",
    about:
      "A campaign creating the awareness and the language young people need to recognise sexual violence, to prevent it, and to support the people around them who have survived it.",
    objectives: [
      "Understand consent and recognise abuse",
      "Know how to support a survivor",
      "Know where to report and get help",
    ],
    activities: [
      "Community awareness campaigns",
      "School education sessions",
      "Survivor support signposting",
    ],
    published: true,
    featured: false,
    orderIndex: 0,
  },
  {
    pillar: "lead",
    slug: "community-outreach",
    name: "Community Outreach",
    summary:
      "Taking Ikigai's programmes directly into schools and communities across Sierra Leone.",
    about:
      "Outreach is how every other programme reaches the young people who need it — school visits, community sessions, and partnerships with the organisations already trusted locally.",
    objectives: [
      "Reach young people where they already are",
      "Build lasting relationships with schools and communities",
      "Recruit and support local youth leaders",
    ],
    activities: [
      "School outreach visits",
      "Community campaigns",
      "Youth leadership projects",
    ],
    impactValue: "Multiple",
    impactLabel: "Community campaigns",
    published: true,
    featured: false,
    orderIndex: 1,
  },
  {
    pillar: "lead",
    slug: "youth-advocacy",
    name: "Youth Advocacy",
    summary:
      "Young people campaigning on the issues affecting their own communities.",
    published: false,
    orderIndex: 2,
  },
];

const IMPACT_STATS = [
  { value: "2,000+", label: "Girls reached", orderIndex: 0 },
  { value: "100", label: "Girls introduced to STEM", orderIndex: 1 },
  { value: "50", label: "Young people mentored", orderIndex: 2 },
  { value: "Multiple", label: "Community campaigns", orderIndex: 3 },
];

const SITE_COPY: { key: string; value: Record<string, unknown> }[] = [
  {
    key: "hero",
    value: {
      headline:
        "Helping young people discover purpose, build skills, and create change.",
      body: "Ikigai is a youth-led organization empowering young people through personal development, wellbeing, mentorship, skills development and community action.",
      primaryLabel: "Join a programme",
      primaryHref: "/get-involved",
      secondaryLabel: "Partner with us",
      secondaryHref: "/get-involved#partner",
    },
  },
  {
    key: "about_intro",
    value: {
      body: "Ikigai exists to help young people understand who they are, discover their purpose, and develop the confidence and skills needed to create meaningful impact in their communities.",
    },
  },
  {
    key: "mission",
    value: {
      body: "To help young people discover who they are, develop their abilities, improve their wellbeing, and become leaders who transform their communities.",
    },
  },
  {
    key: "vision",
    value: {
      body: "A Sierra Leone where every young person knows their purpose and has the support, skills and confidence to pursue it.",
    },
  },
  {
    key: "values",
    value: {
      items: ["Purpose", "Growth", "Community", "Inclusion", "Empowerment"],
    },
  },
];

async function main() {
  await db
    .insert(pillars)
    .values(PILLARS.map((p) => ({ ...p, published: true })))
    .onConflictDoNothing({ target: pillars.slug });

  const pillarRows = await db
    .select({ id: pillars.id, slug: pillars.slug })
    .from(pillars);
  const pillarIdBySlug = new Map(pillarRows.map((p) => [p.slug, p.id]));

  await db
    .insert(programmes)
    .values(
      PROGRAMMES.map(({ pillar, ...rest }) => ({
        ...rest,
        pillarId: pillarIdBySlug.get(pillar),
      })),
    )
    .onConflictDoNothing({ target: programmes.slug });

  // No natural key on these two, so a re-run would duplicate them. Only seed
  // when the table is untouched.
  const [existingStat] = await db.select().from(impactStats).limit(1);
  if (!existingStat) {
    await db
      .insert(impactStats)
      .values(IMPACT_STATS.map((s) => ({ ...s, published: true })));
  }

  await db
    .insert(siteCopy)
    .values(SITE_COPY)
    .onConflictDoNothing({ target: siteCopy.key });

  const counts = {
    pillars: (await db.select({ slug: pillars.slug }).from(pillars)).length,
    programmes: (await db.select({ slug: programmes.slug }).from(programmes))
      .length,
    impactStats: (await db.select({ id: impactStats.id }).from(impactStats))
      .length,
    siteCopy: (await db.select({ key: siteCopy.key }).from(siteCopy)).length,
  };
  console.log("CMS seed complete:", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
