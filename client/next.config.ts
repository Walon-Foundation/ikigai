import type { NextConfig } from "next";

// Content-Security-Policy, shipped in REPORT-ONLY mode deliberately.
//
// This is a listening device, not a control. Nothing below blocks anything —
// the browser evaluates the policy, reports what would have been refused, and
// loads it anyway. Enforcing a CSP on this app today would break it, and the
// point of this pass is to find out exactly how much before that happens.
// Without a `report-to` endpoint violations surface in the browser console;
// wire one up (Vercel Log Drains, or a /api/csp-report route) if the owner
// wants them collected rather than eyeballed.
//
// The sources below are the real ones the app uses, so the reports that do
// come back are signal rather than noise:
//   - Clerk's clerk-js loads from the Clerk frontend host (*.clerk.accounts.dev
//     in dev, clerk.<domain> in production) and its bot check frames Cloudflare
//     Turnstile.
//   - Leaflet pulls map tiles from *.tile.openstreetmap.org (components/resource-map.tsx).
//   - UploadThing uploads go direct from the browser to *.ingest.uploadthing.com,
//     coordinated through api.uploadthing.com; the files come back from
//     *.ufs.sh / utfs.io, which is also where CMS imagery lives.
//   - Fonts are self-hosted: next/font downloads DM Sans, Fraunces and
//     JetBrains Mono at build time, so there is NO connection to Google. It
//     does emit an inline <style> block, which is why style-src needs
//     'unsafe-inline'.
//
// BEFORE THIS CAN BE ENFORCED:
//   1. Generate a per-request nonce in proxy.ts and thread it onto both inline
//      scripts — components/theme-init.tsx (the pre-paint theme script) and the
//      service-worker registration in app/(pwa)/layout.tsx. Both are currently
//      covered only by 'unsafe-inline'.
//   2. Replace 'unsafe-inline' in script-src with 'nonce-<value>' — and note
//      that a nonce makes browsers ignore any 'unsafe-inline' left beside it,
//      so old browsers relying on it get a *stricter* policy, not a looser one.
//   3. Re-check style-src. framer-motion and Leaflet both write inline style
//      attributes, so 'unsafe-inline' has to stay for styles unless those are
//      reworked. That is a far weaker concession than allowing inline scripts.
//
// 'unsafe-inline' MUST NEVER appear in script-src of an ENFORCED policy. With
// it there the policy stops being an XSS control at all — an injected inline
// <script> executes exactly as the attacker wrote it, and every other
// directive is decoration.
const cspReportOnly = [
  "default-src 'self'",
  // 'unsafe-inline' here is what makes the report-only pass readable: without
  // it the two known inline scripts would fire a violation on every page load
  // and bury anything unexpected. It does not survive into an enforced policy
  // — see step 2 above.
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  // next/font's inline <style>, plus framer-motion and Leaflet inline style
  // attributes.
  "style-src 'self' 'unsafe-inline'",
  // Self-hosted next/font files; data: covers inlined subsets.
  "font-src 'self' data:",
  // OpenStreetMap tiles, UploadThing/CMS imagery, Clerk avatars. blob:/data:
  // cover client-side image previews before upload.
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.ufs.sh https://utfs.io https://img.clerk.com",
  // Clerk session/API traffic and UploadThing's direct browser uploads.
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.uploadthing.com https://*.ingest.uploadthing.com https://*.ufs.sh https://utfs.io",
  // /sw.js is same-origin; blob: is for Clerk's worker usage.
  "worker-src 'self' blob:",
  // Clerk's Turnstile bot check renders in a frame.
  "frame-src 'self' https://challenges.cloudflare.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Duplicates X-Frame-Options: DENY below, for browsers that prefer CSP.
  "frame-ancestors 'none'",
].join("; ");

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
          // Two years, and `includeSubDomains` is the part that matters here.
          // The Clerk session cookie is shared across the apex, app.* and
          // admin.* hosts, so an attacker who can force a plaintext request to
          // ANY subdomain — one that was never even deployed — reaches the same
          // session cookie. Pinning only the apex would leave that open.
          // `preload` is a standing commitment: once the domain is on the HSTS
          // preload list, browsers refuse plaintext before the first request,
          // and getting off the list is slow. Only submit it when every
          // subdomain is permanently HTTPS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Deny the powerful browser APIs this app does not use, so an
          // injected script or an embedded frame cannot reach for them.
          //
          // geolocation is `(self)`, NOT blocked: meeting verification really
          // does read GPS — navigator.geolocation.getCurrentPosition in
          // app/(pwa)/(app)/mentorship/[id]/verify/verify-client.tsx. `(self)`
          // keeps it working on our own origin while still denying it to any
          // cross-origin frame.
          //
          // camera, microphone, payment and usb are all `()` — nothing in the
          // codebase calls getUserMedia, PaymentRequest or navigator.usb.
          // Payments infra exists for Monime but is server-side and does not
          // touch the Payment Request API.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
          },
          // See the note above `cspReportOnly`. Report-only on purpose: this
          // observes, it does not block.
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
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
