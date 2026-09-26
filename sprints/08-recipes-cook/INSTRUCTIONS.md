# Sprint 08 - Mood → Suggestions → Recipe → Cook → pantry update

## Before you start

1. Read `sprints/07-scan-confirm/HANDBOOK.md`.
2. Read this file and `fridgechef-mockup/README.md` → Screen reference rows 6-9 and Content rules.
3. Click through the mockup: `#/mood`, `#/suggestions` (filters, sort sheet, empty state), `#/recipe/butter-chicken` (all 4 tabs), `#/cook/butter-chicken` (timer, last step → "Nice work" sheet → Update pantry).

## Goal

The rest of the main flow on the API seam, completing the full loop:

scan → confirm → mood → suggestions → recipe → cook → pantry deducted → Home shows running low.

## Tasks

1. **MoodScreen** ("Your / MOOD")
   - Top bar: back + Badge "Quantities confirmed".
   - Controls, all bound to `prefsStore`, with options from `useCatalog()`:
     - mood chips
     - time `RangeSlider` 10-120, step 5, marks 15/30/60/90, big "N MIN"
     - effort `SegmentedControl` **stacked with level bars**, plus a description hint
     - servings stepper
     - hunger segmented control
     - cuisine chips ("Any" exclusive)
     - diet chips
     - equipment toggle chips
     - spice LevelBars input + label
   - CTA "Cook up ideas" → `/suggestions`.
   - If the scan isn't confirmed (e.g. a deep link), redirect to `/scan/confirm`.
2. **SuggestionsScreen** ("For you / TONIGHT")
   - Data: `useSuggestions(toSuggestRequest(kitchen, prefs, profile))` returns the server's candidate recipes. On-device, apply `rankSuggestions` (match %, the filter chip, sort) from `domain/suggestions`.
   - UI:
     - `LiveBadge` "N matches" (N after filtering)
     - a sort IconButton → sort Sheet (Best match / Quickest / Least effort / Highest protein)
     - the context `ListRow` "Mood · N min · Effort · N servings", "Edit" → Mood
     - filter chips
     - full RecipeCards alternating lime / light, with match %, effort and the have / missing footer
   - States:
     - loading skeleton cards
     - error → EmptyState + retry
     - empty → EmptyState "No matches" with "Loosen filters" and "Add 30 min"
3. **RecipeDetailScreen**
   - The recipe comes from the suggestions cache / cookbook snapshot / `useRecipe(id)`, in that order.
   - PhotoHero: the top bar has **only back + save (heart)**. **No time/match pills and no play button.** Title + "Cuisine · Effort · Serves N".
   - `StatTileRow`: **lime = time ("N MIN")**, white = kcal, soft-lime = protein.
   - `TabBar`:
     - **Ingredients**: "N of M in your kitchen" + servings stepper (scales quantities); `IngredientRow`s with have / short / missing / pantry and notes (swap hint for missing extras).
     - **Steps**: StepTimeline.
     - **Nutrition**: ProgressBars.
     - **Swaps**: InfoCards, or an EmptyState.
   - CTA "Start cooking" (**text only**) on the lime footer → `/cook/[id]`.
   - Save toggles a cookbook snapshot, with a toast.
4. **CookModeScreen**
   - Top bar: close → recipe, name badge, more ("Coming soon").
   - ProgressBar "Step i of n".
   - The big "0i / 0n" and the step text.
   - A **timer chip: LiveBadge lg with a stopwatch icon** that counts down for real and survives re-renders. Tap to start/pause. At 0: haptic + toast "Timer done - on to the next step".
   - An "Up next" InfoCard.
   - Footer row: Back / "Next step"; on the last step, "Done cooking".
   - `expo-keep-awake` while this screen is mounted.
   - "Done cooking" opens the **"Nice work" Sheet**: a row per used item (`defaultUsed`) with a Stepper (fresh item step, or 0.25 for staples) and a "fresh" / "staple" label.
   - "Update pantry" → `pantryStore.applyCooking` + scan-item deduction + `cookbookStore.recordCooked` → Home, then toast "Pantry updated · N items running low" (count only the newly low items; plain "Pantry updated" when there are none).
5. **Tests**
   - `toSuggestRequest` content; the suggestions screen shows the ranked count for the default seed (9) and reacts to a filter chip.
   - The empty state + loosen action.
   - Recipe detail has no play icon and no match tile; the stat tiles are time / kcal / protein.
   - Servings scale quantities.
   - Cook timer ticks (fake timers).
   - The Done sheet → Update pantry makes exactly 2 newly low items for butter chicken on the default seed (garam masala, red chilli), and the toast copy.

## Out of scope

Polish, a11y audit and release config (Sprint 09).

## Acceptance criteria

- The full loop works on an iPhone in mock mode and matches the mockup's behaviour, including the "Running low" count increasing on Home.
- All data access goes through hooks and stores (the guard test is green). The content-rules test is green.

## Build verification pass

`npm run verify` + `npx expo-doctor`. Do a manual full-loop run on a device and record it step by step in the handbook.

## End of sprint

Write the handbook, including the full-loop result and anything that differs from the mockup. Update the status board and decisions. Do not commit.
