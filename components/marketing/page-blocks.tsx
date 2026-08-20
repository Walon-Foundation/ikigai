import {
  BLOCK_REGISTRY,
  type BlockConfig,
  isBlockType,
} from "@/lib/blocks/registry";
import { getPageBlocks } from "@/lib/cms";

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
