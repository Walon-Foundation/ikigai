import { desc, eq } from "drizzle-orm";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { eventAttendance, events, users } from "@/db/schema";
import { remove, save, setAttendanceStatus, togglePublish } from "./actions";
import { AttendanceList } from "./attendance-list";

// Format a Date for a datetime-local input ("YYYY-MM-DDTHH:mm"), in local time.
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const FIELDS: Field[] = [
  { type: "text", name: "title", label: "Title", required: true },
  { type: "datetime", name: "startsAt", label: "Starts", required: true },
  {
    type: "datetime",
    name: "endsAt",
    label: "Ends (optional — volunteering/joining blocked after this)",
  },
  { type: "text", name: "location", label: "Location" },
  {
    type: "lines",
    name: "interestTags",
    label: "Interest tags, one per line",
    help: "Mentees whose interests match any of these are notified once, when the event becomes public.",
  },
  { type: "image", name: "imageUrl", label: "Event image" },
  {
    type: "checkbox",
    name: "allowVolunteer",
    label:
      "Allow volunteering (uncheck to block volunteer sign-ups even if date is future)",
    defaultChecked: true,
  },
  {
    type: "checkbox",
    name: "allowJoin",
    label:
      "Allow joining / registration (uncheck to close registration even if date is future)",
    defaultChecked: true,
  },
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
  const [rows, attendanceRows] = await Promise.all([
    db.select().from(events).orderBy(desc(events.startsAt)),
    db
      .select({
        id: eventAttendance.id,
        eventId: eventAttendance.eventId,
        status: eventAttendance.status,
        userName: users.displayName,
        userEmail: users.email,
      })
      .from(eventAttendance)
      .leftJoin(users, eq(eventAttendance.userId, users.id)),
  ]);

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
      e.endsAt
        ? `ends ${e.endsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
        : null,
      e.location,
      e.allowVolunteer === false ? "volunteering closed" : null,
      e.allowJoin === false ? "join closed" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    thumb: e.imageUrl,
    published: e.isPublic ?? false,
    values: {
      title: e.title,
      startsAt: toLocalInput(e.startsAt),
      endsAt: toLocalInput(e.endsAt as Date | null),
      location: e.location ?? "",
      imageUrl: e.imageUrl ?? "",
      interestTags: (e.interestTags ?? []).join("\n"),
      allowVolunteer: e.allowVolunteer === false ? "" : "true",
      allowJoin: e.allowJoin === false ? "" : "true",
      reportSummary: e.reportSummary ?? "",
      reportPartners: e.reportPartners ?? "",
      reportImpact: e.reportImpact ?? "",
    },
  }));

  const attendanceByEvent = new Map<string, typeof attendanceRows>();
  for (const a of attendanceRows) {
    const list = attendanceByEvent.get(a.eventId) ?? [];
    list.push(a);
    attendanceByEvent.set(a.eventId, list);
  }

  return (
    <div className="space-y-8">
      <ResourceManager
        singular="Event"
        fields={FIELDS}
        items={items}
        actions={{ save, togglePublish, remove }}
        canReorder={false}
        canDelete={true}
        publishLabel={{ on: "Public", off: "Hidden" }}
      />

      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Attendance — who RSVP&apos;d
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          RSVPs from the app (mentee/mentor). Change status to mark attended / no-show. Deleting the event above also removes its RSVPs.
        </p>
        <AttendanceList
          rows={rows}
          attendanceByEvent={attendanceByEvent}
          setAttendanceStatus={setAttendanceStatus}
        />
      </div>
    </div>
  );
}
