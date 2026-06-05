import { desc, eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { journalEntries, users } from "@/db/schema";

function fmt(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminSafeguardingPage() {
  const flagged = await db
    .select({
      id: journalEntries.id,
      content: journalEntries.content,
      visibility: journalEntries.visibility,
      createdAt: journalEntries.createdAt,
      authorId: users.id,
      authorName: users.displayName,
      authorEmail: users.email,
    })
    .from(journalEntries)
    .leftJoin(users, eq(journalEntries.userId, users.id))
    .where(eq(journalEntries.keywordFlag, true))
    .orderBy(desc(journalEntries.createdAt));

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-3xl font-black text-foreground">
          Safeguarding Alerts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Journal entries flagged for concerning language. Review with care.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <ShieldAlert className="size-5 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">
          These entries contain sensitive personal content surfaced for youth
          safety. Access is limited to administrators — handle confidentially
          and follow your safeguarding escalation process.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          Flagged Entries
        </h2>
        {flagged.length > 0 && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            {flagged.length}
          </span>
        )}
      </div>

      {flagged.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No flagged entries — all clear ✓
        </div>
      ) : (
        <div className="space-y-4">
          {flagged.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-destructive/30 bg-card p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {entry.authorId ? (
                    <Link
                      href={`/admin/users/${entry.authorId}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {entry.authorName ?? "Unknown user"}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground">
                      Unknown user
                    </span>
                  )}
                  {entry.authorEmail && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {entry.authorEmail}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {fmt(entry.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm text-foreground">
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
