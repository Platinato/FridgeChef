# FridgeChef app - target architecture

This is the architecture every sprint builds toward. A sprint may refine it, but any change must be recorded in `sprints/reference/decisions.md` and in that sprint's handbook.

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo (latest stable SDK at bootstrap time, record the version) + React Native + **TypeScript strict** |
| Navigation | Expo Router (file-based; stack + bottom tabs), routes in `src/app/` |
| Storage (on-device) | **SQLite** via `expo-sqlite` (in Expo Go, iOS + Android): raw SQL behind typed repositories, `PRAGMA user_version` migrations. See **Local database** below. |
| State (in memory) | Zustand stores: hydrated from the SQLite repositories at boot, and every action writes through to its repository. No `persist` middleware, no AsyncStorage. |
| Remote data | TanStack Query (`@tanstack/react-query`) wrapping the API client |
| Validation | Zod: every API response is parsed before it reaches the app |
| UI deps | `react-native-svg`, `expo-linear-gradient`, `@react-native-masked-view/masked-view`, `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler`, `@react-native-community/slider`, `react-native-toast-message`, `expo-haptics` |
| Media | `expo-camera`, `expo-image-picker` (multi-select), `expo-image-manipulator` (resize/compress before upload), `expo-image` |
| Fonts | `expo-font` + `@expo-google-fonts/bebas-neue` + `@expo-google-fonts/inter` |
| Tests | `jest-expo` + `@testing-library/react-native` |
| Lint/format | ESLint (`eslint-config-expo`) + Prettier |

Always add Expo-managed packages with `npx expo install <pkg>` so versions match the SDK.

## Folder layout (project root: `fridgechef-app/`)

```
fridgechef-app/
├─ app.config.ts            # app name, bundle id, scheme, plugins, iOS permission strings
├─ .env.example             # every variable, documented (real .env is git-ignored)
├─ docs/api-contract.md     # copy of sprints/reference/api-contract.md, kept in sync
└─ src/
   ├─ app/                  # Expo Router routes - thin; each renders a screen from src/screens
   ├─ screens/              # screen bodies (HomeScreen.tsx, ConfirmScreen.tsx, ...)
   ├─ components/           # one file per component, named like the mockup (Chip.tsx, TicketCard.tsx, ...)
   ├─ theme/                # tokens.ts (port of mockup js/theme.js), fonts.ts, icons
   ├─ domain/               # types.ts + pure logic (matching, scoring, units, formatting) - no React, no IO
   ├─ state/                # Zustand stores (profile, prefs, pantry, scan, cookbook): hydrate from db/repositories, write through
   ├─ db/                   # the on-device user database (fridgechef.db) - see "Local database"
   │  ├─ driver.ts          # SqlDriver port (execAsync, runAsync, getAllAsync, getFirstAsync, withTransactionAsync)
   │  ├─ client.ts          # opens the DB (the ONLY expo-sqlite import), WAL + foreign_keys, getDb(), setDatabaseForTests()
   │  ├─ migrate.ts         # runs migrations/ in order, tracked with PRAGMA user_version
   │  ├─ migrations/        # 0001_init.ts, 0002_… - append-only, never edit a shipped one
   │  ├─ repositories/      # profileRepo, prefsRepo, pantryRepo, scanRepo, cookbookRepo, metaRepo, resetRepo - the ONLY place app SQL lives
   │  ├─ seeds/demoUser.ts  # demo starting state (pantry levels, saved / cooked, last scan) applied in mock mode
   │  ├─ bootstrap.ts       # initDatabase(), seedDemoData(), seedDefaults(), resetDatabase()
   │  └─ testing/nodeDriver.ts  # SqlDriver on node:sqlite, for Jest and scripts/api-smoke.ts
   ├─ testing/              # test-only fixtures (mockup data as domain types) - never imported by app code
   ├─ services/
   │  ├─ config.ts          # the ONLY place env is read
   │  ├─ api/
   │  │  ├─ FridgeChefApi.ts    # interface - the app depends on this, never on an implementation
   │  │  ├─ contract.ts         # Zod schemas for request/response DTOs (mirrors api-contract.md)
   │  │  ├─ mappers.ts          # DTO <-> domain; the ONLY place that knows the wire format
   │  │  ├─ errors.ts           # ApiError (kind: network | timeout | unauthorized | rate_limited | server | not_found | invalid_response) + toUserMessage
   │  │  ├─ http/HttpApi.ts     # FridgeChefApi over HTTP (explicit HttpOptions; http/options.ts builds them from config)
   │  │  ├─ http/request.ts     # the ONLY fetch call: URL join, auth + X-Client, timeout, retry policy, decodeResponse()
   │  │  ├─ http/endpoints.ts   # path table
   │  │  ├─ mock/MockApi.ts     # simulated latency/failures, then mockBackend → decodeResponse() → mappers (same path as HttpApi)
   │  │  ├─ mock/mockBackend.ts # the stand-in server: request DTOs in, raw replies (status + JSON) out, from the mock DB
   │  │  ├─ mock/db/            # the stand-in backend's database (fridgechef-mock.db)
   │  │  │  ├─ schema.ts        # mock tables + the seeding migration (mockMigrations, prepareMockDatabase); no expo-sqlite import
   │  │  │  ├─ mockDb.ts        # openMockDatabase() / resetMockDatabase() - opened lazily on the first mock call
   │  │  │  ├─ mockRepo.ts      # the ONLY place mock SQL lives; returns wire DTOs
   │  │  │  └─ seed/            # catalog.ts, detections.ts, recipes.ts, demoPhotos.ts - typed as contract DTOs
   │  │  └─ index.ts            # getApi(): picks mock | http from config; listDemoPhotos() ([] in http mode)
   │  ├─ queries/           # QueryProvider + TanStack Query hooks: useCatalog, useDetectIngredients, useSuggestions, useRecipe
   │  └─ media/             # image prep: resize → JPEG → base64
```

There are **no JSON data files** in the app. Dummy data is written as typed TypeScript seed modules (ported from `fridgechef-mockup/js/data.js`) and lives in SQLite at runtime.

## The API seam (why going live is a config change)

```
screens → queries/hooks → FridgeChefApi (interface) ─┬─ MockApi  → fridgechef-mock.db (SQLite, on device)
                                                     └─ HttpApi  → EXPO_PUBLIC_API_BASE_URL
                                both return DOMAIN types via mappers.ts + contract.ts (Zod)
```

Rules that keep the swap cheap:

1. **Screens, components and stores never import `MockApi`, `HttpApi`, anything under `services/api/mock/`, or `fetch`.** They use the hooks in `services/queries`, which call `getApi()`.
2. **`MockApi` reads wire DTOs (as defined in `contract.ts`) from the mock database**, and runs them through the same Zod schemas and mappers as `HttpApi`. The mock therefore exercises the real parsing path.
3. **Wire format lives only in `contract.ts` + `mappers.ts` + `http/endpoints.ts`.** If the real backend's shape differs from the contract, only those files change.
4. **All env is read in `services/config.ts`**, via static `process.env.EXPO_PUBLIC_…` references (Expo inlines them at build time), validated with Zod, and exported as a frozen `config`. No `process.env` anywhere else.
5. Contract tests run every seed DTO and every MockApi response through the Zod schemas. Sprint 10 runs the same suite against the live endpoint.
6. **http mode never opens the mock database.** Going live does not touch `fridgechef.db` or any user data.

### Environment variables (`.env`, see `.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_MODE` | `mock` | `mock` or `http` |
| `EXPO_PUBLIC_API_BASE_URL` | empty | e.g. `https://api.example.com` (required when mode is `http`) |
| `EXPO_PUBLIC_API_KEY` | empty | sent with every request |
| `EXPO_PUBLIC_API_AUTH_HEADER` | `Authorization` | header name for the key (e.g. `x-api-key`) |
| `EXPO_PUBLIC_API_AUTH_SCHEME` | `Bearer` | prefix before the key; empty = send the raw key |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `30000` | per-request timeout (detection can be slow) |
| `EXPO_PUBLIC_MOCK_LATENCY_MS` | `900` | simulated latency in mock mode |
| `EXPO_PUBLIC_MOCK_FAILURE_RATE` | `0` | 0-1, makes mock calls fail at random, to test error states |

> **Security note to carry into every handbook:** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. The key the user supplies must be one intended for a client (for example, a key for their own backend, with rate limiting). A secret LLM-provider key must stay on a server, never in this app.

## Data ownership

- **On device (SQLite `fridgechef.db`, mirrored in Zustand while the app runs):**
  - user profile (diet, allergies, household, units, default effort)
  - preferences for the last Mood screen
  - pantry staples and their levels
  - the current scan session (photos, detected items, confirmed quantities)
  - saved recipe snapshots and cooked history
- **From the API:**
  - the catalog (moods, cuisines, diets, allergies, equipment, addable items, staple suggestions)
  - ingredient detection for photos
  - recipe suggestions for confirmed ingredients + preferences
  - recipe detail by id
- **Computed on device (pure `domain/` logic, ported from mockup `js/logic.js`):**
  - match %, have / short / missing, scoring
  - filter chips and sort
  - unit display conversions
  - pantry deduction after cooking

## Local database (SQLite)

All app data lives on the phone in SQLite, through `expo-sqlite` (included in Expo Go for SDK 57; works on iOS and Android). Nothing is synced anywhere. Add the package with `npx expo install expo-sqlite`, and check the SDK 57 docs (`https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/`) before writing code against it.

### Two database files

| File | Opened when | Holds | Owner |
|---|---|---|---|
| `fridgechef.db` | always | user data: profile, preferences, pantry, scan session, cookbook, app meta | `src/db/` |
| `fridgechef-mock.db` | only when `API_MODE=mock` | the stand-in backend's data: catalog, detections, recipes, demo photos | `src/services/api/mock/db/` |

Keeping the mock backend in its own file means it can be reset or deleted without touching user data, and http mode never loads it.

### Schema v1 (`fridgechef.db`, migration `0001_init`)

| Table | Rows | Columns (main) |
|---|---|---|
| `app_meta` | key/value | `key` PK, `value` TEXT. Keys: `onboarded`, `seeded_at`, `last_scan_at`, `last_scan_items`, `auto_include` |
| `profile` | exactly 1 (`id = 1`) | name, diet, `allergies` (JSON text, Zod-validated on read), household_size, units, default_effort, updated_at |
| `preferences` | exactly 1 (`id = 1`) | mood, time_min, effort, servings, hunger, diet, spice, filter, sort, `cuisines` / `equipment` (JSON text) |
| `staples` | one per staple | id PK, name, category, unit, unit_hint, per_level, level, included, updated_at, sort_order (low stock = level ≤ 1.5, a domain constant) |
| `scan_sessions` | one per scan | id PK, created_at, confirmed_at (NULL until confirmed), status |
| `scan_photos` | ≤ 6 per session | (session_id FK, id) PK, uri, label, idx, retaken |
| `scan_items` | detected + manual items | (session_id FK, id) PK, name, category, unit, min, max, step, estimate, value (base unit), display_unit, alt_unit (JSON), confidence (`manual` = added by the user), photo_index, image_url, touched, sort_order |
| `scan_warnings` | per photo | session_id FK, photo_index, type, message |
| `recipe_snapshots` | one per recipe seen | id PK, `recipe` (domain Recipe as JSON, Zod-validated on read), fetched_at |
| `saved_recipes` | one per saved | recipe_id PK → recipe_snapshots, saved_at |
| `cooked_history` | one per cook | id INTEGER PK, recipe_id → recipe_snapshots, servings, cooked_at |

Small lists and whole snapshots are stored as JSON text **inside SQLite** and always parsed with Zod on read. Anything the app filters or sorts on gets a real column.

### Rules

1. **`expo-sqlite` is imported only in `src/db/client.ts`.** Everything else talks to the `SqlDriver` port (`src/db/driver.ts`), whose method names match expo-sqlite (`execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`).
2. **App SQL lives only in `src/db/repositories/`; mock SQL lives only in `services/api/mock/db/`.** Repositories take and return domain types, never raw rows. Always use bound parameters, never string-built SQL.
3. **Screens and components never import `src/db`.** They read Zustand stores and query hooks. Stores call repositories.
4. **Migrations are append-only.** `migrate.ts` reads `PRAGMA user_version`, runs every newer migration in order, each inside its own transaction, then bumps `user_version`. A shipped migration is never edited; changes go in a new numbered file.
5. On open: `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.
6. Multi-row writes (confirm scan, apply cooking, reset, seed) run in one transaction.

### Boot sequence

1. The root layout keeps the splash screen visible (`useBoot()` → `bootApp()` in `src/state/boot.ts`, D38).
2. `initDatabase()`: open `fridgechef.db` and run its migrations. In mock mode, `fridgechef-mock.db` is opened, migrated and seeded **lazily** on the first mock API call (D34).
3. First launch in mock mode (`app_meta.seeded_at` unset): apply `db/seeds/demoUser.ts` to `fridgechef.db`. In http mode, start empty; when the catalog first loads, `AppEffects` adds its `defaultStaples` at level 3 into an empty pantry, once per install.
4. `hydrateStores()`: every Zustand store loads its state from its repository.
5. Hide the splash. If any step throws, show `BootErrorScreen` with "Try again" (reruns the boot; no crash loop). A failed write-through later shows a toast.
6. Routes: `(tabs)` (Home / Pantry / Saved with the floating BottomNav) redirects to `/onboarding` until `profile.onboarded`; Scan and everything after it are full-screen stack routes (D37).

### State: Zustand over SQLite

- Stores keep the state the UI renders. They hydrate once at boot.
- Each action updates the store, then writes through to its repository (awaitable, so tests can wait for it). A failed write is logged, and in dev it shows a toast.
- `resetAll()` (`src/state`) waits for queued writes, then `resetDatabase()` clears the user tables in one transaction and reseeds; the stores hydrate again.
- Writes are serialised through one queue (`state/persist.ts`) so no statement lands inside another action's transaction (expo-sqlite includes every statement that runs while a transaction is open).
- Transient UI state (open sheets, in-flight requests) is never written to the database.

### Mock backend database

- `services/api/mock/db/seed/` holds typed TypeScript seed modules (`catalog.ts`, `detections.ts`, `recipes.ts`, `demoPhotos.ts`), typed as the contract DTO types, so the compiler checks them against `contract.ts`.
- The seeding migration inserts one row per entity: a few indexed columns used for lookups (e.g. recipe `id`, detection `photo_index`) plus the full wire DTO in a `dto` TEXT column.
- `MockApi` reads rows through `mockRepo.ts` (via `mockBackend.ts`, which answers like a server), then parses the reply with the same `decodeResponse()`, Zod schemas and mappers `HttpApi` uses. A parity test proves both paths return deep-equal domain data (D32).
- `listDemoPhotos()` in `services/api/index.ts` reads the demo photos for the Scan screen's "Use demo photos" helper. It returns `[]` in http mode.

### Tests and scripts

- `src/db/testing/nodeDriver.ts` implements `SqlDriver` on **`node:sqlite`** (built into Node 24, no dependency). Jest and `scripts/api-smoke.ts` (`npm run api:smoke`) use it with an in-memory database (`:memory:`) or a temp file.
- If Jest can't load `node:sqlite`, fall back to `sql.js` (pure WASM) behind the same port, and record the decision.
- Tests inject the driver with `setDatabaseForTests()`. They never mock SQL calls one by one.

### Web preview

Web support in `expo-sqlite` is alpha. For `npm run web`, `metro.config.js` serves `.wasm` files and sends `Cross-Origin-Embedder-Policy: credentialless` + `Cross-Origin-Opener-Policy: same-origin` (SDK 57 docs), and `app.config.ts` uses `web.output: 'single'` (static rendering fails on expo-sqlite's web worker). With both, the browser preview runs the real database (D41). iOS on a device is still what counts.

### Privacy and backup

- Data never leaves the device except the photos and preferences sent to the API.
- The database is not encrypted in v1. The `expo-sqlite` config plugin's `useSQLCipher` option can turn encryption on later.
- iOS includes the app's documents folder (where the database lives) in device backups by default. That's fine for v1.

## Mapping from the mockup

The mockup (`fridgechef-mockup/`) is the design and behaviour source of truth. Its README has the screen reference, content rules and component → React Native table. Port `js/theme.js` → `src/theme/tokens.ts`, `js/logic.js` → `src/domain/*`, and `js/data.js` → the TypeScript seed modules (`services/api/mock/db/seed/*` for backend data, `src/db/seeds/demoUser.ts` for the demo starting state). The mockup's `localStorage` store (`js/store.js`) becomes Zustand stores backed by the SQLite repositories. Each mockup component in `js/components/` becomes a `.tsx` component with the same name and props.
