// Shared journal rules used by both the client (live "Are you okay?" warning)
// and the server action (authoritative safety flag + validation). No
// "server-only" guard: the client imports CONCERN_KEYWORDS / flagsConcern for
// the in-editor warning, while the server independently recomputes the flag so
// a tampered request cannot suppress it.

export const JOURNAL_VISIBILITIES = [
  "private",
  "mentor_only",
  "community",
] as const;
export type JournalVisibility = (typeof JOURNAL_VISIBILITIES)[number];

export function isJournalVisibility(
  value: unknown,
): value is JournalVisibility {
  return (
    typeof value === "string" &&
    (JOURNAL_VISIBILITIES as readonly string[]).includes(value)
  );
}

// A single entry is capped to keep storage bounded and reject abusive payloads.
export const MAX_JOURNAL_LENGTH = 10_000;

const CONCERN_KEYWORDS = ["hurt myself", "end it", "give up", "no reason to"];

// Crisis-language detector. The server treats its result as authoritative and
// never trusts a client-supplied flag.
export function flagsConcern(text: string): boolean {
  const lower = text.toLowerCase();
  return CONCERN_KEYWORDS.some((kw) => lower.includes(kw));
}
