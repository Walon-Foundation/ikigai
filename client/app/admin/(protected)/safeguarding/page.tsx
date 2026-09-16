import { desc, eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { db } from "@/db/db";
import { journalEntries, messages, users } from "@/db/schema";

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

// flagsConcern() runs in three places — journal entries (journal/actions.ts),
// direct messages (api/messages/route.ts) and group posts (groups/actions.ts) —
// and writes journal_entries.keyword_flag or messages.keyword_flag. This page
// used to read only the first of those. Nothing in the codebase read
// messages.keyword_flag at all, so a mentee who typed "I want to hurt myself"
// to their mentor was flagged in the database and no administrator ever saw
// it: the row was written, and this queue kept rendering "all clear ✓". The
// reassuring empty state was the most dangerous part — it asserted that
// nothing had been flagged, when what it actually meant was that nothing from
// one of the three sources had been.
//
// Both sources are now unioned into one queue. It stays a single list rather
// than tabs or per-source sections on purpose: this is triage, and the
// question a reviewer is answering is "what has come in since I last looked",
// not "what has come in via messages". Splitting it would let a whole source
// sit unread behind a tab — which is the failure being fixed here.
type FlaggedSource = "journal" | "dm" | "group";

type FlaggedRow = {
  key: string;
  source: FlaggedSource;
  content: string;
  createdAt: Date | null;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
};

const SOURCE_LABELS: Record<FlaggedSource, string> = {
  journal: "Journal entry",
  dm: "Direct message",
  group: "Group post",
};

export default async function AdminSafeguardingPage() {
  // Two independent tables, so two queries rather than a SQL UNION: the row
  // shapes differ, the volumes here are small (only keyword_flag rows), and
  // merging in JS keeps the source labelling honest and readable. Run in
  // parallel — neither depends on the other.
  const [flaggedJournal, flaggedMessages] = await Promise.all([
    db
      .select({
        id: journalEntries.id,
        content: journalEntries.content,
        createdAt: journalEntries.createdAt,
        authorId: users.id,
        authorName: users.displayName,
        authorEmail: users.email,
      })
      .from(journalEntries)
      .leftJoin(users, eq(journalEntries.userId, users.id))
      .where(eq(journalEntries.keywordFlag, true))
      .orderBy(desc(journalEntries.createdAt)),
    db
      .select({
        id: messages.id,
        content: messages.content,
        // A message belongs to either a mentorship or a group (see schema), so
        // a null groupId is what distinguishes a 1:1 message to a mentor from
        // a post in a group. That distinction matters to whoever picks this
        // up: a DM was said privately to one trusted adult, a group post was
        // said in front of peers, and those are different conversations to
        // have with the young person.
        groupId: messages.groupId,
        createdAt: messages.createdAt,
        authorId: users.id,
        authorName: users.displayName,
        authorEmail: users.email,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.keywordFlag, true))
      .orderBy(desc(messages.createdAt)),
  ]);

  const flagged: FlaggedRow[] = [
    ...flaggedJournal.map((row) => ({
      // Ids are uuids from two different tables; prefixing keeps React keys
      // unique in the merged list without relying on cross-table uniqueness.
      key: `journal:${row.id}`,
      source: "journal" as const,
      content: row.content,
      createdAt: row.createdAt,
      authorId: row.authorId,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
    })),
    ...flaggedMessages.map((row) => ({
      key: `message:${row.id}`,
      source: (row.groupId ? "group" : "dm") as FlaggedSource,
      content: row.content,
      createdAt: row.createdAt,
      authorId: row.authorId,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
    })),
    // Newest first across both sources. Rows with no timestamp sort last
    // rather than being dropped — a flagged row with a missing createdAt still
    // has to be seen.
  ].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  );

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-3xl font-black text-foreground">
          Safeguarding Alerts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Journal entries, direct messages and group posts flagged for
          concerning language. Review with care.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <ShieldAlert className="size-5 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">
          These entries contain sensitive personal content surfaced for youth
          safety — including private messages the sender wrote to one person.
          Access is limited to administrators — handle confidentially and follow
          your safeguarding escalation process.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          Flagged Content
        </h2>
        {flagged.length > 0 && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            {flagged.length}
          </span>
        )}
      </div>

      {flagged.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No flagged content — all clear ✓
        </div>
      ) : (
        <div className="space-y-4">
          {flagged.map((entry) => (
            <div
              key={entry.key}
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
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {SOURCE_LABELS[entry.source]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmt(entry.createdAt)}
                  </span>
                </div>
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
