import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { partners } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

const FIELDS: Field[] = [
  { type: "text", name: "name", label: "Name", required: true },
  { type: "image", name: "logoUrl", label: "Logo", aspect: "square" },
  {
    type: "text",
    name: "websiteUrl",
    label: "Website",
    placeholder: "https://…",
  },
  { type: "textarea", name: "description", label: "Description", rows: 3 },
];

export default async function PartnersCmsPage() {
  const rows = await db
    .select()
    .from(partners)
    .orderBy(asc(partners.orderIndex));

  const items: AdminRow[] = rows.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: p.websiteUrl ?? undefined,
    thumb: p.logoUrl,
    published: p.published ?? false,
    values: {
      name: p.name,
      logoUrl: p.logoUrl ?? "",
      websiteUrl: p.websiteUrl ?? "",
      description: p.description ?? "",
    },
  }));

  return (
    <ResourceManager
      singular="Partner"
      fields={FIELDS}
      items={items}
      actions={{ save, remove, togglePublish, move }}
    />
  );
}
