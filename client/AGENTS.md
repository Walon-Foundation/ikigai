<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design

**All UI here follows [../docs/05-design-guide.md](../docs/05-design-guide.md)**,
the design system for the whole web app: marketing, admin, auth, and any page
added later. **Not `app/(pwa)/`**: the PWA stays live but is not touched.
It shares `globals.css` and `components/ui/` with the rest of the app, so
scope new styles to marketing and admin, build new components in
`components/system/`, and never restyle a shared file the PWA uses. See the guide's *The PWA must not change*. Use its tokens, type scale, components and patterns rather than
new one-off styles. If a screen needs something the guide does not cover,
extend the guide first.
