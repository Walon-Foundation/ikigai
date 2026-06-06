// In-person meeting verification helpers (PRD §18). Pure — no database.

export const MEETINGS = [
  { number: 1, name: "Introduction", blurb: "First in-person meeting." },
  { number: 2, name: "Progress Review", blurb: "Mid-point check-in." },
  { number: 3, name: "Graduation", blurb: "Final celebration & next steps." },
] as const;

export const VERIFICATION_METHODS = ["gps", "qr", "photo"] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export function isVerificationMethod(v: unknown): v is VerificationMethod {
  return (
    typeof v === "string" &&
    (VERIFICATION_METHODS as readonly string[]).includes(v)
  );
}

export function meetingName(n: number): string {
  return MEETINGS.find((m) => m.number === n)?.name ?? `Meeting ${n}`;
}
