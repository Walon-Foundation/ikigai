# Brand source assets

Source artwork for the Ikigai mark. **Not served** — these live outside
`public/` on purpose: at ~850KB and ~900KB they are far too large to send to a
browser, and nothing in the app referenced them while they sat in `public/`.

| File | Use |
|---|---|
| `logo-transparent.png` | Full mark, transparent background — the original upload |
| `logo-circle.png` | Circular crop on white — the source of the previous favicon |

The shipped icons are generated from `logo-transparent.png` and live elsewhere:
`app/favicon.ico` (16/32/48) and `app/icon.png` (96) use the swirl-only mark,
cropped to the circle, because the leaves are illegible below ~64px;
`app/apple-icon.png` and the PWA icons at `public/icon-192x192.png` /
`public/icon-512x512.png` / `public/icon-512x512-maskable.png` use the full
mark on white (referenced by
`app/manifest.ts` and cached by `public/sw.js`).

Before using either file in a rendered surface, downscale it and route it
through `next/image` — this audience is on metered mobile data in Freetown and
the Western Rural Area.
