import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { teamMembers } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

const FIELDS: Field[] = [
  { type: "text", name: "name", label: "Name", required: true },
  { type: "text", name: "role", label: "Role" },
  { type: "image", name: "photoUrl", label: "Photo", aspect: "square" },
  { type: "textarea", name: "bio", label: "Short bio", rows: 3 },
];

export default async function TeamCmsPage() {
  const rows = await db
    .select()
    .from(teamMembers)
    .orderBy(asc(teamMembers.orderIndex));

  const items: AdminRow[] = rows.map((m) => ({
    id: m.id,
    title: m.name,
    subtitle: m.role ?? undefined,
    thumb: m.photoUrl,
    published: m.published ?? false,
    values: {
      name: m.name,
      role: m.role ?? "",
      photoUrl: m.photoUrl ?? "",
      bio: m.bio ?? "",
    },
  }));

  return (
    <ResourceManager
      singular="Team member"
      fields={FIELDS}
      items={items}
      actions={{ save, remove, togglePublish, move }}
    />
  );
}
