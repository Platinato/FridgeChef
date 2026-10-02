# Sprint 04 TODO - Domain logic, SQLite storage and on-device state

## Start
- [x] Read `sprints/01-bootstrap/HANDBOOK.md` (+ 02/03 handbooks if they exist)
- [x] Read `INSTRUCTIONS.md`, `reference/architecture.md` (Local database, Data ownership), `reference/api-contract.md`, decisions D12-D15, mockup `logic.js` / `data.js` / `store.js`
- [x] Read the SDK 57 `expo-sqlite` docs
- [x] Set Sprint 04 to "In progress" in `sprints/README.md`

## Tasks
- [x] `domain/types.ts`
  - [x] Also `ScanSession`, `Kitchen`, `MatchRow`, `Suggestion`, catalog item types; `Recipe` / `Staple` structurally fit `RecipeCardRecipe` / `PantryItemStaple` (Sprint 03 handover)
- [x] `domain/units.ts`
  - [x] Plus `unitsOf(item)` for the QuantitySlider unit switch
- [x] `domain/format.ts`
  - [x] Time helpers take an optional `now` so they stay pure / testable
- [x] `domain/scan.ts`
  - [x] Plus `capPhotos`, `removePhotoAt`, `retakePhoto` (warnings follow their photo), `manualItem`
- [x] `domain/matching.ts`
- [x] `domain/suggestions.ts`
- [x] `domain/pantry.ts`
  - [x] `applyCooking` also returns `newlyLow` + changed ids (so the store writes only changed rows)
- [x] Extra: `domain/preferences.ts` (defaults, `toggleCuisine` "Any" rule, `toggleIn`, `loosen`, `addTime`)
- [x] Remove `@react-native-async-storage/async-storage` + its jest mock (D14)
  - [x] Also dropped from `jest.config.js` `transformIgnorePatterns`
- [x] `npx expo install expo-sqlite`
  - [x] Added the `expo-sqlite` config plugin to `app.config.ts` (expo install can't edit a TS config); `zustand` installed too
- [x] `db/driver.ts` (`SqlDriver` port)
  - [x] `reentrantTransactions()` wrapper (nested transactions join the outer one)
- [x] `db/client.ts` (only expo-sqlite import; WAL + foreign_keys; `getDb`, `setDatabaseForTests`, `openDatabaseByName`)
- [x] `db/migrate.ts` (`PRAGMA user_version`, one transaction per migration, refuse newer DB)
- [x] `db/migrations/0001_init.ts` + `migrations/index.ts` (schema v1, FKs, indexes)
- [x] `db/repositories/` (meta, profile, prefs, pantry, scan, cookbook; domain types in/out, Zod for JSON columns)
  - [x] Every row (not just JSON columns) is Zod-parsed; `DbDataError` names the table and field
  - [x] `resetRepo` (wipe all user tables)
- [x] `db/seeds/demoUser.ts` (typed TS, content rules, no JSON)
  - [x] Generated from the mockup's `data.js` (values unchanged) to avoid transcription errors
- [x] `db/testing/nodeDriver.ts` (`node:sqlite`; fallback `sql.js` recorded if needed)
  - [x] `node:sqlite` loads under `jest-expo`: no fallback needed (D27)
- [x] `db/bootstrap.ts` (`initDatabase`, `seedDemoData`, `seedDefaults`, `resetAll`)
  - [x] `resetAll` split: `resetDatabase()` here, `resetAll()` (queued + re-hydrate) in `src/state` (D31)
- [x] `profileStore` (hydrate + write-through)
- [x] `prefsStore` (Any-exclusive cuisines, household sync, loosen, addTime)
  - [x] `setHousehold` lives on `profileStore` and syncs `prefs.servings` (D31)
- [x] `pantryStore`
- [x] `scanStore` (6-photo cap, qty / unit / confirm / remove / manual add, confirmScan in one transaction, lastScan)
  - [x] Plus `resetScan()` and the transient `detecting` flag
- [x] `cookbookStore` (snapshots, cooked history)
  - [x] Plus `refreshSnapshot(recipe)`; fixed: unsaving an uncooked recipe now drops its snapshot from memory too (found by the restart test)
- [x] `hydrateStores()`
- [x] Selector hooks (`useLowStaples`, `usePendingChecks`, `useKitchen`)
  - [x] Plus `useProfileStore` / `usePrefsStore` / `usePantryStore` / `useScanStore` / `useCookbookStore` and pure `select*` functions
- [x] Regression tests (suggestion counts, butter chicken 91%, cooking → 2 newly low, units, fmtQty)
- [x] Database tests (migrate fresh + idempotent, refuse newer, repo round-trips, bad JSON, cascade)
  - [x] Plus: failed migration rolls back, FK enforcement, nested-transaction rollback, bootstrap mock / http / reset
- [x] Store tests (restart persistence over the same DB, gate, cuisine logic, photo cap, resetAll, seed once)
  - [x] Plus: `applyCooking` rollback across both tables, write-failure reporting, hooks test (`renderHook`)
- [x] Extra: `src/__tests__/architecture-rules.test.ts` (acceptance criteria as a test; mutation-checked)

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor` (no expo-sqlite mismatch)
- [x] Domain coverage ≥ 90% (record it)
  - 100% lines / 100% statements / 100% functions / 94.61% branches
- [x] `src/domain` imports nothing from React / RN / state / db / services / mocks
- [x] `expo-sqlite` imported only in `src/db/client.ts`; SQL only in repositories + migrations; no `.json` data files in `src/`; no AsyncStorage left
- [x] Extra: temporary iOS export with a route importing `@/state` + `@/db/bootstrap` (reverted): bundles, and contains no `node:sqlite` / Node driver
- [ ] ~~Optional: `npm run web` with expo-sqlite~~ - skipped: nothing renders data yet and no route imports the database, so the preview can't exercise it. Web wasm + COOP/COEP setup handed to Sprint 06.

## Close
- [x] `HANDBOOK.md` (store + repository APIs, schema v1, seed contents, Node driver used, deviations)
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
