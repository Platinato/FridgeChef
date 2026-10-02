# Sprint 03 handbook - Composite components

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done
- **Dates:** 2026-09-29 → 2026-09-29
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

All composites are built, in the gallery, and covered by tests; `verify` and `expo-doctor` pass. Two things could only be checked on a device, so they carry over to Expo Go.

1. **Sheet opening.** The browser pane was hidden during the visual check, which paused `requestAnimationFrame`, so the sheet's open animation never ran. A real crash in `Sheet` was found and fixed while debugging this (see Known issues).
2. **Expo Go on a physical iPhone.** Still not done (Sprints 01-02 carry the same item).

## What was built

- **26 new composites / helpers** in `src/components/` (one file each, props API below):
  - Layout: `Screen`, `TopBar`, `SectionHeader`, `FormSection`, `InfoCard`, `ListRow`, `EmptyState`
  - Cards: `TicketCard`, `RecipeCard`
  - Media: `PhotoHero` + `HeroFadeContinuation`, `PhotoThumbStrip`, `PhotoStack`, `ScanOverlay`, `DetectedChip`, `ShutterButton`
  - Rows: `IngredientRow`, `StepTimeline`, `PantryItem`
  - Inputs: `RangeSlider`, `QuantitySlider`, `SearchField`
  - Overlays and nav: `Sheet`, `Toast` (`ToastHost`, `showToast`, `ToastPill`), `BottomNav`
  - Shared helpers: `DashedLine`, `FallbackImage` (+ `initials`)
- **Root layout** (`src/app/_layout.tsx`):
  - `GestureHandlerRootView` → `BottomSheetModalProvider` → `Stack`
  - `ToastHost` mounted last
  - fonts and splash unchanged
- **Primitive tweaks:**
  - `Disc` gained `ring` (default true).
  - `usePressScale(scale, duration?)` gained a duration.
  - `PressableScale.style` accepts Reanimated animated styles.
  - `IconButton` now uses `FallbackImage`.
  - `pointerEvents` moved from props to `style` everywhere (RN / RN-web deprecation).
- **Tokens:** composite colours added as named tokens:
  - `statusScrim`, `bgClear`, `heroFadeEnd`, `navBg`, `grabHandle`, `nodeBorder`, `stepLink`
  - `inkCaption`, `inkDash`, `photoRing`, `ticketWhiteEnd`
  - `infoGlass*`, `infoAlert*`, `qtyFlag*`, `qtyDoneBorder`
  - `markerLine`, `thumb*`, `addTile*`, `softShadow`, `deepShadow`, `scanGlow`
  - also `shadow.stack`, `shadow.small`, `shadow.scanGlow`, and `nav` geometry
- **Dev gallery:**
  - Split into `PrimitivesGallery` + `CompositesGallery` behind a TabBar in `ComponentGalleryScreen`. The shell itself is a `Screen` + `TopBar`.
  - `galleryKit.tsx` holds `Section`, `PhotoBackdrop`, the sample `PHOTOS` (Unsplash ids from the mockup's `data.js`), and `DeviceFrame`, a phone-shaped box with fake safe-area insets for demoing `Screen` / `PhotoHero fill` / `BottomNav`.
  - Every composite is shown with realistic literals and is interactive where it matters: slider, stepper, unit switch, toggles, thumbs remove/add, chip replay, sheet, toast, nav.
- **Tests:** 88 in 6 suites, up from 58.
  - `src/components/__tests__/composites.test.tsx` (28):
    - QuantitySlider: the gate logic (`quantityStatus`), "Looks right", confirmed state, unit switch, Stepper at the bounds, remove
    - RecipeCard: full / compact `match` / compact `effort`, including that no `%` appears on the effort card
    - TicketCard: children, press, and notch path geometry
    - Screen: footer, row footer, overlay, no footer
    - BottomNav: navigation
    - small composites, the Sheet, and the geometry helpers
  - `content-rules.test.ts` also fails if `src/components` imports `state/`, `services/`, `mocks/` or `db/`.
  - `gallery-a11y.test.tsx` sweeps **both** gallery tabs: every pressable has a press role and a label.

## Component props API (main handover for Sprints 06-08)

All components are named exports from `@/components/<Name>`. Pressables use `onPress`, never `action`. Callers pass in anything derived from the domain (match %, low stock, formatted quantities, "2d ago"); components never read stores or the API.

| Component | Props (defaults in brackets) | Notes |
|---|---|---|
| `Screen` | `children`; `footer?: ReactNode` (one element or an array); `footerVariant`: `default` \| `lime` \| `row` \| `clear` [`default`]; `withNav` [false]; `overlay?: ReactNode`; `flush` [false]; `scroll` [true] | Safe-area top padding + 4 (none when `flush`), 16pt gutters, 20pt gap, status-bar scrim. The footer is measured, and the body pads by its height. `withNav` pads for the floating nav but does **not** render it. `row` gives each footer child `flex: 1`. |
| `TopBar` | `left`, `center`, `right` (ReactNode); `overlay` [false] | `overlay` pins it absolutely under the status bar, inside the gutters. |
| `SectionHeader` | `title`; `dot`; `count?: number`; `actionLabel` + `onAction`; `right?` | Header role, labelled "title, count". The action is a 44pt lime text button. |
| `FormSection` | `title`; `hint?`; `right?`; `children`; `divider` [false] | Pass `divider` on every section except the first (the dashed rule the CSS sibling rule drew). |
| `InfoCard` | `title`; `body?`; `icon?`; `variant`: `dark` \| `lime` \| `glass` \| `alert` [`dark`]; `right?`; `footer?` | Disc 40pt: lime (no halo) on dark/glass, ink on lime, dark on alert. The footer sits under a dashed rule. The Pantry "Staples are remembered" card has **no icon** (content rule). |
| `ListRow` | `label`; `detail?`; `icon?`; `onPress?`; `right?`; `danger` | Button with a chevron only when `onPress` is set; `right` replaces the chevron. Labelled "label, detail". |
| `EmptyState` | `title`; `body`; `icon` [`search`]; `actions?: PrimaryButtonProps[]` | Actions render as `sm`, hugging buttons. |
| `TicketCard` | `top`; `bottom?`; `variant` / `bottomVariant`: `lime` \| `light` \| `white` \| `dark` [`lime` / `white`]; `compact`; `onPress?`; `label?` | SVG halves with 14pt concave notches and a dashed seam (24pt inset). With no `bottom` it's a plain rounded card. Scale 0.985. `ticketPath(w, h, seam)` is exported. |
| `RecipeCard` | `recipe: { id, name, timeMin, image?, cuisine, effort }`; `match: { pct, have, total, missing: {name}[] }`; `variant`: `lime` \| `light` \| `white` [`lime`]; `onPress?`; `compact?`; `stat?: 'match' \| 'effort'` | The full card has cuisine · match % · effort, then have / missing. Compact defaults to match % (Home "Cook again"); `stat="effort"` shows effort bars and **no %** (Saved), and `match` becomes optional. The label mirrors the visible stat. |
| `PhotoHero` | `alt`; `uri?`; `height` [440]; `fill` [false]; `fade` [true]; `children` | Bleeds past the gutters (−16pt). The overlay is padded below the status bar. `fill` covers the parent (camera). A missing or failed image shows lime initials. |
| `HeroFadeContinuation` | `children`; `gap` [18] | Place right after a `PhotoHero`: it overlaps by 20pt and fades the dark green to `bg` over 220pt. |
| `IngredientRow` | `name`; `qty` (pre-formatted); `status`: `have` \| `pantry` \| `short` \| `missing`; `thumb?`; `note?`; `last` | Dashed rule under each row except `last`. No thumb shows grey initials. |
| `StepTimeline` | `steps: { text, minutes }[]`; `active` [0] | Each step is one a11y element: "Step n of N: text. m minutes". `connectorPath(h)` is exported. |
| `PantryItem` | `item: { id, name, level, unitHint }`; `low`; `updatedLabel?`; `variant`: `row` \| `card` [`row`]; `toggle?: { on, onChange }`; `onPress?` | `low` → red dot + white bars. `toggle` turns a row into a non-pressable include row (off = 45% opacity). |
| `RangeSlider` | `min`, `max`, `step` [1], `value`; `onChange(v)` (release); `onChanging(v)` (drag); `unit`; `marks?: number[]`; `marker?: { value, label }`; `label`; `bare`; `minLabel?`, `maxLabel?` | Native slider (white thumb) over a drawn 8pt track, fill, halo and marker. `thumbCenter(v, min, max, w)` = 14 + pct × (w − 28). The big lime value shows the live drag value. |
| `QuantitySlider` | `name`; `thumb?`; `confidence?`: `high` \| `med` \| `low`; `touched`; `value`, `min`, `max`, `step`, `unit`; `units?: string[]`; `estimate?`; `onChange(v)`; `onChanging(v)`; `onUnitChange(u)`; `onRemove()`; `onConfirm()` | `quantityStatus(confidence, touched)` gives "Please check" (low and untouched) → "Confirmed" (touched) → "Sure" / "Fairly sure" / "Unsure" / "Added by you". The estimate tick shows a **bare number**. `onChange` fires on release and on every stepper press, so the parent should set `touched` there. The unit switch appears only with ≥ 2 units. Unit **conversion** is the caller's job (domain). |
| `PhotoThumbStrip` | `photos: { id, uri, label, blurry? }[]`; `removable` [true]; `onRemove(id)`; `onAdd?`; `max` [6] | Blurry = red ring + blur 1.5. The "+" tile hides at `max`. The × has 10pt hitSlop (44pt). |
| `PhotoStack` | `photos: { id, uri, label }[]` (first 3; first on top); `scanning` | The top card carries `ScanOverlay` (inset 14). |
| `ScanOverlay` | `sweeping`; `inset`: number \| `{top,right,bottom,left}` [camera framing 19% 9% 50%] | The sweep line ping-pongs every 2.2s (static with Reduce Motion). Hidden from a11y. |
| `DetectedChip` | `name`; `confidence?`; `animate`; `connector` | `low` → red dot, else a lime check. `animate` pops in over 320ms. Pass `connector` on every chip but the first. |
| `ShutterButton` | `onPress`; `disabled` | The lime core squeezes to 0.86 in 120ms. Labelled "Take photo". |
| `SearchField` | `value`; `onChangeText`; `placeholder` ['Search']; `onSubmit?`; `inSheet`; `autoFocus?` | **Use `inSheet` inside a `Sheet`** (gorhom's keyboard-aware input). Lime ring on focus. |
| `Sheet` | `open`; `onClose()`; `title`; `children`; `footer?: ReactNode` (array → equal columns); `tall` | Controlled: set `open`, and `onClose` fires on close button / backdrop / swipe. Sized to content up to 80%, or a fixed 80% with `tall`. |
| `ToastHost` / `showToast(message)` / `ToastPill` | - | `ToastHost` is already mounted in the root layout. Call `showToast('Pantry updated')` from anywhere. |
| `BottomNav` | `active`: `home` \| `scan` \| `pantry` \| `saved`; `onNavigate(tab)`; `floating` [true] | Also exports `NAV_TABS` and `navBottomOffset(insetBottom)`. Tabs have role `tab` and are selected; the active pill animates 52 → 96pt. |
| `DashedLine` | `color` [`colors.dash`]; `thickness` [1]; `dash` [[4, 4]]; `vertical`; `style` | Use it instead of a dashed single-side border. |
| `FallbackImage` | `label`; `uri?`; `style`; `initialsSize` [18]; `fallback`: `gradient` \| `plain` [`gradient`]; `blurRadius?` | Every photo should go through it (offline-safe). |

## Changed files (uncommitted, for the user to review)

Sprint 02's changes are still uncommitted too; these are the Sprint 03 ones.

- **New, `fridgechef-app/src/components/`:**
  - `BottomNav`, `DashedLine`, `DetectedChip`, `EmptyState`, `FallbackImage`, `FormSection`, `InfoCard`, `IngredientRow`, `ListRow`, `PantryItem`, `PhotoHero`, `PhotoStack`, `PhotoThumbStrip`, `QuantitySlider`, `RangeSlider`, `RecipeCard`
  - `ScanOverlay`, `Screen`, `SearchField`, `SectionHeader`, `Sheet`, `ShutterButton`, `StepTimeline`, `TicketCard`, `Toast`, `TopBar` (all `.tsx`)
  - `__tests__/composites.test.tsx`
- **New, `fridgechef-app/src/screens/dev/`:** `CompositesGallery.tsx`, `PrimitivesGallery.tsx` (moved out of the Sprint 02 screen), `galleryKit.tsx`
- **Modified in `src/`:**
  - `components/Disc.tsx`, `IconButton.tsx`, `PressableScale.tsx`
  - `screens/dev/ComponentGalleryScreen.tsx` (rewritten as the tabbed shell)
  - `screens/__tests__/gallery-a11y.test.tsx`, `__tests__/content-rules.test.ts`
  - `theme/tokens.ts`, `app/_layout.tsx`
- **Modified, config:** `jest.setup.ts` (gorhom mock), `package.json` / `package-lock.json`
- **Docs and sprints:**
  - `CLAUDE.md` (design-system notes)
  - `sprints/README.md` (status)
  - `sprints/03-components/TODO.md`, `sprints/03-components/HANDBOOK.md` (new)
  - `sprints/reference/decisions.md` (D22-D26)

New packages (all via `npx expo install`):

| Package | Version |
|---|---|
| `@react-native-community/slider` | 5.2.0 |
| `@gorhom/bottom-sheet` | ^5.2.14 |
| `react-native-toast-message` | ^2.5.2 |

The slider's native module is in Expo Go SDK 57; bottom-sheet and toast are JS on top of Reanimated / Gesture Handler.

## Decisions and deviations

Decisions D22-D26 were appended to `sprints/reference/decisions.md`:

- **D22:** presentational composites with minimal local prop types; an import guard enforces it.
- **D23:** SVG TicketCard halves; `DashedLine`.
- **D24:** native slider with drawn track, fill, halo and marker.
- **D25:** root providers; the gorhom single-style rule; `showToast`.
- **D26:** pure `BottomNav` for `Tabs`; `PhotoPicker` dropped in favour of `expo-image-picker`.

Deviations from the mockup / instructions:

- **`PhotoPicker` is not ported.** The native `expo-image-picker` (multi-select) replaces the mockup's in-app grid (instruction 13). Sprint 07 wires it to `PhotoThumbStrip.onAdd`.
- **Presentational inputs.** `PantryItem` takes `low` / `updatedLabel` instead of calling `isLow` / `timeAgo`. `IngredientRow.qty` and `RecipeCard`'s numbers arrive pre-formatted.
- **Slider thumb.** The native iOS thumb can't be restyled, so the mockup's 5pt lime ring is drawn as a 38pt `limeRing` halo behind it.
- **Glass blur.** Glass variants (InfoCard glass/alert, glass buttons) still have no backdrop blur (D21).
- **Sibling selectors become props:**
  - `FormSection.divider` replaces `.c-form + .c-form`.
  - `DetectedChip.connector` replaces `.c-detected + .c-detected::before`. As in the mockup's CSS, a chip that wraps to a new line still shows its tail in the gap on the left.
- **`Screen.withNav` replaces `nav`.** Screen doesn't render the nav; the tab navigator does (D26).
- **Root layout.** The root layout gained providers (strictly Sprint 06 territory), because Sheet and Toast need them to work anywhere, including the gallery.

## Handovers to the next sprint

Sprint 04 (domain + SQLite) is next in order. Sprints 05 → 06 then use these components.

- **Sprint 06 (shell):**
  - Use `Screen` for every screen.
  - Pass `BottomNav` to Expo Router `Tabs` as `tabBar={(p) => <BottomNav active={...} onNavigate={...} />}`, and set `withNav` on tab screens.
  - Tab route names should map to `NavTab` (`home` / `scan` / `pantry` / `saved`).
  - `ToastHost` and the sheet provider are already in `_layout.tsx`: keep them outermost when the Stack / Tabs structure changes.
- **Sprint 04 (domain):**
  - Make the domain `Recipe` / `Staple` types structurally satisfy `RecipeCardRecipe` / `PantryItemStaple`.
  - Provide `isLow`, `timeAgo`, `match()` and unit formatting / conversion, which screens feed into the components.
  - Sprint 04 also removes the AsyncStorage mock (D14). `jest.setup.ts` now also mocks `@gorhom/bottom-sheet`: keep that.
- **Sprint 07 (Confirm):**
  - Render a list of `QuantitySlider`s.
  - Commit values in `onChange` (release / stepper) and mark `touched` there. Ignore `onChanging` unless you need live totals.
  - Convert units in the domain when `onUnitChange` fires (the gallery shows a demo-only g ↔ kg conversion).
  - Low-confidence items go first (the mockup orders them low → med → high).
- **Styles into gorhom components** (`Sheet`, `BottomSheetView`, `BottomSheetScrollView`): pass **one flattened object**, never an array (see Known issues).
- **Screen-level tests:**
  - Wrap in `SafeAreaProvider initialMetrics={...}` (see `composites.test.tsx`).
  - In Jest, the gorhom mock renders sheet content inline even when closed, so assert on content rather than visibility.
- **Carry-over, device check** (Expo Go on an iPhone): open `/dev/gallery` → Composites and check:
  - the Sheet opens, closes and handles the keyboard with the search field
  - the slider thumb and estimate tick line up (`thumbCenter` vs the native thumb inset)
  - the toast position under the Dynamic Island
  - the TicketCard gradients and notches, and the `boxShadow` on the nav and stack
  - the scan-line sweep
- **Security note (carry into every handbook):** anything prefixed `EXPO_PUBLIC_` is compiled into the bundle and can be extracted. Only a client-safe key may go there, never a secret LLM-provider key.

## Known issues / tech debt

- **gorhom style arrays (fixed here; watch for regressions).** `@gorhom/bottom-sheet` 5.2 runs a style array through `StyleSheet.compose(...array)`.
  - On web that throws for more than 2 entries, which crashed the Sheet.
  - On native, `compose` keeps only the first two styles, so the third is silently dropped.
  - `Sheet` now passes one flattened style.
- **Sheet presentation not visually verified.** The browser pane was hidden (`document.hidden`, rAF paused), so gorhom's `present()` (which runs in `requestAnimationFrame`) never fired. Structure is covered by Jest; the device check above covers the rest.
- **Slider thumb alignment.** The native thumb's travel inset may differ slightly from the mockup's 14pt. If the estimate tick doesn't sit under the thumb at the same value on iOS, adjust `THUMB` in `RangeSlider.tsx`.
- **Peer warning from `npm install`:** `test-renderer@1.3.0` → `react-reconciler@0.34` wants React ^19.3 (RN pins 19.2.3). It's dev-only, it predates this sprint, and tests pass. Revisit when Expo moves to React 19.3.
- **Unchanged:** 14 moderate `npm audit` advisories (transitive through Expo), placeholder icons, splash and bundle id, no glass blur.

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm start                 # Expo Go: long-press the logo → Composites tab
npm run web               # or http://localhost:8081/dev/gallery → Composites
npm test -- src/components/__tests__/composites.test.tsx
```

## Build verification pass

```
npm run verify   → PASS (exit 0)
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 6 suites, 88 tests passed
  ios export  "iOS Bundled ... (2002 modules)" → .verify-dist
npx expo-doctor      → PASS: 21/21 checks passed. No issues detected!
npm run format:check → PASS
Import guard         → content-rules.test.ts: no state/services/mocks/db imports in src/components
Colour literals      → none in src/components or src/screens (enforced)
Manual smoke (web preview, 390x844, against the mockup running side by side):
  - Screen footers (default fade, lime slab, row), withNav + floating BottomNav: match.
  - InfoCard (dark / lime / glass / alert + dashed footer), ListRow, SectionHeader, FormSection: match.
  - TicketCard: real semicircle notches, dashed seams, lime 120deg / light / white gradients: match.
  - RecipeCard full + compact (match / effort): matches the Suggestions / Home / Saved cards.
  - PhotoHero + HeroFadeContinuation + StatTileRow + TabBar + lime footer: matches the recipe detail.
    Offline hero → lime initials on green.
  - QuantitySlider (flagged) side by side with the mockup Confirm card: badge, tint, bare "500"
    tick, fill, thumb halo, min / max, stepper, unit switch, trash, "Looks right": match.
  - IngredientRow, StepTimeline curves, PantryItem row / toggle / card, PhotoThumbStrip, PhotoStack
    (sweep caught mid-animation), ScanOverlay, ShutterButton, DetectedChip, SearchField: as the mockup.
  - Toast: shown via a real key press ("Pantry updated ...").
  - Found and fixed during the check: the Sheet crash (gorhom compose), and the pointerEvents deprecation.
  - Sheet open / close: NOT verified (pane hidden → rAF paused). Carry-over.
  - Expo Go on a physical iPhone: NOT run (no device reachable). Carry-over.
```

## Environment notes

- Windows 11, Node v24.19.0, npm 11.17.0, Expo SDK 57.0.25, RN 0.86.3, React 19.2.3, Reanimated 4.5.1, gorhom bottom-sheet 5.2.14, community slider 5.2.0.
- RN 0.86 removed `StyleSheet.absoluteFillObject`. Use `StyleSheet.absoluteFill` in style arrays, or spell out `position: 'absolute'` + edges in `StyleSheet.create`.
- Browser pane tip for later agents: a tab opened later becomes the front tab, and a hidden pane pauses rAF (and with it gorhom sheets and Reanimated). Check `document.hidden` before trusting an animation test on web.
