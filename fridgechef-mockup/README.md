# FridgeChef - clickable mockup (final, approved)

A high-fidelity iPhone mockup of **FridgeChef**, built in plain HTML, CSS and vanilla JS with dummy data. You snap your kitchen, confirm the real quantities, set your mood, and cook.
It is the **visual and behavioural source of truth** for the React Native app. Every piece maps 1:1 onto a React Native component.

## Run it

- **Double-click `index.html`.** It works from `file://` because it has no build step and uses no ES modules.
- Or serve the folder: `npx serve .` (or `node ../.claude/static-server.js` from the repo root, then open http://localhost:5173).

Everything is clickable. State (photos, confirmed quantities, pantry levels, saved recipes, preferences) persists in `localStorage`.
Use **Reset demo data** (dev menu, or Profile → Reset demo data) to start over.

- **Dev menu** (top-left, outside the phone): jump to any screen.
- **`#/gallery`**: every screen side by side on the lime backdrop, as 17 frames. Tap a frame to open that exact state.

## Click-path

```
Onboarding (Snap → Confirm → Cook → Taste setup)
  → Home ─┬─ Scan ─ shutter / gallery picker / remove / retake blurry
          │    → Analyzing (auto-advances)
          │    → Confirm QUANTITIES  ← required gate: low-confidence items must be checked
          │    → Your MOOD (mood, time, effort, servings, hunger, cuisine, diet, equipment, spice)
          │    → For you TONIGHT (filters, sort sheet, empty state)
          │    → Recipe detail (Ingredients / Steps / Nutrition / Swaps)
          │    → Cook mode (timer) → "Nice work" sheet → Update pantry → Home (toast + running-low update)
          ├─ Pantry (categories, level editor sheet, add staple, auto-include toggle)
          └─ Saved / Profile (saved recipes, diet & allergy sheets, household, effort, units)
```

The state flows across screens:

1. Photos determine which items get detected.
2. Confirmed quantities drive the match % and the have / short / missing status on each recipe.
3. Mood inputs filter and re-rank the suggestions.
4. After cooking, your stepper amounts are deducted from both fresh items and staple levels. Staples that drop low surface on Home.

## Screen reference (final)

| # | Screen | Key content |
|---|---|---|
| 1 | Onboarding | 3 photo slides (Snap / Confirm / Cook) with a glass "Skip" pill, then a taste setup step (diet, allergies, household). CTA "Let's cook". |
| 2 | Home | Logo, search, bell (red dot if staples are low). "Explore / RECIPES". Mood chips. Lime scan ticket card ("What's in your kitchen?" + camera disc, last scan + "Scan now"). "Running low" staple cards. "Cook again" compact cards showing **match %**. |
| 3 | Scan | Full-bleed camera feed with lime corner brackets. Badge "● Ready", flash toggle, tip pill, blurry-photo warning with "Retake", photo strip (max 6, removable, "+" opens the gallery picker sheet), shutter, flip. CTA **"Analyze N photos"** (text only, no icon). |
| 4 | Analyzing | Fanned photo stack with a sweep line, badge "● Scanning", "8 / 12 FOUND", progress bar, detected chips popping in. Auto-advances to Confirm. |
| 5 | Confirm QUANTITIES | Gate screen. A slider card per item: thumb, name, confidence badge (**"Sure" / "Fairly sure" / "Unsure"**, or "Please check" while unconfirmed), big value + unit, track with an **estimate tick showing only the number** (e.g. "500"), min/max, − / + steppers, unit switch, remove. Low-confidence items come first and need "Looks right" or an edit. "Add missed item" sheet. Collapsible "From your pantry" list with include toggles. |
| 6 | Your MOOD | Mood chips, time slider (10–120 min), effort segmented control **with level bars**, servings, hunger, cuisine, diet, equipment, spice level. CTA "Cook up ideas". |
| 7 | For you TONIGHT | Badge "● N matches", sort sheet, context row (edit → Mood), filter chips, full recipe ticket cards (cuisine · **match %** · effort bars, then have / missing footer). Empty state with "Loosen filters" / "Add 30 min". |
| 8 | Recipe detail | Photo hero with **only back + save** in the top bar (no time/match pills, **no play button**). Title and "Cuisine · Effort · Serves N". Stat tiles: **lime = time ("35 MIN")**, white = kcal, soft-lime = protein. Tabs: Ingredients (servings stepper, have / missing / pantry rows, swap hints) · Steps (dashed curved timeline) · Nutrition · Swaps. CTA "Start cooking" (text only) on a lime bar. |
| 9 | Cook mode | Big "01 / 05", step text, lime timer chip with a **stopwatch icon** (tap to start/pause), "Up next" card, Back / Next. Last step: "Done cooking" opens the "Nice work" sheet with editable used amounts, then "Update pantry". |
| 10 | Pantry | "My / PANTRY" + staple count. "Staples are remembered" card (**no icon**) with an auto-include toggle. Category chips, running low list, all staples. Level-editor sheet (5 big bars, refill, remove) and add-staple sheet. |
| 11 | Saved / Profile | "My / COOKBOOK". Saved compact cards show **effort bars instead of match %**. Profile: diet, allergies, household, **Default effort as a plain segmented control (no bars)**, units, replay onboarding, reset. |

### Content rules (from design review)

- **Never show the word "AI"** anywhere in the UI. Say "Ready", "Scanning", "Sure", or show the estimate as a bare number.
- **No play-button affordances.** Cooking starts from the "Start cooking" CTA only.
- **Use hyphens (-), never em dashes (—)**, in copy.
- Lime is the only accent. The red dot marks "live", low stock, and needs-check states.
- Match % appears on Home "Cook again", Suggestions and Recipe ingredients count. It does **not** appear on the recipe detail stat tiles or the Saved cards.

## Structure

```
index.html
styles/  tokens.css · base.css · components.css · screens.css
js/      util.js · theme.js · icons.js · data.js · logic.js · store.js · router.js · app.js
js/components/  one file per component (44)
js/screens/     Onboarding · Home · Scan · Analyzing · Confirm · Mood · Suggestions · RecipeDetail · CookMode · Pantry · Saved · Gallery
```

**Rules that keep it RN-portable**

- Flexbox only: no grid, floats or sticky.
- Components are pure `Component(props) → HTML` functions that never read global state.
- Screens only compose components. The only exceptions are `t-*` text and `row` / `stack` layout utilities (≈ `<Text>` / `<View>`).
- One delegated handler in `app.js` maps `data-action` → an `actions` map (≈ `onPress`).
- Sliders patch the DOM live while dragging and commit to the store on release.
- `logic.js` (matching, scoring, filters, formatting) is pure. Port it to TypeScript as-is.

## Component → React Native mapping

| Mockup component | React Native |
|---|---|
| `Screen` | `SafeAreaView` + `ScrollView` + absolutely positioned footer |
| `TopBar` | `View` row (or a custom stack header) |
| `AppLogo`, `ScanOverlay`, `StepTimeline` connectors | `react-native-svg` |
| `IconButton`, `Chip`, `PrimaryButton`, `Disc`, `ShutterButton` | `Pressable` + `Text` / icon |
| `ChipRow` | horizontal `ScrollView` (or `View` with `flexWrap`) |
| `Badge`, `LiveBadge`, `CounterPill` | `View` + `Text` (+ `Animated` pulse for the live dot) |
| `HeroTitle` | `View` + two `Text`s (+ `MaskedView` + `LinearGradient` for the title gradient) |
| `TicketCard`, `RecipeCard` (`stat: 'match' \| 'effort'` on compact cards) | `View` halves + `react-native-svg` mask for the notches, dashed `border` |
| `StatTile`, `StatTileRow`, `LevelBars`, `ProgressBar` | `View`s |
| `RangeSlider`, `QuantitySlider` | `@react-native-community/slider` + `Pressable` steppers |
| `SegmentedControl` (options with or without `level`), `TabBar` | `View` row of `Pressable`s |
| `Stepper` | `View` row + two `Pressable`s |
| `Toggle` | `Switch` |
| `BottomNav` | custom `tabBar` for `@react-navigation/bottom-tabs` |
| `BottomSheet` | `@gorhom/bottom-sheet` |
| `Toast` | `react-native-toast-message` |
| `PhotoHero` (+ `c-photohero__after` fade continuation) | `ImageBackground` + `expo-linear-gradient` |
| `PhotoThumbStrip`, `PhotoStack`, `PhotoPicker` | `Image` + `ScrollView` / `expo-image-picker` (`allowsMultipleSelection`) |
| Scan viewfinder | `expo-camera` (`CameraView`, `takePictureAsync`) |
| `SearchField` | `TextInput` |
| `PantryItem`, `IngredientRow`, `ListRow`, `InfoCard`, `FormSection`, `SectionHeader`, `EmptyState`, `DetectedChip`, `PaginationDots` | `View` / `Pressable` compositions |
| Fonts (Bebas Neue, Inter) | `expo-font` / `@expo-google-fonts/*` |
| `store.js` | Zustand stores backed by SQLite repositories (`expo-sqlite`) |
| `router.js` | Expo Router (stack + bottom tabs) |
| `logic.js` | plain TS module / selectors, unchanged |

## Design tokens (`styles/tokens.css` ≙ `js/theme.js`)

| Token | Value |
|---|---|
| `--bg` | `#0A0A0A` |
| `--surface-1 / 2 / 3` | `#161616` / `#1F1F1F` / `#2A2A2A` |
| `--border` | `#2E2E2E` |
| `--lime` (only accent) | `#C6F432` |
| `--lime-soft` / `--lime-deep` | `#E3FA9C` / `#9BC21E` |
| `--light-card` | `#F2F2F2`, gradient `#FFFFFF → #CFCFCF` |
| `--text / -2 / -3` | `#FFFFFF` / `#9A9A9A` / `#5C5C5C` |
| `--ink` | `#0A0A0A` (text on lime / light) |
| `--alert` | `#FF3B30` (live dot, low stock, low confidence) |
| `--photo-fade` | transparent → `#1F3A0E` → `#2B4A12` |
| Fonts | Bebas Neue (display, uppercase), Inter 400/500/600 |
| Type scale | 84 / 56 / 34 / 22 display · 17 / 15 / 13 / 11 body |
| Radii | 32 / 28 / 20 / 14 / pill |
| Spacing | 4 / 8 / 12 / 16 / 20 / 24 / 32 · gutter 16 |
| Motion | 150–250 ms `cubic-bezier(.2,.8,.2,1)` |

## Notes

- Images are Unsplash URLs. Any image that fails (for example offline) swaps to a lime-on-dark tile showing its initials.
- Ingredient detection is simulated here. `data.js` holds the detections (with confidence levels), 25 pantry staples, and 10 recipes. The real app replaces this with a vision + recipe service (see `../sprints/`).
