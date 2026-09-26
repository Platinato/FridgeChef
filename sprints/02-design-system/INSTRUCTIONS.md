# Sprint 02 - Design system: tokens, fonts, icons, primitives

## Before you start

1. Read `sprints/01-bootstrap/HANDBOOK.md`.
2. Read this file and `sprints/reference/architecture.md`.
3. Open the mockup (`fridgechef-mockup/index.html#/gallery`) and keep it open. Read `fridgechef-mockup/README.md` (tokens, content rules, component mapping) and the matching sources in `fridgechef-mockup/js/components/*.js` and `styles/components.css`.

## Goal

The visual foundation: tokens, fonts, icons, and every **primitive** component, pixel-matched to the mockup. Plus a dev-only component gallery route to review them.

## Tasks

1. **Tokens.** Create `src/theme/tokens.ts`, a typed port of `fridgechef-mockup/js/theme.js` / `styles/tokens.css`: colors, type scale, radii, spacing, shadow, motion. Export `theme` as `const`. No hard-coded colours anywhere else.
2. **Fonts**
   - `@expo-google-fonts/bebas-neue` and `@expo-google-fonts/inter` (400/500/600/700).
   - Load them in the root layout with `useFonts`, holding the splash screen (`expo-splash-screen`) until they're loaded.
   - `src/theme/fonts.ts` maps the roles `display` and `body*`.
3. **Text.** Create `src/components/AppText.tsx`, the equivalent of the mockup's `.t-*` utilities.
   - Variants: `display` (uppercase Bebas, line-height ~0.9), `bodyL`, `body`, `caption`, `micro`.
   - Colour props: `text`, `text2`, `ink`, `lime`.
4. **Icons**
   - `src/components/Icon.tsx`: port every path in `fridgechef-mockup/js/icons.js` to `react-native-svg`. `name` is a typed union; props `size`, `color`, `strokeWidth`.
   - `AppLogo.tsx`: the lime disc with a chef hat and check swoosh.
5. **Primitives.** One file per component. Same names and props as the mockup unless RN idioms need a change. Each takes `onPress` instead of `action`.
   - `IconButton`: variants dark / lime / ghost / glass / ink, an `image` thumb option, badge dot.
   - `Chip` and `ChipRow` (horizontal `ScrollView` that bleeds past the right gutter, or wrap mode).
   - `Badge` and `LiveBadge` (red dot with a white ring that pulses via Reanimated; pressable when it has `onPress`; sizes sm / lg).
   - `CounterPill`.
   - `PrimaryButton`: variants black / lime / outline / ghost / light / danger / glass; sizes default / sm / xs; a disabled style.
   - `Disc`.
   - `LevelBars`: display mode and input mode, where each square is pressable.
   - `StatTile` and `StatTileRow` (the first tile is taller).
   - `ProgressBar`.
   - `Toggle`: a custom switch matching the mockup; wrapping RN `Switch` is acceptable if it can be styled to match.
   - `Stepper`: a `hideValue` option; the next value is computed with 2-decimal rounding like the mockup.
   - `SegmentedControl`: options may carry `level` (renders LevelBars); stacked and `sm` variants.
   - `TabBar`.
   - `PaginationDots`.
   - `HeroTitle`: grey kicker plus a huge display title with a white → `#BDBDBD` vertical gradient via MaskedView + LinearGradient; an optional `right` slot.
6. **Pressed feedback.** Pressables scale to 0.97 over 150-250 ms (`cubic-bezier(.2,.8,.2,1)`). Use a shared helper or hook so every component behaves the same.
7. **Dev gallery**
   - `src/app/dev/gallery.tsx`, reachable only when `__DEV__`, e.g. via a long-press on the placeholder logo.
   - Shows every primitive in all its variants and states on the dark background.
8. **Content-rules test.** Add `src/__tests__/content-rules.test.ts`. It fails if any file under `src/` (excluding `__tests__`) contains an em dash (U+2014), or if `src/components` / `src/screens` / the seed modules contain the whole word "AI". The seed modules are `src/db/seeds/` (Sprint 04) and `src/services/api/mock/db/seed/` (Sprint 05); scan those folders if they exist, so the test keeps working as they arrive.
9. **Tests**
   - Render and interaction tests for the primitives: `onPress` fires, disabled blocks presses, accessibility role and label exist, and `Stepper` computes the next value.
   - Snapshot tests are optional. Prefer assertions.

## Accessibility baseline

- Every pressable has `accessibilityRole` and a label.
- Hit areas are at least 44×44 (use `hitSlop` where the visual is smaller).
- Text meets WCAG AA contrast on its background, as in the mockup.

## Out of scope

Composite components (Sprint 03), screens and navigation (Sprint 06).

## Acceptance criteria

- The dev gallery shows all primitives, and side by side with the mockup gallery they match in colour, radius, type and spacing.
- No colour literals outside `theme/tokens.ts`. Check by searching for `#[0-9A-Fa-f]{3,6}` in `src/components`.
- The content-rules test is green.

## Build verification pass

`npm run verify` + `npx expo-doctor`. Do a manual check of the dev gallery in Expo Go if you can, and include screenshots or notes in the handbook.

## End of sprint

Write the handbook: list every component with its props API, which is the main handover for Sprint 03. Update the status board and decisions. Do not commit.
