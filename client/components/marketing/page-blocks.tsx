import {
  BLOCK_REGISTRY,
  type BlockConfig,
  type BlockType,
  isBlockType,
} from "@/lib/blocks/registry";
import { getPageBlocks } from "@/lib/cms";

// A known page's block order/types, used only when the DB has zero rows for
// that page (a fresh install, or `page_blocks` was wiped/truncated). Without
// this, an empty database means an empty page — every other piece of the
// marketing site has a code-level fallback for exactly this reason (see
// lib/cms.ts and the headline ?? "..." pattern this replaced), and the block
// system shouldn't be the one place that regresses to a blank page. Each
// block's own `defaultConfig` supplies the copy, so this list only needs the
// type + order, mirroring scripts/seed-page-blocks.ts's HOME_BLOCKS order.
const FALLBACK_PAGE_BLOCKS: Record<string, BlockType[]> = {
  home: [
    "hero",
    "about_intro",
    "four_pillars",
    "impact_stats",
    "featured_programmes",
    "upcoming_events",
    "stories",
    "partners",
    "app_cta",
    "final_cta",
  ],
};

// Renders one marketing page's published `page_blocks` rows, in order,
// through the registry in lib/blocks/registry.ts. A plain DB read like every
// other marketing-page query (see the caching note at the top of lib/cms.ts)
// — no unstable_cache — so an admin reordering blocks in /admin/page-builder
// is visible on the next request, same as every other CMS edit.
//
// A row whose `type` no longer exists in the registry (a block type that was
// removed from the codebase) is skipped rather than crashing the page — a
// stale row should not be able to take the whole homepage down.
export async function PageBlocks({ page }: { page: string }) {
  const rows = await getPageBlocks(page);

  if (rows.length === 0) {
    const fallback = FALLBACK_PAGE_BLOCKS[page] ?? [];
    return (
      <>
        {fallback.map((type) => {
          const { Render, defaultConfig } = BLOCK_REGISTRY[type];
          return <Render key={type} config={defaultConfig} />;
        })}
      </>
    );
  }

  return (
    <>
      {rows.map((row) => {
        if (!isBlockType(row.type)) return null;
        const { Render } = BLOCK_REGISTRY[row.type];
        return (
          <Render key={row.id} config={(row.config as BlockConfig) ?? {}} />
        );
      })}
    </>
  );
}
