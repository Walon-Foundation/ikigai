// Shared journal rules used by both the client (live "Are you okay?" warning)
// and the server action (authoritative safety flag + validation). No
// "server-only" guard: the client imports flagsConcern for the in-editor
// warning, while the server independently recomputes the flag so a tampered
// request cannot suppress it. (CONCERN_KEYWORDS itself stays module-private —
// the list is a safeguarding tripwire, and there is no reason to hand a
// browser the exact strings it watches for.)

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

// Crisis vocabulary. This list is the entire safeguarding heuristic for the
// platform — it is run over journal entries, direct messages to mentors, and
// group posts — so both the things it misses and the things it over-matches
// have a cost measured in children.
//
// It started as four substrings: "hurt myself", "end it", "give up", "no
// reason to". That missed the plainest ways a young person actually says this
// ("kill myself", "want to die", "end my life"), while two of the four were
// ordinary teenage English — "I give up on this maths homework", "there's no
// reason to go tomorrow" — which floods the queue with noise and trains the
// reviewer to skim. A queue nobody reads carefully is the same as no queue.
//
// So: nothing was deleted, but the two over-broad phrases were lengthened into
// the forms that actually carry crisis meaning ("give up on life", "no reason
// to live" …) rather than dropped, and the explicit phrasings were added.
// Matching is deliberately generous within a phrase — a substring match on the
// stem catches "killing myself" and "want to die" alike — because a false
// positive here costs an adult two minutes of reading and a false negative
// costs far more.
//
// KRIO IS MISSING, AND THAT IS A KNOWN GAP, NOT AN OVERSIGHT.
// Most young people in Freetown and the Western Rural Area write to each other
// in Krio, and a Krio-speaking child in crisis will very often not phrase it in
// English at all — so in practice this list is blind to a large share of the
// people it exists to protect. It is left blind on purpose rather than filled
// in from guesswork: an invented or mistranslated phrase fails in one of two
// ways, and both are harmful. Get it too narrow or simply wrong and a child
// asking for help in their own language is silently not flagged, while the
// admin queue keeps displaying "all clear". Get it too broad — and Krio
// idiom uses "die"/"tayad" constructions in wholly ordinary contexts — and the
// queue fills with false positives until real ones are missed inside it.
// Neither failure is visible from here. These phrasings MUST be added with
// Ikigai's Freetown safeguarding staff and Krio-speaking mentors, who can say
// what young people actually write, and should then be reviewed against real
// flagged volume rather than left to run unchecked.
const CONCERN_KEYWORDS = [
  // Explicit suicidal ideation.
  "kill myself",
  "killing myself",
  "want to die",
  "wanna die",
  "wish i was dead",
  "wish i were dead",
  "end my life",
  "take my own life",
  "suicide",
  "suicidal",
  "not want to live",
  "don't want to live",
  "dont want to live",
  // Self-harm.
  "hurt myself",
  "hurting myself",
  "harm myself",
  "cut myself",
  "cutting myself",
  // Burden / withdrawal language — how this is most often said out loud
  // before it is ever said explicitly.
  "better off without me",
  "nobody would miss me",
  "no one would miss me",
  "everyone would be better off",
  "want to disappear",
  "tired of living",
  "can't go on",
  "cant go on",
  // Original phrases kept, but narrowed to the forms that carry crisis
  // meaning. Bare "give up" and "no reason to" matched homework and bus
  // timetables; these do not.
  // "end it" is left as-is: it is broad, but the phrase it is reaching for
  // ("I want to end it") has no safe narrower form that still catches the way
  // people write it, and it already subsumes "end it all".
  "end it",
  "give up on life",
  "giving up on life",
  "gave up on life",
  "give up on living",
  "no reason to live",
  "no reason to go on",
  "no reason to be here",
  "no reason to keep going",
];

// Crisis-language detector. The server treats its result as authoritative and
// never trusts a client-supplied flag.
//
// Whitespace is collapsed before matching so a line break or a double space
// mid-phrase ("kill  myself", or "want to\ndie" as typed on a phone keyboard)
// still matches — that is a common way for a real phrase to slip past a plain
// substring test.
export function flagsConcern(text: string): boolean {
  const normalised = text.toLowerCase().replace(/\s+/g, " ");
  return CONCERN_KEYWORDS.some((kw) => normalised.includes(kw));
}
