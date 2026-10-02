# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules for every agent (non-negotiable)

1. **No worktrees.** Never create or use git worktrees (`git worktree`, isolated worktree sessions, or similar). Work only in this repository's main working tree.
2. **No `git commit` and no `git push`, ever.** Leave all changes uncommitted; the user reviews and commits. Read-only git commands (`status`, `diff`, `log`, `grep`) are fine, and so is `git init` when a sprint needs it.

## What this repo is

FridgeChef is an iOS app (React Native / Expo). The user photographs their fridge or pantry and ingredients are detected. The user **must confirm quantities with sliders** before any recipe is suggested, then picks mood, time, effort and similar preferences to get recipes. Pantry staples are remembered and deducted after cooking.

| Path | What it is |
|---|---|
| `fridgechef-mockup/` | The **approved** clickable HTML/CSS/JS mockup. The source of truth for UI, copy and behaviour. Its `README.md` holds the screen reference, content rules, design tokens and the component → React Native mapping. |
| `fridgechef-app/` | The Expo app (SDK 57, RN 0.86, React 19.2, TS strict, Expo Router with routes in `src/app/`). Scaffolded in Sprint 01. Its `README.md` covers run, env and verify. |
| `sprints/` | The build plan **and the build's memory**: protocol, status board, per-sprint instructions / TODO / handbook, and `reference/` (architecture, API contract, decision log). |
| `MOCKUP_PROMPT.md` | The original design brief. Historical: where it conflicts with the mockup README, the README wins. |
| `.claude/static-server.js`, `.claude/launch.json` | Preview configs: `fridgechef-mockup` (zero-dependency static server, port 5173) and `fridgechef-app` (`expo start --web`, port 8081). |
| `.gitignore`, `.gitattributes` | Repo-level git config (git lives at the repo root, initialised in Sprint 01, no agent commits). |
| `fridgechef-app/docs/API_GO_LIVE.md` | The exact go-live checklist Sprint 10 executes (env, smoke, contract reconciliation, rollback). |
| `fridgechef-app/eas.json` | EAS profiles `development` (needs `expo-dev-client`, not installed) / `preview` / `production`. |

## Working in sprints (mandatory for app work)

All app development follows `sprints/README.md`:

1. Read the **previous sprint's `HANDBOOK.md`**.
2. Read this sprint's `INSTRUCTIONS.md`.
3. Work through and tick `TODO.md`.
4. Finish with the **build verification pass**.
5. Write this sprint's `HANDBOOK.md` from `sprints/_templates/HANDBOOK.md`.
6. Update the status board and `sprints/reference/decisions.md`.

Sprint progress and handovers live only in `sprints/`. Sprint 10 (API go-live) is blocked until the user provides the endpoint + key.

## Commands

Mockup (no build step):

```bash
node .claude/static-server.js          # http://localhost:5173 ; #/gallery shows every screen
```

App (from `fridgechef-app/`; keep this list in sync with `package.json`):

```bash
npm ci                                 # clean install from package-lock.json
npm start                              # expo start (Expo Go on a physical iPhone; this is a Windows machine, no iOS Simulator)
npm run web                            # browser preview via react-native-web, real SQLite in the browser (metro.config.js + web.output single); also regenerates typed routes
npm run verify                         # build verification: typecheck + lint + jest --ci + expo export --platform ios (.verify-dist/)
npx expo-doctor                        # dependency/config health, part of every verification pass
npm run typecheck                      # tsc --noEmit
npm run lint                           # expo lint (eslint-config-expo flat config + eslint-config-prettier)
npm run format                         # prettier --write . (format:check only checks)
npm test -- src/services/__tests__/config.test.ts   # single test file
npm test -- -t "http mode"             # tests matching a name
npm run bundle:ios                     # iOS export only
npx jest --coverage --collectCoverageFrom="src/domain/**" src/domain   # domain coverage (Sprint 04 bar: >= 90% lines)
npm run api:smoke                      # all 4 endpoints through the configured mode: MockApi on a temp in-memory mock DB, or HttpApi against .env (exit 1 on failure)
npx expo install <pkg>                 # always add Expo-managed deps this way (dev deps: add `-- --save-dev`, then check package.json: SDK-versioned packages can still land in dependencies)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-icons.ps1   # regenerate icon / splash / favicon PNGs from the logo geometry
npx eas-cli@latest build -p ios --profile preview                          # EAS build (needs the user's Expo + Apple accounts; never run without them)
```

Testing notes: React Native Testing Library 14 is async (`await render(...)`). Never put tests or helpers under `src/app/`, because every file there is a route; app-level tests go in `src/__tests__/`. Jest runs Reanimated 4 via the worklets resolver + `setUpTests()` (see `jest.config.js` / `jest.setup.ts`). `src/__tests__/content-rules.test.ts` enforces the content rules below plus "no colour literals in components / screens"; `src/__tests__/architecture-rules.test.ts` enforces the layering (domain imports, `expo-sqlite` only in `db/client.ts`, SQL only in repositories / migrations, no `.json` in `src/`, no AsyncStorage) and the API seam (no mock / HttpApi imports or `fetch` outside `services/api`; only `http/request.ts` calls `fetch`; only `services/api/index.ts` builds the APIs; the two `api-contract.md` copies are identical). Store / DB tests run real SQL: `setDatabaseForTests(createNodeDriver())`, `initDatabase({ mode: 'mock' })`, then `createAppStores()` + `hydrateStores(stores)`; `await flushWrites()` before reading back. Test-only fixtures live in `src/testing/` (`mockupData.ts`: the mock seed mapped to domain types; `apiHelpers.ts`: `createMockDb()`, `fastMockApi()`, a fake `fetch` reply). App flow tests (`src/__tests__/app-flows.test.tsx`) render the real routes with `renderRouter('./src/app')` from `expo-router/testing-library`: mock `react-native-reanimated/mock` to the real module, `await fireEvent.*`, read `getPathname()` from the object `renderRouter` returns before awaiting it, `appQueryClient.clear()` after each test, and never `jest.restoreAllMocks()` (D40). `jest.setup.ts` has a stateful `BottomSheetModal` mock: sheet content exists only while presented. Typed routes live in the git-ignored `.expo/types/router.d.ts`: after adding or renaming a route, run `npm run web` (or `npm start`) once, or a stale file fails `tsc` (a fresh clone has none and types hrefs loosely). Scan flow tests (`src/__tests__/scan-flow.test.tsx`) fake `expo-camera` / `expo-image-picker` / `expo-image-manipulator`; fake timers stay on after `renderRouter`, so call MockApi outside `waitFor` with `sleep: async () => undefined`, and assert timer-driven sequences with `waitFor` rather than one `act(advanceTimersByTimeAsync)` (D47). Flow tests that seed state before rendering must `hydrateStores()` after `initDatabase()` (`appStores` is a module singleton; D52), and `act` must be awaited. End-to-end: `src/__tests__/full-loop.test.tsx` runs the whole loop from a seeded database (and again at a seeded 30% mock failure rate, pressing "Try again"); `resilience.test.tsx` covers the error boundary, offline banner, newer-database refusal and a failed write. API hook tests: `setApiForTests(api)` + a `createQueryClient({ queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } })` client (otherwise a gc timer keeps Jest from exiting).

Design system (Sprint 02): tokens in `src/theme/tokens.ts` (the only place colours live), fonts in `src/theme/fonts.ts`, icons in `src/theme/icons.ts`. Every pressable is built on `src/components/PressableScale.tsx`. Composites (Sprint 03) are presentational: callers pass domain-derived values in; `src/components` never imports `state/`, `services/`, `mocks/` or `db/` (enforced by the content-rules test). Screens are built on `Screen` (footer variants, `withNav`, `flush`) and `TopBar`; dashed rules use `DashedLine`, photos use `FallbackImage`. The root layout hosts `GestureHandlerRootView` + `BottomSheetModalProvider` (for `Sheet`) + `ToastHost` (`showToast()`); anything styled that goes to a `@gorhom/bottom-sheet` component must be a single flattened style object. The dev gallery (`/dev/gallery`, `__DEV__` only: long-press Home's logo) has Primitives / Composites tabs; the props APIs are in `sprints/02-design-system/HANDBOOK.md` and `sprints/03-components/HANDBOOK.md`.

Polish rules (Sprint 09): controls that hold text use `minHeight`, never a fixed `height` (Dynamic Type; `AppText` caps scaling per variant via `FONT_SCALE_CAP`). `Badge` aligns itself to `flex-start`, so wrap it in a plain `View` to centre it. Haptics go through `src/components/haptics.ts` (`tap` / `selection` / `success`; no-op on web). `showToast()` also announces for VoiceOver. Sliders are one `adjustable` element (`RangeSlider`). Text / background pairs are checked against WCAG AA in `src/theme/__tests__/contrast.test.ts` (`text3` is gallery-only). The root layout exports `ErrorBoundary` (`AppErrorScreen` + "Restart"); `AppEffects` renders the `OfflineBanner` (`src/services/network.ts`; only http mode ties TanStack Query to the connection). Boot errors are classified (`bootErrorKind`: a database from a newer app → "Update FridgeChef").

## Architecture (big picture)

See `sprints/reference/architecture.md` for the full picture. The parts that span many files:

- **API seam.** The backend doesn't exist yet. The app runs on an on-device mock database, and going live must only need `.env` changes.
  - Data flows: screens → `services/queries` hooks → the `FridgeChefApi` interface → `MockApi` (reads `fridgechef-mock.db`) **or** `HttpApi` (`EXPO_PUBLIC_API_BASE_URL`), chosen by `EXPO_PUBLIC_API_MODE`.
  - The wire format lives only in `services/api/contract.ts` (Zod), `mappers.ts` and `http/endpoints.ts`.
  - MockApi reads wire DTOs from SQLite and runs them through the same Zod + mappers as HttpApi.
  - Guard tests fail if anything outside `services/api/` imports MockApi / HttpApi / `services/api/mock/**` or calls `fetch`.
  - MockApi answers through a stand-in server (`mock/mockBackend.ts`) and decodes with the same `decodeResponse()` + mappers as HttpApi; a parity test proves both return the same domain data. `fridgechef-mock.db` opens lazily on the first mock call; http mode never opens it.
  - Screens use `services/queries` (`useCatalog`, `useDetectIngredients`, `useSuggestions`, `useRecipe`, each with a ready `errorMessage`) under `QueryProvider`; errors are `ApiError` with a `kind`.
- **Local database (SQLite, `expo-sqlite`).** All app data stays on the phone. There are **no JSON data files**. Full rules: `sprints/reference/architecture.md` → Local database.
  - Two files:
    - `fridgechef.db` holds user data and is owned by `src/db/`.
    - `fridgechef-mock.db` is the mock backend, opened only in mock mode, and seeded from typed TS modules in `services/api/mock/db/seed/`.
  - `expo-sqlite` is imported only in `src/db/client.ts`. Everything else uses the `SqlDriver` port.
  - SQL lives only in `src/db/repositories/` and `services/api/mock/db/`. Screens and components never import `src/db`.
  - Migrations (`src/db/migrations/`, `PRAGMA user_version`) are append-only. Never edit one that has shipped; add a new numbered file.
  - Tests run real SQL through the Node driver `src/db/testing/nodeDriver.ts` (`node:sqlite`), injected with `setDatabaseForTests()`.
- **Env** is read only in `src/services/config.ts`, via static `process.env.EXPO_PUBLIC_*` references.
  - `EXPO_PUBLIC_*` values are bundled into the app, so a secret provider key must never go there.
- **Logic is on-device and pure** (`src/domain/`, a port of the mockup's `js/logic.js`): match %, have / short / missing, scoring, filters, sort, unit conversion, pantry deduction. The backend only detects ingredients and proposes recipes.
- **State is local-first.** Zustand stores in `src/state/` (profile, prefs, pantry, scan, cookbook) hydrate from the SQLite repositories at boot and write every change back through them. There is no `persist` middleware and no AsyncStorage.
  - Boot: `initDatabase()` (`db/bootstrap.ts`: open, migrate, seed once) → `hydrateStores()`. Reset: `resetAll()` (`src/state`).
  - Screens read through `useProfileStore` / `usePrefsStore` / `usePantryStore` / `useScanStore` / `useCookbookStore` (select small slices) and the memoised `useKitchen` / `useLowStaples` / `usePendingChecks`.
  - Every write goes through one queue (`state/persist.ts`); actions update state first and resolve `true` / `false` for the write, never reject.
- **Shell + screens (Sprint 06).** Routes in `src/app` are thin re-exports of `src/screens/*`. Root Stack: `(tabs)` (Home / Pantry / Saved, `expo-router/js-tabs` + `AppTabBar` = `BottomNav`; redirects to `/onboarding` until onboarded), `onboarding`, and full-screen `scan/*`, `mood`, `suggestions`, `recipe/[id]`, `cook/[id]` + `dev/gallery`. The root layout keeps the splash until fonts + `bootApp()` (initDatabase + hydrateStores) settle, shows `BootErrorScreen` on failure, and mounts `AppEffects` (write-failure toast, catalog default staples). Fetched data uses `QueryState` (placeholder / error + Try again). Destructive confirms: `confirmDestructive()`.
- **Scan flow (Sprint 07).** `/scan` (`ScanScreen`: `expo-camera` `CameraView`, permission states, the gallery via `services/media/pickPhotos`, mock-only "Use demo photos" via `useDemoPhotos()`) → `/scan/analyzing` (`prepareImages` → `useDetectIngredients().detectAsync(input, { signal })`, aborted on unmount; staggered reveal; **replaces** itself with Confirm) → `/scan/confirm` (`ConfirmScreen`: the gate, then `confirmScan()` → `/mood`). Scan keeps the session's photos (no auto reset, D45). Photo warnings come from detection (`scan.warnings`, keyed by photo index) and show on Scan and Confirm with "Retake" (`markRetaken(id, uri?)`). Image prep lives only in `src/services/media/` (≤ 1280 px, JPEG 0.7, base64).
- **Recipe flow (Sprint 08).** `/mood` (`MoodScreen`: every control bound to `prefsStore`, catalog-driven; redirects to `/scan/confirm` unless the scan is confirmed) → `/suggestions` (`useSuggestions({ kitchen, prefs, profile })` + on-device `rankSuggestions`; filter chips / sort never refetch) → `/recipe/[id]` (`useRecipe`; back + save only, time / kcal / protein tiles; the servings stepper writes `prefs.servings`) → `/cook/[id]` (`useKeepAwake`; `endsAt`-based step timer + `expo-haptics` at 0; "Nice work" sheet from `defaultUsed` → `pantry.applyCooking` (staples + scan items) → `cookbook.recordCooked` → `router.dismissTo('/')` + the newly-low toast). Static option lists (hunger, spice, filters, sorts, time slider, nutrition maxima) live in `screens/shared.ts`.
- **UI.** Each mockup component in `fridgechef-mockup/js/components/` becomes a same-named RN component in `src/components/`. Tokens in `src/theme/tokens.ts` port the mockup's `js/theme.js`. Screens compose components and never hand-style one-off views.

## Content rules (from design review, enforced by a test)

- Never show the word "AI" in the UI: use "Ready" / "Scanning" / "Sure" / "Fairly sure" / "Unsure", and show estimate ticks as a bare number.
- No play-button icons (the cook timer uses a stopwatch). "Start cooking" and "Analyze N photos" are text-only.
- Use hyphens, never em dashes, in copy.
- Lime `#C6F432` is the only accent; the red dot means live / low / needs check.
- Recipe detail stat tiles are time / kcal / protein, with no match tile. Saved cards show effort, not match %.
