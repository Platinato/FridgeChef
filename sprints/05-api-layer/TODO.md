# Sprint 05 TODO - API layer (mock + http seam)

## Start
- [ ] Read `sprints/04-domain-state/HANDBOOK.md` + `sprints/01-bootstrap/HANDBOOK.md`
- [ ] Read `INSTRUCTIONS.md`, `reference/architecture.md` (API seam + Local database), decisions D12-D15, `reference/api-contract.md`
- [ ] Set Sprint 05 to "In progress" in `sprints/README.md`

## Tasks
- [ ] `contract.ts`: Zod schemas + types for all DTOs + the error envelope
- [ ] `mappers.ts`: DTO ⇄ domain (incl. `toSuggestRequest`, `toDetectRequest`)
- [ ] `FridgeChefApi.ts` interface (domain in/out, AbortSignal)
- [ ] `errors.ts`: `ApiError` kinds + `toUserMessage` (content rules)
- [ ] `http/endpoints.ts` path table
- [ ] `http/request.ts`: base URL join, auth header/scheme, `X-Client`, timeout, retry policy, status mapping, Zod parse
- [ ] `http/HttpApi.ts`
- [ ] `mock/db/seed/`: `catalog.ts`, `detections.ts`, `recipes.ts`, `demoPhotos.ts` (typed as contract DTOs, content rules)
- [ ] `mock/db/schema.ts` (mock tables + seeding migration), `mockDb.ts` (open / reset `fridgechef-mock.db`), `mockRepo.ts`
- [ ] Switch Sprint 04's recipe test helper to the seed module (regression counts still green)
- [ ] `mock/MockApi.ts`: mock DB rows → DTO → Zod → mappers; latency + failure injection; detect / suggest / 404 rules
- [ ] `index.ts`: `getApi()` factory (mock DB opened lazily, never in http mode) + `setApiForTests` + `listDemoPhotos()`
- [ ] `queries/QueryProvider.tsx` + `useCatalog`, `useDetectIngredients`, `useSuggestions`, `useRecipe`
- [ ] `scripts/api-smoke.ts` + `npm run api:smoke` (mock mode via the Node driver)
- [ ] `docs/api-contract.md` synced; `.env.example` updated
- [ ] Contract tests (seed DTOs, DB rows, MockApi output)
- [ ] Mock database tests (counts, no double seed, reset)
- [ ] HttpApi tests (headers, URL join, timeout, 401, 429, 5xx, invalid body)
- [ ] Mock ⇄ Http parity test
- [ ] Hook tests
- [ ] Architecture guard test (no `services/api/mock/**` / HttpApi / fetch outside `services/api`; `expo-sqlite` only in `db/client.ts`; no `src/db` in screens/components; no `.json` data in `src/`)
- [ ] Test: http mode never opens the mock DB

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor`
- [ ] `npm run api:smoke` passes in mock mode

## Close
- [ ] `HANDBOOK.md` with a "How to go live" section
- [ ] Update the status board + decisions
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
