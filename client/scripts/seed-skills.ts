import { db } from "@/db/db";
import { milestoneTemplates, skillCategories } from "@/db/schema";

// Seeds the skill category taxonomy and the milestone content library behind
// automatic milestone generation (see lib/skill-tracks.ts). Four categories
// ship with a full DISCOVER→THRIVE→BUILD→LEAD track; the remaining named
// categories are seeded as empty shells (so a mentee's interest tag still
// classifies correctly) for an admin to fill in at /admin/skills; "General"
// is the fallback for anything that matches no category at all.
//
// Idempotent: categories conflict on slug and do nothing on a re-run; a
// second run is therefore also the safe way to check nothing is missing.
//
// Run with:  bun scripts/seed-skills.ts

type Stage = "discover" | "thrive" | "build" | "lead";
type Dimension =
  | "knowledge"
  | "tools"
  | "practice"
  | "output"
  | "feedback"
  | "real_world"
  | "impact";

const STAGE_POINTS: Record<Stage, number> = {
  discover: 10,
  thrive: 15,
  build: 20,
  lead: 30,
};

function m(dimension: Dimension, label: string, requiresMentorReview: boolean) {
  return { dimension, label, requiresMentorReview };
}

type CategorySeed = {
  slug: string;
  name: string;
  description?: string;
  aliases: string[];
  isFallback?: boolean;
  track?: Record<Stage, ReturnType<typeof m>[]>;
};

const CATEGORIES: CategorySeed[] = [
  {
    slug: "advocacy",
    name: "Advocacy",
    aliases: ["advocacy", "activism", "community organizing", "campaigning"],
    track: {
      discover: [
        m("knowledge", "Complete an advocacy fundamentals lesson", false),
        m("knowledge", "Identify one issue you care about", false),
        m("knowledge", "Research the issue using 3 reliable sources", false),
        m("knowledge", "Identify the people affected by the issue", false),
        m("practice", "Complete one mentor challenge", true),
      ],
      thrive: [
        m("practice", "Write an advocacy message", false),
        m("output", "Create 2 advocacy posts", true),
        m("knowledge", "Complete 2 research assignments", false),
        m("real_world", "Interview or speak with 2 community members", true),
        m("real_world", "Participate in one advocacy activity", true),
        m("feedback", "Receive mentor feedback on an advocacy idea", true),
      ],
      build: [
        m("output", "Develop an advocacy campaign concept", false),
        m("output", "Create a campaign plan", true),
        m("output", "Produce 5 campaign materials", true),
        m("real_world", "Complete a community engagement activity", true),
        m("real_world", "Launch a small advocacy campaign", true),
        m("output", "Document campaign results", true),
      ],
      lead: [
        m("real_world", "Lead an advocacy activity", true),
        m("real_world", "Organize a community action", true),
        m("real_world", "Collaborate with another organization or group", true),
        m("output", "Present an advocacy project", true),
        m("impact", "Mentor another young advocate", true),
        m("impact", "Complete an impact reflection", false),
      ],
    },
  },
  {
    slug: "media-content-creation",
    name: "Media & Content Creation",
    aliases: [
      "content creation",
      "content",
      "video editing",
      "social media",
      "media",
      "videography",
    ],
    track: {
      discover: [
        m("knowledge", "Complete content creation basics", false),
        m("tools", "Learn basic video editing", false),
        m("knowledge", "Learn content planning", false),
        m("knowledge", "Create 3 content ideas", false),
        m("knowledge", "Learn basic storytelling", false),
        m("practice", "Complete one mentor challenge", true),
      ],
      thrive: [
        m("practice", "Post 2 videos per week", false),
        m("output", "Create 5 pieces of content", true),
        m("practice", "Complete 2 assignments", false),
        m("practice", "Complete 2 mentor challenges", true),
        m("feedback", "Submit one piece of content for feedback", true),
        m("feedback", "Apply feedback to a new piece of content", true),
      ],
      build: [
        m("output", "Create a 5-video content series", true),
        m("output", "Create a one-week content calendar", false),
        m("output", "Produce 5 edited videos", true),
        m("output", "Build a content portfolio", true),
        m("real_world", "Complete one real-world content project", true),
        m("feedback", "Revise a project based on mentor feedback", true),
      ],
      lead: [
        m("output", "Publish 10 pieces of content", true),
        m("real_world", "Complete a 30-day content challenge", true),
        m("real_world", "Create content for a real organization", true),
        m("real_world", "Lead a small content project", true),
        m("output", "Build a public portfolio", true),
        m("impact", "Help another mentee with content creation", true),
      ],
    },
  },
  {
    slug: "software-engineering",
    name: "Software Engineering",
    aliases: [
      "software engineering",
      "programming",
      "coding",
      "python",
      "javascript",
      "web development",
      "mobile development",
      "backend",
      "frontend",
    ],
    track: {
      discover: [
        m("knowledge", "Complete programming fundamentals", false),
        m("tools", "Set up your development environment", false),
        m("practice", "Complete 3 beginner coding exercises", false),
        m("tools", "Learn basic Git/GitHub", false),
        m("output", "Build your first simple program", false),
      ],
      thrive: [
        m("practice", "Complete 5 coding challenges", false),
        m("practice", "Code twice per week", false),
        m("practice", "Complete 2 programming assignments", false),
        m("practice", "Fix 3 bugs", false),
        m("feedback", "Submit code for mentor review", true),
        m("practice", "Complete one mentor coding challenge", true),
      ],
      build: [
        m("output", "Build a small application", true),
        m("tools", "Use GitHub to document your project", false),
        m("output", "Build one project using your chosen technology", true),
        m("feedback", "Add a new feature based on feedback", true),
        m("practice", "Test your application", false),
        m("real_world", "Deploy or demonstrate your project", true),
      ],
      lead: [
        m("output", "Complete a larger software project", true),
        m("real_world", "Contribute to an existing project", true),
        m("real_world", "Collaborate with another developer", true),
        m("impact", "Help another learner solve a coding problem", true),
        m("real_world", "Present your project", true),
        m("output", "Build a software portfolio", true),
      ],
    },
  },
  {
    slug: "fashion-tailoring",
    name: "Fashion & Tailoring",
    aliases: [
      "fashion",
      "tailoring",
      "sewing",
      "fashion design",
      "dressmaking",
    ],
    track: {
      discover: [
        m("tools", "Learn sewing machine basics", false),
        m("knowledge", "Identify 5 common fabrics", false),
        m("knowledge", "Learn basic measurements", false),
        m("practice", "Complete 3 basic sewing exercises", false),
        m("knowledge", "Learn basic garment construction", false),
        m("practice", "Complete one mentor challenge", true),
      ],
      thrive: [
        m("practice", "Complete 3 sewing assignments", false),
        m("practice", "Practice sewing twice per week", false),
        m("output", "Create 3 basic samples", true),
        m("practice", "Complete one garment exercise", false),
        m("practice", "Practice taking accurate measurements", false),
        m("feedback", "Submit work for mentor feedback", true),
      ],
      build: [
        m("output", "Create your first complete garment", true),
        m("output", "Create 3 finished pieces", true),
        m("output", "Complete a custom garment project", true),
        m("output", "Create a small fashion portfolio", true),
        m("real_world", "Complete one client-style assignment", true),
        m("feedback", "Improve one garment based on mentor feedback", true),
      ],
      lead: [
        m("output", "Complete a full fashion collection or project", true),
        m("real_world", "Create garments for a real client", true),
        m("output", "Build a fashion portfolio", true),
        m("real_world", "Complete a paid or community fashion project", true),
        m("impact", "Teach another learner one sewing technique", true),
        m("real_world", "Present your finished work", true),
      ],
    },
  },
  {
    slug: "graphic-design",
    name: "Graphic Design",
    aliases: ["graphic design", "design", "illustrator", "photoshop", "canva"],
  },
  {
    slug: "business-entrepreneurship",
    name: "Business & Entrepreneurship",
    aliases: ["business", "entrepreneurship", "startup", "business plan"],
  },
  {
    slug: "creative-writing",
    name: "Creative Writing",
    aliases: ["creative writing", "writing", "poetry", "fiction"],
  },
  {
    slug: "photography",
    name: "Photography",
    aliases: ["photography", "photo", "camera"],
  },
  {
    slug: "public-speaking",
    name: "Public Speaking",
    aliases: ["public speaking", "debate", "oratory", "presentation"],
  },
  {
    slug: "marketing-communications",
    name: "Marketing & Communications",
    aliases: ["marketing", "communications", "pr", "branding"],
  },
  {
    slug: "digital-skills",
    name: "Digital Skills",
    aliases: ["digital skills", "computer skills", "ict", "digital literacy"],
  },
  {
    slug: "leadership",
    name: "Leadership",
    aliases: ["leadership", "team lead"],
  },
  {
    slug: "arts-crafts",
    name: "Arts & Crafts",
    aliases: ["arts and crafts", "crafts", "painting", "drawing", "art"],
  },
  {
    slug: "beauty-hair",
    name: "Beauty & Hair",
    aliases: ["beauty", "hair", "hairdressing", "makeup", "cosmetology"],
  },
  {
    slug: "education-teaching",
    name: "Education & Teaching",
    aliases: ["teaching", "education", "tutoring"],
  },
  {
    slug: "finance",
    name: "Finance",
    aliases: ["finance", "accounting", "budgeting", "bookkeeping"],
  },
  {
    slug: "research",
    name: "Research",
    aliases: ["research", "data analysis"],
  },
  {
    slug: "stem",
    name: "STEM",
    aliases: ["stem", "science", "engineering", "math", "mathematics"],
  },
  {
    slug: "general",
    name: "General",
    description:
      "Fallback track for a skill that doesn't match a named category yet.",
    aliases: [],
    isFallback: true,
    track: {
      discover: [
        m("knowledge", "Complete a beginner lesson in this skill", false),
        m("tools", "Identify the key tools or equipment used", false),
        m("knowledge", "Complete a short tutorial", false),
        m("practice", "Complete one mentor challenge", true),
      ],
      thrive: [
        m("practice", "Complete 3 practice exercises", false),
        m("practice", "Practice this skill twice a week for two weeks", false),
        m("feedback", "Submit one piece of work for mentor feedback", true),
        m("feedback", "Apply feedback to your next attempt", true),
      ],
      build: [
        m("output", "Create a project using this skill", true),
        m("real_world", "Complete a real-world task using this skill", true),
        m("output", "Build a small portfolio of your work", true),
        m("feedback", "Revise a project based on mentor feedback", true),
      ],
      lead: [
        m("real_world", "Complete a real-world project with this skill", true),
        m("real_world", "Collaborate with another mentee on a project", true),
        m("impact", "Help another learner with one concept", true),
        m(
          "impact",
          "Reflect on how you'd use this skill to help your community",
          false,
        ),
      ],
    },
  },
];

async function seed() {
  for (const category of CATEGORIES) {
    const [row] = await db
      .insert(skillCategories)
      .values({
        slug: category.slug,
        name: category.name,
        description: category.description,
        aliases: category.aliases,
        isFallback: category.isFallback ?? false,
        orderIndex: CATEGORIES.indexOf(category),
      })
      .onConflictDoNothing({ target: skillCategories.slug })
      .returning();

    // Already existed (conflict) — leave its templates alone; an admin may
    // have edited them since the last seed run.
    if (!row || !category.track) continue;

    const stages: Stage[] = ["discover", "thrive", "build", "lead"];
    for (const stage of stages) {
      const items = category.track[stage];
      await db.insert(milestoneTemplates).values(
        items.map((item, i) => ({
          categoryId: row.id,
          stage,
          dimension: item.dimension,
          label: item.label,
          requiresMentorReview: item.requiresMentorReview,
          growthPoints: STAGE_POINTS[stage],
          orderIndex: i,
        })),
      );
    }
  }

  console.log(`Seeded ${CATEGORIES.length} skill categories.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
