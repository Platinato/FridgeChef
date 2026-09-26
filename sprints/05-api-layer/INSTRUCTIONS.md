# Sprint 05 - API layer (mock + http seam)

## Before you start

1. Read `sprints/04-domain-state/HANDBOOK.md` and `sprints/01-bootstrap/HANDBOOK.md`.
2. Read this file, `sprints/reference/architecture.md` → **The API seam** and **Local database** (Mock backend database), decisions D12-D15, and all of `sprints/reference/api-contract.md`.

## Goal

The complete infrastructure for talking to the backend. It runs today on an **on-device SQLite mock database** (`MockApi` reading `fridgechef-mock.db`), seeded from typed TypeScript modules. There are no JSON data files. When the user later supplies the endpoint and key in `.env`, the app must work against the real backend **with no changes outside `contract.ts` / `mappers.ts` / `http/endpoints.ts`**. Ideally there are no code changes at all.

## Tasks

1. **Contract** (`services/api/contract.ts`)
   - Zod schemas + inferred types for every request and response DTO in `api-contract.md`: Catalog, DetectRequest/Response, SuggestRequest/Response, Recipe, and the error envelope.
   - Unknown extra fields are allowed (`.passthrough()` or strip); required fields are enforced.
2. **Mappers** (`services/api/mappers.ts`): DTO → domain (`toDetectedItem`, `toRecipe`, `toCatalog`, …) and domain → DTO (`toSuggestRequest(kitchen, prefs, profile)`, `toDetectRequest(preparedImages, …)`). This is the only place that knows the wire format.
3. **Interface** (`services/api/FridgeChefApi.ts`):
   ```ts
   interface FridgeChefApi {
     getCatalog(signal?: AbortSignal): Promise<CatalogData>;
     detectIngredients(input: DetectInput, signal?: AbortSignal): Promise<DetectionResult>;
     suggestRecipes(input: SuggestInput, signal?: AbortSignal): Promise<Recipe[]>;
     getRecipe(id: string, signal?: AbortSignal): Promise<Recipe>;
   }
   ```
   Every method takes and returns **domain** types.
4. **Errors** (`services/api/errors.ts`)
   - `ApiError` with `kind` (`network` | `timeout` | `unauthorized` | `rate_limited` | `server` | `not_found` | `invalid_response`), `status?`, `retryAfterSec?` and a user-safe `message`.
   - `toUserMessage(error)` returns short copy for the UI, following the content rules: no "AI", no em dashes.
5. **HttpApi** (`services/api/http/`)
   - `endpoints.ts` is a path table (`catalog: '/v1/catalog'`, …).
   - A `request()` helper that:
     - joins the base URL safely
     - sends JSON
     - sets the auth header from `config.API_AUTH_HEADER` + `config.API_AUTH_SCHEME` + `config.API_KEY` (an empty scheme sends the raw key), plus `X-Client`
     - applies the timeout via `AbortController` (merged with the caller's signal)
     - retries per the contract table
     - maps statuses to `ApiError`
     - parses with Zod (a failure becomes `invalid_response` and logs the Zod issues in dev)
   - `HttpApi` implements the interface using the mappers.
6. **Mock backend database** (`services/api/mock/db/`)
   - `seed/catalog.ts`, `seed/detections.ts` (all 12 items with `photoIndex`, confidence, altUnit, imageUrl), `seed/recipes.ts` (all 10 recipes with nested `nutrition` and `imageUrl`), and `seed/demoPhotos.ts` (the mockup's library photos).
     - These are ported from `fridgechef-mockup/js/data.js` and **typed as the contract DTO types** from `contract.ts`, so a shape mismatch fails `tsc`.
     - Copy follows the content rules.
   - `schema.ts`: the mock tables, and migrations run with Sprint 04's `migrate()`.
     - Tables: `mock_catalog` (one row), `mock_detections`, `mock_recipes`, `mock_demo_photos`.
     - Each row has the lookup columns (`id`, `photo_index`, `sort_order`) and the full wire DTO in a `dto` TEXT column.
     - A seeding migration inserts the seed modules in one transaction.
   - `mockDb.ts`: `openMockDatabase()` opens `fridgechef-mock.db` through `openDatabaseByName()` from `src/db/client.ts`, and migrates it. It is **only called in mock mode**. `resetMockDatabase()` deletes and reseeds it.
   - `mockRepo.ts`: the only place mock SQL lives. It returns raw DTO objects, which MockApi then parses.
   - Replace Sprint 04's local recipe test helper with the seed module, and keep its regression counts green.
7. **MockApi** (`services/api/mock/MockApi.ts`)
   - Implements the same interface **by reading wire DTOs from the mock database, then passing them through the same Zod schemas and mappers**, so the mock exercises the real parsing path.
   - Behaviour per `api-contract.md` → Mock behaviour: `photoIndex` filtering, the blurry warning, preference filtering via `domain/suggestions.passes`, and 404 for an unknown recipe.
   - Latency comes from `config.MOCK_LATENCY_MS` (abortable). `config.MOCK_FAILURE_RATE` injects `server` errors.
8. **Factory** (`services/api/index.ts`)
   - `getApi()` returns a singleton chosen by `config.API_MODE`. The mock database is opened lazily on the first mock call; http mode never opens it.
   - Export a `setApiForTests(api)` hook.
   - Export `listDemoPhotos()`: it returns the demo photos from the mock database in mock mode, and `[]` in http mode. The Scan screen's "Use demo photos" helper uses it in Sprint 07.
   - **Nothing else in the app may import `MockApi` or `HttpApi`.**
9. **Query layer** (`services/queries/`)
   - A `QueryProvider` (QueryClient with sensible defaults: `retry` handled by `request()` so Query retries are 0 for mutations, `staleTime` 24 h for the catalog).
   - Hooks:
     - `useCatalog()`
     - `useDetectIngredients()`: a mutation that writes to `scanStore.setDetection` on success.
     - `useSuggestions(input)`: a query keyed by a stable hash of the confirmed kitchen + prefs.
     - `useRecipe(id)`: seeded from the suggestions cache / cookbook snapshot as `initialData`.
   - Each hook exposes loading / error / data in a UI-friendly shape.
10. **Smoke script** (for Sprint 10)
   - `scripts/api-smoke.ts`, run as `npm run api:smoke`, i.e. `node --env-file=.env --import tsx scripts/api-smoke.ts`.
   - It calls all four endpoints through **HttpApi** with the configured env and prints pass/fail per call, plus any Zod issues.
   - In mock mode it runs against MockApi on a temporary mock database, opened through the Node driver (`src/db/testing/nodeDriver.ts`), because `expo-sqlite` doesn't run in plain Node. It should pass.
11. **Docs**
    - Copy `sprints/reference/api-contract.md` to `fridgechef-app/docs/api-contract.md` and keep them in sync. If you refine the contract, update both and log it in `decisions.md`.
    - Update `.env.example` if anything changed.
12. **Tests.** They run on the Node driver with in-memory databases.
    - **Contract tests** (`services/api/__tests__/contract.test.ts`): every seed DTO passes the Zod schemas, every row read back from the mock database passes, and every MockApi method's output is valid.
    - **Mock database tests:** the seed row counts (10 recipes, 12 detections), a reopen does not seed twice, and `resetMockDatabase` restores the seed.
    - **HttpApi tests** with a mocked `global.fetch`:
      - Bearer vs raw-key vs `x-api-key` header composition
      - base URL joining with and without a trailing slash
      - timeout → `timeout`
      - 401 → `unauthorized`
      - 429 + retryAfter → one retry
      - 5xx → retries, then `server`
      - a malformed body → `invalid_response`
    - **Parity test**: MockApi and HttpApi (fetch mocked to return the same seed DTOs) produce deep-equal domain results for the same inputs. This is the "minimal change" guarantee.
    - **Hook tests** with a test QueryClient + `setApiForTests`.
    - **Architecture guard test**. It scans app source files (test files under `__tests__/` and `src/db/testing/` are exempt). It fails if:
      - any file outside `services/api/` imports `services/api/mock/**` or `http/HttpApi`, or calls `fetch(`
      - any file outside `src/db/client.ts` imports `expo-sqlite`
      - screens or components import `src/db`
      - `src/` contains a `.json` data file

## Out of scope

Screens (Sprints 06-08); real endpoint values (Sprint 10).

## Acceptance criteria

- Flipping `EXPO_PUBLIC_API_MODE` between `mock` and `http` needs **zero code changes**. The parity test proves both paths produce the same domain data.
- The architecture guard test, the contract tests and the mock database tests are green.
- In http mode, `fridgechef-mock.db` is never opened (a test proves it).
- `npm run api:smoke` passes in mock mode.

## Build verification pass

`npm run verify` + `npx expo-doctor` + `npm run api:smoke` (mock). Record all three in the handbook.

## End of sprint

The handbook must include a **"How to go live" section**: which env vars to set, what to run, and which three files may need edits. Update the status board and decisions. Do not commit.
