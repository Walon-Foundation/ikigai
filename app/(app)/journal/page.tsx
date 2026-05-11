import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { journalEntries } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { JournalClient } from "./journal-client";

type Visibility = "private" | "mentor_only" | "community";

export default async function JournalPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, user.id))
    .orderBy(desc(journalEntries.createdAt))
    .limit(50);

  return (
    <JournalClient
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
