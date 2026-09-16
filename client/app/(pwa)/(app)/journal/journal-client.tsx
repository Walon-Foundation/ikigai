"use client";

import { useAuth } from "@clerk/nextjs";
import {
  AlertTriangle,
  CloudOff,
  Globe,
  Lock,
  Users,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { BusyLabel } from "@/components/spinner";
import {
  flagsConcern,
  type JournalVisibility,
  MAX_JOURNAL_LENGTH,
} from "@/lib/journal";
import {
  discardPendingEntry,
  type PendingJournalEntry,
  queuePendingEntry,
  readPendingEntries,
} from "@/lib/offline-journal";
import { cn } from "@/lib/utils";
import { saveJournalEntry } from "./actions";

type Visibility = JournalVisibility;

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "private", label: "Private", icon: Lock },
  { value: "mentor_only", label: "Mentor Only", icon: Users },
  { value: "community", label: "Community", icon: Globe },
];

type Entry = {
  id: string;
  content: string;
  visibility: Visibility;
  keywordFlag: boolean;
  createdAt: string;
};

// What actually gets rendered in the list: either an entry the server has, or
// one still sitting in the offline queue. The queue used to be invisible —
// entries written offline showed once, optimistically, then vanished on the
// next load until a sync happened, which reads to a mentee as "the app ate what
// I wrote". They are now shown with a "Waiting to sync" badge and swapped for
// the real thing once they land.
type ListItem = Entry & { pending: boolean };

/**
 * Did this failure mean "the request never reached the server", or "the server
 * looked at it and said no"?
 *
 * It matters, because the old code treated every throw as offline and told the
 * user "Saved offline — will sync when connected" even when the server had
 * rejected the entry outright. Nothing was queued that could ever succeed, and
 * the mentee was told the opposite.
 *
 * `fetch()` rejects with a TypeError when the request never got a response, and
 * that is what a dropped connection looks like from here. A server action that
 * throws comes back as a plain Error instead (carrying a `digest` in
 * production, where Next.js masks the message), so it does not match and is
 * surfaced as a real failure. `navigator.onLine` is checked first because it is
 * the one unambiguous signal we have — false means there is no network at all.
 */
function isNetworkFailure(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return error instanceof TypeError;
}

export function JournalClient({
  initialEntries,
  defaultVisibility,
}: {
  initialEntries: Entry[];
  defaultVisibility: Visibility;
}) {
  // The journal page gets its entries from the server but not the viewer's id,
  // and the offline queue has to stamp an owner on every record it writes (see
  // lib/offline-journal.ts for why). Clerk's client hook is the source of that
  // id without touching the server component's props.
  const { userId, isLoaded: isAuthLoaded } = useAuth();

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [pending, setPending] = useState<PendingJournalEntry[]>([]);
  const [newContent, setNewContent] = useState("");
  // Seeded from the mentee's setting rather than hard-coded to "private".
  const [visibility, setVisibility] = useState<Visibility>(defaultVisibility);
  const [showWarning, setShowWarning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Track online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // On mount + on coming back online: load this user's queue and try to sync it.
  //
  // Everything here is scoped to `userId`. `readPendingEntries` only ever
  // returns records stamped with the signed-in user's id, so an entry queued by
  // whoever used this handset before is neither displayed nor posted — it used
  // to be posted, straight into the current user's journal, safeguarding flag
  // and all. Nothing runs until Clerk has resolved the session, because syncing
  // against an unknown owner is the whole bug.
  useEffect(() => {
    if (!isAuthLoaded || !userId) return;
    let cancelled = false;

    async function syncPending() {
      if (!userId) return;
      const queued = await readPendingEntries(userId);
      if (cancelled) return;
      setPending(queued);

      if (!navigator.onLine) return;

      for (const entry of queued) {
        try {
          await saveJournalEntry({
            content: entry.content,
            visibility: entry.visibility,
            // Restated to the server so the owner rule is enforced somewhere the
            // client cannot skip. readPendingEntries already filters to this
            // session; this is the same check made unbypassable.
            expectedOwnerId: entry.ownerId,
          });
        } catch (error) {
          // A genuine network failure means "try again later" — leave it
          // queued. A server rejection means it will never succeed, so drop it
          // rather than retry it on every page load until it expires.
          if (isNetworkFailure(error)) continue;
          await discardPendingEntry(entry.id);
          if (!cancelled) {
            setPending((prev) => prev.filter((p) => p.id !== entry.id));
          }
          continue;
        }

        await discardPendingEntry(entry.id);
        if (cancelled) continue;
        // Move it out of "Waiting to sync" and into the list proper, so the
        // entry does not blink out of existence between syncing and the next
        // server render.
        setPending((prev) => prev.filter((p) => p.id !== entry.id));
        setEntries((prev) =>
          prev.some((e) => e.id === entry.id)
            ? prev
            : [
                {
                  id: entry.id,
                  content: entry.content,
                  visibility: entry.visibility,
                  keywordFlag: entry.keywordFlag,
                  createdAt: entry.createdAt,
                },
                ...prev,
              ],
        );
      }
    }

    syncPending();
    window.addEventListener("online", syncPending);
    return () => {
      cancelled = true;
      window.removeEventListener("online", syncPending);
    };
  }, [userId, isAuthLoaded]);

  const handleContentChange = useCallback((val: string) => {
    setNewContent(val);
    setShowWarning(flagsConcern(val));
    setSaveError(null);
  }, []);

  function handleSave() {
    if (!newContent.trim() || isPending) return;
    const content = newContent.trim();
    const keywordFlag = flagsConcern(content);

    // Checked here as well as on the server so an over-long entry is named as
    // such, with the text still in the box, instead of being reported as a
    // network problem and queued for a sync that would be rejected again.
    if (content.length > MAX_JOURNAL_LENGTH) {
      setSaveError(
        `That entry is a bit too long — please shorten it to under ${MAX_JOURNAL_LENGTH.toLocaleString()} characters.`,
      );
      return;
    }

    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Entry = {
      id: optimisticId,
      content,
      visibility,
      keywordFlag,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setEntries((prev) => [optimistic, ...prev]);
    setNewContent("");
    setShowWarning(false);
    setSaveError(null);

    startTransition(async () => {
      try {
        await saveJournalEntry({ content, visibility });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        // The optimistic card comes back out either way: if this queued, it
        // reappears below as "Waiting to sync"; if the server refused it, the
        // text goes back in the box so nothing the mentee wrote is lost.
        setEntries((prev) => prev.filter((e) => e.id !== optimisticId));

        if (!isNetworkFailure(error) || !userId) {
          setNewContent(content);
          setShowWarning(flagsConcern(content));
          setSaveError(
            userId
              ? "Couldn't save that entry. Please check it and try again."
              : "Couldn't save that entry — you may have been signed out. Please sign in and try again.",
          );
          return;
        }

        const queued: PendingJournalEntry = {
          ...optimistic,
          // Stamped with the author now, while we still know who it is. This is
          // what stops the entry being posted into the next person's journal if
          // they sign in on this device before it syncs.
          ownerId: userId,
        };
        await queuePendingEntry(queued);
        setPending((prev) => [queued, ...prev]);
        setOfflineSaved(true);
        setTimeout(() => setOfflineSaved(false), 4000);
      }
    });
  }

  // Queued entries sit above saved ones — they are the most recent thing
  // written, and the most useful thing to be able to see is still there.
  const listItems: ListItem[] = [
    ...pending.map((p) => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      keywordFlag: p.keywordFlag,
      createdAt: p.createdAt,
      pending: true,
    })),
    ...entries.map((e) => ({ ...e, pending: false })),
  ];

  return (
    <>
      <PageHeader title="Journal" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Offline banner */}
        {!isOnline && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-accent-pale px-4 py-2.5 text-sm font-medium text-earth-ink">
            <WifiOff className="size-4 shrink-0" />
            You&apos;re offline — entries will sync automatically when you
            reconnect.
          </div>
        )}

        {/* Offline-saved toast */}
        {offlineSaved && (
          <div className="mb-4 rounded-xl bg-accent-pale px-4 py-2.5 text-sm font-medium text-earth-ink">
            Saved offline — will sync when connected.
          </div>
        )}

        {/* New Entry */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">
            New Entry
          </p>
          <textarea
            value={newContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="What's on your mind today?"
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
          />

          {/* Inline, next to the text it is about — the entry is still in the
              box and needs editing, so a toast on another corner of the screen
              would be the wrong place for this. */}
          {saveError && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {saveError}
            </p>
          )}

          {showWarning && (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-earth/30 bg-earth-light/10 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-earth" />
              <div>
                <p className="text-sm font-semibold text-earth">
                  Are you okay?
                </p>
                <p className="text-xs text-muted-foreground">
                  It sounds like you might be going through something difficult.{" "}
                  <a href="/safety/help" className="underline text-primary">
                    View crisis resources
                  </a>
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVisibility(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  visibility === opt.value
                    ? "border-primary bg-primary-muted/20 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <opt.icon className="size-3" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!newContent.trim() || isPending}
              aria-busy={isPending}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              <BusyLabel pending={isPending} busy="Saving…">
                {saved
                  ? "Saved"
                  : offlineSaved
                    ? "Saved offline"
                    : "Save Entry"}
              </BusyLabel>
            </button>
            {newContent && (
              <button
                type="button"
                onClick={() => {
                  setNewContent("");
                  setShowWarning(false);
                  setSaveError(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Past Entries */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Past Entries
          </p>
          {listItems.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No entries yet. Start writing above.
            </div>
          ) : (
            <div className="space-y-3">
              {listItems.map((entry) => {
                const visOpt = VISIBILITY_OPTIONS.find(
                  (v) => v.value === entry.visibility,
                );
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "rounded-2xl border bg-card p-5",
                      entry.pending
                        ? "border-dashed border-earth/40"
                        : "border-border",
                    )}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span>·</span>
                      {visOpt && (
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                          <visOpt.icon className="size-2.5" />
                          {visOpt.label}
                        </span>
                      )}
                      {entry.keywordFlag && (
                        <span className="flex items-center gap-1 rounded-full bg-earth-light/20 px-2 py-0.5 text-earth">
                          <AlertTriangle className="size-2.5" />
                          Flagged
                        </span>
                      )}
                      {entry.pending && (
                        <span className="flex items-center gap-1 rounded-full bg-accent-pale px-2 py-0.5 font-medium text-earth-ink">
                          <CloudOff className="size-2.5" />
                          Waiting to sync
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {entry.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
