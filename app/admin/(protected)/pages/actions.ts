"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { marketingPages } from "@/db/schema";
import { requiredText, slugify, text } from "@/lib/cms-admin";
import { cmsInvalidate, cmsRemove, cmsTogglePublish } from "@/lib/cms-crud";
import { requireAdmin } from "@/lib/db-user";

const PATH = "/admin/pages";
const cols = {
  table: marketingPages,
  id: marketingPages.id,
  published: marketingPages.published,
};

// Route folders that already exist under app/(marketing)/, plus "home" (the
// page_blocks key the real homepage uses). A custom page can't take one of
// these: the static route always wins over the catch-all, so the page would
// silently be unreachable, and "home" would corrupt the real homepage's
// blocks since page_blocks.page is just a shared free-text key.
const RESERVED_SLUGS = new Set([
  "home",
  "about",
  "contact",
  "events",
  "gallery",
  "get-involved",
  "how-it-works",
  "partners",
  "privacy",
  "programmes",
  "stories",
  "terms",
  "what-we-do",
]);

export async function save(id: string | null, v: Record<string, string>) {
  await requireAdmin();
  const title = requiredText(v.title, 160, "Title");
  const requestedSlug = text(v.slug, 80);
  const slug = requestedSlug ? slugify(requestedSlug) : slugify(title);
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`"${slug}" is a built-in page and can't be reused`);
  }

  const fields = {
    title,
    metaDescription: text(v.metaDescription, 300),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(marketingPages).set(fields).where(eq(marketingPages.id, id));
  } else {
    const [existing] = await db
      .select({ id: marketingPages.id })
      .from(marketingPages)
      .where(eq(marketingPages.slug, slug))
      .limit(1);
    if (existing) throw new Error(`A page with slug "${slug}" already exists`);
    await db.insert(marketingPages).values({ ...fields, slug });
  }
  cmsInvalidate(PATH);
}

export async function remove(id: string) {
  await cmsRemove(cols, PATH, id);
}
export async function togglePublish(id: string, next: boolean) {
  await cmsTogglePublish(cols, PATH, id, next);
}
