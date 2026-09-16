# mobile — Ikigai for Android

The mentee app, built with Expo SDK 57 and native Jetpack Compose components
from `@expo/ui`. The design is **Material You**: colours come from the user's
wallpaper on Android 12+, and from Ikigai green on older phones.

```bash
bun install
bun run start      # then open in a development build on Android
```

Compose components need a development build (not Expo Go) and render on Android
only. The iOS version — SwiftUI components, with Liquid Glass via
`expo-glass-effect` — is a later pass; until then iOS shows a placeholder.

## Layout

```
src/app/(tabs)/     Chats · Journey · Match · Me   (native tab bar)
src/app/thread/     mentor · tree · journal        (pushed over the tabs)
src/components/     Screen, Thread (app bar, bubbles, composer), Symbol, Type, Avatar
src/data/demo.ts    demo data, shaped like the NestJS API responses
src/theme/colors.ts Material You with the brand-green fallback
```

All data is demo content for now. Its shapes mirror the API, so wiring a
screen to real data changes where the data comes from, not the screen.
