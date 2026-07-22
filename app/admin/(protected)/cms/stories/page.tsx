import { desc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { programmes, stories } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

const CATEGORY_LABEL: Record<string, string> = {
  participant: "Participant story",
  volunteer: "Volunteer story",
  partner: "Partner story",
  impact: "Impact story",
};

export default async function StoriesCmsPage() {
  const [rows, programmeRows] = await Promise.all([
    db.select().from(stories).orderBy(desc(stories.publishedAt)),
    db.select().from(programmes).orderBy(programmes.name),
  ]);

  const fields: Field[] = [
    { type: "text", name: "title", label: "Title", required: true },
    {
      type: "select",
      name: "category",
      label: "Category",
      options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
        value,
        label,
      })),
    },
    { type: "image", name: "coverImageUrl", label: "Cover image" },
    { type: "text", name: "authorName", label: "Author name" },
    {
      type: "textarea",
      name: "excerpt",
      label: "Excerpt (list preview)",
      rows: 2,
    },
    { type: "textarea", name: "body", label: "Body", rows: 10 },
    {
      type: "select",
      name: "programmeId",
      label: "Related programme (optional)",
      options: [
        { value: "", label: "— None —" },
        ...programmeRows.map((p) => ({ value: p.id, label: p.name })),
      ],
    },
  ];

  const items: AdminRow[] = rows.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: [CATEGORY_LABEL[s.category] ?? s.category, s.authorName]
      .filter(Boolean)
      .join(" · "),
    thumb: s.coverImageUrl,
    published: s.published ?? false,
    values: {
      title: s.title,
      category: s.category,
      coverImageUrl: s.coverImageUrl ?? "",
      authorName: s.authorName ?? "",
      excerpt: s.excerpt ?? "",
      body: s.body ?? "",
      programmeId: s.programmeId ?? "",
    },
  }));

  return (
    <ResourceManager
      singular="Story"
      fields={fields}
      items={items}
      actions={{ save, remove, togglePublish, move }}
      canReorder={false}
    />
  );
}
