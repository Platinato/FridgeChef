# Sprint 10 - API go-live

> **Blocked until the user provides:** the API base URL, the API key, how the key is sent (header name + scheme, e.g. `Authorization: Bearer …` or `x-api-key: …`), and any API docs or sample responses. Don't start without them. Don't invent values.

## Before you start

1. Read `sprints/09-polish-qa/HANDBOOK.md`. Also read `sprints/05-api-layer/HANDBOOK.md` → "How to go live".
2. Read `fridgechef-app/docs/API_GO_LIVE.md`, this file and `sprints/reference/api-contract.md`.

## Goal

Point the finished app at the real backend with the **minimum possible change**:

- env values always change
- only if the wire format differs: `services/api/contract.ts`, `mappers.ts`, `http/endpoints.ts`

Nothing in screens, components, stores, domain or the local database (`src/db`) should change.

## Tasks

1. **Configure**
   - Put the supplied values in `fridgechef-app/.env`. It's git-ignored; never commit it or paste the key into any sprint file or handbook.
   - Set `EXPO_PUBLIC_API_MODE=http`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_KEY`, `EXPO_PUBLIC_API_AUTH_HEADER` and `EXPO_PUBLIC_API_AUTH_SCHEME`.
   - Raise `EXPO_PUBLIC_API_TIMEOUT_MS` if detection is slow.
2. **Security check**
   - Confirm with the user that the key is safe to ship inside a mobile app, because `EXPO_PUBLIC_*` values are extractable from the bundle.
   - If it's a secret provider key (e.g. an LLM vendor key), **stop** and recommend a server-side proxy. Record the decision.
3. **Smoke**
   - Run `npm run api:smoke` against the live endpoint.
   - For each endpoint, record: status, latency, and whether it passes Zod.
   - Save sanitised sample responses (no personal data, no keys) under `fridgechef-app/docs/api-samples/`.
4. **Reconcile the contract.** For every mismatch between live responses and `api-contract.md`:
   - adapt `contract.ts` (schemas), `mappers.ts` (field mapping / units / enums) and/or `http/endpoints.ts` (paths, methods)
   - update both copies of `api-contract.md`
   - log each change in `reference/decisions.md`
   - If a screen, component, store or domain file seems to need a change, stop and write down why. It means the seam leaked; fix it in the API layer if at all possible.
5. **Tests**
   - The existing contract and parity tests must stay green in mock mode.
   - Add an opt-in live contract test: `API_LIVE=1 npm test -- contract.live`. It is skipped by default so CI never needs the key.
6. **Full regression in http mode.** On a device, run the full loop against the live API, plus the error paths:
   - airplane mode
   - a wrong key → `unauthorized` message
   - slow network
7. **Rollback.** Document that setting `EXPO_PUBLIC_API_MODE=mock` instantly restores the app running on the on-device mock database. The switch in either direction leaves user data in `fridgechef.db` untouched.

## Acceptance criteria

- The full loop works on a device against the live API.
- The git diff for this sprint touches **only** env docs, `contract.ts`, `mappers.ts`, `endpoints.ts`, tests and docs. List the changed files in the handbook as evidence.
- The key appears in no file except the git-ignored `.env`: `git grep --untracked <first characters of the key>` returns nothing.

## Build verification pass

`npm run verify` (mock mode, which is what CI uses) + `npx expo-doctor` + `npm run api:smoke` (live) + the manual live full loop. Record them in the handbook, with keys redacted.

## End of sprint

Write the handbook (live status, contract changes, samples, open issues). Mark Sprint 10 Done. Do not commit.
