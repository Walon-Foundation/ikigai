import { asc, eq } from "drizzle-orm";
import { PageBuilder } from "@/components/admin/page-builder";
import { db } from "@/db/db";
import { pageBlocks } from "@/db/schema";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import {
  addBlock,
  removeBlock,
  reorderBlocks,
  toggleBlockPublish,
  updateBlockConfig,
} from "./actions";

// Only the homepage is migrated onto the block system so far (see
// app/(marketing)/page.tsx and lib/blocks/registry.ts) — the other thirteen
// marketing pages still render their sections directly. This constant is the
// one thing to change to point the screen at a different page key once
// another route is migrated; a page picker (mirroring cms/layout.tsx's
// sub-nav) is the natural next step once there is more than one.
const PAGE = "home";

function valuesFor(
  config: Record<string, unknown> | null,
): Record<string, string> {
  if (!config) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) out[k] = String(v ?? "");
  return out;
}

export default async function PageBuilderPage() {
  const rows = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.page, PAGE))
    .orderBy(asc(pageBlocks.orderIndex));

  const blocks = rows.map((r) => ({
    id: r.id,
    type: r.type,
    published: r.published,
    values: valuesFor(r.config as Record<string, unknown> | null),
  }));

  const registry = Object.entries(BLOCK_REGISTRY).map(([type, def]) => ({
    type,
    label: def.label,
    description: def.description,
    fields: def.fields,
  }));

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-2xl font-black text-foreground">
          Page builder
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reorder and configure the sections on the homepage. Every block
          renders with the site's existing design, so there's nothing here that
          can break the look of the page.
        </p>
      </div>
      <PageBuilder
        page={PAGE}
        blocks={blocks}
        registry={registry}
        actions={{
          addBlock,
          updateBlockConfig,
          removeBlock,
          toggleBlockPublish,
          reorderBlocks,
        }}
      />
    </div>
  );
}
