# client — marketing site + admin panel

The Next.js 16 half of Ikigai: the public, SEO-indexed marketing site and the
admin panel. Both are CMS-driven and read the shared Postgres database.

Run `bun install && bun run dev`. Setup, including environment variables, is in
[../docs/SETUP.md](../docs/SETUP.md).

## Surfaces

Subdomain routing lives in `proxy.ts` (Next 16's renamed middleware):

| Host | Route group | Audience |
|---|---|---|
| `<domain>` | `app/(marketing)/` | public |
| `admin.<domain>` | `app/admin/` | staff — the `/admin` prefix is never shown |
| `app.<domain>` | `app/(pwa)/` | the authenticated PWA |

`app/(pwa)/` is being ported to the Expo app in `mobile/`, but **stays working
here** — the PWA is how users on metered data and low-end devices reach the
product, and it is not being deleted. See
[../docs/03-mobile.md](../docs/03-mobile.md).

## Notes

- Marketing pages are `force-dynamic` on purpose: admin content edits appear
  immediately. Correctness over milliseconds.
- CSP ships **report-only**; `next.config.ts` documents what must happen before
  it can be enforced.
- `stories`, `gallery_items`, `partners` and `team_members` are empty in the
  live database. Do not write copy or code implying they have content.
