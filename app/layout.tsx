import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Not preloaded. next/font preloads by default, which put a 40KB woff2 on the
// critical path of every page in the app — including all seven marketing pages,
// where `font-mono` renders not one glyph. It's used in exactly three places,
// all deep inside the PWA, all pairing codes. It still loads there, just when
// something actually needs it rather than ahead of first paint everywhere.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://findingyourikigai.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ikigai — Find your reason to wake up every morning",
    template: "%s · Ikigai",
  },
  description:
    "Ikigai connects youth in Sierra Leone with mentors, growth tools, and a community built for their future.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_SL",
    siteName: "Ikigai",
    title: "Ikigai — Find your reason to wake up every morning",
    description:
      "A purpose-discovery and mentorship platform for youth in Sierra Leone. Journal, grow, and get matched with verified mentors.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ikigai — Find your reason to wake up every morning",
    description:
      "A purpose-discovery and mentorship platform for youth in Sierra Leone.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ikigai",
  },
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1A5C3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInit />
        {/* Icons are declared once, in `metadata.icons` above — Next renders
            them into <head> for every route. Repeating them as manual <link>
            tags here emitted each icon twice, with two non-identical
            rel="icon" tags whose precedence was left to browser heuristics. */}
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
