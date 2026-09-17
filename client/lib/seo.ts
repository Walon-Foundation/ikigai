import type { Metadata } from "next";
import { clientEnv } from "@/lib/env.client";

// Metadata for the public marketing site.
//
// Next.js merges metadata from nested segments *shallowly*: a page that sets
// `openGraph` replaces the layout's whole `openGraph` object. So every page
// builds its complete set here, rather than each hand-writing a partial one
// that silently drops the rest (which is how every shared link ended up with
// the home page's title).
//
// Titles are plain ("About"): the root layout's template appends " · Ikigai".
// The share image is a static file attached explicitly: a page's own
// `openGraph` replaces a file-convention opengraph-image from its segment, so
// that route never reached a page. Regenerate public/marketing/og-image.jpg
// (1200x630) if the brand or tagline changes.

export const SITE = {
  name: "Ikigai",
  url: clientEnv.marketingUrl.replace(/\/$/, ""),
  description:
    "A youth-led organization helping young people in Freetown and the Western Rural Area of Sierra Leone discover purpose, build skills, and lead change.",
  locale: "en_SL",
} as const;

const SHARE_IMAGE = {
  url: "/marketing/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Ikigai: helping young people in Sierra Leone find their reason for being.",
};

/** The organisation, for JSON-LD on the home page and as an event organiser. */
export const ORGANIZATION = {
  "@type": "NGO",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icon-512x512.png`,
  description: SITE.description,
  areaServed: [
    { "@type": "City", name: "Freetown" },
    { "@type": "AdministrativeArea", name: "Western Area Rural District" },
    { "@type": "Country", name: "Sierra Leone" },
  ],
};

/** Trim to a search-snippet length at a word boundary. */
export function snippet(text: string | null | undefined, max = 160) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max - 1))}…`;
}

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  type = "website",
  noIndex,
}: {
  /** Plain page title; the layout template appends the site name. */
  title: string;
  description?: string | null;
  /** Path from the site root, e.g. "/about". */
  path: string;
  /** Use this title as-is, without the template (the home page). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const desc = snippet(description) || SITE.description;
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE.name,
      locale: SITE.locale,
      url: path,
      title: fullTitle,
      description: desc,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [SHARE_IMAGE],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
