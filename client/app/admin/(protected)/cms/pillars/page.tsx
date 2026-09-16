import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { pillars } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

const FIELDS: Field[] = [
  {
    type: "text",
    name: "name",
    label: "Name",
    required: true,
    placeholder: "Discover",
  },
  { type: "text", name: "icon", label: "Icon (emoji)", placeholder: "🌱" },
  {
    type: "text",
    name: "tagline",
    label: "Tagline",
    placeholder: "Understand yourself and find your purpose.",
  },
  { type: "textarea", name: "description", label: "Description", rows: 3 },
  {
    type: "select",
    name: "accent",
    label: "Accent colour",
    options: [
      { value: "green", label: "Green" },
      { value: "amber", label: "Amber" },
      { value: "earth", label: "Earth" },
      { value: "sage", label: "Sage" },
    ],
  },
];

export default async function PillarsCmsPage() {
  const rows = await db.select().from(pillars).orderBy(asc(pillars.orderIndex));

  const items: AdminRow[] = rows.map((p) => ({
    id: p.id,
    title: `${p.icon ?? ""} ${p.name}`.trim(),
    subtitle: p.tagline ?? undefined,
    published: p.published ?? false,
    values: {
      name: p.name,
      icon: p.icon ?? "",
      tagline: p.tagline ?? "",
      description: p.description ?? "",
      accent: p.accent ?? "green",
    },
  }));

  return (
    <ResourceManager
      singular="Pillar"
      fields={FIELDS}
      items={items}
      actions={{ save, remove, togglePublish, move }}
    />
  );
}
