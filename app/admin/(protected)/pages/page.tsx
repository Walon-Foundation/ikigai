import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  type AdminRow,
  type Field,
  ResourceManager,
} from "@/components/admin/resource-manager";
import { db } from "@/db/db";
import { marketingPages } from "@/db/schema";
import { remove, save, togglePublish } from "./actions";

const FIELDS: Field[] = [
  {
    type: "text",
    name: "title",
    label: "Title",
    required: true,
    placeholder: "Spring Fundraiser",
  },
  {
    type: "text",
    name: "slug",
    label: "URL slug (findingyourikigai.org/slug — auto-generated from title if blank, permanent once created)",
    placeholder: "spring-fundraiser",
  },
  {
    type: "textarea",
    name: "metaDescription",
    label: "Meta description",
    rows: 2,
  },
];

export default async function MarketingPagesAdmin() {
  const rows = await db
    .select()
    .from(marketingPages)
    .orderBy(desc(marketingPages.createdAt));

  const items: AdminRow[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: `/${p.slug}`,
    published: p.published,
    values: {
      title: p.title,
      slug: p.slug,
      metaDescription: p.metaDescription ?? "",
    },
  }));

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-2xl font-black text-foreground">
          Custom pages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pages that aren't part of the original site design. Create one here,
          then add its sections at{" "}
          <Link href="/admin/page-builder" className="text-primary underline">
            Page Builder
          </Link>
          .
        </p>
      </div>
      <ResourceManager
        singular="Page"
        fields={FIELDS}
        items={items}
        actions={{ save, remove, togglePublish }}
        canReorder={false}
        publishLabel={{ on: "Live", off: "Draft" }}
      />
    </div>
  );
}
