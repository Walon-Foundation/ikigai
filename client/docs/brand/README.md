# Brand source assets

Source artwork for the Ikigai mark. **Not served** — these live outside
`public/` on purpose: at ~850KB and ~900KB they are far too large to send to a
browser, and nothing in the app referenced them while they sat in `public/`.

| File | Use |
|---|---|
| `logo-transparent.png` | Full mark, transparent background — the original upload |
| `logo-circle.png` | Circular crop, the source the favicon was generated from |

The shipped icons are generated separately and live elsewhere:
`app/favicon.ico`, `app/icon.tsx`, `app/apple-icon.tsx`, and the PWA icons at
`public/icon-192x192.png` / `public/icon-512x512.png` (referenced by
`app/manifest.ts` and cached by `public/sw.js`).

Before using either file in a rendered surface, downscale it and route it
through `next/image` — this audience is on metered mobile data in Freetown and
the Western Rural Area.
