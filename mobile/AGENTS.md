# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## What this app is

Expo SDK 57, React Native 0.86, expo-router with typed routes, React Compiler
on. The UI is **Jetpack Compose via `@expo/ui`** — Android first; iOS shows a
placeholder until a SwiftUI version is built. Screens run on **demo data**
(`src/data/demo.ts`, shaped like API responses) until auth (docs/02) lands.

Flow: intro `(intro)/onboarding1–4` (what Ikigai is) → `(auth)` sign in / sign
up → `(tabs)`. The demo session is in memory (`src/state/session.ts`).

## Design rules (decided by the user — do not undo)

- **Brand palette, light only.** Every `Host` is seeded from Ikigai green and
  fixed to light (`src/theme/colors.ts`). No Material You / wallpaper colors,
  no dark theme.
- **Brand accents** come from the logo: `src/theme/brand.ts` (orange, teal,
  leaf, sun). Tabs use `BrandHero`; the logo is `BrandMark` (the "coin": the
  swirl-and-sun on a white disc, with no tree). Journey stages each have a
  color (`STAGE_ACCENT`).
- Not plain: prefer brand headers, colored avatars and tinted icons over
  stock grey Material lists.

## Conventions

- A screen is `<Screen>` wrapping a component of its own; colors come from
  `useMaterialColors()` inside it. Layout with `Page` and the pieces in
  `src/components/Kit.tsx`; text with `<Type variant>`; icons with
  `<Glyph name>` (Material Symbol names — check them against
  `node_modules/expo-symbols/build/android/symbols.json`).
- **Never name a component `Symbol`** (or any other JS global): the React
  Compiler emits `Symbol.for(...)`, and a shadowing import crashes every
  screen.
- Edge-to-edge is on: `Screen` pads the status bar; layouts with inputs need
  `imePadding()` or the keyboard covers them.
- RN views outside a Compose Host (navigators, tab bar) take colors from
  `useAppPalette()` so nothing flashes a different theme.

## Running it

- Checks: `bunx tsc --noEmit`, and `bunx expo export --platform android` to
  prove it bundles. New routes need regenerated types:
  `CI=1 timeout 45 bunx expo start --offline --port 8099`.
- On the phone: `bun run android` (native build; use JDK 21 —
  `JAVA_HOME=~/.local/share/mise/installs/java/temurin-21`). Icon, splash or
  `app.json` changes need a rebuild; JS does not.
- Dev server for the device: `bunx expo start --dev-client` **without
  `CI=1`** — CI mode disables reloads and the phone silently runs stale code.
  After replugging, `adb reverse tcp:8081 tcp:8081`.
- `android/` and `ios/` are generated (`expo prebuild`) and gitignored.
