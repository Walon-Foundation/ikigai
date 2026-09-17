import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://findingyourikigai.org";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Every app (PWA) and admin route, from the app/(pwa) and app/admin
        // trees. A path prefix covers everything beneath it, so "/journal" also
        // blocks "/journal/new". Keep this in step when the app adds a route.
        disallow: [
          "/admin",
          "/api/",
          "/activities",
          "/dashboard",
          "/goals",
          "/groups",
          "/journal",
          "/journey",
          "/mentor-portal",
          "/mentors",
          "/mentorship",
          "/notifications",
          "/onboarding",
          "/pad-her-power",
          "/parent-portal",
          "/purpose-book",
          "/safety",
          "/settings",
          "/sign-in",
          "/sign-up",
          "/tasks",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
