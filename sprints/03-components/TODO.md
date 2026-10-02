# Sprint 03 TODO - Composite components

## Start
- [x] Read `sprints/02-design-system/HANDBOOK.md` (+ 01 if needed)
- [x] Read `INSTRUCTIONS.md` + mockup component sources
- [x] Set Sprint 03 to "In progress" in `sprints/README.md`

## Tasks
- [x] Screen (safe area, scroll, scrim, footer variants, flush, overlay)
  - [x] `withNav` only reserves space: the floating nav itself is rendered by the tab navigator (Sprint 06)
- [x] TopBar
- [x] SectionHeader
- [x] FormSection
  - [x] `divider` prop replaces the CSS `.c-form + .c-form` sibling rule
- [x] InfoCard
  - [x] Disc gained `ring={false}` (InfoCard's lime disc has no halo, per CSS)
- [x] ListRow
- [x] EmptyState
- [x] TicketCard (SVG notches, dashed seam, variants, compact, pressable)
- [x] RecipeCard (full + compact with `stat: match | effort`)
- [x] PhotoHero + HeroFadeContinuation
- [x] IngredientRow
- [x] StepTimeline (dashed curved connectors)
- [x] PantryItem (row / card / toggle)
  - [x] Takes `low` + `updatedLabel` from the caller (the mockup called `logic.isLow` / `timeAgo`; components stay presentational)
- [x] RangeSlider (estimate tick, marks, min/max)
- [x] QuantitySlider (badges, stepper, unit switch, remove, "Looks right")
  - [x] Pure `quantityStatus(confidence, touched)` exported for the gate logic tests
- [x] PhotoThumbStrip
- [x] PhotoStack
- [x] ScanOverlay (sweep)
- [x] DetectedChip (pop-in)
- [x] ShutterButton
- [x] Sheet (gorhom wrapper, styled)
  - [x] Fixed: gorhom spreads a style array into `StyleSheet.compose()` (crash on web, silently drops styles on iOS) - pass one flattened style
  - [x] Root layout: `GestureHandlerRootView` + `BottomSheetModalProvider` + `ToastHost`
- [x] Toast config (lime pill)
- [x] SearchField
- [x] BottomNav (pure, for a custom tabBar)
- [x] All composites in the dev gallery
  - [x] Gallery split into Primitives / Composites tabs; the gallery shell itself now uses `Screen` + `TopBar`
- [x] Tests (QuantitySlider, RecipeCard stat, Screen footer, BottomNav, TicketCard)
  - [x] Extra: SectionHeader, ListRow, EmptyState, IngredientRow, PantryItem, PhotoThumbStrip, ShutterButton, StepTimeline, Sheet, geometry helpers (`thumbCenter`, `ticketPath`, `connectorPath`)
  - [x] a11y sweep runs over both gallery tabs
- [x] Extracted helpers: `DashedLine` (iOS can't dash one border side), `FallbackImage` (offline initials tile; IconButton now uses it)
- [x] Moved `pointerEvents` props into `style` (RN / RN-web deprecation)

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
- [x] Manual gallery comparison vs mockup
  - Web preview at 390 wide vs the mockup's Confirm / Recipe / Mood screens. Sheet presentation could not be checked: the browser pane was hidden (rAF paused) - carry-over to Expo Go.
- [x] No imports from `state/`, `services/`, `mocks/` in `src/components` (now enforced by `content-rules.test.ts`)

## Close
- [x] `HANDBOOK.md` (props APIs, deviations, PhotoPicker note)
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
