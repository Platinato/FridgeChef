# Sprint 03 - Composite components

## Before you start

1. Read `sprints/02-design-system/HANDBOOK.md` (component APIs and known issues) and `sprints/01-bootstrap/HANDBOOK.md` if you haven't yet.
2. Read this file, `fridgechef-mockup/README.md` → Component → React Native mapping, and the matching mockup sources in `js/components/` and `styles/components.css`.

## Goal

Every composite / layout component the screens need. All presentational: data in via props, events out via callbacks, no store or API access. Each is added to the dev gallery.

## Tasks

1. **Screen**: the shell every screen uses.
   - Safe areas, a `ScrollView` body with 16 px gutters and a 20 px vertical gap.
   - A status-bar scrim gradient at the top.
   - An optional sticky `footer` with variants default (dark fade) / `lime` (lime slab with a rounded top) / `row` (buttons side by side) / `clear`.
   - Bottom padding when a footer or nav is present, `flush` (no top padding, for full-bleed heroes) and `scroll={false}`.
   - An `overlay` slot for sheets.
2. **TopBar** (left / center / right slots, `overlay` mode over photos), **SectionHeader** (dot, count, action or `right` slot), **FormSection**, **InfoCard** (optional icon; variants dark / lime / glass / alert; `right` + `footer` slots), **ListRow** (icon, label, detail, chevron or custom `right`; danger), **EmptyState**.
3. **TicketCard**: the signature two-part card.
   - The top and bottom halves have **real semicircular notch cut-outs** at the seam, plus a dashed seam line.
   - Recommended approach: draw each half's background as a `react-native-svg` `Path`, with a gradient fill for lime / light variants, sized with `onLayout`. Children are laid out on top.
   - Variants lime / light / white / dark, a compact size, pressable.
4. **RecipeCard**
   - Full card: name, time disc, round photo; then cuisine (dashed pill) · match % · effort bars; then a have / missing footer.
   - Compact card with a `stat: 'match' | 'effort'` prop (the Saved screen uses `effort`).
5. **PhotoHero**: full-bleed `expo-image` + `expo-linear-gradient` fade (`transparent → #1F3A0E → #2B4A12`), a content overlay slot, a `fill` mode, and a `HeroFadeContinuation` block that carries the green fade into the content below.
6. **IngredientRow**: status badges have / pantry / short / missing, plus a note.
7. **StepTimeline**: numbered nodes linked by curved **dashed** SVG connectors, each step with a time badge.
8. **PantryItem**: variants row / card / toggle; low stock shows a red dot and white bars.
9. **RangeSlider** and **QuantitySlider**
   - Use `@react-native-community/slider` with lime minimum track, dark maximum track and a white thumb.
   - Overlay an **estimate tick marker with a bare number label** (no "AI"). Position it with `onLayout` using the same thumb-centre formula as the mockup: `14 + pct × (width - 28)`.
   - Show min/max labels.
   - QuantitySlider adds a thumb image, name, confidence badge ("Sure" / "Fairly sure" / "Unsure", "Please check" while flagged, "Confirmed" when touched), a big value + unit, a Stepper (hideValue), a unit SegmentedControl (sm), a remove IconButton, and a full-width "Looks right" button when flagged.
   - `onChange` fires on release and `onChanging` while dragging, so the parent can avoid re-rendering the list on every tick.
10. **Media and scan visuals**
    - **PhotoThumbStrip**: 64 px thumbs, number badge, remove ×, blurry red ring, a "+" tile.
    - **PhotoStack**: fanned photos.
    - **ScanOverlay**: lime corner brackets + a Reanimated sweep line.
    - **DetectedChip**: pop-in entering animation; dashed connector to the previous chip.
    - **ShutterButton**.
11. **Overlays**
    - **Sheet**: a wrapper around `@gorhom/bottom-sheet` (`BottomSheetModal`) with the mockup styling: grab handle, big display title, close IconButton, scrollable body, footer row.
    - **Toast**: `react-native-toast-message` with a custom lime pill config, positioned under the status bar.
12. **SearchField**: a pill `TextInput` with a search icon, controlled.
13. **BottomNav**: the floating black pill; the active tab is a wide lime pill.
    - Build it as a pure component (`active`, `onNavigate(tab)`), so Sprint 06 can pass it to Expo Router `Tabs` as a custom `tabBar`.
    - Tabs: home, scan, pantry, saved.
    - The mockup's in-app gallery **PhotoPicker** isn't needed: the native `expo-image-picker` replaces it. Record this in the handbook.
14. **Dev gallery**: add every composite with realistic props (use realistic literals defined locally in the gallery; the seed data arrives in Sprints 04 and 05, and components never read the database).
15. **Tests**
    - QuantitySlider: the flagged → confirmed badge logic, a unit switch callback, a Stepper at the bounds.
    - RecipeCard: the `stat` prop renders effort vs match.
    - Screen: renders the footer.
    - BottomNav: calls `onNavigate`.
    - TicketCard: renders its children.

## Out of scope

Stores, API, navigation wiring and real screens.

## Acceptance criteria

- The dev gallery shows every composite, visually matching the mockup, including TicketCard notches and dashed seams, the PhotoHero fade and the StepTimeline curves.
- No component imports from `state/`, `services/` or `mocks/`.
- The content-rules test is still green.

## Build verification pass

`npm run verify` + `npx expo-doctor` + a manual gallery check in Expo Go. Note any rendering differences between the mockup and RN in the handbook.

## End of sprint

Write the handbook with the props API of each composite and any deviations from the mockup. Update the status board and decisions. Do not commit.
