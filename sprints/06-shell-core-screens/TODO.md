# Sprint 06 TODO - App shell + core screens

## Start
- [ ] Read handbooks 03 and 05 (+ 02/04 if needed)
- [ ] Read `INSTRUCTIONS.md` + mockup README screen rows 1, 2, 10, 11 + content rules
- [ ] Set Sprint 06 to "In progress" in `sprints/README.md`

## Tasks
- [ ] Root layout: fonts/splash, DB boot gate (`initDatabase` + `hydrateStores`, error + retry), gesture root, safe area, QueryProvider, sheet provider, Toast, StatusBar, dark theme, transitions
- [ ] Route files per INSTRUCTIONS (tabs + stack + placeholders + dev gallery)
- [ ] BottomNav as custom tabBar; Scan pushes full-screen `/scan`
- [ ] Onboarding gate (the first-launch demo seed comes from `initDatabase` in mock mode)
- [ ] Toast for failed store write-throughs
- [ ] OnboardingScreen (slides + taste setup from catalog, loading/error)
- [ ] HomeScreen (moods, scan ticket, running low → pantry sheet, cook again w/ match %)
- [ ] PantryScreen (info card without icon, auto-include, categories, lists, level sheet, add sheet, toasts)
- [ ] SavedScreen (effort cards, diet/allergy sheets, household, plain Default effort, units, replay onboarding, reset w/ confirm)
- [ ] Shared loading/error pattern (QueryState)
- [ ] Tests (onboarding, home, pantry actions, saved rules, boot gate error/retry, reset demo data)

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor`
- [ ] Manual smoke on Expo Go: onboarding → home → pantry → saved → kill + reopen (SQLite persistence) → reset demo data
- [ ] Architecture guard + content-rules tests green

## Close
- [ ] `HANDBOOK.md` (route map, patterns, deviations)
- [ ] Update the status board + decisions
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
