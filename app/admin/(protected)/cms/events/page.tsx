import { desc } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { events } from "@/db/schema";
import { remove, save, togglePublish } from "./actions";

// Format a Date for a datetime-local input ("YYYY-MM-DDTHH:mm"), in local time.
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const FIELDS: Field[] = [
  { type: "text", name: "title", label: "Title", required: true },
  { type: "datetime", name: "startsAt", label: "Starts", required: true },
  { type: "text", name: "location", label: "Location" },
  { type: "image", name: "imageUrl", label: "Event image" },
  {
    type: "textarea",
    name: "reportSummary",
    label: "Report summary (after the event)",
    rows: 5,
  },
  { type: "text", name: "reportPartners", label: "Partners involved" },
  { type: "text", name: "reportImpact", label: "Impact (e.g. '120 attended')" },
];

export default async function EventsCmsPage() {
  const rows = await db.select().from(events).orderBy(desc(events.startsAt));

  const items: AdminRow[] = rows.map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: [
      e.startsAt
        ? e.startsAt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null,
      e.location,
    ]
      .filter(Boolean)
      .join(" · "),
    thumb: e.imageUrl,
    published: e.isPublic ?? false,
    values: {
      title: e.title,
      startsAt: toLocalInput(e.startsAt),
      location: e.location ?? "",
      imageUrl: e.imageUrl ?? "",
      reportSummary: e.reportSummary ?? "",
      reportPartners: e.reportPartners ?? "",
      reportImpact: e.reportImpact ?? "",
    },
  }));

  return (
    <>
      <p className="mb-4 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        Events created here are public. Events created in the main Events admin
        stay internal to the app until you make them public here. Attendance and
        deletion live on that screen.
      </p>
      <ResourceManager
        singular="Event"
        fields={FIELDS}
        items={items}
        actions={{ save, togglePublish, remove }}
        canReorder={false}
        canDelete={false}
        publishLabel={{ on: "Public", off: "Hidden" }}
      />
    </>
  );
}
