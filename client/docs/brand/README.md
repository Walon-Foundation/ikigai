# Brand source assets

Source artwork for the Ikigai mark. **Not served** — these live outside
`public/` on purpose: at ~850KB and ~900KB they are far too large to send to a
browser, and nothing in the app referenced them while they sat in `public/`.

| File | Use |
|---|---|
| `logo-transparent.png` | Full mark, transparent background — the original upload |
| `logo-circle.png` | Circular crop on white — the source of the previous favicon |

The shipped icons are generated from `logo-transparent.png`, using the same
"coin" as the mobile app: the swirl-and-sun mark (leaves and arrow removed —
they are illegible below ~64px) on a white disc. `app/favicon.ico` (16/32/48)
and `app/icon.png` (96) are the coin alone; `app/apple-icon.png` and the PWA
icons at `public/icon-192x192.png` / `public/icon-512x512.png` /
`public/icon-512x512-maskable.png` put it on pale leaf green `#E3F1E1`
(referenced by
`app/manifest.ts` and cached by `public/sw.js`).

Before using either file in a rendered surface, downscale it and route it
through `next/image` — this audience is on metered mobile data in Freetown and
the Western Rural Area.
