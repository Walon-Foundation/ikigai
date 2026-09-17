import { and, eq, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db/db";
import {
  events,
  groups,
  marketingPages,
  programmes,
  stories,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://findingyourikigai.org";

  // Avoid hammering DB if unavailable at build — return static routes at least.
  // Static pages carry no lastModified: claiming "changed today" on every
  // request teaches crawlers to ignore the field. Rows below use their own
  // updatedAt (or createdAt, for tables without one).
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/team",
    "/what-we-do",
    "/programmes",
    "/events",
    "/stories",
    "/gallery",
    "/clubs",
    "/partners",
    "/contact",
    "/how-it-works",
    "/get-involved",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority:
      route === ""
        ? 1
        : route === "/programmes" || route === "/events"
          ? 0.8
          : 0.6,
  }));

  try {
    const [programmeRows, storyRows, eventRows, customPages, clubRows] =
      await Promise.all([
        db
          .select({ slug: programmes.slug, updatedAt: programmes.updatedAt })
          .from(programmes)
          .where(eq(programmes.published, true)),
        db
          .select({ slug: stories.slug, updatedAt: stories.updatedAt })
          .from(stories)
          .where(eq(stories.published, true)),
        db
          .select({
            slug: events.slug,
            id: events.id,
            createdAt: events.createdAt,
          })
          .from(events)
          .where(and(eq(events.isPublic, true))),
        db
          .select({
            slug: marketingPages.slug,
            updatedAt: marketingPages.updatedAt,
          })
          .from(marketingPages)
          .where(eq(marketingPages.published, true)),
        // Hidden clubs are excluded: their pages 404, and a sitemap that
        // advertises a 404 is a sitemap search engines learn to distrust.
        db
          .select({ slug: groups.slug, createdAt: groups.createdAt })
          .from(groups)
          .where(isNull(groups.hiddenAt)),
      ]);

    const clubUrls: MetadataRoute.Sitemap = clubRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${base}/clubs/${r.slug}`,
        lastModified: r.createdAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.4,
      }));

    const programmeUrls: MetadataRoute.Sitemap = programmeRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${base}/programmes/${r.slug}`,
        lastModified: r.updatedAt ?? undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      }));

    const storyUrls: MetadataRoute.Sitemap = storyRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${base}/stories/${r.slug}`,
        lastModified: r.updatedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.5,
      }));

    const eventUrls: MetadataRoute.Sitemap = eventRows.map((r) => ({
      url: `${base}/events/${r.slug ?? r.id}`,
      lastModified: r.createdAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    const customUrls: MetadataRoute.Sitemap = customPages.map((r) => ({
      url: `${base}/${r.slug}`,
      lastModified: r.updatedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [
      ...staticRoutes,
      ...programmeUrls,
      ...storyUrls,
      ...eventUrls,
      ...clubUrls,
      ...customUrls,
    ];
  } catch {
    return staticRoutes;
  }
}
