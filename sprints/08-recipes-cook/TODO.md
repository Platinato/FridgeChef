# Sprint 08 TODO - Mood → Suggestions → Recipe → Cook

## Start
- [x] Read `sprints/07-scan-confirm/HANDBOOK.md`
- [x] Read `INSTRUCTIONS.md` + mockup README rows 6-9; click through the mockup flows (read `js/screens/{Mood,Suggestions,RecipeDetail,CookMode}.js`, the `app.js` actions, `data.js` option lists and `screens.css`)
- [x] Set Sprint 08 to "In progress" in `sprints/README.md`

## Tasks
- [x] MoodScreen (all controls bound to prefsStore; catalog-driven; guard if not confirmed)
  - [x] Static option lists in `screens/shared.ts` (hunger, spice labels, time slider, filters, sorts, nutrition maxima)
- [x] SuggestionsScreen (useSuggestions + on-device rank/filter/sort; sort sheet; context row; loading / error / empty)
- [x] RecipeDetailScreen (back + save only; time/kcal/protein tiles; 4 tabs; servings scaling; text-only CTA; save snapshot)
- [x] CookModeScreen (progress, big step number, stopwatch timer, haptic at 0, up next, back/next, keep-awake)
  - [x] `npx expo install expo-keep-awake expo-haptics` (57.0.2 / 57.0.3)
  - [x] `endsAt`-based timer; renders only when the second changes
  - [x] Web: swallow keep-awake's "has not activated yet" rejection on unmount (`suppressDeactivateWarnings`)
- [x] "Nice work" sheet with used steppers → Update pantry → Home + toast (newly low count)
- [x] Tests (request builder, ranking count 9, filter, empty/loosen, recipe detail rules, servings, timer, deduction → 2 newly low)
  - [x] `src/__tests__/recipe-flow.test.tsx` (12); `toSuggestRequest` itself is covered by Sprint 05's contract tests, so this suite asserts what the screen sends
- [x] Delete the now-unused `src/screens/PlaceholderScreen.tsx`

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
- [ ] Manual full loop on iPhone (mock mode), recorded step by step (no device reachable from this session; the same loop passed on the web preview, recorded in the handbook)
- [x] Guard + content-rules tests green

## Close
- [x] `HANDBOOK.md` (full-loop result, differences from the mockup)
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
