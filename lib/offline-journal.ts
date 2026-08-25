// The offline journal queue: journal entries a mentee wrote while the network
// was down, parked in IndexedDB until they can be posted to the server.
//
// READ THIS BEFORE CHANGING ANYTHING HERE. What this file stores is the single
// most sensitive payload in the product: the full plaintext of a young person's
// private journal entry, sitting unencrypted on a phone, alongside
// `keywordFlag` — the safeguarding heuristic's verdict on it. A queued record
// can quite literally be `{ content: "<a teenager's account of self-harm>",
// keywordFlag: true }`.
//
// And the devices are shared. Ikigai is used in Freetown and the Western Rural
// Area on family phones, school computer labs and friends' handsets. Assume
// that between one mentee writing an entry and the next page load, a different
// person — a sibling, a classmate, a parent, a stranger — has the device. Two
// things follow, and both of them are the reason this module exists rather
// than a few `openDB` calls inline in the journal component:
//
//   1. DISCLOSURE. Clerk's `signOut()` clears Clerk's cookies. It does not
//      touch IndexedDB, and nothing else did either — so an entry queued while
//      offline, by a user who signed out before reconnecting, stayed readable
//      on that device forever. `clearOfflineJournal()` (called by
//      `signOutAndClearOfflineJournal()`) is what makes signing out actually
//      mean something.
//
//   2. MIS-ATTRIBUTION, which is worse. `saveJournalEntry()` resolves the
//      author from the *current* Clerk session — the queue carries no author of
//      its own. So if user A queued an entry and signed out, and user B signed
//      in on the same handset, the sync loop on B's next visit to /journal
//      would post A's private entry into B's journal. A silently loses a
//      private entry to someone else's account; B sees words they never wrote;
//      and where `keywordFlag` is true, a safeguarding signal about one child
//      gets attached to a different child. That is the failure that makes an
//      adult go and check on the wrong kid.
//
// `ownerId` on every record is the fix for (2), and it is deliberately belt AND
// braces with (1): sign-out clearing can be missed — the tab is killed
// mid-sign-out, the delete is blocked by another open tab, the browser drops
// the write — and the owner check still holds in every one of those cases. If
// you are here to "simplify" by dropping `ownerId` because sign-out already
// clears the store, you are removing the half of this that works when the
// other half doesn't. Don't.

import { deleteDB, openDB } from "idb";
import type { JournalVisibility } from "@/lib/journal";

export const OFFLINE_JOURNAL_DB = "ikigai-journal";
export const OFFLINE_JOURNAL_STORE = "pending-entries";

// v1 records had no `ownerId`. The v2 upgrade drops the store rather than
// migrating them: an entry with no author cannot be safely attributed to
// anyone, and guessing "it's probably whoever is signed in now" is exactly the
// mis-attribution bug this version exists to close. Losing an unsynced draft is
// bad; posting a child's private words into another child's journal is worse.
const OFFLINE_JOURNAL_DB_VERSION = 2;

// An entry that has failed to sync for a week is not going to sync — the user
// has moved on, reinstalled, or the write was rejected outright. Past that
// point it is no longer a pending draft, just plaintext liability sitting on a
// shared device, so reads drop it.
export const PENDING_ENTRY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type PendingJournalEntry = {
  id: string;
  /**
   * Clerk user id of the person who wrote this. Checked against the live
   * session before the entry is ever displayed or synced — see the file header.
   */
  ownerId: string;
  content: string;
  visibility: JournalVisibility;
  /** Display-only. The server recomputes the authoritative flag on sync. */
  keywordFlag: boolean;
  /** ISO timestamp; drives the 7-day expiry above. */
  createdAt: string;
};

/** Structurally matches Clerk's `signOut` without importing its internal type. */
type SignOutOptionsLike = { sessionId?: string; redirectUrl?: string };
type SignOutLike = (options?: SignOutOptionsLike) => Promise<unknown>;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

/**
 * Runs `fn` against the queue database and always closes the connection.
 *
 * Closing matters: `clearOfflineJournal()` deletes the whole database, and
 * IndexedDB blocks a delete for as long as any connection is open. A cached
 * long-lived handle would mean sign-out silently failing to clear the queue on
 * the one screen where the queue actually has something in it.
 *
 * Returns `fallback` when IndexedDB is unavailable (SSR, private-mode quirks,
 * a browser with storage disabled) rather than throwing — an unusable queue
 * must degrade to "no offline drafts", never to a broken journal page.
 */
async function withJournalDB<T>(
  fn: (db: Awaited<ReturnType<typeof openJournalDB>>) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!hasIndexedDB()) return fallback;
  let db: Awaited<ReturnType<typeof openJournalDB>> | undefined;
  try {
    db = await openJournalDB();
    return await fn(db);
  } catch {
    return fallback;
  } finally {
    db?.close();
  }
}

function openJournalDB() {
  return openDB(OFFLINE_JOURNAL_DB, OFFLINE_JOURNAL_DB_VERSION, {
    upgrade(db, oldVersion) {
      // Pre-owner records are discarded, not migrated. See the version comment.
      if (
        oldVersion < 2 &&
        db.objectStoreNames.contains(OFFLINE_JOURNAL_STORE)
      ) {
        db.deleteObjectStore(OFFLINE_JOURNAL_STORE);
      }
      if (!db.objectStoreNames.contains(OFFLINE_JOURNAL_STORE)) {
        db.createObjectStore(OFFLINE_JOURNAL_STORE, { keyPath: "id" });
      }
    },
  });
}

function isExpired(entry: PendingJournalEntry, now: number): boolean {
  const created = Date.parse(entry.createdAt);
  // An unparseable timestamp is treated as expired: we cannot show the user how
  // old it is, and an entry we cannot reason about should not linger on a
  // shared device.
  if (Number.isNaN(created)) return true;
  return now - created > PENDING_ENTRY_MAX_AGE_MS;
}

/** Queues one entry for later sync. Silently no-ops if IndexedDB is unusable. */
export async function queuePendingEntry(
  entry: PendingJournalEntry,
): Promise<void> {
  await withJournalDB(async (db) => {
    await db.put(OFFLINE_JOURNAL_STORE, entry);
  }, undefined);
}

/**
 * Every queued entry belonging to `ownerId`, newest first, with expired records
 * purged on the way past.
 *
 * Records belonging to someone else are filtered out but deliberately NOT
 * deleted here: they are another account's unsynced writing, and this session
 * has no business destroying it. Sign-out is what clears the store; until then
 * they stay invisible and unsyncable, which is the safe state.
 */
export async function readPendingEntries(
  ownerId: string,
): Promise<PendingJournalEntry[]> {
  return withJournalDB<PendingJournalEntry[]>(async (db) => {
    const all = (await db.getAll(
      OFFLINE_JOURNAL_STORE,
    )) as PendingJournalEntry[];
    const now = Date.now();
    const mine: PendingJournalEntry[] = [];

    for (const entry of all) {
      // A v1 leftover that somehow survived the upgrade has no owner and cannot
      // be attributed — drop it rather than guess.
      if (!entry?.ownerId || isExpired(entry, now)) {
        await db.delete(OFFLINE_JOURNAL_STORE, entry.id).catch(() => {});
        continue;
      }
      if (entry.ownerId === ownerId) mine.push(entry);
    }

    return mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, []);
}

/** Removes one queued entry — after a successful sync, or when it is dropped. */
export async function discardPendingEntry(id: string): Promise<void> {
  await withJournalDB(async (db) => {
    await db.delete(OFFLINE_JOURNAL_STORE, id);
  }, undefined);
}

/**
 * Wipes the offline journal queue off this device.
 *
 * Two passes, because a single one is not reliable enough for data this
 * sensitive. `clear()` empties the store inside an ordinary transaction, which
 * succeeds even if another tab has the database open; `deleteDB()` then removes
 * the database itself so nothing remains in the browser's storage inspector —
 * but it *blocks* while any other connection is open, so it races a short
 * timeout. Whatever happens, the rows are already gone from the first pass.
 *
 * Never throws. A failed wipe must not strand someone in a session they asked
 * to leave — see `signOutAndClearOfflineJournal()`.
 */
export async function clearOfflineJournal(): Promise<void> {
  if (!hasIndexedDB()) return;

  await withJournalDB(async (db) => {
    await db.clear(OFFLINE_JOURNAL_STORE);
  }, undefined);

  try {
    await Promise.race([
      deleteDB(OFFLINE_JOURNAL_DB, {
        // Another tab is holding the database open. Nothing useful to do from
        // here — the store is already empty — so let the race time out.
        blocked() {},
      }),
      new Promise((resolve) => setTimeout(resolve, 1_500)),
    ]);
  } catch {
    // Best effort. The `clear()` above is the pass that actually has to work.
  }
}

/**
 * The only way this app should sign a user out.
 *
 * Clears the offline journal queue first, then hands off to Clerk with the
 * caller's own options (each surface has its own `redirectUrl`, and those are
 * passed straight through). Clearing is awaited so the wipe is not racing a
 * navigation, but it can never block the sign-out itself: `clearOfflineJournal`
 * swallows its own failures, and this belt-and-braces catch covers anything it
 * somehow doesn't. A user tapping "Sign out" on a borrowed phone must end up
 * signed out even if the browser's storage layer is having a bad day.
 *
 * Every sign-out call site in the app routes through here so the five of them
 * cannot drift apart — one of them quietly forgetting to clear is precisely the
 * bug this replaced.
 */
export async function signOutAndClearOfflineJournal(
  signOut: SignOutLike,
  options?: SignOutOptionsLike,
): Promise<void> {
  try {
    await clearOfflineJournal();
  } catch {
    // Never block sign-out on storage cleanup.
  }
  await signOut(options);
}
