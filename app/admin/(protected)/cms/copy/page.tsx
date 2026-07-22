import { db } from "@/db/db";
import { siteCopy } from "@/db/schema";
import { CopyBlock } from "./copy-client";

// The editable copy blocks and their shapes. Adding a block here (plus a case
// in actions.ts) is all it takes to make a new piece of page copy editable.
const BLOCKS = [
  {
    key: "hero",
    title: "Homepage hero",
    description: "The first thing a visitor reads.",
    fields: [
      { name: "headline", label: "Headline", kind: "textarea" as const },
      { name: "body", label: "Body", kind: "textarea" as const },
      {
        name: "primaryLabel",
        label: "Primary button label",
        kind: "text" as const,
      },
      {
        name: "primaryHref",
        label: "Primary button link",
        kind: "text" as const,
      },
      {
        name: "secondaryLabel",
        label: "Secondary button label",
        kind: "text" as const,
      },
      {
        name: "secondaryHref",
        label: "Secondary button link",
        kind: "text" as const,
      },
    ],
  },
  {
    key: "about_intro",
    title: "About introduction",
    description: "The short paragraph under the About heading.",
    fields: [{ name: "body", label: "Body", kind: "textarea" as const }],
  },
  {
    key: "mission",
    title: "Mission",
    description: "What Ikigai does.",
    fields: [{ name: "body", label: "Body", kind: "textarea" as const }],
  },
  {
    key: "vision",
    title: "Vision",
    description: "The future Ikigai wants to create.",
    fields: [{ name: "body", label: "Body", kind: "textarea" as const }],
  },
  {
    key: "values",
    title: "Values",
    description: "Listed on the About page.",
    fields: [{ name: "items", label: "Values", kind: "lines" as const }],
  },
];

function valuesFor(
  stored: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!stored) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(stored)) {
    out[k] = Array.isArray(v) ? v.join("\n") : String(v ?? "");
  }
  return out;
}

export default async function CopyCmsPage() {
  const rows = await db.select().from(siteCopy);
  const byKey = new Map(
    rows.map((r) => [r.key, r.value as Record<string, unknown>]),
  );

  return (
    <div className="space-y-4">
      {BLOCKS.map((block) => (
        <CopyBlock
          key={block.key}
          copyKey={block.key}
          title={block.title}
          description={block.description}
          fields={block.fields}
          values={valuesFor(byKey.get(block.key))}
        />
      ))}
    </div>
  );
}
