# Sprint 02 handbook - Design system: tokens, fonts, icons, primitives

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done
- **Dates:** 2026-09-27 → 2026-09-27
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

The sprint is done. The only open item is the Expo Go check on a physical iPhone: no device was reachable, so the gallery was compared on the web preview instead. That's a carry-over, not a blocker.

## What was built

- **Tokens:** `src/theme/tokens.ts`.
  - A typed port of `js/theme.js`: `colors`, `type`, `radii`, `spacing`, `minTouch` (44), `shadow`, `motion`, `device`, and a combined `theme`.
  - Every one-off colour from `components.css` is a named token (`glassBg`, `outlineBorder`, `dangerBorder`, `limeRing`, `barOffOnDark`, `inkMuted`, ...).
  - Gradients come with their CSS stop `locations` (`photoFade`, `heroTitleGrad`, `imageFallbackGrad`, `lightGrad`).
- **Fonts:** `src/theme/fonts.ts`.
  - Bebas Neue 400 and Inter 400/500/600/700, each imported from its own entry point.
  - Roles: `fonts.display`, `fonts.body[weight]`, `bodyFont(weight)`.
  - `src/app/_layout.tsx` loads them with `useFonts` and holds the splash (`preventAutoHideAsync` at module scope, `hideAsync` once loaded or failed).
- **Icons:** `src/theme/icons.ts`.
  - 40 icons generated from the mockup's `js/icons.js` as typed shape data.
  - `IconName` is a typed union, and `iconNames` lists them all.
- **Components** in `src/components/`, one file each:
  - Base: `PressableScale` (plus `usePressScale`, `touchSlop`), `AppText`, `Icon`, `AppLogo`
  - Primitives: `IconButton`, `Chip`, `ChipRow`, `Badge` (plus `StatusDot`), `LiveBadge`, `CounterPill`, `PrimaryButton`, `Disc`, `LevelBars`, `StatTile`, `StatTileRow`, `ProgressBar`, `Toggle`, `Stepper` (plus `stepValue`, `formatStepperValue`), `SegmentedControl`, `TabBar`, `PaginationDots`, `HeroTitle`
- **Dev gallery:** `src/app/dev/gallery.tsx` renders `src/screens/dev/ComponentGalleryScreen.tsx`.
  - Release builds redirect to `/`.
  - To open it, long-press the logo on the placeholder start screen (dev only), or go to `/dev/gallery` on web.
  - It shows the colour tokens, the type scale, all 40 icons, and every primitive in every variant and state, interactive where it makes sense.
  - A `PhotoBackdrop` puts the glass variants on something other than black.
- **Placeholder** (`src/app/index.tsx`): now uses tokens, `AppLogo` and `AppText`, and still reads "FridgeChef · mode: mock".
- **Tests:** 58 in 5 suites, up from 19.
  - `src/__tests__/content-rules.test.ts` checks:
    - no em dash anywhere in `src/`
    - no whole-word "AI" in `components`, `screens`, `db/seeds`, or `services/api/mock/db/seed`
    - no `play` icon
    - no hex / `rgb(a)` / `hsl(a)` literals in `components` or `screens`
  - `src/components/__tests__/primitives.test.tsx` (33 tests) covers presses, disabled states, roles and labels, selected and checked state, hitSlop, Stepper maths, the progress clamp and the tall first tile.
  - `src/screens/__tests__/gallery-a11y.test.tsx` renders the whole gallery and asserts that every pressable (60+) has a press role and a label.

## Component props API (main handover for Sprint 03)

Every pressable is built on `PressableScale`:

- it takes `onPress` (never `action`)
- it sets `accessibilityRole` and `accessibilityLabel`
- smaller visuals get `hitSlop` up to 44pt
- `disabled` blocks the press and the scale animation

All components are named exports, e.g. `import { Chip } from '@/components/Chip'`.

| Component | Props (defaults in brackets) | Notes |
|---|---|---|
| `PressableScale` | all `PressableProps` + `pressedScale` [0.97], `style` | The base for new pressables. `usePressScale(scale)` gives the animated style + handlers; `touchSlop(w, h?)` gives the hitSlop for 44pt. |
| `AppText` | `variant`: `display` \| `bodyL` \| `body` \| `caption` \| `micro` [`body`]; `color`: `text` \| `text2` \| `text3` \| `ink` \| `ink2` \| `lime` \| `alertText` [per variant]; `size` (pt); `weight`: 400 \| 500 \| 600 \| 700; `align`; + `TextProps` | Display is uppercase Bebas at line-height 0.9 (default size 34, so pass `size`). Default colours: display / bodyL / micro → `text`, body / caption → `text2`. Micro is 11pt uppercase, tracked, 0.6 opacity. |
| `Icon` | `name: IconName`; `size` [20]; `color` [`colors.text`]; `strokeWidth` [1.75] | Decorative; the parent carries the label. `testID="icon-<name>"`. |
| `AppLogo` | `size` [48] | Role `image`, label "FridgeChef". |
| `IconButton` | `label` (required); `icon: IconName` **or** `image: string` (uri); `onPress`; `variant`: `dark` \| `lime` \| `ghost` \| `glass` \| `ink` [`dark`]; `badge` [false]; `size` [44]; `disabled` | Scale 0.94. An image that fails to load falls back to lime initials of `label` on the dark-green gradient. |
| `Chip` | `label`; `active` [false]; `icon`; `size`: `md` \| `sm` [`md`]; `onPress` | `accessibilityState.selected = active`. |
| `ChipRow` | `chips: (ChipProps & { key: string })[]`; `wrap` [false] | Scroll mode bleeds 16pt past the right edge, so place it inside the standard gutter. |
| `Badge` | `label`; `variant`: `lime` \| `dark` \| `glass` \| `alert` \| `outline` \| `ink` [`lime`]; `dot`: `red` \| `live`; `icon`; `size`: `sm` \| `md` \| `lg` [`md`]; `onPress`; `accessibilityLabel` | With `onPress` it's a button (slop to 44pt tall); without, it's text. `lg` uses the Bebas 26 style (the cook timer). |
| `StatusDot` | `live` [false]; `size` [8] | Exported from `Badge.tsx`. `live` adds the white ring and a pulsing halo (static when Reduce Motion is on). |
| `LiveBadge` | `Badge` props minus `dot` / `variant` | Always lime with the live dot: "Ready", "Scanning", "3 matches", the timer. |
| `CounterPill` | `icon`; `value` | White icon + 14/600 text, no background. |
| `PrimaryButton` | `label`; `onPress`; `variant`: `black` \| `lime` \| `outline` \| `ghost` \| `light` \| `danger` \| `glass` [`black`]; `size`: `md` 56 \| `sm` 44 \| `xs` 36 [`md`]; `disabled`; `icon`; `iconRight`; `full` [true] | `full={false}` hugs the label. Disabled = `surface3` fill, grey text. Keep "Start cooking" and "Analyze N photos" text-only. |
| `Disc` | `label` or `icon`; `size` [52]; `variant`: `ink` \| `lime` \| `dark` [`ink`]; `onPress`; `accessibilityLabel` | `lime` has the 8pt `limeRing` halo (`boxShadow`). A button only with `onPress`. |
| `LevelBars` | `level` [0]; `max` [5]; `color`: `lime` \| `white` \| `ink` [`lime`]; `size` [10]; `onChange(level)`; `label` | Display mode: role `image`, "Level N of M". With `onChange` (input mode) each square is a button "Level i of M", radius 12, gap 8. |
| `StatTile` | `value`; `caption`; `variant`: `lime` \| `white` \| `soft` [`lime`]; `tall` [false] | 72pt, or 88pt when tall. |
| `StatTileRow` | `tiles: Omit<StatTileProps,'tall'>[]` | The first tile is tall. Recipe detail uses time (lime) / kcal (white) / protein (soft), with no match tile. |
| `ProgressBar` | `value`; `max` [1]; `label`; `caption` ['']; `variant`: `lime` \| `soft` \| `white` [`lime`] | Clamped 0-1. Role `progressbar` with `accessibilityValue`. The fill isn't animated (see known issues). |
| `Toggle` | `on`; `label`; `sub`; `onChange(next)`; `bare` [false]; `disabled` | Custom 52×32 switch; the knob animates 20pt. Role `switch` with `checked`. `bare` keeps the label for accessibility. |
| `Stepper` | `value`; `min` [0]; `max` [99]; `step` [1]; `onChange(next)`; `label` ['Quantity']; `unit`; `hideValue` [false] | Buttons are labelled "Decrease {label}" / "Increase {label}" and disable at the bounds. `stepValue(v, step, ±1, min, max)` rounds to 2 decimals and clamps. `formatStepperValue` is the mockup's `fmtNum`. |
| `SegmentedControl<T>` | `options: { value: T; label; level? }[]`; `value`; `onChange(value)`; `stacked` [false]; `size`: `md` \| `sm` [`md`]; `label` | Role `radiogroup` / `radio`. Segments are equal width; `sm` (the QuantitySlider unit switch) hugs its labels. With `level`, LevelBars render (7pt, ink when active). Mood effort = `stacked` + `level`; Profile "Default effort" = no `level`. |
| `TabBar<T>` | `tabs: { id: T; label }[]`; `active`; `onChange(id)` | Role `tablist` / `tab` (selected). Tabs grow from their content width so labels never truncate. |
| `PaginationDots` | `count`; `active` (0-based) | Role `image`, "Step N of M". |
| `HeroTitle` | `kicker`; `title`; `size` [84]; `right?: ReactNode` | One header element, labelled "{kicker} {title}". The title has a white → light grey gradient via MaskedView (plain white on web). |

## Changed files (uncommitted, for the user to review)

Sprint 01 was committed by the user, so this is the diff on top of it:

- **App config:**
  - `fridgechef-app/package.json` / `package-lock.json` (modified)
  - `jest.config.js` (modified: worklets resolver, `standard-navigation`)
  - `jest.setup.ts` (modified: Reanimated `setUpTests()`)
- **App routes:**
  - `src/app/_layout.tsx` (modified: fonts + splash, tokens)
  - `src/app/index.tsx` (modified: tokens, logo, dev long-press)
  - `src/app/dev/gallery.tsx` (new)
- **Theme** (new): `src/theme/tokens.ts`, `fonts.ts`, `icons.ts`
- **Components** (new): `src/components/` `PressableScale`, `AppText`, `Icon`, `AppLogo`, `IconButton`, `Chip`, `ChipRow`, `Badge`, `LiveBadge`, `CounterPill`, `PrimaryButton`, `Disc`, `LevelBars`, `StatTile`, `StatTileRow`, `ProgressBar`, `Toggle`, `Stepper`, `SegmentedControl`, `TabBar`, `PaginationDots`, `HeroTitle` (all `.tsx`)
- **Screens** (new): `src/screens/dev/ComponentGalleryScreen.tsx`
- **Tests** (new): `src/__tests__/content-rules.test.ts`, `src/components/__tests__/primitives.test.tsx`, `src/screens/__tests__/gallery-a11y.test.tsx`
- **Deleted:** `.gitkeep` in `src/components`, `src/screens`, `src/theme`
- **Docs:** `CLAUDE.md` (testing + design-system notes), `fridgechef-app/README.md` (layout lines)
- **Sprints:** `sprints/README.md` (status), `sprints/02-design-system/TODO.md`, `sprints/02-design-system/HANDBOOK.md` (new), `sprints/reference/decisions.md` (D16-D21)

New packages, all added with `npx expo install` except `@types/node`:

| Package | Version | Type |
|---|---|---|
| `react-native-svg` | 15.15.4 | dependency |
| `expo-linear-gradient` | ~57.0.2 | dependency |
| `@react-native-masked-view/masked-view` | 0.3.2 | dependency |
| `@expo-google-fonts/bebas-neue` | ^0.4.1 | dependency |
| `@expo-google-fonts/inter` | ^0.4.2 | dependency |
| `@types/node` | ^24 | dev dependency (for the file-scanning test) |

## Decisions and deviations

Decisions D16-D21 were appended to `sprints/reference/decisions.md`:

- **D16:** tokens only in `tokens.ts`, enforced by a test.
- **D17:** `PressableScale` as the shared press mechanism, with the mockup's per-component scale values.
- **D18:** per-weight font imports; font weights are selected by family, never with `fontWeight`.
- **D19:** icons as generated data, with no `play` icon.
- **D20:** Jest setup for Reanimated 4 and Expo Router 57.
- **D21:** glass variants have no backdrop blur.

Deviations from `INSTRUCTIONS.md` / the mockup:

- **Pressed scale varies by component.** The instructions say 0.97, but I kept the mockup's own values: 0.94 for IconButton, Disc and input LevelBars squares, 0.92 for Stepper buttons, 0.97 elsewhere. Toggle uses 1 (no scale), like the mockup. The mechanism is shared.
- **`play` icon not ported** (content rules).
- **Props naming:** `size="md"` names the mockup's implicit default for Badge, Chip, PrimaryButton and SegmentedControl. `onChange` replaces `action`/`value` on stateful controls (Stepper, Toggle, LevelBars, SegmentedControl, TabBar). `ChipRow` items need a `key`. `IconButton.label` is required.
- **Extras beyond the spec:**
  - `StatusDot` is exported for reuse.
  - `Stepper`'s maths helpers are exported for tests.
  - `Badge` / `Disc` take `accessibilityLabel` so the cook timer can say "Start the timer" instead of "04:59".
- **No backdrop blur on glass variants** (D21).
- **HeroTitle on web** renders plain white: MaskedView's web build only renders the mask. iOS gets the gradient.
- **The Sprint 01 AsyncStorage mock is untouched.** D14 says Sprint 04 removes it, so I left it for that sprint.

## Handovers to the next sprint

Sprint 03 (composites) and Sprint 04 (domain + SQLite) can both start.

- **Build composites from these primitives only.** Take colours from `colors.*` and fonts from `bodyFont()` / `fonts.display` or `AppText`. The content-rules test fails on colour literals in `src/components` / `src/screens`, so add any new colour to `tokens.ts` under a role name.
- **Composites needing a new press target:** use `PressableScale` + `touchSlop()`. `TicketCard` uses scale 0.985 (per the CSS).
- **Composites waiting in Sprint 03:**
  - TicketCard / RecipeCard notches via `react-native-svg` masks; the dashed separator uses `colors.dashInk` / `colors.dash`.
  - `PhotoHero`: `colors.photoFade` + `photoFadeLocations`.
  - A shared image-with-fallback (the IconButton fallback logic, i.e. initials on `imageFallbackGrad`, is worth extracting).
  - `Screen` with the footer gradient.
  - `BottomNav` with `shadow.float`, which is a `boxShadow` string: RN 0.86 supports `boxShadow` including spread, and the badge ring and Disc halo already use it.
  - `RangeSlider` / `QuantitySlider`: `@react-native-community/slider` still needs `npx expo install`.
- **Glass blur:** decide whether to add `expo-blur` (it's in Expo Go) for the camera and recipe-hero glass controls. Until then, glass is a translucent fill.
- **Tests:** RNTL 14 is async (`await render`). Reanimated works under Jest (D20). For screen-level tests, wrap in `SafeAreaProvider initialMetrics={...}` as `gallery-a11y.test.tsx` does. The gallery sweep automatically covers any primitive you add to the gallery, so add new components to the gallery.
- **Carry-over from Sprint 01 and this sprint:** open `/dev/gallery` in **Expo Go on a physical iPhone**. Check the Bebas line heights, the HeroTitle gradient (native MaskedView), the LiveBadge pulse, `boxShadow` rings, and the Toggle knob animation.
- **Security note (carry into every handbook):** anything prefixed `EXPO_PUBLIC_` is compiled into the bundle and can be extracted. Only a client-safe key may go there, never a secret LLM-provider key.

## Known issues / tech debt

- **ProgressBar fill isn't animated.** The mockup animates the width over 300 ms. It's fine for static uses; for the Analyzing and cook progress screens (Sprints 07-08), animate `width` with Reanimated.
- **Web font rendering** (preview only): Bebas renders slightly bolder on Chrome/Windows than on iOS. Judge type on a device.
- **Web console:** the gallery deliberately loads a broken image URL (`invalid.example`) to show the fallback, so web logs `ERR_NAME_NOT_RESOLVED` once. That's expected.
- **Unchanged from Sprint 01:** 14 moderate `npm audit` advisories (transitive through Expo tooling), placeholder icons and splash, placeholder bundle id.

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm start               # Expo Go: long-press the lime logo → component gallery
npm run web             # or open http://localhost:8081/dev/gallery
npm test -- src/components/__tests__/primitives.test.tsx
npm test -- src/__tests__/content-rules.test.ts
```

## Build verification pass

```
npm run verify   → PASS (exit 0)
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 5 suites, 58 tests passed
  ios export  "iOS Bundled ... (1737 modules)" → .verify-dist; fonts shipped: BebasNeue 400 + Inter 400/500/600/700 only
npx expo-doctor  → PASS: 21/21 checks passed. No issues detected!
npm run format:check → PASS
Colour literals  → `grep -E "#[0-9A-Fa-f]{3,8}" src/components` finds nothing (also enforced by content-rules.test.ts)
Manual smoke     → web preview (expo start --web), 375x812 and 390x844 viewports:
  - Placeholder: lime AppLogo, "FridgeChef · mode: mock" in Inter, dev hint; fonts load (splash held).
  - /dev/gallery: every section checked visually. Found and fixed: SegmentedControl `sm` collapsing to
    zero width, TabBar labels truncating, an `accessible=false` DOM warning from the Svg.
  - Compared with the mockup (Mood + Recipe detail at 390 wide): stacked effort segments with level bars,
    hunger segments, stepper, stat tiles (lime / white / soft), tab bar, `sm` badges and chips match in
    colour, radius, type and spacing. Remaining differences: no glass blur (D21), HeroTitle gradient
    only on native, tab widths distribute leftover space slightly differently from CSS (no truncation).
  - Expo Go on a physical iPhone: NOT run (no device reachable from the agent session). Carry-over.
```

## Environment notes

- Windows 11, Node v24.19.0, npm 11.17.0, Expo SDK 57.0.25, React Native 0.86.3, React 19.2.3, Reanimated 4.5.1, react-native-svg 15.15.4.
- The first Jest run after adding Reanimated / SVG takes about 70 s while the transform cache builds; later runs take about 20 s.
- `src/theme/icons.ts` was produced by a one-off Node script, which isn't kept in the repo. The script evaluated `js/icons.js`, parsed each icon's `<path>` / `<circle>` / `<rect>` into typed shape data, and failed on anything it couldn't parse. The approved mockup is frozen, so edit `icons.ts` by hand if an icon is ever added.
