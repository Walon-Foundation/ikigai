import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { skillCategories } from "@/db/schema";
import { move, remove, save } from "./actions";

const FIELDS: Field[] = [
  {
    type: "text",
    name: "name",
    label: "Name",
    required: true,
    placeholder: "Software Engineering",
  },
  { type: "textarea", name: "description", label: "Description", rows: 2 },
  {
    type: "lines",
    name: "aliases",
    label: "Matches these interest tags",
    help: "One per line. A mentee's interest tag (e.g. “python”) is matched against these to classify it into this category.",
    placeholder: "python\nweb development\ncoding",
  },
  {
    type: "checkbox",
    name: "isFallback",
    label: "Fallback category (used when a tag matches nothing else)",
  },
];

export default async function SkillCategoriesPage() {
  const rows = await db
    .select()
    .from(skillCategories)
    .orderBy(asc(skillCategories.orderIndex));

  const items: AdminRow[] = rows.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: c.isFallback
      ? "Fallback"
      : (c.aliases ?? []).slice(0, 4).join(", ") || "No aliases yet",
    published: true,
    values: {
      name: c.name,
      description: c.description ?? "",
      aliases: (c.aliases ?? []).join("\n"),
      isFallback: c.isFallback ? "true" : "",
    },
  }));

  return (
    <ResourceManager
      singular="Category"
      fields={FIELDS}
      items={items}
      actions={{ save, remove, move }}
      canPublish={false}
    />
  );
}
