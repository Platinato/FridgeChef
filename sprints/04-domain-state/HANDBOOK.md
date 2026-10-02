# Sprint 04 handbook - Domain logic, SQLite storage and on-device state

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done
- **Dates:** 2026-09-29 → 2026-09-29
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

All tasks and acceptance criteria are met and `verify` / `expo-doctor` pass. There is no UI in this sprint, so nothing new to smoke-test on a device (see Build verification pass).

## What was built

- **Domain (`src/domain/`)**: pure TypeScript with no React, IO or SQL, ported from the mockup's `logic.js` / `util.js` / `app.js` actions with the behaviour unchanged.
  - `types.ts`: every app-facing type (below).
  - `units.ts`, `format.ts`, `scan.ts`, `matching.ts`, `suggestions.ts`, `pantry.ts`, plus `preferences.ts` (defaults and the Mood / Suggestions preference rules).
- **SQLite (`src/db/`)**:
  - `driver.ts`: the `SqlDriver` port, plus `reentrantTransactions()`.
  - `client.ts`: the only `expo-sqlite` import.
  - `migrate.ts`, `migrations/0001_init.ts` + `migrations/index.ts`.
  - Seven repositories.
  - `seeds/demoUser.ts`.
  - `bootstrap.ts`.
  - `testing/nodeDriver.ts` on `node:sqlite`.
- **Stores (`src/state/`)**:
  - Five vanilla Zustand stores built by `createAppStores()`, plus the app's `appStores`.
  - `hydrateStores()`, `resetAll()`.
  - The write-through queue (`persist.ts`).
  - Pure selectors and React hooks.
- **Test fixtures (`src/testing/mockupData.ts`)**: the mockup's 10 recipes, 12 detections, addable items and staples as domain types. They were generated from `data.js` and are test-only.
- **Tests: +7 suites, +89 tests (177 total).**
  - `src/domain/__tests__/` (3 suites, 39 tests)
  - `src/db/__tests__/database.test.ts` (22)
  - `src/state/__tests__/stores.test.ts` (18) and `hooks.test.tsx` (1)
  - `src/__tests__/architecture-rules.test.ts` (9)
- **Packages:**
  - added `expo-sqlite` ~57.0.3 (+ its config plugin in `app.config.ts`) and `zustand` ^5.0.15
  - removed `@react-native-async-storage/async-storage`, its jest mock and its `transformIgnorePatterns` entry (D14)

### Domain API

| Module | Exports |
|---|---|
| `types.ts` | `Photo`, `PhotoWarning`, `AltUnit`, `DetectedItem`, `LastScan`, `ScanSession`, `Staple`, `Recipe`, `RecipeIngredient`, `Step`, `Swap`, `Nutrition`, `Profile`, `Preferences`, `Kitchen`, `IngredientStatus`, `MatchRow`, `MatchResult`, `Suggestion`, `CatalogData` (+ `CatalogMood`, `CatalogOption`, `AddableItem`, `StapleSuggestion`, `DefaultStaple`), and the enums (`Confidence`, `ItemConfidence`, `RecipeDiet`, `DietPref`, `EffortPref`, `Hunger`, `UnitSystem`, `FilterId`, `SortId`, `PhotoWarningType`, `ScanStatus`) |
| `units.ts` | `displayOf(item)` → `{ value, min, max, step, unit, estimate }` in the display unit; `toBase(item, displayValue)` (clamped); `unitsOf(item)`; `snap`, `clamp` |
| `format.ts` | `fmtQty(v, unit)` (¼ ½ ¾), `fmtNum`, `plural`, `timeAgo(iso, now?)`, `lastScanLabel(lastScan, now?)`, `effortLabel(level)`, `daysSince`, `daysAgo` |
| `scan.ts` | `MAX_PHOTOS = 6`, `pendingChecks(items)`, `sortByConfidence(items)`, `capPhotos`, `removePhotoAt`, `retakePhoto`, `manualItem(addable)` |
| `matching.ts` | `ingredientStatus(ing, kitchen, k)`, `match(recipe, kitchen, servings)`, `stapleOn(staple, pantry)` |
| `suggestions.ts` | `passes(recipe, prefs, allergies)`, `score(recipe, match, prefs)`, `FILTERS`, `SORTS`, `rankSuggestions(recipes, { kitchen, prefs, allergies })`, `EFFORT_MAX`, `DIET_OK`, `ALLERGENS` |
| `pantry.ts` | `LOW_THRESHOLD = 1.5`, `FULL_LEVEL = 5`, `isLow`, `lowStaples`, `stapleOn`, `defaultUsed(recipe, kitchen, servings)`, `applyCooking(used, kitchen, nowIso)` → `{ items, staples, changedItemIds, changedStapleIds, newlyLow }`, `newStaple(suggestion, nowIso)`, `slug`, `clampLevel` |
| `preferences.ts` | `DEFAULT_PROFILE`, `DEFAULT_PREFERENCES`, `toggleCuisine`, `toggleIn`, `loosen`, `addTime`, `MAX_TIME_MIN`, `ADD_TIME_MIN` |

### Store API (`import { … } from '@/state'`)

Every action updates state first, then queues the repository write and resolves `true` / `false` for the write. Actions never reject (D28).

| Store | State | Actions |
|---|---|---|
| `profile` | `hydrated`, `onboarded`, `profile` | `setName`, `setDiet` (+ prefs.diet), `toggleAllergy`, `setHousehold` (+ prefs.servings), `setUnits`, `setDefaultEffort` (+ prefs.effort), `completeOnboarding` (sets onboarded; copies diet + household into prefs), `replayOnboarding` |
| `prefs` | flat `Preferences` (`mood`, `timeMin`, `effort`, `servings`, `hunger`, `cuisines`, `diet`, `equipment`, `spice`, `filter`, `sort`) + `hydrated` | `update(patch)`, `setMood`, `setTimeMin`, `setEffort`, `setServings`, `setHunger`, `toggleCuisine` ("Any" exclusive), `setDiet`, `toggleEquipment`, `setSpice`, `setFilter`, `setSort`, `loosenFilters`, `addTime` |
| `pantry` | `staples`, `autoInclude`, `excluded` | `setLevel(id, level)`, `refill(id)`, `remove(id)`, `add(suggestion)` (false if present), `toggleIncluded(id)`, `setAutoInclude(on)`, `applyCooking(used)` → `{ newlyLow, saved }`. It writes staples and scan items in one transaction. |
| `scan` | `sessionId`, `status`, `confirmedAt`, `photos`, `items`, `warnings`, `lastScan`, transient `detecting` | `addPhotos(newPhotos)` → `{ added, dropped }` (cap 6), `removePhoto`, `markRetaken`, `setDetecting` (not persisted), `setDetection(items, warnings)` (clears confirmation), `setQty(id, displayValue)` (touched), `setUnit(id, unit)`, `confirmItem(id)`, `removeItem(id)`, `addManualItem(addable)` (false if present), `confirmScan()` (false while checks are pending; sets `lastScan` in one transaction), `resetScan()` |
| `cookbook` | `snapshots` (id → Recipe), `saved` (newest first), `cooked` (≤ 6 distinct, newest first) | `toggleSave(recipe)`, `recordCooked(recipe, servings)`, `refreshSnapshot(recipe)` |

Also exported:
- `createAppStores()`, `appStores`
- `hydrateStores(stores?)`, `resetAll(stores?, opts?)`
- `flushWrites()`, `setWriteErrorReporter(fn)`
- `selectPreferences`, `selectKitchen`, `selectLowStaples`, `selectPendingChecks`
- hooks: `useProfileStore(sel)`, `usePrefsStore(sel)`, `usePantryStore(sel)`, `useScanStore(sel)`, `useCookbookStore(sel)`, `useKitchen()`, `useLowStaples()`, `usePendingChecks()`

### Repository API (`src/db/repositories`, all take `db: SqlDriver` first)

| Repo | Functions |
|---|---|
| `metaRepo` | `get` / `set` / `remove(key)`, `getOnboarded` / `setOnboarded`, `getSeededAt` / `setSeededAt`, `getAutoInclude` / `setAutoInclude`, `getLastScan` / `setLastScan` |
| `profileRepo` | `get()` → `Profile \| null`, `save(profile, nowIso?)` |
| `prefsRepo` | `get()` → `Preferences \| null`, `save(prefs, nowIso?)` |
| `pantryRepo` | `list()` → `{ staples, excluded }`, `add(staple)` → bool, `saveLevels(staples)`, `setIncluded(id, on)`, `remove(id)`, `replaceAll(staples, excluded?)` |
| `scanRepo` | `loadLatest()` → `ScanSession \| null`, `ensureSession(id, createdAt)`, `savePhotos(id, photos, warnings)`, `saveDetection(id, items, warnings)`, `updateItems(id, items)`, `addItem(id, item)`, `removeItem(id, itemId)`, `setStatus(id, status, confirmedAt)`, `deleteSession(id)` |
| `cookbookRepo` | `load()` → `{ snapshots, saved, cooked }`, `save(recipe, savedAt)`, `unsave(id)`, `recordCooked(recipe, servings, cookedAt)`, `upsertSnapshot(recipe, fetchedAt)`, `history()` |
| `resetRepo` | `clearAll()`, `USER_TABLES` |

Every row is parsed with Zod, and JSON columns go through `jsonColumn(schema)`. A bad row throws `DbDataError("Unreadable row in <table>: … → at <field>")`.

Boot (`src/db/bootstrap.ts`):
- `initDatabase({ mode?, now?, defaultStaples? })` → `{ db, seeded }`. It opens, migrates, and seeds once.
- `seedDemoData(db, now?, seed?)`
- `seedDefaults(db, { now?, defaultStaples? })`
- `resetDatabase(opts?)`

Client (`src/db/client.ts`): `openAppDatabase()`, `getDb()`, `setDatabaseForTests(driver | null)`, `openDatabaseByName(name)`. Migrations: `migrate(db, migrations)` → `{ from, to }`, `getUserVersion`, `MigrationError`.

### Schema v1 (`fridgechef.db`, `0001_init`)

| Table | Key | Notes |
|---|---|---|
| `app_meta` | `key` | `onboarded`, `seeded_at`, `last_scan_at`, `last_scan_items`, `auto_include` |
| `profile` | `id = 1` | `allergies` JSON |
| `preferences` | `id = 1` | `cuisines`, `equipment` JSON; also `filter`, `sort` |
| `staples` | `id` | `level` CHECK 0-5, `included` 0/1, `sort_order` (indexed) |
| `scan_sessions` | `id` | `status` in draft / detected / confirmed; indexed by `created_at` |
| `scan_photos` | `(session_id, id)` | FK → session **ON DELETE CASCADE**; `label`, `idx`, `retaken` |
| `scan_items` | `(session_id, id)` | FK cascade; `alt_unit` JSON; `confidence` in high / med / low / manual; `sort_order` |
| `scan_warnings` | `id` autoinc | FK cascade; `type` in blurry / dark / no_food |
| `recipe_snapshots` | `id` | `recipe` = domain Recipe JSON (Zod on read) |
| `saved_recipes` | `recipe_id` | FK → snapshot, cascade; indexed by `saved_at` |
| `cooked_history` | `id` autoinc | FK → snapshot, cascade; indexed by `recipe_id` |

### Demo seed (`src/db/seeds/demoUser.ts`)

- **Profile:** Alex, diet none, no allergies, household 2, metric, moderate. `onboarded: false`, as in the mockup.
- **Preferences:** the mockup defaults.
  - comfort, 45 min, moderate, 2 servings, meal, Any
  - diet none; stove / microwave / pressure / blender; spice 3
  - filter all, sort best
- **Pantry:** all 25 mockup staples with their levels and `updatedDaysAgo` offsets. Auto-include is on and nothing is excluded.
- **Saved:** palak-paneer (3 days ago) and shakshuka (8 days ago).
- **Cooked:** egg-fried-rice (1 day ago) and paneer-bhurji (4 days ago), 2 servings each.
- **Last scan:** 2 days ago, 11 items.
- **Recipe snapshots:** those four recipes, copied from `data.js` as domain `Recipe`s.
- **No scan session** (D30).

### Node driver

`node:sqlite` (`DatabaseSync`, built into Node 24) loads under the `jest-expo` preset, so there is **no `sql.js` fallback** and D15 stands (D27). Metro never bundles the driver: a temporary iOS export with a route importing `@/state` + `@/db/bootstrap` contained `openDatabaseAsync` and no `node:sqlite` / `createNodeDriver`.

## Changed files (uncommitted, for the user to review)

Sprint 02 and 03 work is also still uncommitted in the tree. This sprint's changes:

- **Added:**
  - `fridgechef-app/src/domain/{types,units,format,scan,matching,suggestions,pantry,preferences}.ts`
  - `fridgechef-app/src/domain/__tests__/{suggestions,matching-pantry,units-format-scan}.test.ts`
  - `fridgechef-app/src/db/{driver,client,migrate,bootstrap}.ts`, `src/db/migrations/{0001_init,index}.ts`, `src/db/repositories/{rows,metaRepo,profileRepo,prefsRepo,pantryRepo,scanRepo,cookbookRepo,resetRepo,index}.ts`, `src/db/seeds/demoUser.ts`, `src/db/testing/nodeDriver.ts`, `src/db/__tests__/database.test.ts`
  - `fridgechef-app/src/state/{index,appStores,types,persist,selectors,hooks,profileStore,prefsStore,pantryStore,scanStore,cookbookStore}.ts`, `src/state/__tests__/{stores.test.ts,hooks.test.tsx}`
  - `fridgechef-app/src/testing/mockupData.ts`
  - `fridgechef-app/src/__tests__/architecture-rules.test.ts`
  - `sprints/04-domain-state/HANDBOOK.md`
- **Modified:**
  - `fridgechef-app/package.json` + `package-lock.json` (expo-sqlite, zustand in; async-storage out)
  - `fridgechef-app/app.config.ts` (`expo-sqlite` plugin)
  - `fridgechef-app/jest.setup.ts` (AsyncStorage mock removed)
  - `fridgechef-app/jest.config.js` (async-storage removed from `transformIgnorePatterns`)
  - `fridgechef-app/README.md` (coverage command, storage and layout notes)
  - `.gitignore` (`coverage/`)
  - `CLAUDE.md` (coverage command, testing notes, state API)
  - `sprints/README.md` (status board), `sprints/04-domain-state/TODO.md`, `sprints/reference/decisions.md` (D27-D31), `sprints/reference/architecture.md` (schema v1 refinements, layout, reset / write queue)
- **Deleted:** `fridgechef-app/src/domain/.gitkeep`, `fridgechef-app/src/state/.gitkeep`

## Decisions and deviations

Decisions D27-D31 were appended to `sprints/reference/decisions.md`. In short:

- **D27:** `node:sqlite` works in Jest (no `sql.js`). The port binds positional params only, and transactions are re-entrant.
- **D28:** store factory + singleton, one serialised write queue, and actions resolve a boolean without ever rejecting.
- **D29:** domain shapes stay close to the contract.
  - `nutrition` object, `image`, ingredient `name`
  - `estimate` / `altUnit` / `imageUrl`
  - `LOW_THRESHOLD` constant
- **D30:** schema v1 refinements, no `confirmed` / `manual` item columns, and no scan session in the demo seed.
- **D31:**
  - `resetAll` lives in `state` and `resetDatabase` in `db`.
  - `setHousehold` is on `profileStore`.
  - Fixtures live in `src/testing/`.
  - The architecture-rules test enforces the layering.
  - PRAGMA is allowed in the client, `migrate` and the Node driver.

Behaviour differences from the mockup (all deliberate, none visible yet):

- **Extra-ingredient names** come from the recipe's `ingredients[].name` (contract field) instead of a lookup in the addable list. Same names for all 10 recipes.
- **`snap()` trims float noise** to 6 decimals (e.g. `0.30000000000000004` → `0.3`). The snapped values are otherwise identical.
- **Duplicate adds are refused:**
  - `addManualItem` resolves false if the item id is already in the list (the mockup would push a duplicate).
  - `pantry.add` does the same for an existing staple id.
- **Removing a photo shifts later warnings down**, so they stay on the same photo. Retaking clears that photo's warnings. The mockup kept a `blurry` flag on the photo itself.
- **`match()` of a recipe with zero ingredients** returns 0% instead of `NaN`.
- **Unsaving a recipe that was never cooked** drops its snapshot from memory. That's what a restart would load, and the restart test caught the mismatch.

## Handovers to the next sprint

**Sprint 05 (API layer):**
- **Mappers produce these domain types:**
  - `DetectedItem`: `value = estimate`, `displayUnit = unit`, `touched = false`, `imageUrl`, `altUnit`
  - `Recipe`: `imageUrl` → `image`, with the `nutrition` object as-is
  - `CatalogData`
- **The test fixtures move to the mock seed:**
  - `src/testing/mockupData.ts` holds the 10 recipes, 12 detections and addable items that the mock backend seed needs (`services/api/mock/db/seed/*`). Generate the DTO seeds from it (or from `data.js`), then point the domain tests at the seed through the mappers, as the instructions ask.
  - Keep `MOCKUP_ITEMS[*].photoIndex` for the `detectedFor(n)` behaviour. The second photo gets a `blurry` warning when 3+ photos are sent.
- **Mock database migrations:** reuse `migrate(db, migrations)` and `openDatabaseByName('fridgechef-mock.db')` for it. Mock SQL is allowed in `services/api/mock/db/` (the architecture-rules test already allowlists it).
- **Bootstrap:** `initDatabase()` in `db/bootstrap.ts` gets the "in mock mode also open + seed `fridgechef-mock.db`" step. In http mode, pass `defaultStaples` from the catalog to `initDatabase` / `seedDefaults` (only applied on first launch).
- **Leftover folder:** `src/mocks/fixtures/.gitkeep` (a Sprint 01 skeleton folder) contradicts D13 (no JSON fixtures). Delete `src/mocks/` when the mock backend lands in `services/api/mock/`, and update the import-guard regexes if you do.

**Sprint 06 (shell + screens):**
- **Boot:** behind the splash, `await initDatabase(); await hydrateStores();`. On a throw, show the full-screen error with Retry.
- **Surface write failures in dev:** `setWriteErrorReporter((label) => showToast(...))`.
- **Home:**
  - "Last scan" = `lastScanLabel(lastScan)`. `lastScan` is `null` in http mode before the first scan, so show your own empty copy.
  - Low staples = `useLowStaples()`.
- **Pantry:** `PantryItem` gets `low={isLow(s)}` and `updatedLabel={timeAgo(s.updatedAt)}`.
- **Profile:**
  - `resetAll()` for "Reset demo data", `replayOnboarding()`
  - household / diet / effort setters (they sync prefs)
- **`profile.name` is `''` in http mode** (the mockup only had the demo "Alex"). Onboarding or Profile needs a fallback label.
- **Selector rule:** select small slices. A selector that returns a new array or object on every call re-renders forever. Use the memoised hooks for derived data.
- **Web preview:** expo-sqlite on web needs Metro to serve `.wasm` plus the COOP / COEP headers (`architecture.md` → Web preview). This is untested. If the web preview can't open the database, record it as a known issue; iOS is what counts.

**Sprint 07 (scan → confirm):**
- **Starting a new scan:** call `resetScan()` first. Otherwise photos and detection attach to the current session.
- **Adding photos:** `addPhotos([{ uri, label? }])` returns `{ added, dropped }`, used for the "max 6 per scan" toast.
- **Confirm screen:**
  - `sortByConfidence(items)`, then `displayOf(item)` for each slider.
  - `unitsOf(item)` for the unit switch.
  - `QuantitySlider.onChange` → `setQty(id, v)` (marks touched).
  - `onUnitChange` → `setUnit`.
  - `onConfirm` → `confirmItem`.
  - The gate is `usePendingChecks().length === 0`, then `confirmScan()`.
- **Detection:** set `setDetecting(true)` around the request, then `setDetection(items, warnings)`.

**Sprint 08 (recipes → cook):**
- **Suggestions:** `rankSuggestions(recipes, { kitchen: useKitchen(), prefs, allergies: profile.allergies })`.
- **Recipe detail:** `match(recipe, kitchen, servings)`.
- **Done sheet:** `defaultUsed(...)`.
- **Pantry update:** `await pantry.applyCooking(used)` (gives `newlyLow` for "N items running low"), then `cookbook.recordCooked(recipe, servings)`. These are two writes, queued in order.

**Security note (carried):** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. A secret LLM-provider key must stay on a server, never in this app.

**Carry-over from earlier sprints (still open):**
- Expo Go smoke test on a physical iPhone (Sprints 01-03).
- The Sheet open / close animation check (Sprint 03).

## Known issues / tech debt

- **expo-sqlite transactions include every statement that runs while they're open.** The store write queue prevents interleaving, but code that calls repositories directly (outside `writeThrough`) while the app runs could land inside another write's transaction.
  - Impact: only a problem if such code is added.
  - Fix: keep app writes in store actions. If direct access is ever needed, switch the adapter to `withExclusiveTransactionAsync` (iOS / Android only; it takes a `txn` argument, so the port would change).
- **No encryption.** The database is plain SQLite in the app's documents folder (included in iCloud / device backups). It's fine for v1; `useSQLCipher` in the plugin config can turn encryption on later (it isn't in Expo Go).
- **`npm audit`:** still the 14 moderate transitive advisories from Sprint 01. There are no new ones from expo-sqlite or zustand.
- **Test-renderer peer warning** (from Sprint 03) is unchanged.

## How to run / try what this sprint added

There's nothing new on screen. The behaviour is in the tests:

```bash
cd fridgechef-app
npm test -- src/domain            # mockup regression: 9 suggestions, butter chicken 91%, units, fmtQty
npm test -- src/db                # migrations, repositories, cascade, bootstrap / seed / reset
npm test -- src/state             # restart persistence, gate, photo cap, cuisines, cooking, reset
npx jest --coverage --collectCoverageFrom="src/domain/**" src/domain
```

## Build verification pass

```
npm run verify   → PASS
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 13 suites, 177 tests passed (Sprint 03 ended at 6 suites / 88)
  ios export  "iOS Bundled ... (2002 modules)" → .verify-dist
              (probe: with a route importing @/state + @/db/bootstrap → 2068 modules, bundles OK,
               contains expo-sqlite's openDatabaseAsync and no node:sqlite / createNodeDriver; reverted)
npx expo-doctor  → PASS: 21/21 checks passed. No issues detected! (no expo-sqlite version mismatch)
npm run format:check → PASS
Domain coverage (jest --coverage --collectCoverageFrom="src/domain/**" src/domain):
  All files 100% statements | 94.61% branches | 100% functions | 100% lines
  (types.ts is type-only: 0/0)
Acceptance guards (src/__tests__/architecture-rules.test.ts, mutation-checked by adding a
  react-native import + a SQL string to src/domain/format.ts: both rules failed, then reverted)
Manual smoke     → not run: this sprint has no UI and no route uses the database yet.
  Expo Go on a physical iPhone is still a carry-over from Sprints 01-03.
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0 (`node:sqlite` built in), npm 11.17.0.
- Expo SDK 57.0.25, expo-sqlite ~57.0.3, zustand ^5.0.15, Zod 4.
- `npx expo install expo-sqlite` prints the plugin snippet for `app.json` because it can't edit `app.config.ts`, so the plugin was added by hand.
- Jest `--coverage` writes `fridgechef-app/coverage/`, which is now git-ignored.
