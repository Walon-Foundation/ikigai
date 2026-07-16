import { desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { journalEntries } from "@/db/schema";
import { requireRole } from "@/lib/db-user";
import { JournalClient } from "./journal-client";

type Visibility = "private" | "mentor_only" | "community";

export default async function JournalPage() {
  const user = await requireRole(["mentee"]);

  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, user.id))
    .orderBy(desc(journalEntries.createdAt))
    .limit(50);

  // The mentee's setting decides what a new entry starts as. This used to be
  // hard-coded to "private" in the client while the settings toggle claimed to
  // control it.
  const defaultVisibility = (user.journalDefaultVisibility ??
    "private") as Visibility;

  return (
    <JournalClient
      defaultVisibility={defaultVisibility}
      initialEntries={entries.map((e) => ({
        id: e.id,
        content: e.content,
        visibility: (e.visibility ?? "private") as Visibility,
        keywordFlag: e.keywordFlag ?? false,
        createdAt: e.createdAt?.toISOString() ?? new Date().toISOString(),
      }))}
    />
  );
}
