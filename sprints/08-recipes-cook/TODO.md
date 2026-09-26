# Sprint 08 TODO - Mood → Suggestions → Recipe → Cook

## Start
- [ ] Read `sprints/07-scan-confirm/HANDBOOK.md`
- [ ] Read `INSTRUCTIONS.md` + mockup README rows 6-9; click through the mockup flows
- [ ] Set Sprint 08 to "In progress" in `sprints/README.md`

## Tasks
- [ ] MoodScreen (all controls bound to prefsStore; catalog-driven; guard if not confirmed)
- [ ] SuggestionsScreen (useSuggestions + on-device rank/filter/sort; sort sheet; context row; loading / error / empty)
- [ ] RecipeDetailScreen (back + save only; time/kcal/protein tiles; 4 tabs; servings scaling; text-only CTA; save snapshot)
- [ ] CookModeScreen (progress, big step number, stopwatch timer, haptic at 0, up next, back/next, keep-awake)
- [ ] "Nice work" sheet with used steppers → Update pantry → Home + toast (newly low count)
- [ ] Tests (request builder, ranking count 9, filter, empty/loosen, recipe detail rules, servings, timer, deduction → 2 newly low)

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor`
- [ ] Manual full loop on iPhone (mock mode), recorded step by step
- [ ] Guard + content-rules tests green

## Close
- [ ] `HANDBOOK.md` (full-loop result, differences from the mockup)
- [ ] Update the status board + decisions
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
