import { and, desc, eq } from "drizzle-orm";
import { Mail } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { enquiries } from "@/db/schema";
import { StatusControl } from "./status-control";

const TYPE_LABEL: Record<string, string> = {
  volunteer: "Volunteer",
  mentor: "Mentor",
  partner: "Partner",
  programme: "Programme",
  contact: "Contact",
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "handled", label: "Handled" },
];

function fmt(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status, type } = await searchParams;

  const conditions = [
    status ? eq(enquiries.status, status) : undefined,
    type ? eq(enquiries.type, type) : undefined,
  ].filter(Boolean);

  const rows = await db
    .select()
    .from(enquiries)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(enquiries.createdAt))
    .limit(200);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-foreground">
          Enquiries
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything submitted through the public website’s forms.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const href = f.key
            ? `/admin/enquiries?status=${f.key}`
            : "/admin/enquiries";
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key}
              href={href}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No enquiries yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((e) => {
            const details = (e.details ?? {}) as Record<string, unknown>;
            const detailEntries = Object.entries(details).filter(
              ([, v]) => v != null && String(v).trim() !== "",
            );
            return (
              <div
                key={e.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {TYPE_LABEL[e.type] ?? e.type}
                      </span>
                      <p className="font-semibold text-foreground">{e.name}</p>
                    </div>
                    <a
                      href={`mailto:${e.email}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Mail className="size-3" />
                      {e.email}
                    </a>
                    {e.phone && (
                      <span className="ml-3 text-sm text-muted-foreground">
                        {e.phone}
                      </span>
                    )}
                    {e.organization && (
                      <span className="ml-3 text-sm text-muted-foreground">
                        {e.organization}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {fmt(e.createdAt)}
                    </span>
                    <StatusControl id={e.id} status={e.status} />
                  </div>
                </div>

                {e.message && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                    {e.message}
                  </p>
                )}

                {detailEntries.length > 0 && (
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {detailEntries.map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="font-medium capitalize text-muted-foreground">
                          {k.replace(/([A-Z])/g, " $1")}:
                        </dt>
                        <dd className="text-foreground">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
