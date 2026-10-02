# Sprint 02 TODO - Design system

## Start
- [x] Read `sprints/01-bootstrap/HANDBOOK.md`
- [x] Read `INSTRUCTIONS.md`, `reference/architecture.md`, mockup README + gallery
  - [x] Noted the SQLite switch (D12-D15) in `architecture.md`: it affects Sprints 04-05, not this sprint
- [x] Set Sprint 02 to "In progress" in `sprints/README.md`

## Tasks
- [x] `theme/tokens.ts` (colors, type, radii, spacing, shadow, motion)
  - [x] Every one-off colour from `styles/components.css` added as a named token (glass, outline, danger, rings, bar-off...)
- [x] Fonts: Bebas Neue + Inter loaded in the root layout, splash held until loaded; `theme/fonts.ts`
  - [x] Import each weight from its own entry point (the package index bundled all 18 Inter files, ~6 MB)
- [x] `AppText` with variants + colour props
- [x] `Icon` (all mockup icons, typed names) + `AppLogo`
  - [x] `theme/icons.ts` generated from `js/icons.js` by a script (40 icons); `play` left out on purpose (content rules)
- [x] Shared pressed-scale helper/hook (`PressableScale`, `usePressScale`, `touchSlop`)
- [x] IconButton
- [x] Chip + ChipRow (scroll with bleed + wrap)
- [x] Badge + LiveBadge (pulsing dot)
- [x] CounterPill
- [x] PrimaryButton (all variants/sizes/disabled)
- [x] Disc
- [x] LevelBars (display + input)
- [x] StatTile + StatTileRow
- [x] ProgressBar
- [x] Toggle
- [x] Stepper (hideValue, 2-decimal steps)
- [x] SegmentedControl (level, stacked, sm)
  - [x] Fixed: `sm` collapsed on web (`flex: 0`); `sm` now hugs its labels like CSS `flex: none`
- [x] TabBar
  - [x] Fixed: labels truncated; tabs now grow from content width (CSS `min-width: auto` behaviour)
- [x] PaginationDots
- [x] HeroTitle (gradient title via MaskedView)
- [x] Dev gallery route (`src/app/dev/gallery.tsx`, `__DEV__` only)
  - [x] Body in `src/screens/dev/ComponentGalleryScreen.tsx`; long-press the logo on the placeholder to open it
- [x] Content-rules test (no em dash; no "AI" in components/screens/seed modules)
  - [x] Extra: no `play` icon, and no colour literals in components/screens
- [x] Component tests (press, disabled, a11y, stepper maths)
- [x] a11y pass: roles, labels, 44pt hit areas
  - [x] `gallery-a11y.test.tsx` sweeps every pressable in the gallery (60+) for a role and a label
- [x] Jest: Reanimated 4 setup (`react-native-worklets/jest/resolver` + `setUpTests()`), `standard-navigation` transformed

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
- [x] Manual: dev gallery vs mockup gallery compared (note differences)
  - Web preview at 375 / 390 pt against the mockup's Mood and Recipe screens; differences are listed in the handbook. Expo Go on an iPhone not available (carry-over).
- [x] No colour literals outside `theme/tokens.ts`

## Close
- [x] `HANDBOOK.md` incl. the component props API table
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
