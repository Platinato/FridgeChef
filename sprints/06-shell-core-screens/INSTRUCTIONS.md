# Sprint 06 - App shell, onboarding, Home, Pantry, Saved/Profile

## Before you start

1. Read the handbooks of **03** (components) and **05** (API layer). Read 02 / 04 if you haven't.
2. Read this file and `fridgechef-mockup/README.md` → Screen reference rows 1, 2, 10, 11 and Content rules.
3. Click through those screens in the mockup: `#/onboarding`, `#/home`, `#/pantry`, `#/saved`.

## Goal

The navigable app shell with all providers, plus the four "home base" screens working end to end on mock data. Screens compose Sprint 02/03 components, read and write the Sprint 04 stores, and fetch through the Sprint 05 hooks only.

## Tasks

1. **Root layout** (`src/app/_layout.tsx`):
   - font loading + splash
   - `GestureHandlerRootView`, `SafeAreaProvider`, `QueryProvider`, `BottomSheetModalProvider`
   - Toast host
   - light `StatusBar`
   - dark navigation theme (`#0A0A0A` background, no white flashes)
   - screen transitions: stack slide/fade around 240 ms
2. **Routes** (thin files that render `src/screens/*`):
   ```
   src/app/
     _layout.tsx
     onboarding.tsx
     (tabs)/_layout.tsx          # Tabs with custom tabBar = BottomNav; tabs: index (Home), pantry, saved
     (tabs)/index.tsx | pantry.tsx | saved.tsx
     scan/index.tsx | scan/analyzing.tsx | scan/confirm.tsx     # placeholders in this sprint
     mood.tsx | suggestions.tsx | recipe/[id].tsx | cook/[id].tsx # placeholders in this sprint
     dev/gallery.tsx
   ```
   - The **Scan** button in BottomNav pushes `/scan`, a full-screen stack route with no tab bar, matching the mockup where the nav only appears on Home, Pantry and Saved.
   - Placeholder screens use `Screen` + `EmptyState` ("Coming in Sprint 07/08") so navigation never dead-ends.
3. **Database boot gate and onboarding gate**
   - In the root layout, keep the splash screen up until all of these are done: fonts are loaded, `initDatabase()` has finished (migrations, plus the first-launch demo seed in mock mode, Sprint 04), and `hydrateStores()` has run. Never render a screen with un-hydrated stores.
   - If the database step fails, show a full-screen error (`EmptyState` + "Try again" that reruns the boot). No crash loop, no blank screen.
   - Show failed store write-throughs as a toast ("Couldn't save that change"). This replaces the dev-only report from Sprint 04.
   - If `profileStore.onboarded` is false, redirect to `/onboarding`.
4. **OnboardingScreen**
   - 3 photo slides (Snap / Confirm / Cook) with a glass "Skip", pagination dots and "Next" / "Set up my kitchen".
   - Then the taste setup: diet (single), allergies (multi), household stepper, from `useCatalog()`.
   - "Let's cook" sets `onboarded`, syncs prefs (diet, servings), goes Home, and shows the toast "Welcome to FridgeChef".
   - Handle catalog loading and error states (retry).
5. **HomeScreen**
   - Top bar: logo, search (toast "Coming soon"), bell (red dot when staples are low; toast with the count).
   - "Explore / RECIPES" hero and mood chips (`prefsStore.mood`).
   - The lime **scan TicketCard** with the camera disc, `lastScanLabel` and "Scan now" → `/scan`.
   - "Running low" staple cards; tapping one opens Pantry with that staple's sheet (route param `?staple=<id>`).
   - "Cook again" compact RecipeCards with **match %** from cooked-history snapshots + `useKitchen()`, opening `/recipe/[id]`.
6. **PantryScreen**
   - "My / PANTRY" with the staple count.
   - The "Staples are remembered" InfoCard (**no icon**) with the auto-include Toggle.
   - Category chips, the running low list, and all staples.
   - A level-editor Sheet: big "N / 5 left", LevelBars input, pack size, last updated, "Remove" (danger) and "Mark refilled".
   - An add-staple Sheet: SearchField filtering `catalog.stapleSuggestions`, tap to add.
   - Toasts on each action.
7. **SavedScreen** ("My / COOKBOOK")
   - Saved compact RecipeCards with **`stat="effort"`**, or an EmptyState with "Find recipes" → `/scan`.
   - Profile rows: Diet sheet, Allergies sheet, Household stepper, **Default effort as a plain SegmentedControl (no level bars)**, Units (Metric / Imperial), "Replay onboarding", and "Reset demo data" (danger, with an Alert confirm → `resetAll()`: clears the user tables in SQLite, reseeds in mock mode and re-hydrates the stores).
8. **Loading and error conventions**
   - A shared `QueryState` helper, or a pattern documented in the handbook: skeleton/placeholder while loading; `EmptyState` + retry on error using `toUserMessage`.
   - Use it for `useCatalog`.
9. **Tests** (RNTL + a test QueryClient + MockApi with 0 latency via `setApiForTests`):
   - the onboarding flow sets `onboarded` and navigates
   - Home shows the running-low count and navigates to scan
   - Pantry level edit and refill update the store
   - Saved renders effort (not %) on cards, and Default effort has no LevelBars
   - the boot gate shows the error state when `initDatabase` rejects, and Retry recovers
   - "Reset demo data" restores the seed (on a Node driver database)
   - the content-rules test is still green

## Out of scope

The camera, detection and confirm flow (Sprint 07); mood, suggestions, recipe and cook (Sprint 08).

## Acceptance criteria

- A fresh install in mock mode: onboarding → Home looks like the mockup's Home. The Pantry and Saved tabs behave like the mockup. State survives an app restart (it is read back from SQLite).
- No screen imports `services/api/mock/**`, `MockApi`, `HttpApi`, `src/db` or `fetch` (the architecture guard test passes).

## Build verification pass

`npm run verify` + `npx expo-doctor`. Do a manual smoke on Expo Go (iPhone) covering onboarding, Home, Pantry sheets, Saved sheets, a full app restart (kill it and reopen) for SQLite persistence, and "Reset demo data". If you also use `npm run web`, record whether web SQLite worked (see `architecture.md` → Web preview). Record it in the handbook.

## End of sprint

Write the handbook: the route map, the loading/error pattern, and deviations. Update the status board and decisions. Do not commit.
