import { asc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { pillars, programmes } from "@/db/schema";
import { move, remove, save, togglePublish } from "./actions";

function toLines(value: unknown): string {
  return Array.isArray(value) ? value.join("\n") : "";
}

// Format a Date for datetime-local input ("YYYY-MM-DDTHH:mm"), in local time.
function toLocalInput(date: Date | null | undefined): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function ProgrammesCmsPage() {
  const [rows, pillarRows] = await Promise.all([
    db.select().from(programmes).orderBy(asc(programmes.orderIndex)),
    db.select().from(pillars).orderBy(asc(pillars.orderIndex)),
  ]);

  const pillarName = new Map(pillarRows.map((p) => [p.id, p.name]));

  const fields: Field[] = [
    {
      type: "text",
      name: "name",
      label: "Name",
      required: true,
      placeholder: "PadHer Initiative",
    },
    {
      type: "select",
      name: "pillarId",
      label: "Pillar",
      options: [
        { value: "", label: "— No pillar —" },
        ...pillarRows.map((p) => ({ value: p.id, label: p.name })),
      ],
    },
    { type: "text", name: "summary", label: "Summary (card one-liner)" },
    { type: "image", name: "heroImageUrl", label: "Hero image" },
    {
      type: "textarea",
      name: "about",
      label: "About (why it exists)",
      rows: 4,
    },
    {
      type: "lines",
      name: "objectives",
      label: "Objectives",
      help: "One per line — what participants gain.",
    },
    {
      type: "lines",
      name: "activities",
      label: "Activities",
      help: "One per line — what actually happens.",
    },
    {
      type: "text",
      name: "impactValue",
      label: "Impact number",
      placeholder: "2,000+",
    },
    {
      type: "text",
      name: "impactLabel",
      label: "Impact label",
      placeholder: "Girls reached",
    },
    {
      type: "text",
      name: "ctaLabel",
      label: "Button label",
      placeholder: "Join the programme",
    },
    {
      type: "text",
      name: "ctaUrl",
      label: "Button link",
      placeholder: "/get-involved",
    },
    { type: "checkbox", name: "featured", label: "Feature on the homepage" },
    {
      type: "datetime",
      name: "startsAt",
      label: "Starts at (optional — when the programme begins)",
    },
    {
      type: "datetime",
      name: "endsAt",
      label: "Ends at (optional — when it finishes; volunteers blocked after this)",
    },
    {
      type: "checkbox",
      name: "allowVolunteer",
      label: "Allow volunteering / joining (uncheck to close even if date is future)",
      defaultChecked: true,
    },
  ];

  const items: AdminRow[] = rows.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: [
      p.pillarId ? pillarName.get(p.pillarId) : null,
      p.summary,
      p.startsAt
        ? `starts ${p.startsAt.toLocaleDateString("en-GB")}`
        : null,
      p.endsAt ? `ends ${p.endsAt.toLocaleDateString("en-GB")}` : null,
      p.allowVolunteer === false ? "volunteering closed" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    thumb: p.heroImageUrl,
    published: p.published ?? false,
    values: {
      name: p.name,
      pillarId: p.pillarId ?? "",
      summary: p.summary ?? "",
      heroImageUrl: p.heroImageUrl ?? "",
      about: p.about ?? "",
      objectives: toLines(p.objectives),
      activities: toLines(p.activities),
      impactValue: p.impactValue ?? "",
      impactLabel: p.impactLabel ?? "",
      ctaLabel: p.ctaLabel ?? "",
      ctaUrl: p.ctaUrl ?? "",
      featured: p.featured ? "true" : "",
      startsAt: toLocalInput(p.startsAt as Date | null),
      endsAt: toLocalInput(p.endsAt as Date | null),
      // default true when null (backwards-compat), so checkbox checked unless explicitly false
      allowVolunteer: p.allowVolunteer === false ? "" : "true",
    },
  }));

  return (
    <ResourceManager
      singular="Programme"
      fields={fields}
      items={items}
      actions={{ save, remove, togglePublish, move }}
    />
  );
}
