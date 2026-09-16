import { db } from "@/db/db";
import { appCopy } from "@/db/schema";
import { AppCopyBlock } from "./copy-client";

// Admin-editable strings inside the authenticated app (PWA) — the app-copy
// counterpart to /admin/cms/copy for the public website. This is a
// proof-of-pattern covering a handful of genuinely hardcoded, low-risk
// display strings; most PWA copy is still hardcoded in its components. See
// the comment in lib/app-copy.ts for how to add another one.
const BLOCKS = [
  {
    key: "pad_her_power_intro",
    title: "Pad Her Power — intro",
    description:
      "The hero title and body at the top of the Pad Her Power page.",
    fields: [
      { name: "title", label: "Title", kind: "text" as const },
      { name: "body", label: "Body", kind: "textarea" as const },
    ],
  },
  {
    key: "safety_crisis_banner",
    title: "Safety — crisis banner",
    description:
      "The 'Need immediate help?' banner at the top of the Safety page.",
    fields: [
      { name: "title", label: "Title", kind: "text" as const },
      { name: "body", label: "Subtext", kind: "text" as const },
    ],
  },
  {
    key: "dashboard_no_mentor",
    title: "Dashboard — no mentor yet",
    description:
      "Shown on a mentee's dashboard before they've been matched with a mentor.",
    fields: [
      { name: "title", label: "Card label", kind: "text" as const },
      { name: "body", label: "Message", kind: "text" as const },
      { name: "cta", label: "Button label", kind: "text" as const },
    ],
  },
  {
    key: "dashboard_active_modules_heading",
    title: "Dashboard — active modules heading",
    description:
      "The heading above Pad Her Power / Safety Awareness on a mentee's dashboard.",
    fields: [{ name: "label", label: "Heading", kind: "text" as const }],
  },
];

function valuesFor(
  stored: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!stored) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(stored)) out[k] = String(v ?? "");
  return out;
}

export default async function AppCopyPage() {
  const rows = await db.select().from(appCopy);
  const byKey = new Map(
    rows.map((r) => [r.key, r.value as Record<string, unknown>]),
  );

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-2xl font-black text-foreground">
          App copy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Text shown inside the Ikigai app (the mentee/mentor/parent product),
          not the public website. Only a handful of strings are wired up so far
          — see lib/app-copy.ts to add more.
        </p>
      </div>
      <div className="space-y-4">
        {BLOCKS.map((block) => (
          <AppCopyBlock
            key={block.key}
            copyKey={block.key}
            title={block.title}
            description={block.description}
            fields={block.fields}
            values={valuesFor(byKey.get(block.key))}
          />
        ))}
      </div>
    </div>
  );
}
