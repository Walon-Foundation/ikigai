import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { impactStats } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

const FIELDS: Field[] = [
  {
    type: "text",
    name: "value",
    label: "Value",
    required: true,
    placeholder: "2,000+",
  },
  {
    type: "text",
    name: "label",
    label: "Label",
    required: true,
    placeholder: "Girls reached",
  },
];

export default async function ImpactCmsPage() {
  const rows = await db
    .select()
    .from(impactStats)
    .orderBy(asc(impactStats.orderIndex));

  const items: AdminRow[] = rows.map((s) => ({
    id: s.id,
    title: `${s.value} — ${s.label}`,
    published: s.published ?? false,
    values: { value: s.value, label: s.label },
  }));

  return (
    <ResourceManager
      singular="Statistic"
      fields={FIELDS}
      items={items}
      actions={{ save, remove, togglePublish, move }}
    />
  );
}
