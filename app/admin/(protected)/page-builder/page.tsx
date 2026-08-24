import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageBuilder } from "@/components/admin/page-builder";
import { db } from "@/db/db";
import { marketingPages, pageBlocks } from "@/db/schema";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import {
  addBlock,
  removeBlock,
  reorderBlocks,
  toggleBlockPublish,
  updateBlockConfig,
} from "./actions";

function valuesFor(
  config: Record<string, unknown> | null,
): Record<string, string> {
  if (!config) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) out[k] = String(v ?? "");
  return out;
}

export default async function PageBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: requestedPage } = await searchParams;

  const customPages = await db
    .select()
    .from(marketingPages)
    .orderBy(desc(marketingPages.createdAt));

  // "home" is always available even though it has no marketingPages row —
  // it's a real route file (app/(marketing)/page.tsx), not an admin-created
  // one. Anything else must match a real custom page, or we'd let the editor
  // silently write page_blocks rows under an unreachable key.
  const isValidPage =
    requestedPage === "home" ||
    customPages.some((p) => p.slug === requestedPage);
  const PAGE = isValidPage && requestedPage ? requestedPage : "home";

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
          Reorder and configure a page's sections. Every block renders with the
          site's existing design, so there's nothing here that can break the
          look of the page. New pages are created at{" "}
          <Link href="/admin/pages" className="text-primary underline">
            Custom Pages
          </Link>
          .
        </p>
        <nav className="mt-4 flex flex-wrap gap-1.5">
          <Link
            href="/admin/page-builder?page=home"
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              PAGE === "home"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            Home
          </Link>
          {customPages.map((p) => (
            <Link
              key={p.id}
              href={`/admin/page-builder?page=${p.slug}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                PAGE === p.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {p.title}
              {!p.published && " (draft)"}
            </Link>
          ))}
        </nav>
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
