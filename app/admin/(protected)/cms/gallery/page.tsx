import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { galleryItems, programmes } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

export default async function GalleryCmsPage() {
  const [rows, programmeRows] = await Promise.all([
    db
      .select()
      .from(galleryItems)
      .orderBy(asc(galleryItems.album), asc(galleryItems.orderIndex)),
    db.select().from(programmes).orderBy(programmes.name),
  ]);

  const fields: Field[] = [
    {
      type: "text",
      name: "album",
      label: "Album",
      required: true,
      placeholder: "PadHer Initiative",
    },
    { type: "image", name: "imageUrl", label: "Photo" },
    { type: "text", name: "caption", label: "Caption (optional)" },
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

  const items: AdminRow[] = rows.map((g) => ({
    id: g.id,
    title: g.caption || g.album,
    subtitle: g.album,
    thumb: g.imageUrl,
    published: g.published ?? false,
    values: {
      album: g.album,
      imageUrl: g.imageUrl,
      caption: g.caption ?? "",
      programmeId: g.programmeId ?? "",
    },
  }));

  return (
    <ResourceManager
      singular="Photo"
      fields={fields}
      items={items}
      actions={{ save, remove, togglePublish, move }}
    />
  );
}
