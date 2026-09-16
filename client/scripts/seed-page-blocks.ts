import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { pageBlocks } from "@/db/schema";

// Seeds the homepage's page_blocks rows to match the hand-written homepage
// this replaces, in the same order and with the same visible content — so
// migrating app/(marketing)/page.tsx onto the block system does not change
// what a visitor sees. See lib/blocks/registry.ts for what each block type
// renders.
//
// page_blocks has no natural per-row key to conflict on (a page can hold more
// than one block of the same type), so — like impactStats in seed-cms.ts —
// this only seeds when the "home" page has no blocks at all. Re-running it
// against a database an admin has already rearranged in /admin/page-builder
// will not touch their layout.
//
// Run with:  bun scripts/seed-page-blocks.ts

const HOME_BLOCKS: { type: string; config: Record<string, unknown> }[] = [
  {
    type: "hero",
    config: {
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
    type: "about_intro",
    config: {
      body: "Ikigai exists to help young people understand who they are, discover their purpose, and develop the confidence and skills needed to create meaningful impact in their communities.",
    },
  },
  {
    type: "four_pillars",
    config: {
      eyebrow: "What we do",
      title: "Four ways we help young people grow.",
    },
  },
  { type: "impact_stats", config: { label: "Our impact so far" } },
  {
    type: "featured_programmes",
    config: { eyebrow: "Programmes", title: "Our initiatives." },
  },
  {
    type: "upcoming_events",
    config: { eyebrow: "Events", title: "What's coming up." },
  },
  {
    type: "stories",
    config: { eyebrow: "Stories", title: "Voices from Ikigai." },
  },
  { type: "partners", config: { label: "In partnership with" } },
  {
    type: "app_cta",
    config: {
      title: "There's an app for your journey.",
      body: "Mentees and mentors use the Ikigai app to track goals, meet, and grow together. Join a programme first, then sign in — it installs to your phone like any other app.",
      ctaLabel: "Open the app",
    },
  },
  {
    type: "final_cta",
    config: {
      title: "Your journey starts here.",
      body: "Whether you want to grow, give your time, or partner with us — there's a place for you at Ikigai.",
      primaryLabel: "Get involved",
      primaryHref: "/get-involved",
      secondaryLabel: "Explore our work",
      secondaryHref: "/what-we-do",
    },
  },
];

async function main() {
  const existing = await db
    .select({ id: pageBlocks.id })
    .from(pageBlocks)
    .where(eq(pageBlocks.page, "home"))
    .limit(1);

  if (existing.length > 0) {
    console.log("page_blocks seed skipped: 'home' already has blocks.");
    return;
  }

  await db.insert(pageBlocks).values(
    HOME_BLOCKS.map((block, i) => ({
      page: "home",
      type: block.type,
      config: block.config,
      orderIndex: i,
      published: true,
    })),
  );

  console.log(
    `page_blocks seed complete: ${HOME_BLOCKS.length} blocks for 'home'.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
