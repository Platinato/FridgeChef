# Sprint 06 handbook - App shell, onboarding, Home, Pantry, Saved/Profile

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done with carry-over
- **Dates:** 2026-10-01 → 2026-10-01
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

Everything is built and tested; `verify` and `expo-doctor` pass. The only open item is the **manual smoke test in Expo Go on a physical iPhone**: no device was reachable from this session. The same path (onboarding → Home → Pantry sheets → Saved sheets → reload for persistence → Reset demo data) was smoke-tested in the **web preview, which now runs the real SQLite database** (see Build verification pass).

## What was built

- **Shell (root layout, `src/app/_layout.tsx`)**
  - Providers, outermost first: `GestureHandlerRootView` → `SafeAreaProvider` → dark `ThemeProvider` (`#0A0A0A` background) → `QueryProvider` (`appQueryClient`) → `BottomSheetModalProvider` → `StatusBar` (light), with `ToastHost` last.
  - Stack transitions: `slide_from_right`, 240 ms. `(tabs)` and onboarding fade.
  - Boot gate:
    - The splash stays until fonts and `bootApp()` (`initDatabase()` + `hydrateStores()`) are both done.
    - A failure shows `BootErrorScreen` ("Couldn't open your kitchen", "Try again" reruns the boot).
    - `AppEffects` then wires the "Couldn't save that change" toast for failed write-throughs, and http mode's default staples.
- **Routes** (thin files that re-export `src/screens/*`; see the route map).
- **Screens** (`src/screens/`):
  - `OnboardingScreen`
  - `HomeScreen`
  - `PantryScreen` (level sheet + add sheet)
  - `SavedScreen` (diet + allergies sheets)
  - `PlaceholderScreen`
  - `shell/`: `AppTabBar`, `useBoot`, `BootErrorScreen`, `AppEffects`
  - `shared.ts`: effort / unit options, pantry categories, `dietOptions`, `iconOr`, onboarding slides
  - `confirm.ts`: `confirmDestructive`
- **New component:** `QueryState`, the loading / error convention.
- **State:**
  - `src/state/boot.ts`
  - `pantry.applyDefaultStaples(defaults)`
  - write-failure reporting in all builds
  - `hydrateStores` moved to `appStores.ts`
- **Services:**
  - `resetBackendData()` (`services/api`)
  - `useResetDemoData()`
  - `appQueryClient` (`services/queries`)
- **Config:**
  - `metro.config.js` (expo-sqlite web setup)
  - `web.output: 'single'`
  - Expo patch updates for doctor: expo 57.0.26, expo-router 57.0.24, expo-constants 57.0.20
- **Tests: 21 suites, 285 tests** (Sprint 05 ended at 19 / 269; the placeholder-route test was removed).
  - `src/__tests__/app-flows.test.tsx` (12), on the real routes.
  - `components/__tests__/queryState.test.tsx` (3).
  - `state/__tests__/defaultStaples.test.ts` (2).

### Route map

| Path | File | Screen | Notes |
|---|---|---|---|
| (root stack) | `_layout.tsx` | providers, boot gate | `headerShown: false`, dark theme |
| `/` | `(tabs)/index.tsx` | `HomeScreen` | `(tabs)/_layout.tsx` = `Tabs` from `expo-router/js-tabs` with `tabBar={AppTabBar}`; it **redirects to `/onboarding` until `profile.onboarded`** |
| `/pantry` | `(tabs)/pantry.tsx` | `PantryScreen` | `?staple=<id>` opens that staple's level sheet, then the param is cleared |
| `/saved` | `(tabs)/saved.tsx` | `SavedScreen` | |
| `/onboarding` | `onboarding.tsx` | `OnboardingScreen` | fade transition |
| `/scan`, `/scan/analyzing`, `/scan/confirm` | `scan/*.tsx` | `PlaceholderScreen` ("Coming in Sprint 07.") | full-screen, no nav. BottomNav's Scan **pushes** `/scan` |
| `/mood`, `/suggestions`, `/recipe/[id]`, `/cook/[id]` | `*.tsx` | `PlaceholderScreen` ("Coming in Sprint 08.") | Home "Cook again" and Saved cards push `/recipe/[id]` |
| `/dev/gallery` | `dev/gallery.tsx` | component gallery | `__DEV__` only: long-press Home's logo |

Placeholders have Back (or Home) and a "Back home" button, so navigation never dead-ends. Replace the route file's body with the real screen in Sprints 07 / 08.

### Loading / error pattern

```tsx
const catalog = useCatalog();   // any services/queries hook
<QueryState
  loading={catalog.isLoading}
  errorMessage={catalog.errorMessage}   // already toUserMessage copy
  onRetry={catalog.refetch}
  placeholder="chips"                   // or 'blocks' (+ blocks / blockHeight)
  errorTitle="Couldn't load moods"      // default "Couldn't load this"
>
  {/* rendered once data is there */}
</QueryState>
```

- **Error wins over loading.** The error state is an `EmptyState` with "Try again".
- **Mutations** (`useDetectIngredients`) expose `isPending` / `errorMessage`; show them inline (Sprint 07).
- **Writes** to SQLite never block the UI. A failure toasts "Couldn't save that change" automatically.

### Screen notes (mockup parity)

- **Onboarding:**
  - Slides use `PhotoHero` (500pt) + `HeroFadeContinuation`, a glass "Skip", dots (4 = 3 slides + setup), and "Next" / "Set up my kitchen".
  - Taste setup has diet chips (single), allergy chips (multi, check icon), and a household stepper (1-8), all from `useCatalog()`.
  - "Let's cook" → `completeOnboarding()` (diet + servings into prefs) → `/` → toast "Welcome to FridgeChef".
- **Home:**
  - Search toasts "Coming soon".
  - The bell shows a red dot when staples are low; its toast says "N staples running low".
  - Mood chips set `prefs.mood`.
  - The lime ticket shows `lastScanLabel(lastScan)`.
  - Running low cards deep-link to the Pantry sheet.
  - Cook again shows 2 compact cards, **match %** from `match(snapshot, useKitchen(), prefs.servings)`.
- **Pantry:**
  - Header shows the staple count.
  - "Staples are remembered" InfoCard (**no icon**) with the auto-include Toggle.
  - Category chips, Running low, then the "All staples" / category list (or EmptyState).
  - Level sheet: big "N / 5 left", 52pt LevelBars input, Empty / Full, pack size, last updated, Remove (danger) and Mark refilled.
  - Add sheet: SearchField (in-sheet) filters `catalog.stapleSuggestions` not already in the pantry.
  - Toasts: "Marked as refilled", "Removed X", "X added to your pantry".
- **Saved:**
  - Compact cards with `stat="effort"` (**no %**), or the "Nothing saved" EmptyState → "Find recipes" → `/scan`.
  - Profile rows: Diet (sheet), Allergies (sheet), Household stepper; **Default effort = plain SegmentedControl** (no `level`); Units; Replay onboarding.
  - Reset demo data asks for confirmation, then `useResetDemoData()`: `resetAll()` + the mock DB reseed + `appQueryClient.clear()`. The toast says "Demo data reset" and the gate redirects to onboarding.

## Changed files (uncommitted, for the user to review)

Sprints 02-05 are also still uncommitted. This sprint's changes:

- **Added:**
  - `fridgechef-app/metro.config.js`
  - Routes: `fridgechef-app/src/app/(tabs)/{_layout,index,pantry,saved}.tsx`, `src/app/onboarding.tsx`, `src/app/scan/{index,analyzing,confirm}.tsx`, `src/app/{mood,suggestions}.tsx`, `src/app/recipe/[id].tsx`, `src/app/cook/[id].tsx`
  - Screens: `src/screens/{OnboardingScreen,HomeScreen,PantryScreen,SavedScreen,PlaceholderScreen}.tsx`, `src/screens/{shared,confirm}.ts`, `src/screens/shell/{AppTabBar,BootErrorScreen,AppEffects}.tsx`, `src/screens/shell/useBoot.ts`
  - Component: `src/components/QueryState.tsx`
  - State: `src/state/boot.ts`
  - Tests: `src/__tests__/app-flows.test.tsx`, `src/components/__tests__/queryState.test.tsx`, `src/state/__tests__/defaultStaples.test.ts`
  - Sprint docs: `sprints/06-shell-core-screens/HANDBOOK.md`
- **Modified:**
  - `fridgechef-app/src/app/_layout.tsx` (the shell)
  - `app.config.ts` (`web.output: 'single'`)
  - `package.json` / `package-lock.json` (expo patch updates)
  - `jest.setup.ts` (stateful sheet mock)
  - `src/components/Sheet.tsx` (footer item sizing)
  - `src/state/{persist,pantryStore,appStores,index}.ts`
  - `src/db/repositories/metaRepo.ts` (`default_staples_checked`)
  - `src/services/api/index.ts` (`resetBackendData`)
  - `src/services/queries/{QueryProvider.tsx,hooks.ts,index.ts}`
  - `README.md`
  - `CLAUDE.md`
  - `sprints/README.md`
  - `sprints/06-shell-core-screens/TODO.md`
  - `sprints/reference/{decisions,architecture}.md`
- **Deleted:** `fridgechef-app/src/app/index.tsx` and `src/__tests__/index-route.test.tsx` (the Sprint 01 placeholder).

## Decisions and deviations

Decisions D37-D42 were appended to `sprints/reference/decisions.md`:

- **D37:** route structure (`expo-router/js-tabs`, Scan is a push, onboarding redirect in `(tabs)/_layout`).
- **D38:** the boot gate, write-failure toasts in all builds, once-per-install default staples.
- **D39:** `QueryState` and the `appQueryClient` singleton.
- **D40:** test infrastructure for app flows (stateful sheet mock, `renderRouter` quirks).
- **D41:** the web preview with real SQLite (`metro.config.js` + `web.output: 'single'`) and `confirmDestructive`.
- **D42:** screen-level deviations:
  - The Home scan ticket isn't one pressable card; the camera disc and "Scan now" are the actions.
  - Sheet footer buttons grow from their content width.
  - Empty sections are hidden.
  - Copy for a missing last scan or an empty name.
  - Pantry categories: the mockup's list plus extras.
  - Expo patch updates.

Other notes:

- **Cook again %:** the demo user has **no confirmed scan** (D30), so the Cook again % on Home is lower than in the mockup (which had detected items): 44% / 56% vs the mockup's numbers. It rises after a scan (Sprint 07).
- **Onboarding images** are the mockup's remote Unsplash URLs (`screens/shared.ts`). Offline they fall back to initials (FallbackImage). Sprint 09 may bundle them as assets.

## Handovers to the next sprint

**Sprint 07 (scan → confirm):**
- **Routes:** replace the bodies of `src/app/scan/{index,analyzing,confirm}.tsx` (keep them thin: render new screens). They're already full-screen stack routes with no nav.
- **Navigation:** `/scan` is pushed from BottomNav, Home ("Scan now", the camera disc) and Saved's "Find recipes". Go back with `router.back()`.
- **Detection:** `useDetectIngredients()` from `@/services/queries` sets `scan.detecting` and writes the result to the scan store. Call `scan.resetScan()` first for a new scan.
- **Demo photos:** `listDemoPhotos()` feeds "Use demo photos"; it returns `[]` in http mode.
- **Loading and errors:** use `QueryState` for anything fetched. A failed write already toasts.
- **Sheets:** use `Sheet` with `open` / `onClose`. Under Jest the content exists only while open, so tests open it the way a user does.
- **App-level tests:** copy the setup from `src/__tests__/app-flows.test.tsx` (`renderApp(url)`, `seedUser()`, the reanimated `/mock` override, `await fireEvent`, `pathname()`).
- **Typed routes:** after adding a route file, run `npm run web` (or `npm start`) once so `.expo/types/router.d.ts` regenerates; otherwise `tsc` rejects the new hrefs.

**Sprint 08 (mood → cook):** replace `mood.tsx`, `suggestions.tsx`, `recipe/[id].tsx` and `cook/[id].tsx`. Saved and Home already push `/recipe/[id]` with snapshot recipes, and `useRecipe(id)` shows the snapshot instantly.

**Sprint 09 (polish):**
- **Web white flash:** the web preview flashes white until JS loads (body background). iOS uses the native splash, so this is web-only.
- **Warning to trace:** `props.pointerEvents is deprecated` still logs once on web (not from our components since Sprint 03; probably a library).

**Security note (carried):** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. A secret LLM-provider key must stay on a server, never in this app.

**Carry-over (verbatim from TODO.md):**
- `[ ] Manual smoke on Expo Go: onboarding → home → pantry → saved → kill + reopen (SQLite persistence) → reset demo data`

The Sprint 03 sheet-animation check is folded into this one: on the web preview, gorhom sheets visibly opened and closed when the pane was visible.

## Known issues / tech debt

- **Hidden browser pane:** when the agent's browser pane is hidden, `document.hidden` is true, so lazy `<img>`s don't load and animations pause. The images loaded as soon as the pane was visible. It's an environment artefact, not an app bug.
- **`web.output: 'single'`:** web is a dev preview only (D11). If a real web build is ever wanted, static output needs expo-sqlite's worker to bundle under server rendering. Re-check on the next Expo release.
- **Router test library quirks** (D40): `renderRouter` forces fake timers, returns RNTL 14's promise with the helpers on it, and swaps in Reanimated's legacy mock. All are handled in the flow test. Re-check after expo-router updates.
- **Stale typed routes:** `.expo/types/router.d.ts` only regenerates on `expo start`, not on `expo export` (`verify`). A stale local file can fail `tsc` after route changes (see the handover).
- **`npm audit`:** the same 14 moderate transitive advisories. The patch updates didn't change them.

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm run web          # http://localhost:8081 - fresh browser profile = first launch (onboarding)
npm start            # Expo Go on an iPhone (the carry-over smoke)
npm test -- src/__tests__/app-flows.test.tsx
```

To see the first launch again: Saved → "Reset demo data" (confirm), or clear the site data in the browser.

## Build verification pass

```
npm run verify   → PASS
  typecheck   tsc --noEmit: 0 errors (with freshly generated typed routes)
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 21 suites, 285 tests passed
  ios export  "iOS Bundled ... (2160 modules)" → .verify-dist (the whole app is now in the
              bundle: still no node:sqlite / createNodeDriver / test fixtures in it)
npx expo-doctor  → first run: 1 check failed (patch mismatches expo 57.0.26, expo-router 57.0.24,
                   expo-constants 57.0.20, released since Sprint 05) → `npx expo install --fix`
                   → PASS: 21/21 checks passed. verify re-run after the update: PASS (same counts).
npm run format:check → PASS
Manual smoke (web preview, 375 × 812, real SQLite in the browser):
  - first launch → boot seeds the demo user → redirect to /onboarding
  - slides → Skip → taste setup (diets / allergies from the mock catalog) → "Let's cook"
    → Home + toast "Welcome to FridgeChef"
  - Home: mood chips, lime scan ticket ("2 days ago · 11 items"), Running low (3) cards,
    Cook again cards (44% / 56%), floating BottomNav; compared side by side with the mockup's
    #/home at the same size: same sections, order and styling
  - Running low "Salt" card → /pantry with Salt's level sheet open
  - Pantry: Turmeric sheet → "Mark refilled" → toast, 5/5 "Updated today", Running low 2;
    full page reload → still refilled, still onboarded (read back from SQLite)
  - Saved: effort cards (no %), Profile rows, plain Default effort, Units
  - BottomNav Scan → /scan placeholder (full screen, no nav, Back)
  - Reset demo data (confirm) → back to onboarding, demo data restored
  - Found and fixed during the smoke: web bundle failing on expo-sqlite's worker (D41),
    nested <button>s in the Home ticket, a truncated "Mark refilled", RN-web's no-op Alert
Manual smoke on Expo Go (iPhone) → NOT RUN: no device reachable (carry-over).
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0, npm 11.17.0.
- Expo SDK 57 (expo 57.0.26, expo-router 57.0.24, expo-constants 57.0.20 after this sprint's patch updates).
- The browser pane was intermittently hidden during the smoke, which paused animations and lazy images (see Known issues).
