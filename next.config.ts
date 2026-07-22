import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // CMS photography (programme heroes, story covers, the gallery) is served
    // through next/image so it arrives resized and in a modern format. This
    // audience is on metered mobile data — an unoptimised 4MB campaign photo is
    // a real cost to the person looking at it.
    //
    // Note this is only for CMS content. Avatars stay on a plain <img> by
    // design; see components/avatar.tsx.
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
