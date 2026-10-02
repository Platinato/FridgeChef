# Sprint 08 handbook - Mood → Suggestions → Recipe → Cook → pantry update

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done with carry-over
- **Dates:** 2026-10-01 → 2026-10-01
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

The main loop is complete in the app:

scan → confirm → mood → suggestions → recipe → cook → pantry deducted → Home shows more items running low.

`verify` and `expo-doctor` pass. The open item is the **full loop on a physical iPhone in Expo Go**: no device was reachable from this session. The same loop ran end to end on the **web preview** (real SQLite in the browser) and in the Jest flow suite; the step-by-step record is below.

## What was built

- **`MoodScreen`** (`/mood`):
  - Top bar: back, "Quantities confirmed" badge; "Your / MOOD".
  - Mood chips (catalog moods + icons).
  - Time `RangeSlider` 10-120, step 5, marks 15/30/60/90, big "N MIN".
  - Effort `SegmentedControl` **stacked with level bars**, with the description hint.
  - Servings stepper (1-8, "Recipes scale to this.") and Hunger segmented control.
  - Cuisine chips ("Any" exclusive), diet chips, equipment toggle chips (check / plus icons).
  - Spice `LevelBars` + label (Mild…Fire).
  - Every control writes `prefsStore` (and SQLite). "Cook up ideas" → `/suggestions`.
  - **Redirects to `/scan/confirm` unless the scan is confirmed** (D48).
- **`SuggestionsScreen`** (`/suggestions`):
  - Data: `useSuggestions({ kitchen, prefs, profile })`, then on-device `rankSuggestions`.
  - "N matches" `LiveBadge` and a sort button → "Sort by" sheet (lime check disc on the current sort).
  - Context row "Mood · N min · Effort · N servings" with "Edit" → Mood; filter chips.
  - Full RecipeCards alternating lime / light (match %, effort, have / missing footer).
  - States: skeleton blocks while loading, "Couldn't load recipes" + Try again on error, and "No matches" with "Loosen filters" ("Filters loosened") / "Add 30 min" ("Now N min").
- **`RecipeDetailScreen`** (`/recipe/[id]`):
  - Data: `useRecipe(id)`.
  - Hero: **only back + save** in the top bar, title, "Cuisine · Effort · Serves N".
  - `StatTileRow`: lime time / white kcal / soft-lime protein.
  - Tabs:
    - **Ingredients:** "N of M in your kitchen" + a servings stepper that scales every quantity; `IngredientRow`s with have / short / missing / pantry and the mockup's notes.
    - **Steps:** `StepTimeline`.
    - **Nutrition:** ProgressBars vs. 60 / 90 / 45 g.
    - **Swaps:** InfoCards, or "No swaps needed".
  - "Start cooking" (text only) on the lime footer. Save toggles the cookbook snapshot with a toast.
- **`CookModeScreen`** (`/cook/[id]`):
  - Top bar: close → recipe, name badge, more → "Coming soon".
  - "Step i of n" ProgressBar, big "0i / 0n", step text.
  - The **stopwatch-icon `LiveBadge` lg timer**: real countdown, tap to start / pause, haptic + "Timer done - on to the next step" at 0.
  - "Up next" / "Last step" InfoCard; Back / "Next step" / "Done cooking" footer row.
  - Keeps the screen awake while mounted.
  - **"Nice work" sheet:** a row per used item with a Stepper and a "fresh" / "staple" label.
  - **"Update pantry":** `pantry.applyCooking` (staples + scan items, one transaction) → `cookbook.recordCooked` → `router.dismissTo('/')` → "Pantry updated · N items running low" (newly low only) or "Pantry updated".
- **Shared:** `screens/shared.ts` gets the hunger / spice / time-slider / filter / sort / nutrition lists from the mockup's `data.js`.
- **Packages:** `expo-keep-awake` 57.0.2 and `expo-haptics` 57.0.3, both via `npx expo install`, both in Expo Go.
- **Removed:** `src/screens/PlaceholderScreen.tsx` (no route uses it any more).
- **Tests: 24 suites, 326 tests** (Sprint 07 ended at 23 / 314). `src/__tests__/recipe-flow.test.tsx` (12):
  - Mood: the deep-link redirect; every control bound to prefs.
  - Suggestions:
    - the request carries the confirmed kitchen + prefs; **9 ranked matches** on the default seed
    - a filter chip and sort re-rank **without refetching**
    - empty → "Add 30 min" → "Loosen filters"
    - error → retry
  - Recipe detail: content rules (back + save only, time / kcal / protein tiles, no %, text-only CTA); servings scale 400 g → 600 g; tabs; save toast.
  - Cook mode:
    - the timer ticks, pauses, resets per step, and hits 0 with a toast + haptic
    - Done → Update pantry: **exactly 2 newly low (garam masala, red chilli)**, Home, the toast, "Running low" 3 → 5, chicken 500 → 100 g, persisted
    - a "Nice work" stepper changes the deduction → plain "Pantry updated"

### Route map (all real screens now)

| Path | Screen | Reached from |
|---|---|---|
| `/scan` → `/scan/analyzing` → `/scan/confirm` | Sprint 07 | Home, BottomNav, Saved "Find recipes" |
| `/mood` | `MoodScreen` (redirects to Confirm when not confirmed) | Confirm "Confirm quantities"; Suggestions back / "Edit" |
| `/suggestions` | `SuggestionsScreen` | Mood "Cook up ideas" |
| `/recipe/[id]` | `RecipeDetailScreen` | Suggestions cards, Home "Cook again", Saved cards |
| `/cook/[id]` | `CookModeScreen` | Recipe "Start cooking"; "Update pantry" → `dismissTo('/')` |

## Changed files (uncommitted, for the user to review)

Sprints 02-07 are also still uncommitted. This sprint's changes:

- **Added:**
  - `fridgechef-app/src/screens/{MoodScreen,SuggestionsScreen,RecipeDetailScreen,CookModeScreen}.tsx`
  - `fridgechef-app/src/__tests__/recipe-flow.test.tsx`
  - `sprints/08-recipes-cook/HANDBOOK.md`
- **Modified:**
  - `fridgechef-app/src/app/{mood,suggestions}.tsx`, `src/app/recipe/[id].tsx`, `src/app/cook/[id].tsx` (the placeholders are replaced)
  - `src/screens/shared.ts`
  - `package.json` / `package-lock.json` (expo-keep-awake, expo-haptics)
  - `CLAUDE.md`
  - `sprints/README.md`, `sprints/08-recipes-cook/TODO.md`, `sprints/reference/decisions.md`
- **Deleted:** `fridgechef-app/src/screens/PlaceholderScreen.tsx`

## Decisions and deviations

D48-D52 were appended to `sprints/reference/decisions.md`:

- **D48:** only Mood is gated on a confirmed scan. Suggestions / Recipe / Cook stay reachable from Home and Saved. The static option lists live in `screens/shared.ts`.
- **D49:** `useSuggestions({ kitchen, prefs, profile })` takes the domain input; the mapper builds the wire request. This replaces the instructions' `useSuggestions(toSuggestRequest(...))`, which would put the wire format in a screen. The badge counts after ranking.
- **D50:** recipe detail via `useRecipe`; the servings stepper writes `prefs.servings`; the mockup's ingredient notes.
- **D51:** the `endsAt` timer, haptics, keep-awake, the "Nice work" steppers and `dismissTo('/')`.
- **D52:** test-harness traps (`hydrateStores()` in `beforeEach`; awaited `act`; timer-to-zero on the 1-minute step).

Differences from the mockup:

- **Suggestions context row** truncates at 375pt ("Comfort · 45 min · Moder…" + "Edit"), because `ListRow` keeps one line. The mockup's row has the same width. Sprint 09 can allow two lines.
- **Paused timer caption:** a paused, partly run timer says "Tap to start the timer", exactly as the mockup's three-way caption does (it has no "paused" wording).
- **"Update pantry" returns Home with `dismissTo('/')`**, which pops the whole stack (Suggestions, Recipe, Cook). In the mockup it was a hash change, so its browser history kept those screens.
- **The "N matches" badge is hidden while loading or after an error** (the mockup has no loading state).

## Handovers to the next sprint

**Sprint 09 (polish, QA, release):**
- **Device run:** do the full loop on an iPhone in Expo Go (the carry-over below). Check in particular:
  - the camera (Sprint 07)
  - the keep-awake screen staying on during cook mode
  - the haptic at timer 0
  - the timer staying right after locking / unlocking the phone (it's `endsAt`-based, so it should)
- **a11y audit:** cook mode's big number has `accessibilityLabel="Step i of n"`, and the timer badge announces "Timer mm:ss, running / paused". Sheets and long chip rows still need a VoiceOver pass.
- **Timer in the background:** the countdown pauses visually while the app is backgrounded but stays correct when it comes back. A local notification at 0 would need `expo-notifications`, which is out of scope so far.
- **Copy / layout nits:** the Suggestions context row truncation (above); the long-title wrap on Recipe detail (62pt display) for longer names.
- **Carried from Sprint 07:**
  - the slow web image prep (about 13 s for 6 remote demo photos)
  - the hidden-pane sheet animation artefact
  - Sprint 06's web white flash and the `pointerEvents` deprecation warning

**Sprint 10 (go-live):**
- Suggest requests carry `servings`, so a servings change refetches. The filter chip and sort never refetch.
- `GET /v1/recipes/{id}` is hit once per recipe-detail open to refresh a cached copy (D35).

**Security note (carried):** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. A secret LLM-provider key must stay on a server, never in this app.

**Carry-over (verbatim from TODO.md):**
- `[ ] Manual full loop on iPhone (mock mode), recorded step by step (no device reachable from this session; the same loop passed on the web preview, recorded in the handbook)`
- Still open from earlier sprints: Sprint 07's iPhone camera / gallery / permission checks, and Sprint 06's Expo Go smoke.

## Known issues / tech debt

- **Keep-awake on web** → `useKeepAwake`'s cleanup used to reject with "The wake lock … has not activated yet" when cook mode unmounted before the browser granted the lock → fixed with `suppressDeactivateWarnings: true` (verified on web: no unhandled rejection). iOS isn't affected.
- **Hidden browser pane** (carried) → sheets may not animate up while the agent's pane is hidden. During this sprint's smoke the pane was visible and the "Nice work" sheet opened normally.
- **Cook timer test cost** → each second of countdown is one render. The timer-to-zero test uses the 1-minute step (about 5 s); don't count down a 10-minute step in tests.
- **`npm audit`** → the same 14 moderate transitive advisories (the two new packages added none).

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm run web          # http://localhost:8081 → Scan → "Use demo photos" → Analyze → confirm → Mood → …
npm start            # Expo Go on an iPhone: the full loop (the carry-over)
npm test -- src/__tests__/recipe-flow.test.tsx
```

To start the loop over: Saved → "Reset demo data" (confirm).

## Build verification pass

```
npm run verify   → PASS (final run, after deleting PlaceholderScreen.tsx)
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 24 suites, 326 tests passed (guard + content-rules suites green)
  ios export  "iOS Bundled ... (2192 modules)" → .verify-dist (no node:sqlite / createNodeDriver /
              test fixtures in the bundle)
npx expo-doctor      → PASS: 21/21 checks passed, no issues
npm run format:check → PASS

Manual full loop (web preview, 375 × 812, real SQLite in the browser, mock mode), step by step:
  1. /mood with an unconfirmed scan (re-analyzed in Sprint 07's timing run) → redirected to
     /scan/confirm (the D48 guard)
  2. Confirm: "Looks right" ×3 → "Confirm quantities" → /mood
  3. Mood: "Quantities confirmed", every section present (mood chips, 45 MIN slider + marks, stacked
     effort with level bars + hint, servings 2, hunger, cuisines, diets, equipment, spice "Medium");
     no page-level horizontal scroll
  4. "Cook up ideas" → /suggestions: "9 matches", the same best-match order as the domain test
     (Palak Paneer … Chicken Tikka Wrap); Butter Chicken Lite 91%, "Have 10 of 11 · Missing: fresh
     cream"; "≤ 20 min" → 5 matches; "All" → 9
  5. Butter Chicken → /recipe/butter-chicken: the hero's only buttons are Back + "Save recipe"; tiles
     35 MIN / 540 KCAL / 38G PROTEIN; "10 of 11 in your kitchen"; "You have 500 g"; the title fits
     the gutters (16-359 of 375)
  6. "Start cooking" → /cook/butter-chicken: "Step 1 of 5", "01 / 05", timer 10:00 → tap → 09:57
     after about 3 s → tap → stays 09:57
  7. "Next step" ×4 → "Step 5 of 5", "Last step"; "Done cooking" → "Nice work" sheet slid up: Chicken
     breast fresh 400 g, Tomatoes 3 pcs, Onion 1 pcs, Yogurt 100 g, Garlic 4 cloves, Butter / Garam
     masala / Red chilli powder / Ginger-garlic paste / Salt as staples
  8. "Update pantry" → / with the toast "Pantry updated · 2 items running low"; Running low 1 → 3
     (Turmeric + the newly low Red chilli powder and Garam masala); Cook again now leads with Butter
     Chicken Lite at 73% (100 g chicken left)
  9. Full reload → Running low 3 and Cook again unchanged (read back from SQLite)
  10. Found and fixed: keep-awake's unhandled rejection on unmount (web); re-checked
      recipe → cook → exit: no unhandled rejections
Manual full loop on Expo Go (iPhone) → NOT RUN: no device reachable (carry-over)
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0, npm 11.17.0.
- Expo SDK 57 (expo 57.0.26, expo-router 57.0.24); new this sprint: expo-keep-awake 57.0.2, expo-haptics 57.0.3.
- The browser pane was visible for most of this sprint's smoke. Screenshots at 0.5 scale still came back cropped, so layout was checked with DOM measurements instead.
