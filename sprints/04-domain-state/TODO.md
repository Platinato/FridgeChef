# Sprint 04 TODO - Domain logic, SQLite storage and on-device state

## Start
- [ ] Read `sprints/01-bootstrap/HANDBOOK.md` (+ 02/03 handbooks if they exist)
- [ ] Read `INSTRUCTIONS.md`, `reference/architecture.md` (Local database, Data ownership), `reference/api-contract.md`, decisions D12-D15, mockup `logic.js` / `data.js` / `store.js`
- [ ] Read the SDK 57 `expo-sqlite` docs
- [ ] Set Sprint 04 to "In progress" in `sprints/README.md`

## Tasks
- [ ] `domain/types.ts`
- [ ] `domain/units.ts`
- [ ] `domain/format.ts`
- [ ] `domain/scan.ts`
- [ ] `domain/matching.ts`
- [ ] `domain/suggestions.ts`
- [ ] `domain/pantry.ts`
- [ ] Remove `@react-native-async-storage/async-storage` + its jest mock (D14)
- [ ] `npx expo install expo-sqlite`
- [ ] `db/driver.ts` (`SqlDriver` port)
- [ ] `db/client.ts` (only expo-sqlite import; WAL + foreign_keys; `getDb`, `setDatabaseForTests`, `openDatabaseByName`)
- [ ] `db/migrate.ts` (`PRAGMA user_version`, one transaction per migration, refuse newer DB)
- [ ] `db/migrations/0001_init.ts` + `migrations/index.ts` (schema v1, FKs, indexes)
- [ ] `db/repositories/` (meta, profile, prefs, pantry, scan, cookbook; domain types in/out, Zod for JSON columns)
- [ ] `db/seeds/demoUser.ts` (typed TS, content rules, no JSON)
- [ ] `db/testing/nodeDriver.ts` (`node:sqlite`; fallback `sql.js` recorded if needed)
- [ ] `db/bootstrap.ts` (`initDatabase`, `seedDemoData`, `seedDefaults`, `resetAll`)
- [ ] `profileStore` (hydrate + write-through)
- [ ] `prefsStore` (Any-exclusive cuisines, household sync, loosen, addTime)
- [ ] `pantryStore`
- [ ] `scanStore` (6-photo cap, qty / unit / confirm / remove / manual add, confirmScan in one transaction, lastScan)
- [ ] `cookbookStore` (snapshots, cooked history)
- [ ] `hydrateStores()`
- [ ] Selector hooks (`useLowStaples`, `usePendingChecks`, `useKitchen`)
- [ ] Regression tests (suggestion counts, butter chicken 91%, cooking → 2 newly low, units, fmtQty)
- [ ] Database tests (migrate fresh + idempotent, refuse newer, repo round-trips, bad JSON, cascade)
- [ ] Store tests (restart persistence over the same DB, gate, cuisine logic, photo cap, resetAll, seed once)

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor` (no expo-sqlite mismatch)
- [ ] Domain coverage ≥ 90% (record it)
- [ ] `src/domain` imports nothing from React / RN / state / db / services / mocks
- [ ] `expo-sqlite` imported only in `src/db/client.ts`; SQL only in repositories + migrations; no `.json` data files in `src/`; no AsyncStorage left

## Close
- [ ] `HANDBOOK.md` (store + repository APIs, schema v1, seed contents, Node driver used, deviations)
- [ ] Update the status board + decisions
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
