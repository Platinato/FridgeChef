# Sprint 05 handbook - API layer (mock + http seam)

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done
- **Dates:** 2026-09-29 → 2026-09-29
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

All tasks and acceptance criteria are met. `verify`, `expo-doctor` and `api:smoke` (mock) pass. The smoke script also passed in **http mode** against a throwaway local server over a real socket (see Build verification pass).

## What was built

- **The seam (`src/services/api/`)**
  - `contract.ts`: Zod schemas + DTO types for every request / response + the error envelope.
  - `mappers.ts`: DTO ⇄ domain.
  - `FridgeChefApi.ts`: the interface + `DetectInput` / `DetectionResult` / `SuggestInput` / `PreparedImage`.
  - `errors.ts`: `ApiError` + `toUserMessage`.
  - `http/endpoints.ts` + `joinUrl`.
  - `http/request.ts`: the only `fetch` call, plus `decodeResponse()`.
  - `http/options.ts`: `httpOptionsFromConfig`.
  - `http/HttpApi.ts`.
  - `mock/mockBackend.ts`: the stand-in server.
  - `mock/MockApi.ts`.
  - `mock/db/{schema,mockDb,mockRepo}.ts`, and `mock/db/seed/{catalog,detections,recipes,demoPhotos}.ts` typed as contract DTOs.
  - `index.ts`: `getApi()`, `createApi()`, `setApiForTests()`, `listDemoPhotos()`.
- **Query layer (`src/services/queries/`)**
  - `QueryProvider` + `createQueryClient(overrides?)`.
  - `useCatalog`, `useDetectIngredients`, `useSuggestions`, `useRecipe`.
  - `queryKeys` (stable hash), `knownRecipe`.
- **Smoke script:** `scripts/api-smoke.ts`, run as `npm run api:smoke`.
- **Test fixtures:**
  - `src/testing/mockupData.ts` now maps the **mock seed through the real mappers**. All Sprint 04 regression counts are still green on it.
  - New `src/testing/apiHelpers.ts`.
- **Tests: +6 suites, +92 tests (269 total).**
  - `services/api/__tests__/contract.test.ts` (34)
  - `mockApi.test.ts` (10)
  - `httpApi.test.ts` (20)
  - `parity.test.ts` (11)
  - `factory.test.ts` (4)
  - `services/queries/__tests__/queries.test.tsx` (8)
  - `architecture-rules.test.ts`, API seam block (+5)
- **Packages:** `@tanstack/react-query` ^5.104.0, and the dev dependency `tsx` ^4.23.15.

### API surface (`import { … } from '@/services/api'`)

| Export | What |
|---|---|
| `getApi()` | The singleton for `EXPO_PUBLIC_API_MODE`. Screens don't call it directly; use the hooks. |
| `FridgeChefApi` | `getCatalog(signal?)` → `CatalogData`; `detectIngredients(DetectInput, signal?)` → `{ scanId, items, warnings }`; `suggestRecipes(SuggestInput, signal?)` → `Recipe[]`; `getRecipe(id, signal?)` → `Recipe` (`not_found` if unknown) |
| `DetectInput` | `{ images: PreparedImage[] (1-6, { id, mimeType, base64 }), knownStapleIds, locale, units }` |
| `SuggestInput` | `{ kitchen (useKitchen()), prefs, profile: { allergies }, limit? = 12 }` |
| `ApiError` | `kind`: `network` / `timeout` / `unauthorized` / `rate_limited` / `server` / `not_found` / `invalid_response`, plus `status?`, `retryAfterSec?`, `detail?` (logs only) and `cancelled`. `message` is always user-safe. |
| `toUserMessage(e)` | Short UI copy per kind (no "AI", no em dashes); falls back to "Something went wrong. Try again." |
| `listDemoPhotos()` | `{ id, label, uri }[]`: 6 in mock mode, `[]` in http mode |
| `setApiForTests(api \| null)`, `createApi(config)`, `httpOptionsFromConfig(config, clientId)`, `clientId()` | Tests / tooling |

### Hooks (`import { … } from '@/services/queries'`, under `<QueryProvider>`)

Every query hook returns `{ data, isLoading, isFetching, error, errorMessage, refetch }`.

| Hook | Notes |
|---|---|
| `useCatalog()` | Cached for 24 h. |
| `useDetectIngredients()` | `{ detect, detectAsync, isPending, data, error, errorMessage, reset }`. It sets `scan.detecting` while in flight, and on success calls `scan.setDetection(items, warnings)`. |
| `useSuggestions(input \| null)` | `null` = idle. Keyed by a hash of the exact suggest request, so the filter chip and sort don't refetch. Cached for 1 h. Returns the backend's list; rank it with `rankSuggestions`. |
| `useRecipe(id?)` | Shows a copy from the suggestions cache or the cookbook snapshot at once (as stale data), refreshes it once, and updates a saved / cooked snapshot. |

### Mock database (`fridgechef-mock.db`)

- **Tables:**
  - `mock_catalog`: 1 row
  - `mock_detections`: 12 rows (`photo_index`, `sort_order`)
  - `mock_recipes`: 10 rows
  - `mock_demo_photos`: 6 rows
  - Each row keeps the full DTO in `dto`.
- **Migrations:** `0001_mock_schema`, then `0002_mock_seed`. Both run with Sprint 04's `migrate()`, one transaction each.
- **Opening:** lazily, on the first mock call.
- **`resetMockDatabase()`** reinserts the seed and leaves user data alone.
- **Mock behaviour:**
  - Detection returns the items whose `photoIndex` < the photo count: 8 items for 1 photo, 12 for 2 or more.
  - The second photo comes back `blurry` when 3+ photos are sent.
  - Suggest filters with `domain/suggestions.passes`, returns the survivors in seed order, and applies `limit`.
  - An unknown recipe id → 404 `not_found`.
  - `MOCK_LATENCY_MS` sets the latency; it's abortable.
  - `MOCK_FAILURE_RATE` → 503 `server`.

## How to go live

1. **Get from the backend owner:** the base URL, a *client* key, and how the key is sent (header name + scheme).
   - **Security:** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. The key must be one intended for a client (e.g. a rate-limited key for your own backend). A secret LLM-provider key must stay on a server, never in this app.
2. **Create `fridgechef-app/.env`** (git-ignored; never commit it):
   ```bash
   EXPO_PUBLIC_API_MODE=http
   EXPO_PUBLIC_API_BASE_URL=https://api.example.com   # a trailing slash or a path prefix (/api) is fine
   EXPO_PUBLIC_API_KEY=<client key>
   EXPO_PUBLIC_API_AUTH_HEADER=Authorization           # or e.g. x-api-key
   EXPO_PUBLIC_API_AUTH_SCHEME=Bearer                  # leave empty (the line with no value) to send the raw key
   EXPO_PUBLIC_API_TIMEOUT_MS=30000
   ```
3. **Run** `cd fridgechef-app && npm run api:smoke`. Every line must print `PASS`: the catalog, detect (3 tiny JPEGs), suggest, recipe by id, and unknown recipe → `not_found`. On a shape mismatch, the line shows `invalid_response` with the Zod issues.
4. **Only if the smoke fails on shapes or paths**, edit **only these three files**:
   - `src/services/api/contract.ts`: the Zod schemas (field names, optional vs required, enums).
   - `src/services/api/mappers.ts`: how wire fields map to the domain (e.g. a renamed field, units, nesting).
   - `src/services/api/http/endpoints.ts`: the paths.

   Then run `npm test -- src/services/api` (the parity test shows whether mock and http still agree), `npm run api:smoke` and `npm run verify`. Log any contract change in `decisions.md`, and update **both** `api-contract.md` copies (a test keeps them identical).
5. **Start the app** with `npx expo start -c`. The `-c` clears the cache: `EXPO_PUBLIC_*` values are inlined at build time. For an EAS build, set the same variables as EAS environment variables.

`fridgechef-mock.db` is never opened in http mode, and the user database (`fridgechef.db`) isn't touched by the switch. In http mode a fresh install starts empty (no demo user); see the Sprint 06 handover about default staples.

## Changed files (uncommitted, for the user to review)

Sprints 02-04 are also still uncommitted. This sprint's changes:

- **Added:**
  - `fridgechef-app/src/services/api/`:
    - `{contract,mappers,FridgeChefApi,errors,index}.ts`
    - `http/{endpoints,request,options,HttpApi}.ts`
    - `mock/{MockApi,mockBackend}.ts`
    - `mock/db/{schema,mockDb,mockRepo}.ts` and `mock/db/seed/{catalog,detections,recipes,demoPhotos}.ts`
    - `__tests__/{contract,mockApi,httpApi,parity,factory}.test.ts`
  - `fridgechef-app/src/services/queries/{QueryProvider.tsx,hooks.ts,keys.ts,index.ts}` and `__tests__/queries.test.tsx`
  - `fridgechef-app/src/testing/apiHelpers.ts`
  - `fridgechef-app/scripts/api-smoke.ts`
  - `sprints/05-api-layer/HANDBOOK.md`
- **Modified:**
  - `fridgechef-app/package.json` + `package-lock.json` (react-query, tsx, the `api:smoke` script)
  - `fridgechef-app/src/testing/mockupData.ts` (now built from the seed + mappers)
  - `fridgechef-app/src/__tests__/architecture-rules.test.ts` (API seam block)
  - `fridgechef-app/README.md` (`api:smoke`, "Going live")
  - `fridgechef-app/docs/api-contract.md` and `sprints/reference/api-contract.md` (D33 refinements, identical)
  - `CLAUDE.md` (the `api:smoke` command, API seam notes, testing notes)
  - `sprints/reference/architecture.md` (layout, lazy mock DB, parity)
  - `sprints/reference/decisions.md` (D32-D36)
  - `sprints/README.md` (status board)
  - `sprints/05-api-layer/TODO.md`
- **Deleted:**
  - `fridgechef-app/src/mocks/fixtures/.gitkeep` (the whole stale `src/mocks/` skeleton)
  - `.gitkeep` in `src/services/api/http/`, `src/services/api/mock/` and `src/services/queries/`

## Decisions and deviations

Decisions D32-D36 were appended to `sprints/reference/decisions.md`:

- **D32:** a mock backend + a shared `decodeResponse()`, so MockApi takes HttpApi's parsing path. The parity test proves it.
- **D33:** contract refinements (404, other 4xx, the 429 wait cap, backoff, aborts, empty key, optional `photoWarnings` / `swaps`). Both contract copies are updated.
- **D34:** the mock database opens lazily, not in `initDatabase()`. `HttpApi` takes explicit options, and `X-Client` comes from `expo-constants`.
- **D35:** TanStack Query defaults (no retries, cache times, a request-hash key, `useRecipe` initial data), and `gcTime: Infinity` in tests.
- **D36:** `api:smoke` uses `--env-file-if-exists`; `src/mocks/` deleted; test helpers live in `src/testing/`.

Deviations from `INSTRUCTIONS.md`:

- **Smoke command:** `--env-file-if-exists=.env` instead of `--env-file=.env`. The latter makes Node exit when there's no `.env`, which is the default mock setup.
- **Boot sequence:** `architecture.md` said `initDatabase()` opens the mock database in mock mode. The instructions' lazy opening wins, and `architecture.md` is updated.
- **Request validation:** requests are also validated before sending (`detectRequestSchema.parse`, `suggestRequestSchema.parse`). An invalid input throws a `ZodError` (a caller bug, e.g. 0 or 7 photos), not an `ApiError`, and nothing is sent.

## Handovers to the next sprint

**Sprint 06 (shell + screens):**
- **Root layout:** wrap it in `<QueryProvider>`, inside the existing gesture / sheet providers. Screens import only `@/services/queries` (and `ApiError` / `toUserMessage` from `@/services/api` when needed). The guard test fails on anything else.
- **React Native focus / online managers aren't wired.** Queries don't refetch on app foreground or reconnect. If wanted, hook TanStack's `focusManager` to `AppState`. Online detection would need a network package, which isn't installed, so decide first.
- **Reset demo data:** `resetAll()` resets only the user database. In mock mode, also call `resetMockDatabase()` (from `@/services/api/mock/db/mockDb`). The guard allows that only inside `services/api`, so add a small `resetBackendData()` export to `services/api/index.ts` rather than importing the mock from a screen.
- **http mode on first launch:** the user database starts empty. When `useCatalog()` resolves, apply `catalog.defaultStaples` at level 3 if the pantry is empty (Sprint 04's `seedDefaults` only applies them on the very first launch, and the catalog isn't known then).
- **Error states:**
  - Every hook exposes `errorMessage` (short, content-rule-safe copy).
  - `error.kind === 'unauthorized'` is a configuration problem, not a user one.
  - `cancelled` errors (the screen was left) shouldn't be shown.

**Sprint 07 (scan → confirm):**
- **Detection:** `useDetectIngredients().detect({ images, knownStapleIds: pantry staple ids, locale, units: profile.units })`. Call `scan.resetScan()` first for a new scan.
- **Image prep:** `PreparedImage` comes from `services/media` (resize ≤ 1280 px, JPEG ~0.7, base64 **without** a `data:` prefix), which is still empty.
- **Demo photos:** `listDemoPhotos()` feeds "Use demo photos": remote Unsplash URLs in mock mode, `[]` in http mode, so hide the helper then. Mock detection only looks at the photo count.

**Sprint 08 (recipes → cook):**
- **Suggestions:** `useSuggestions({ kitchen: useKitchen(), prefs, profile })` → `rankSuggestions(data, { kitchen, prefs, allergies })`. Pass `null` until the scan is confirmed.
- **Recipe detail:** `useRecipe(id)` works offline for saved / cooked recipes (snapshot as initial data).

**Sprint 10 (go-live):** follow **How to go live** above. `api:smoke` in http mode is the acceptance check. It already passed against a local server that follows the contract.

**Security note (carried):** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. A secret LLM-provider key must stay on a server, never in this app.

**Carry-over from earlier sprints (still open):**
- Expo Go smoke test on a physical iPhone (Sprints 01-04).
- The Sheet animation check (Sprint 03).

## Known issues / tech debt

- **A changed seed module doesn't reach existing installs.** The seed is inserted by migration `0002` only once.
  - Fix: after editing a seed, add a migration that calls `mockRepo.reseed(db)`, or reset from a dev menu (`resetMockDatabase()`).
- **MockApi doesn't simulate retries.** An injected failure surfaces immediately (HttpApi would retry 5xx twice). This is intentional, so the error UI is easy to reach.
- **`X-Client` always says `fridgechef-ios`**, also on the web preview. It's harmless; the app targets iOS.
- **esbuild's postinstall isn't approved** under npm 11 `allow-scripts` (a new pending script, next to Sprint 01's `unrs-resolver`). tsx works anyway, because the binary comes from `@esbuild/win32-x64`. Run `npm approve-scripts esbuild` if it becomes noisy.
- **`setApiForTests({ ...api, … })` drops class methods** (spread doesn't copy the prototype). In tests, override with a full object, or spread only for the methods you use.
- **`npm audit`:** the same 14 moderate transitive advisories; no new ones from react-query or tsx.

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm run api:smoke                  # mock: 5 checks against a temporary in-memory mock DB
npm test -- src/services           # contract, mock DB, HttpApi, parity, factory, hooks
EXPO_PUBLIC_API_MODE=http EXPO_PUBLIC_API_BASE_URL=https://… npm run api:smoke   # any real backend
```

## Build verification pass

```
npm run verify     → PASS
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 19 suites, 269 tests passed (Sprint 04 ended at 13 / 177)
  ios export  "iOS Bundled ... (2002 modules)" → .verify-dist
              (probe: a route importing @/services/api + @/services/queries → 2125 modules, bundles OK;
               contains the endpoint paths and the fridgechef-mock.db name, and no node:sqlite /
               createNodeDriver / esbuild; reverted)
npx expo-doctor    → PASS: 21/21 checks passed. No issues detected!
npm run api:smoke  (mock, no .env) → PASS
  PASS  GET  /v1/catalog  8 moods, 8 cuisines, 25 default staples
  PASS  POST /v1/scans/detect  12 items, 1 photo warning(s), scan scn_mock_ph1_ph2_ph3
  PASS  POST /v1/recipes/suggest  9 recipes
  PASS  GET  /v1/recipes/butter-chicken  "Butter Chicken Lite", 11 ingredients, 5 steps
  PASS  GET  /v1/recipes/<unknown> → not_found  not_found as expected
  All 5 checks passed
npm run api:smoke  (http, against a throwaway local Node server serving the mock backend over
  a real socket; scratchpad only, not committed) → PASS 5/5
  base URL http://127.0.0.1:8787/api/ (path prefix + trailing slash), x-api-key with an empty scheme;
  the server saw every request with x-api-key=smoke-key and x-client=fridgechef-ios/1.0.0-smoke
npm run api:smoke  (http, unreachable host) → 5 × FAIL "network", exit 1
npm run api:smoke  (http, no base URL) → ConfigError naming EXPO_PUBLIC_API_BASE_URL
Guard mutation check: a probe file in src/screens importing MockApi / HttpApi and calling fetch
  failed both seam rules; then removed
Manual smoke       → not run: no screen uses the API yet (Sprint 06). Expo Go on an iPhone is
  still a carry-over.
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0 (needed for `--env-file-if-exists` and `node:sqlite`), npm 11.17.0.
- Expo SDK 57.0.25, `@tanstack/react-query` ^5.104.0, `tsx` ^4.23.15, Zod 4.
- `tsx` resolves the `@/` path alias from `tsconfig.json`, so the smoke script imports app code directly.
