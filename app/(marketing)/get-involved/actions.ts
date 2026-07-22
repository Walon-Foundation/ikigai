"use server";

import { createEnquiry } from "@/lib/cms";

// One action for every public form. The four Get Involved pathways and the
// contact form all land in the `enquiries` table with a `type`; the
// type-specific answers ride along in `details`.
//
// Validation is intentionally light — this is an unauthenticated public form
// and the goal is to never lose a genuine enquiry, so we trim and cap rather
// than reject. A name and a contactable email are the only hard requirements.

const TYPES = [
  "volunteer",
  "mentor",
  "partner",
  "programme",
  "contact",
] as const;
type EnquiryType = (typeof TYPES)[number];

function clamp(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitEnquiry(
  type: string,
  data: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const enquiryType: EnquiryType = (TYPES as readonly string[]).includes(type)
    ? (type as EnquiryType)
    : "contact";

  const name = clamp(data.name, 120);
  const email = clamp(data.email, 200);
  if (!name) return { ok: false, error: "Please tell us your name." };
  // A minimal shape check — not validation theatre, just enough to catch a
  // typo that would make the enquiry impossible to answer.
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Please give us an email we can reply to." };
  }

  // Everything that isn't a core column becomes a detail. This keeps the action
  // agnostic to which form called it — a new field on any form just appears.
  const core = new Set(["name", "email", "phone", "organization", "message"]);
  const details: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (core.has(key)) continue;
    const clean = clamp(value, 1_000);
    if (clean) details[key] = clean;
  }

  try {
    await createEnquiry({
      type: enquiryType,
      name,
      email,
      phone: clamp(data.phone, 40) || undefined,
      organization: clamp(data.organization, 160) || undefined,
      message: clamp(data.message, 4_000) || undefined,
      details: Object.keys(details).length ? details : undefined,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
