# Sprint 02 TODO - Design system

## Start
- [ ] Read `sprints/01-bootstrap/HANDBOOK.md`
- [ ] Read `INSTRUCTIONS.md`, `reference/architecture.md`, mockup README + gallery
- [ ] Set Sprint 02 to "In progress" in `sprints/README.md`

## Tasks
- [ ] `theme/tokens.ts` (colors, type, radii, spacing, shadow, motion)
- [ ] Fonts: Bebas Neue + Inter loaded in the root layout, splash held until loaded; `theme/fonts.ts`
- [ ] `AppText` with variants + colour props
- [ ] `Icon` (all mockup icons, typed names) + `AppLogo`
- [ ] Shared pressed-scale helper/hook
- [ ] IconButton
- [ ] Chip + ChipRow (scroll with bleed + wrap)
- [ ] Badge + LiveBadge (pulsing dot)
- [ ] CounterPill
- [ ] PrimaryButton (all variants/sizes/disabled)
- [ ] Disc
- [ ] LevelBars (display + input)
- [ ] StatTile + StatTileRow
- [ ] ProgressBar
- [ ] Toggle
- [ ] Stepper (hideValue, 2-decimal steps)
- [ ] SegmentedControl (level, stacked, sm)
- [ ] TabBar
- [ ] PaginationDots
- [ ] HeroTitle (gradient title via MaskedView)
- [ ] Dev gallery route (`src/app/dev/gallery.tsx`, `__DEV__` only)
- [ ] Content-rules test (no em dash; no "AI" in components/screens/seed modules)
- [ ] Component tests (press, disabled, a11y, stepper maths)
- [ ] a11y pass: roles, labels, 44pt hit areas

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor`
- [ ] Manual: dev gallery vs mockup gallery compared (note differences)
- [ ] No colour literals outside `theme/tokens.ts`

## Close
- [ ] `HANDBOOK.md` incl. the component props API table
- [ ] Update the status board + decisions
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
