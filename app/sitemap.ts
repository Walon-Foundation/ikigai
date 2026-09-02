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
    lastModified: new Date(),
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
          .select({ slug: programmes.slug })
          .from(programmes)
          .where(eq(programmes.published, true)),
        db
          .select({ slug: stories.slug })
          .from(stories)
          .where(eq(stories.published, true)),
        db
          .select({ slug: events.slug, id: events.id })
          .from(events)
          .where(and(eq(events.isPublic, true))),
        db
          .select({ slug: marketingPages.slug })
          .from(marketingPages)
          .where(eq(marketingPages.published, true)),
        // Hidden clubs are excluded: their pages 404, and a sitemap that
        // advertises a 404 is a sitemap search engines learn to distrust.
        db
          .select({ slug: groups.slug })
          .from(groups)
          .where(isNull(groups.hiddenAt)),
      ]);

    const clubUrls: MetadataRoute.Sitemap = clubRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${base}/clubs/${r.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.4,
      }));

    const programmeUrls: MetadataRoute.Sitemap = programmeRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${base}/programmes/${r.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      }));

    const storyUrls: MetadataRoute.Sitemap = storyRows
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${base}/stories/${r.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      }));

    const eventUrls: MetadataRoute.Sitemap = eventRows.map((r) => ({
      url: `${base}/events/${r.slug ?? r.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    const customUrls: MetadataRoute.Sitemap = customPages.map((r) => ({
      url: `${base}/${r.slug}`,
      lastModified: new Date(),
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
