# Sprint 05 TODO - API layer (mock + http seam)

## Start
- [x] Read `sprints/04-domain-state/HANDBOOK.md` + `sprints/01-bootstrap/HANDBOOK.md`
- [x] Read `INSTRUCTIONS.md`, `reference/architecture.md` (API seam + Local database), decisions D12-D15, `reference/api-contract.md`
- [x] Set Sprint 05 to "In progress" in `sprints/README.md`

## Tasks
- [x] `contract.ts`: Zod schemas + types for all DTOs + the error envelope
- [x] `mappers.ts`: DTO ⇄ domain (incl. `toSuggestRequest`, `toDetectRequest`)
  - [x] `toSuggestRequest` sends only items with value > 0 and staples that count (`stapleOn`)
- [x] `FridgeChefApi.ts` interface (domain in/out, AbortSignal)
  - [x] Plus `PreparedImage`, `DetectInput`, `DetectionResult`, `SuggestInput`
- [x] `errors.ts`: `ApiError` kinds + `toUserMessage` (content rules)
  - [x] `message` is always the user-safe copy; server text / Zod issues go in `detail`; `cancelled` flag for caller aborts
- [x] `http/endpoints.ts` path table
  - [x] Plus `joinUrl` (trailing slash / path prefix safe); recipe ids are URL-encoded
- [x] `http/request.ts`: base URL join, auth header/scheme, `X-Client`, timeout, retry policy, status mapping, Zod parse
  - [x] `decodeResponse()` extracted, so MockApi decodes replies exactly like HTTP (D32)
  - [x] Contract gaps decided and written into both `api-contract.md` copies: 404, other 4xx, 429 wait cap, backoff, abort (D33)
- [x] `http/HttpApi.ts`
  - [x] Takes explicit `HttpOptions`; `http/options.ts` builds them from config (no Expo import, so Node can use it)
- [x] `mock/db/seed/`: `catalog.ts`, `detections.ts`, `recipes.ts`, `demoPhotos.ts` (typed as contract DTOs, content rules)
  - [x] Generated from `data.js` (values unchanged)
- [x] `mock/db/schema.ts` (mock tables + seeding migration), `mockDb.ts` (open / reset `fridgechef-mock.db`), `mockRepo.ts`
  - [x] `prepareMockDatabase(db)` lives in `schema.ts` (no expo-sqlite), so the smoke script can use it
- [x] Switch Sprint 04's recipe test helper to the seed module (regression counts still green)
  - [x] `src/testing/mockupData.ts` now maps the seed through the real mappers; plus a test that the demo user's snapshots equal the mapped seed recipes
- [x] `mock/MockApi.ts`: mock DB rows → DTO → Zod → mappers; latency + failure injection; detect / suggest / 404 rules
  - [x] `mock/mockBackend.ts`: the stand-in server (request DTO in, status + JSON out)
- [x] `index.ts`: `getApi()` factory (mock DB opened lazily, never in http mode) + `setApiForTests` + `listDemoPhotos()`
  - [x] Plus `createApi(config)` for tests; `X-Client` from `expo-constants`
- [x] `queries/QueryProvider.tsx` + `useCatalog`, `useDetectIngredients`, `useSuggestions`, `useRecipe`
  - [x] `createQueryClient(overrides)`; stable-hash `queryKeys`; `knownRecipe()` (suggestions cache → cookbook snapshot)
  - [x] Fixed: Jest hung after the hook tests (mutation cache gc timer); test clients use `gcTime: Infinity` (D35)
- [x] `scripts/api-smoke.ts` + `npm run api:smoke` (mock mode via the Node driver)
  - [x] `--env-file-if-exists` instead of `--env-file` (the latter crashes without a `.env`) (D36); `tsx` dev dependency
  - [x] Also run in http mode against a throwaway local server (scratchpad, not committed): 5/5 over a real socket
- [x] `docs/api-contract.md` synced; `.env.example` updated
  - [x] `.env.example` needed no change (no new variables); a test now keeps the two contract copies identical
- [x] Contract tests (seed DTOs, DB rows, MockApi output)
- [x] Mock database tests (counts, no double seed, reset)
- [x] HttpApi tests (headers, URL join, timeout, 401, 429, 5xx, invalid body)
  - [x] Plus: network, 403, 404, other 4xx, 429 without / over the wait cap, 5xx recovery, non-JSON body, caller abort, invalid request never sent
- [x] Mock ⇄ Http parity test
- [x] Hook tests
- [x] Architecture guard test (no `services/api/mock/**` / HttpApi / fetch outside `services/api`; `expo-sqlite` only in `db/client.ts`; no `src/db` in screens/components; no `.json` data in `src/`)
  - [x] Plus: only `http/request.ts` calls `fetch`; only `services/api/index.ts` builds the APIs; only `mockDb.ts` opens the mock DB; mutation-checked
- [x] Test: http mode never opens the mock DB
- [x] Extra: deleted the stale `src/mocks/` skeleton folder (D13) and `.gitkeep` files in now-populated folders

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
- [x] `npm run api:smoke` passes in mock mode
- [x] Extra: temporary iOS export with a route importing `@/services/api` + `@/services/queries` (reverted): bundles, no Node-only code

## Close
- [x] `HANDBOOK.md` with a "How to go live" section
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
