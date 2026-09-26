# Sprint 04 - Domain logic, SQLite storage and on-device state

## Before you start

1. Read `sprints/01-bootstrap/HANDBOOK.md`. Also read the latest handbook of 02 / 03 if those ran before this sprint.
2. Read this file, then `sprints/reference/architecture.md`, especially **Local database** and **Data ownership**. Also read `sprints/reference/api-contract.md` (the DTO shapes) and decisions **D12-D15** in `sprints/reference/decisions.md`.
3. Read the `expo-sqlite` docs for SDK 57: `https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/`. Don't write expo-sqlite code from memory.
4. Read the mockup sources you're porting: `fridgechef-mockup/js/logic.js`, `js/data.js`, `js/store.js`, and the actions in `js/app.js`.

## Goal

The app's brain and its on-device storage, with no UI:

- typed domain models
- pure, fully unit-tested logic ported from the mockup
- the on-device **SQLite database** (`fridgechef.db`): driver port, client, migrations, repositories
- the demo starting state as a typed **TypeScript seed module**. There are no JSON data files.
- Zustand stores that hydrate from the repositories and write through to them

## Handover from Sprint 01

Sprint 01 installed `@react-native-async-storage/async-storage` and added its mock in `jest.setup.ts`, planned for this sprint. Decision D14 replaces it with SQLite, so **remove both**: uninstall the package, and delete the mock and any reference to it.

## Tasks

1. **Types** (`src/domain/types.ts`)
   - `Photo`, `DetectedItem` (value always stored in the base `unit`, plus `displayUnit` and `touched`), `PhotoWarning`, `Staple`
   - `Recipe` / `RecipeIngredient` / `Step` / `Swap` / `Nutrition`
   - `Preferences`, `Profile`, `IngredientStatus`, `MatchResult`, `CatalogData`

   Domain types are app-facing. Wire DTOs are defined separately in Sprint 05.
2. **Pure logic.** One module each, with zero React / IO / SQL. Port from `logic.js` and keep the behaviour identical.
   - `domain/units.ts`: `displayOf(item)` (base ↔ alt unit via factor, snapped to step), `toBase(item, displayValue)`.
   - `domain/format.ts`: `fmtQty` (¼ ½ ¾ fractions), `fmtNum`, `plural`, `timeAgo`, `lastScanLabel`, `effortLabel`.
   - `domain/scan.ts`: `pendingChecks`, `sortByConfidence` (low → med → high → manual).
   - `domain/matching.ts`: `ingredientStatus` (detected / staple / extra, and have / short / missing / pantry), `match(recipe, kitchen, servings)`.
   - `domain/suggestions.ts`: `passes` (time, effort max, equipment, diet table, cuisines, allergens), `score` (mood +15, hunger ±8, spice +5, diet goals +10), `FILTERS`, `SORTS`, and `rankSuggestions(recipes, ctx)`.
   - `domain/pantry.ts`: `isLow`, `lowStaples`, `stapleOn`, `defaultUsed`, `applyCooking(used, kitchen)`. Cooking deducts detected values; staples lose `qty / perLevel` levels and get `updatedAt` touched.
3. **SQLite foundation** (`src/db/`). Install with `npx expo install expo-sqlite`. It is in Expo Go on SDK 57, so no development build is needed. Confirm with `npx expo-doctor`.
   - `driver.ts`: the `SqlDriver` port, with the method names and shapes of expo-sqlite's `SQLiteDatabase` that the app uses: `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`, `closeAsync`.
   - `client.ts`: **the only file that imports `expo-sqlite`.**
     - `openAppDatabase()` opens `fridgechef.db` with `openDatabaseAsync`, then runs `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.
     - `getDb()` returns the open driver.
     - `setDatabaseForTests(driver)` injects a test driver.
     - `openDatabaseByName(name)` is used by Sprint 05 for `fridgechef-mock.db`.
   - `migrate.ts`: `migrate(db, migrations)`.
     - Reads `PRAGMA user_version`, then runs each newer migration in order, each inside `withTransactionAsync`, and sets `user_version` after each one.
     - Refuses to run when the database version is newer than the app knows about (a clear error, not data loss).
     - It is reused by Sprint 05 for the mock database.
   - `migrations/0001_init.ts`: the schema v1 from `architecture.md`.
     - Tables: `app_meta`, `profile`, `preferences`, `staples`, `scan_sessions`, `scan_photos`, `scan_items`, `scan_warnings`, `recipe_snapshots`, `saved_recipes`, `cooked_history`.
     - Add foreign keys (`ON DELETE CASCADE` from a scan session to its photos, items and warnings) and the indexes the repositories need.
     - `migrations/index.ts` exports the ordered list.
   - `repositories/`: `metaRepo`, `profileRepo`, `prefsRepo`, `pantryRepo`, `scanRepo`, `cookbookRepo`.
     - Every function takes and returns **domain types**, uses bound parameters, and parses JSON columns with Zod. A bad row throws a clear error; it never returns `any`.
     - This is the only place app SQL lives.
   - `seeds/demoUser.ts`: the demo starting state the mockup ships with, typed as domain types.
     - Pantry levels, and `updatedAt` offsets in days (resolved against "now" when applied).
     - Saved ids, cooked ids and `lastScan`.
     - Recipe snapshots for the saved and cooked ids: copy the ones you need from `data.js` as domain `Recipe`s. Sprint 05 moves the full recipe list into the mock backend seed.
     - Copy follows the content rules: no em dashes, no "AI".
   - `testing/nodeDriver.ts`: `SqlDriver` on Node's built-in **`node:sqlite`** (`DatabaseSync`), wrapped in promises, supporting `:memory:`.
     - First prove Jest can load `node:sqlite` under the `jest-expo` preset. If it can't, use `sql.js` behind the same port and record the choice in the handbook and decisions (it amends D15).
     - Keep this file out of the app bundle: it's only imported by tests and scripts.
4. **Boot API** (`src/db/bootstrap.ts`). Screens wire it up in Sprint 06.
   - `initDatabase()`: open, migrate, and on first launch (`app_meta.seeded_at` unset) run `seedDemoData()` in mock mode, or `seedDefaults()` in http mode. The http-mode default is empty, with the catalog's `defaultStaples` at level 3 once the catalog is known.
   - `resetAll()`: in one transaction, delete every user table's rows and clear `seeded_at`. Then reseed as above and re-hydrate the stores.
5. **Stores** (`src/state/`). Zustand, **no `persist` middleware**.
   - Each store has a `hydrate()` that loads from its repository. `hydrateStores()` calls them all.
   - Each action updates state, then writes through to its repository.
     - Return the promise so tests and callers can `await` it.
     - A failed write is logged, and in dev it's reported (Sprint 06 adds the toast).
     - Multi-row changes (`confirmScan`, `applyCooking`, `resetAll`) happen in one repository transaction.
   - The stores:
     - `profileStore`: `onboarded`, `profile` (name, diet, allergies, householdSize, units, defaultEffort), actions.
     - `prefsStore`: mood, timeMin, effort, servings, hunger, cuisines, diet, equipment, spice, filter, sort.
       - `toggleCuisine` has the "Any" exclusivity from the mockup.
       - `setHousehold` syncs servings.
       - `loosenFilters`, `addTime`.
     - `pantryStore`: staples, autoInclude, excluded map; `setLevel`, `refill`, `remove`, `add`, `toggleIncluded`, `applyCooking`.
     - `scanStore`:
       - photos (max 6), `addPhotos`, `removePhoto`, `markRetaken`
       - `setDetection(items, warnings)`, `setQty(id, displayValue)`, `setUnit`, `confirmItem`, `removeItem`, `addManualItem`, `confirmScan()`
       - `lastScan`
       - Transient flags such as an in-flight detection are **not** written to the database.
     - `cookbookStore`: saved recipe **snapshots** (id → Recipe, stored in `recipe_snapshots` + `saved_recipes`), `toggleSave`, cooked history (last 6 ids + snapshots), `recordCooked`.
6. **Selectors / hooks**: small typed hooks such as `useLowStaples()`, `usePendingChecks()` and `useKitchen()`, which combines scan items and included staples for matching.
7. **Tests.** These are regression tests that pin the mockup's verified behaviour. They run on the Node driver with an in-memory database.
   - **Domain.** The recipe inputs come from a local test helper that holds the 10 mockup recipes as domain `Recipe`s. Sprint 05 switches it to the mock backend seed.
     - Default seed + default prefs → exactly 9 suggestions. The mockup verified it with ids: palak-paneer, egg-fried-rice, curd-rice, butter-chicken, shakshuka, paneer-bhurji, masala-omelette, tomato-pasta, tikka-wrap, in its best-match order.
     - time 15 → 4 (egg-fried-rice, curd-rice, paneer-bhurji, masala-omelette)
     - vegetarian → 4
     - Dairy allergy → 2 (egg-fried-rice, shakshuka)
     - cuisine Thai → 0
     - chef effort + oven → 10
     - Butter chicken:
       - with chicken 500 g it is 91% (missing cream)
       - `defaultUsed` includes chicken 400
       - `applyCooking` makes garam masala + red chilli newly low (2 items)
     - Units: eggs 6 pcs ⇄ 300 g; milk 750 ml → 3.25 cups snapped to the 0.25 step.
     - `fmtQty(0.5, 'tsp')` → `½ tsp`.
   - **Database.**
     - A fresh database migrates to the latest `user_version`, and running `migrate` again changes nothing.
     - A database newer than the app is refused.
     - Every repository round-trips its domain type.
     - A corrupt JSON column throws a clear error.
     - Deleting a scan session cascades to its photos, items and warnings.
   - **Stores.**
     - **Restart persistence:** act on the stores, then build fresh stores over the *same* database, hydrate, and expect equal state.
     - The scan confirm gate, the cuisine "Any" logic, and the 6-photo cap.
     - `resetAll` + reseed.
     - `seedDemoData` runs once only.

## Out of scope

- The API client, network, and the mock backend database (Sprint 05).
- Any UI, including the splash / boot gate (Sprint 06).

## Acceptance criteria

- `src/domain` imports nothing from React, RN, `state`, `db`, `services` or `mocks`.
- `expo-sqlite` is imported only in `src/db/client.ts`. SQL strings exist only in `src/db/repositories/` and `src/db/migrations/`.
- `@react-native-async-storage/async-storage` is gone from `package.json`, `jest.setup.ts` and `src/`.
- There are no `.json` data files under `src/`.
- Every behaviour above is covered by tests. Domain coverage is at least 90% of lines (`jest --coverage --collectCoverageFrom="src/domain/**"`).
- The demo seed type-checks against the domain types. Sprint 05 adds the Zod check for the backend seed.

## Build verification pass

`npm run verify` + `npx expo-doctor`, which must show no expo-sqlite version mismatch. Put the coverage summary in the handbook.

Optional: `npm run web` to see whether the placeholder still boots with expo-sqlite installed. Web SQLite needs the wasm + COOP/COEP setup in `architecture.md` → Web preview. Nothing renders data yet, so this can wait until Sprint 06.

## End of sprint

- Write the handbook with:
  - the store APIs and repository APIs
  - the schema v1 table list
  - the seed module contents
  - which Node driver was used
  - any behaviour that differs from the mockup
- Update the status board and decisions. Do not commit.
