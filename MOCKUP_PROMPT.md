# PROMPT — FridgeChef clickable mockup (HTML / CSS / JS)

You are a senior mobile UI engineer and product designer. Build a **high-fidelity, clickable iPhone mockup** of an app called **FridgeChef** using **plain HTML, CSS and vanilla JavaScript with dummy data**. This mockup will be reviewed before the real app is built in **React Native (iOS)**, so structure everything as **reusable components that map 1:1 to future React Native components**.

---

## 1. The product

FridgeChef turns "what's in my kitchen?" into "what can I cook right now?".

1. The user **takes one or more photos** (or **uploads from the gallery**) of their fridge, pantry and kitchen supplies.
2. AI detects the ingredients and **estimates quantities**. Because a single blurry photo can't tell 400 g of chicken from 700 g, the user **must confirm every quantity with a slider** before any recipe is suggested.
3. The user tells the app about themselves right now: **mood, time available, effort they're willing to put in, servings, hunger, cuisine, diet, equipment, spice level**.
4. The app suggests **recipes they can make** with a **brief recipe** (ingredients, short steps, time, nutrition).
5. The app **remembers pantry staples**, meaning things used in small amounts such as spices, oil, salt, sauces, flour and sugar, so the user doesn't have to scan them each time. Their stock levels are tracked and are **deducted automatically after cooking**.

---

## 2. Design system (follow exactly)

The visual language comes from a premium dark sports-app aesthetic: **near-black surfaces, one loud neon-lime accent, huge condensed uppercase headlines, pill shapes everywhere, "ticket" cards with notches, dashed connector lines, and floating pill navigation.**

### 2.1 Colour tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0A` | App background |
| `--surface-1` | `#161616` | Cards on bg |
| `--surface-2` | `#1F1F1F` | Raised cards, sheets |
| `--surface-3` | `#2A2A2A` | Inactive chips, icon buttons |
| `--border` | `#2E2E2E` | Hairlines, dashed lines (use `rgba(255,255,255,.18)` for dashes) |
| `--lime` | `#C6F432` | **Primary accent**: active chips, primary tiles, active nav, badges |
| `--lime-soft` | `#E3FA9C` | Secondary accent tiles |
| `--lime-deep` | `#9BC21E` | Pressed state / gradient end |
| `--light-card` | `#F2F2F2` | Light cards (gradient `#FFFFFF → #CFCFCF`, top to bottom) |
| `--text` | `#FFFFFF` | Primary text on dark |
| `--text-2` | `#9A9A9A` | Secondary text, "Explore"-style labels |
| `--text-3` | `#5C5C5C` | Tertiary / disabled |
| `--ink` | `#0A0A0A` | Text on lime / light surfaces |
| `--alert` | `#FF3B30` | Red "live" dot: low confidence, low stock |
| `--photo-fade` | `linear-gradient(180deg, rgba(10,10,10,.0) 40%, #1F3A0E 85%, #2B4A12 100%)` | Overlay on hero food photos (dark-green fade) |
| Page backdrop (outside phone) | `#9CC43A` | Lime-olive presentation background |

Rules:
- Lime is the **only** accent. Never introduce blue, orange or other brand colours.
- Text on lime is always `--ink` (black).
- Lime elements are flat with no gradients, except the subtle `--lime → --lime-deep` on large hero cards.

### 2.2 Typography
- **Display:** `Bebas Neue` (fallback `Oswald 700`, then `Impact`) from Google Fonts. It is **UPPERCASE**, tight letter-spacing (`-0.5px` to `0`) and line-height ~0.9. Use it for hero words, recipe names, big numbers (times, percentages, quantities) and section labels.
- **Body / UI:** `Inter` (400/500/600) from Google Fonts.
- **Hero title pattern (signature):** two lines. Line 1 is a small word in Inter 400, 28px, `--text-2` (e.g. "Explore", "Confirm", "Your", "For you", "My"). Line 2 is a huge word in Bebas Neue, 72–84px, white (e.g. "RECIPES", "QUANTITIES", "MOOD", "TONIGHT", "PANTRY").
- Scale: display-xl 84 / display-l 56 / display-m 34 / display-s 22; body-l 17 / body 15 / caption 13 / micro 11.

### 2.3 Shape, spacing, elevation
- Radii: `--r-xl 32px` (screen-level cards, phone), `--r-l 28px` (cards), `--r-m 20px` (tiles), `--r-pill 999px` (chips, buttons, badges, nav).
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32. Screen side padding is 16px.
- **Icon buttons:** 44×44 circles, `--surface-3` background, 20px white line icon (1.75px stroke). Use inline SVG and no icon fonts.
- **Ticket cards:** cards with a semicircular **notch cut-out** on the left and right edges at a divider line, plus a **dashed divider** across the card. Use a mask or radial-gradient to cut the notches. Cards stack vertically and can alternate lime and light variants.
- **Dashed connector lines:** thin 1.5px dashed white at 25% opacity, curved (SVG paths). Use them for the recipe step timeline and for connecting detected items in the scan result.
- Shadows are minimal. Separate layers by surface colour, not drop shadows. Floating nav gets `0 10px 30px rgba(0,0,0,.5)`.

### 2.4 Signature components from the reference (reuse them)
- **LiveBadge:** a lime pill with a **red dot** and black text ("● Live"). Reuse it as "● AI Scanning", "● Ready in 25m" and "● 3 low".
- **Counter pill:** an icon plus a number in white on transparent (like "👁 14.5k"). Reuse it as "🧺 11 items" or "⏱ 25m" (draw the icons as SVG, not emoji).
- **Percentage tiles row:** three rounded tiles side by side, one **lime**, one **white** and one **soft-lime**, each with a big Bebas number plus a small caption ("92% MATCH", "540 KCAL", "38G PROTEIN").
- **Square level bars:** 5 small squares (■■■□□), filled white or lime and empty `--surface-3`. Use them for effort and pantry stock level.
- **Floating bottom nav:** a black pill (`#111`, 1px `--border`) floating 16px above the home indicator. The active item is a wide **lime pill** with a black icon. Inactive items are 44px dark circles with white icons.
- **Bottom tab bar:** a dark rounded container with 4 pill tabs where the active one is lime and black. Reuse it for Ingredients / Steps / Nutrition / Swaps.
- **Primary CTA:** a full-width **black pill** (`#0A0A0A`, 56px tall, white Inter 600 17px). On dark screens it sits on a lime or photo area. On plain dark backgrounds, use the **lime-fill variant** with black text.
- **Chip row:** a horizontally scrollable row of pills. Active chips are lime with black text; inactive chips are `--surface-3` with `--text-2` text. The row bleeds off the right edge.
- **App logo:** a lime circle containing a black glyph that merges a chef hat with a check-swoosh. Draw it as an SVG.

### 2.5 Motion
Use 150–250 ms `cubic-bezier(.2,.8,.2,1)`. Chips and buttons scale to 0.97 when pressed. Bottom sheets slide up. Screens cross-fade with a 12px slide. The scan has a lime scan-line sweep. Detected items pop in with scale plus fade, staggered 80 ms.

---

## 3. Architecture rules (must stay React Native-portable)

1. **Flexbox only.** Do not use CSS Grid, floats or `position: sticky`, because React Native only supports flexbox. Absolute positioning is fine where React Native could do the same.
2. **No hover-only interactions.** Everything must be tap-driven.
3. **Pseudo-elements** (`::before` / `::after`) only for pure decoration.
4. **Everything is a component.** Each component is a pure function `ComponentName(props) → HTML string` in its own file, named exactly as the future React Native component (`QuantitySlider.js` becomes `QuantitySlider.tsx`). Screens only compose components and never contain one-off styled markup that should be a component.
5. **Props, not globals:** components read nothing from global state. Screens pass data in.
6. **No build step, no ES modules.** Use plain `<script>` tags in dependency order and attach everything to a global `window.FC` namespace (`FC.components.Chip`, `FC.screens.Home`, etc.) so the mockup **opens by double-clicking `index.html`** (`file://`).
7. **No frameworks or libraries.** Google Fonts is the only external dependency, plus Unsplash image URLs.
8. **Event handling:** use one delegated click/input listener in `app.js` that reads `data-action` / `data-id` attributes. This mirrors React Native `onPress` props.
9. **Design tokens in one place:** `styles/tokens.css` (CSS variables), mirrored in `js/theme.js` (a JS object with the same names, the future `theme.ts`).
10. **State:** `js/store.js` is a tiny store (`getState`, `setState(patch)`, `subscribe(fn)`), persisted to `localStorage` inside a try/catch. Add a "Reset demo data" action.
11. **Routing:** a hash router in `js/router.js` (`#/home`, `#/scan`, `#/recipe/:id`, …).

### Folder structure
```
fridgechef-mockup/
├─ index.html
├─ README.md
├─ styles/
│  ├─ tokens.css
│  ├─ base.css          (reset, phone frame, fonts, gallery backdrop)
│  ├─ components.css    (one section per component, same order as components/)
│  └─ screens.css       (layout-only rules per screen)
└─ js/
   ├─ theme.js
   ├─ data.js           (all dummy data)
   ├─ store.js
   ├─ router.js
   ├─ icons.js          (inline SVG icon set: back, search, bell, camera, gallery, home, pantry, heart, user, clock, flame, plus, minus, close, check, play, timer, more, eye, basket)
   ├─ components/       (one file per component, list below)
   ├─ screens/          (one file per screen, list below)
   └─ app.js            (bootstrap, delegated events, render loop)
```

### Presentation
- Render the app inside an **iPhone frame, 390×844**, with a 48px outer radius, a Dynamic Island, a status bar (9:41, signal, battery) and a home indicator. Centre it on the `#9CC43A` backdrop.
- Add a **`#/gallery` route** that renders **every screen side by side** in scaled phone frames (scale 0.6, wrapping row) on the lime backdrop. It should look like a Dribbble shot, with a label under each frame.
- Add a small floating dev menu (top-left, outside the phone) to jump to any screen and to toggle the gallery.

---

## 4. Reusable components (build all of these)

| Component | Props (key ones) | Notes |
|---|---|---|
| `AppLogo` | size | Lime circle with chef-hat and check glyph |
| `IconButton` | icon, action, variant (`dark`/`lime`/`ghost`), badge | 44px circle; optional red dot badge |
| `HeroTitle` | kicker, title, right (slot) | "Explore / RECIPES" pattern; optional right slot (e.g. avatars) |
| `Chip` | label, active, icon, action | Pill |
| `ChipRow` | chips[], multi | Horizontal scroll, right bleed |
| `Badge` / `LiveBadge` | label, dot (`red`/none), variant | Lime pill with red dot |
| `CounterPill` | icon, value | "👁 14.5k" pattern |
| `PrimaryButton` | label, variant (`black`/`lime`/`outline`), disabled, action | 56px pill |
| `TicketCard` | variant (`lime`/`light`/`dark`), top (slot), bottom (slot) | Notched edges and dashed divider |
| `StatTile` | value, caption, variant (`lime`/`white`/`soft`) | Big Bebas number |
| `StatTileRow` | tiles[] | 3 tiles, equal flex |
| `LevelBars` | level (0–5), max, color | Square bars |
| `QuantitySlider` | name, unit (`g`/`ml`/`pcs`/`cups`), min, max, step, value, aiEstimate, confidence (`high`/`med`/`low`), thumb | **Key component**, see §5.5 |
| `SegmentedControl` | options[], value | Pill segments; active is lime |
| `Stepper` | value, min, max, label | − / value / + |
| `Toggle` | on, label | Lime when on |
| `RangeSlider` | min, max, value, unit, marks | Used for time available and hunger level |
| `BottomNav` | active | Floating pill nav: Home, Scan, Pantry, Saved |
| `TabBar` | tabs[], active | Bottom tab pills |
| `IngredientRow` | name, qty, unit, have (bool), thumb | Have ✓ or missing (red dot) |
| `RecipeCard` | recipe, matchPct, missing[] | Ticket-style card, see §5.7 |
| `StepTimeline` | steps[] | Numbered nodes linked by curved dashed lines |
| `PhotoThumbStrip` | photos[], removable | 64px rounded thumbs with × and a "+" tile |
| `ScanOverlay` | progress | Corner brackets and a lime sweep line |
| `DetectedChip` | name, confidence | Pops in during analysis |
| `PantryItem` | name, level, unit, updatedAt, low | Row with LevelBars |
| `BottomSheet` | title, content (slot), open | Slide-up with a grab handle |
| `Toast` | message | Top toast, lime |
| `EmptyState` | icon, title, body, cta | |
| `SectionHeader` | title, actionLabel | Bebas label plus a small "See all" |

Every component must support the states it needs (active, disabled, pressed, loading) and be used in at least one screen.

---

## 5. Screens and flow

Main flow: **Onboarding → Home → Scan → Analyzing → Confirm Quantities → Your Mood → Suggestions → Recipe Detail → Cook Mode → Done (pantry deducted)**.
Side tabs: **Pantry**, **Saved / Profile**.
The floating `BottomNav` appears on Home, Pantry and Saved only.

### 5.1 Onboarding (3 slides and a setup step)
- Slides: "SNAP" (take photos of your fridge), "CONFIRM" (slide to set real quantities), "COOK" (recipes matched to your mood). Each slide has a large Bebas headline, a food photo with the green fade, and pagination dots (active dot is a lime pill).
- The setup step has chip rows for diet (None, Vegetarian, Vegan, Eggetarian, Keto, High-protein, Jain), allergies (Nuts, Dairy, Gluten, Shellfish, Soy, Eggs), a household-size stepper, and the CTA "Let's cook".

### 5.2 Home — "Explore / RECIPES"
- Top row: `AppLogo` on the left; search and bell `IconButton`s on the right (bell has a red dot).
- `HeroTitle` "Explore / RECIPES".
- `ChipRow` of moods: Comfort · Quick · Healthy · Adventurous · Lazy Sunday · Date night.
- **Scan hero `TicketCard` (lime):** top section reads "WHAT'S IN YOUR KITCHEN?" in Bebas, with a camera icon in a black circle (like the "VS" circle in the reference). Bottom section (light) shows the last scan "2 days ago · 11 items" and a black "Scan now" pill.
- **"Running low"** `SectionHeader` with a horizontal row of small dark cards (Turmeric ■□□□□, Olive oil ■■□□□, Salt ■□□□□), each with a red dot.
- **"Cook again"** `SectionHeader` with two light `TicketCard`s showing recent recipes (name, time, a "PREMIER"-style tag such as "INDIAN" or "15 MIN").
- `BottomNav` with Home active.

### 5.3 Scan
- Full-screen **mock camera viewfinder** with a dummy fridge photo, `ScanOverlay` corner brackets, a top row of back `IconButton` plus `LiveBadge` "● AI Ready" plus a flash `IconButton`.
- Tip pill: "Open the door wide · Good light · Multiple angles".
- Bottom controls: a gallery-upload `IconButton` on the left showing the last-photo thumbnail, a **big shutter** in the centre (white ring, lime inner circle), and a flip `IconButton` on the right.
- Above the controls is a `PhotoThumbStrip` with 3 dummy photos (fridge, pantry shelf, spice rack), each removable, and a "+" tile.
- Tapping the shutter adds a photo (cycle through dummy images) and shows a flash animation. Tapping gallery opens a `BottomSheet` "Choose photos" with a 3-column dummy photo picker that supports multi-select. Build that picker with flex-wrap, not grid.
- CTA (lime variant): **"Analyze 3 photos"**. It is disabled when there are 0 photos.

### 5.4 Analyzing
- The selected photos are stacked like cards with a lime scan-line sweeping across. Show `LiveBadge` "● AI Scanning".
- `DetectedChip`s pop in one by one (Chicken breast, Eggs, Tomatoes, Onion, Spinach, Paneer, Milk, Bell pepper, Garlic, Rice, Yogurt, Lemon), connected by faint dashed lines.
- A progress counter in Bebas ("8 / 12 FOUND"). Auto-advance after ~3 s to Confirm, with a "Skip" option.

### 5.5 Confirm — "Confirm / QUANTITIES" (required gate)
This is the most important screen. **Recipes are never suggested until quantities are confirmed.**
- Header: back button, `CounterPill` "🧺 12 items", `HeroTitle` "Confirm / QUANTITIES".
- Sub-copy: "Photos can be tricky. Slide to the real amount so recipes fit what you actually have."
- Summary strip: "3 need a check ●" (red dot) and "9 look good".
- **Low-confidence items are sorted first**, flagged with a red dot and a "Please check" tag, with a subtle red-tinted border.
- Each item is a `QuantitySlider` card (`--surface-2`, radius 28):
  - Left: a 48px rounded thumbnail cropped from the photo, plus the name in Bebas 22.
  - Right: the big current value in Bebas 34 with the unit ("500 G").
  - The track is dark with a lime fill and a 28px white round thumb. A small **"AI" tick marker** sits at the AI estimate position, with the min and max labels below.
  - A unit switcher appears where it makes sense (g ↔ pcs for eggs and onions, ml ↔ cups for milk).
  - − / + steppers for fine adjustment. A trash icon removes the item.
  - Once the user moves the slider or taps "Looks right ✓", the card shows a lime check and the red flag disappears.
  - Example data: **Chicken breast** estimated 500 g, range 100–1500 g, step 50, **low** confidence; Eggs 6 pcs (0–30); Milk 750 ml (0–2000); Paneer 200 g **low**; Spinach 1 bunch; Rice 1.5 kg **med**.
- "+ Add missed item": opens a `BottomSheet` with search and quick chips (Butter, Potato, Cheese, Bread…) that adds a new slider card.
- **"From your pantry"** collapsible section: the remembered staples (spices, oil, salt, flour…) as compact rows with `LevelBars`, each with a `Toggle` to include or exclude. Header copy: "Auto-included · you don't need to scan these."
- Sticky bottom CTA **"Confirm quantities"**. It stays **disabled** (showing "Check 3 items first") until every low-confidence item has been touched or confirmed. Confirming writes the quantities to the store.

### 5.6 Your Mood — "Your / MOOD" (human parameters)
- **Mood** `ChipRow` with a small SVG icon on each: Comfort · Light & fresh · Adventurous · Lazy · Date night · Post-workout · Sick day · Party.
- **Time available** `RangeSlider` from 10 to 120 min, with the big Bebas value ("30 MIN") and marks at 15/30/60/90.
- **Effort** `SegmentedControl`: Minimal / Moderate / Chef mode, each with `LevelBars` (1/3/5) and a one-line description ("One pan, few steps").
- **Servings** `Stepper` (1–8, defaulting to the household size).
- **Hunger level** `SegmentedControl`: Snack / Meal / Starving.
- **Cuisine** multi-select chips: Any · Indian · Italian · Chinese · Mexican · Thai · Continental · Middle Eastern.
- **Diet** chips, pre-filled from onboarding.
- **Equipment** toggles in a flex-wrap of pills: Stove · Oven · Microwave · Air fryer · Pressure cooker · Blender.
- **Spice level** `LevelBars`-style selector from 1 to 5.
- Sticky CTA **"Cook up ideas"**.

### 5.7 Suggestions — "For you / TONIGHT"
- Header row: back button, `LiveBadge` "● 8 matches", and a sort `IconButton` that opens a sheet (Best match · Quickest · Least effort · Highest protein).
- Filter `ChipRow`: All · Uses everything · ≤ 20 min · One-pan · High-protein.
- A context line reflecting the inputs: "Comfort · 30 min · Moderate · 2 servings" with an edit link back to Mood.
- `RecipeCard` list, alternating lime and light `TicketCard` variants, modelled on the match cards in the reference:
  - Top: the recipe name in big Bebas on the left and a round food thumbnail on the right, with a black circle in the centre showing the time ("25'").
  - Divider with notches.
  - Bottom row of three segments separated by dashed pill outlines: cuisine tag ("INDIAN"), **match % in Bebas 40** ("92%"), and effort `LevelBars`.
  - Footer line: "Uses 9 of your 11 items · Missing: cream" (the missing item gets a red dot) or "You have everything ✓".
- Tapping a card opens Recipe Detail.

### 5.8 Recipe Detail
- **Full-bleed hero food photo** (top ~55%) with the `--photo-fade` green gradient. Top row: back `IconButton`, `CounterPill` "⏱ 25m", `LiveBadge` "● Match 92%", and a heart/save `IconButton`.
- A central lime **play-style circle button** on the photo labelled "Cook", which starts Cook Mode.
- The title in huge Bebas over the gradient ("BUTTER CHICKEN / LITE"), with a subtitle "Indian · Moderate · Serves 2".
- `StatTileRow`: lime "540 KCAL", white "38G PROTEIN", soft "4 STEPS".
- `TabBar`: **Ingredients · Steps · Nutrition · Swaps**.
  - **Ingredients:** `IngredientRow`s scaled to servings, marked "have ✓" (from confirmed quantities) or "missing ●". Pantry staples are tagged "from pantry".
  - **Steps:** `StepTimeline` with 4–6 **brief** steps connected by curved dashed lines. Each step has a time chip.
  - **Nutrition:** simple horizontal bars for macros (flex-based).
  - **Swaps:** "No cream? Use yogurt + 1 tsp butter" cards.
- Sticky black pill CTA **"Start cooking"** on a lime backing bar.

### 5.9 Cook Mode
- One step per screen: a huge Bebas step number ("02 / 05"), the step text in 22px, a `LiveBadge`-style timer chip ("● 08:00", tap to start the countdown, which actually ticks), and a progress bar.
- Prev / Next pills. The last step becomes **"Done cooking"**.
- **Done `BottomSheet`:** "NICE WORK" in Bebas, then "We'll update your kitchen:" with a list of used amounts (Chicken −400 g, Garam masala −1 tsp, Oil −2 tbsp), each editable with a mini stepper. CTA "Update pantry". This deducts from the store, shows a lime `Toast` ("Pantry updated · 2 items running low"), and returns Home.

### 5.10 Pantry — "My / PANTRY" (staples memory)
- `HeroTitle` "My / PANTRY", with a `CounterPill` "24 staples" and an add `IconButton`.
- A card explaining the feature: "Staples are remembered. Spices, oils & basics used in small amounts are tracked here and auto-included in every scan." It has an "Auto-include in scans" `Toggle`.
- Category `ChipRow`: All · Spices · Oils & Fats · Grains & Flours · Sauces · Baking · Dairy basics.
- **"Running low"** section at the top with red dots.
- A list of `PantryItem` rows: the name, a unit hint ("~50 g jar"), `LevelBars` (0–5) and "Updated 3d ago". Tapping a row opens a `BottomSheet` with a `QuantitySlider` or level selector, plus "Mark as refilled" and "Remove".
- Add item: a `BottomSheet` with search and common staples as quick chips.
- `BottomNav` with Pantry active.

### 5.11 Saved / Profile
- Saved recipes as a list of small `TicketCard`s.
- Profile section: diet, allergies, household size, default effort, units (metric/imperial), "Reset demo data".
- `BottomNav` with Saved active.

### 5.12 Empty and edge states (at least these)
- Scan with 0 photos (CTA disabled with a helper text).
- A photo that is too blurry: a warning row "Photo 2 looks blurry, quantities may be off" with "Retake".
- No recipe matches: an `EmptyState` with "Loosen filters" and "Increase time" actions.

---

## 6. Dummy data (`js/data.js`)

Provide realistic data. The cuisine mix should lean Indian and global.
- `photos[]`: ~6 Unsplash image URLs (fridge interior, pantry shelf, spice rack, vegetables on a counter). Always provide a **gradient fallback** (`onerror` swaps in a CSS-gradient placeholder with the item's initials) so the mockup works offline.
- `detectedIngredients[]` (~12): `{ id, name, category, unit, altUnits, min, max, step, aiEstimate, confidence: 'high'|'med'|'low', thumb, photoIndex }`.
- `pantryStaples[]` (~25): turmeric, red chilli powder, garam masala, cumin seeds, coriander powder, mustard seeds, black pepper, salt, sugar, oregano, chilli flakes, olive oil, mustard oil, ghee, butter, soy sauce, vinegar, tomato ketchup, basmati rice, atta, besan, maida, baking powder, honey, ginger-garlic paste. Each has `{ id, name, category, level 0–5, unitHint, updatedAt, lowThreshold }`.
- `recipes[]` (~8): e.g. Butter Chicken Lite, Palak Paneer, Egg Fried Rice, Shakshuka, Chicken Tikka Wrap, Tomato Garlic Pasta, Paneer Bhurji, Lemon Herb Chicken Bowl. Each has `{ id, name, subtitle, cuisine, timeMin, effort 1–5, servings, kcal, protein, carbs, fat, moods[], equipment[], image, ingredients:[{ingredientId|stapleId, qty, unit}], steps:[{text, minutes}], swaps:[{missing, use}] }`.
- `moods[]`, `cuisines[]`, `diets[]`, `allergies[]`, `equipment[]`.
- `user`: `{ name: 'Alex', householdSize: 2, diet: 'None', allergies: [] }`.

**Matching logic** (simple JS is fine): compute `matchPct` from confirmed quantities plus included staples against each recipe's ingredients. Filter by time ≤ available, effort ≤ chosen level, equipment available and diet. Sort by match. Changing inputs on the Mood screen must visibly change the suggestions.

---

## 7. Interaction and quality bar
- **Every screen is reachable by tapping through**. There are no dead buttons; anything not built shows a `Toast` "Coming soon".
- Sliders, steppers, chips, segmented controls, toggles, tabs, bottom sheets and the timer all work.
- **State flows across screens:** photos → detected items → confirmed quantities → suggestions → recipe "have/missing" → cooking deducts from pantry → Home "Running low" updates.
- iOS feel: safe-area paddings, 44px minimum tap targets, momentum-like horizontal scroll on chip rows (hidden scrollbars), sticky bottom CTAs above the home indicator.
- Contrast: body text must meet WCAG AA on its background.
- Pixel polish: consistent 16px gutters, aligned baselines, no overflow or horizontal scroll inside the phone, and no layout shift when sheets open.
- Code: readable, commented where not obvious, and no dead code. Keep each component file under ~120 lines.

---

## 8. Deliverables and acceptance checklist

Return:
1. The complete `fridgechef-mockup/` folder described in §3.
2. `README.md` with:
   - How to run it: "double-click `index.html`" (and optionally `npx serve`).
   - The screen map and click-path.
   - A **component → React Native mapping table** (e.g. `QuantitySlider` → `@react-native-community/slider` + `Pressable`, `BottomSheet` → `@gorhom/bottom-sheet`, `ChipRow` → horizontal `ScrollView`, `TicketCard` → `View` + `react-native-svg` mask, fonts via `expo-font`, camera via `expo-camera`, gallery via `expo-image-picker`).
   - A list of design tokens.

Before finishing, verify each item:
- [ ] Opens from `file://` with no console errors.
- [ ] `#/gallery` shows all screens side by side on the lime backdrop.
- [ ] Multiple photos can be taken or uploaded and removed.
- [ ] Confirm Quantities blocks progress until low-confidence items are checked; the slider shows the AI estimate marker, min/max and units.
- [ ] Mood, time, effort, servings, hunger, cuisine, diet, equipment and spice all exist and affect suggestions.
- [ ] Pantry staples are auto-included, editable, and deducted after cooking.
- [ ] Only flexbox layout is used; every UI element comes from a reusable component.
- [ ] The visual language matches §2: near-black, neon lime, Bebas uppercase heroes, pills, notched ticket cards, dashed lines, floating nav.
