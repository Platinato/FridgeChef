# Sprint 06 TODO - App shell + core screens

## Start
- [x] Read handbooks 03 and 05 (+ 02/04 if needed)
- [x] Read `INSTRUCTIONS.md` + mockup README screen rows 1, 2, 10, 11 + content rules
- [x] Set Sprint 06 to "In progress" in `sprints/README.md`

## Tasks
- [x] Root layout: fonts/splash, DB boot gate (`initDatabase` + `hydrateStores`, error + retry), gesture root, safe area, QueryProvider, sheet provider, Toast, StatusBar, dark theme, transitions
  - [x] `bootApp()` in `src/state/boot.ts`; `useBoot()` + `BootErrorScreen` in `src/screens/shell/`
  - [x] `hydrateStores` moved into `state/appStores.ts` (import cycle with `boot.ts`)
- [x] Route files per INSTRUCTIONS (tabs + stack + placeholders + dev gallery)
  - [x] Removed the Sprint 01 placeholder `src/app/index.tsx` + its test; the gallery opens from a long-press on Home's logo
  - [x] Typed routes: the stale git-ignored `.expo/types/router.d.ts` failed `tsc`; `npm run web` regenerates it (documented in CLAUDE.md)
- [x] BottomNav as custom tabBar; Scan pushes full-screen `/scan`
  - [x] `expo-router/js-tabs` (`Tabs` from `expo-router` is deprecated in v57)
- [x] Onboarding gate (the first-launch demo seed comes from `initDatabase` in mock mode)
- [x] Toast for failed store write-throughs
  - [x] The reporter is no longer dev-only (`state/persist.ts`); `AppEffects` plugs in the toast
- [x] OnboardingScreen (slides + taste setup from catalog, loading/error)
  - [x] Only diets the app understands are offered (`dietOptions`)
- [x] HomeScreen (moods, scan ticket, running low → pantry sheet, cook again w/ match %)
  - [x] Fixed: nested buttons (pressable ticket containing "Scan now"); the camera disc and "Scan now" are the actions (D42)
- [x] PantryScreen (info card without icon, auto-include, categories, lists, level sheet, add sheet, toasts)
  - [x] Fixed: "Mark refilled" truncated in the sheet footer (`Sheet` footer items grow from content width)
  - [x] Fixed: set-state-in-effect lint for the `?staple=` param (adjust state during render)
- [x] SavedScreen (effort cards, diet/allergy sheets, household, plain Default effort, units, replay onboarding, reset w/ confirm)
  - [x] `confirmDestructive()` (native Alert; `window.confirm` on web) and `useResetDemoData()` (user DB + mock DB + query cache)
- [x] Shared loading/error pattern (QueryState)
- [x] Tests (onboarding, home, pantry actions, saved rules, boot gate error/retry, reset demo data)
  - [x] Plus: bottom nav, running-low deep link, add staple, auto-include, diet sheet, replay onboarding, `QueryState`, default staples
  - [x] Stateful `BottomSheetModal` mock in `jest.setup.ts`; `expo-router/testing-library` quirks handled (D40)
- [x] Extra: http-mode default staples (Sprint 05 handover): `pantry.applyDefaultStaples`, once per install
- [x] Extra: web preview runs real SQLite (`metro.config.js` + `web.output: 'single'`, D41)

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
  - [x] Fixed: 3 patch mismatches published since Sprint 05 (`npx expo install --fix`: expo 57.0.26, expo-router 57.0.24, expo-constants 57.0.20)
- [ ] Manual smoke on Expo Go: onboarding → home → pantry → saved → kill + reopen (SQLite persistence) → reset demo data
  - Carry-over: no iPhone reachable from this session. The same path was smoke-tested in the web preview with the real database (see the handbook), including a full page reload for persistence and "Reset demo data".
- [x] Architecture guard + content-rules tests green

## Close
- [x] `HANDBOOK.md` (route map, patterns, deviations)
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
