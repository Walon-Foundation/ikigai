import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { milestoneTemplates, skillCategories } from "@/db/schema";
import { SKILL_STAGE_LABELS, SKILL_STAGES } from "@/lib/skill-stages";
import { remove, save } from "./actions";

const DIMENSION_OPTIONS = [
  { value: "knowledge", label: "Knowledge" },
  { value: "tools", label: "Tools" },
  { value: "practice", label: "Practice" },
  { value: "output", label: "Output" },
  { value: "feedback", label: "Feedback" },
  { value: "real_world", label: "Real-world application" },
  { value: "impact", label: "Impact" },
];

const FIELDS: Field[] = [
  { type: "textarea", name: "label", label: "Milestone", rows: 2 },
  {
    type: "select",
    name: "stage",
    label: "Stage",
    options: SKILL_STAGES.map((s) => ({
      value: s,
      label: SKILL_STAGE_LABELS[s],
    })),
  },
  {
    type: "select",
    name: "dimension",
    label: "Dimension",
    options: DIMENSION_OPTIONS,
  },
  {
    type: "checkbox",
    name: "requiresMentorReview",
    label: "Needs mentor review before it counts",
  },
  {
    type: "number",
    name: "growthPoints",
    label: "Growth points",
    min: 0,
    max: 200,
  },
  {
    type: "number",
    name: "orderIndex",
    label: "Order within stage",
    min: 0,
    max: 999,
  },
];

export default async function MilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;

  const categories = await db
    .select()
    .from(skillCategories)
    .orderBy(asc(skillCategories.orderIndex));

  const active = categorySlug
    ? (categories.find((c) => c.slug === categorySlug) ?? categories[0])
    : categories[0];

  if (!active) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Add a category first.
      </p>
    );
  }

  const rows = await db
    .select()
    .from(milestoneTemplates)
    .where(eq(milestoneTemplates.categoryId, active.id))
    .orderBy(asc(milestoneTemplates.stage), asc(milestoneTemplates.orderIndex));

  const items: AdminRow[] = rows.map((t) => ({
    id: t.id,
    title: t.label,
    subtitle: `${SKILL_STAGE_LABELS[t.stage]} · ${t.dimension}${t.requiresMentorReview ? " · mentor review" : ""}`,
    published: true,
    values: {
      label: t.label,
      stage: t.stage,
      dimension: t.dimension,
      requiresMentorReview: t.requiresMentorReview ? "true" : "",
      growthPoints: String(t.growthPoints),
      orderIndex: String(t.orderIndex ?? 0),
    },
  }));

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/skills/milestones?category=${c.slug}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              c.id === active.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <ResourceManager
        singular="Milestone"
        fields={FIELDS}
        items={items}
        actions={{ save: save.bind(null, active.id), remove }}
        canPublish={false}
        canReorder={false}
      />
    </div>
  );
}
