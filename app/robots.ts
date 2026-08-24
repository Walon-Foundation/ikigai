import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://findingyourikigai.org";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/onboarding",
          "/onboarding/*",
          "/journal",
          "/journal/*",
          "/journey",
          "/mentor-portal",
          "/mentor-portal/*",
          "/parent-portal",
          "/parent-portal/*",
          "/mentorship",
          "/mentorship/*",
          "/settings",
          "/api/*",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
