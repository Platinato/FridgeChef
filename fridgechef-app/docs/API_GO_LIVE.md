# API go-live checklist (Sprint 10)

The app runs on an on-device mock backend today (`EXPO_PUBLIC_API_MODE=mock`). Going live means switching to `HttpApi` with **env values only**, plus contract / mapper tweaks if the real backend's wire format differs from [`api-contract.md`](./api-contract.md). Nothing in screens, components, stores, domain logic or the user database (`src/db`, `fridgechef.db`) should change.

Execute the steps in order. Never paste the API key into any tracked file, handbook or chat log.

## 0. What the user must supply (blockers)

| Needed                                                                                                | Goes into                                                                            |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| API base URL (https, no trailing slash needed)                                                        | `EXPO_PUBLIC_API_BASE_URL`                                                           |
| API key                                                                                               | `EXPO_PUBLIC_API_KEY`                                                                |
| How the key is sent: header name + scheme (e.g. `Authorization: Bearer <key>`, or `x-api-key: <key>`) | `EXPO_PUBLIC_API_AUTH_HEADER`, `EXPO_PUBLIC_API_AUTH_SCHEME` (empty value = raw key) |
| API docs or sample responses for the 4 endpoints                                                      | compared against `api-contract.md` in step 4                                         |
| Confirmation that the key is meant to ship inside a mobile app                                        | the security check in step 1                                                         |

## 1. Security check (stop here if it fails)

`EXPO_PUBLIC_*` values are compiled into the JS bundle and can be extracted from any installed copy of the app. The key must be one intended for a client: for example a rate-limited key for the user's own backend.

**If it is a secret provider key (e.g. an LLM vendor key), stop.** Recommend a small server-side proxy that holds the secret, and point the app at the proxy instead. Record the decision in `sprints/reference/decisions.md`.

## 2. Configure

1. Create `fridgechef-app/.env` from `.env.example`. It is git-ignored (root `.gitignore`); `.env*.local` files are ignored too.
2. Set:

   ```bash
   EXPO_PUBLIC_API_MODE=http
   EXPO_PUBLIC_API_BASE_URL=https://…           # from the user
   EXPO_PUBLIC_API_KEY=…                        # from the user
   EXPO_PUBLIC_API_AUTH_HEADER=Authorization    # or x-api-key, …
   EXPO_PUBLIC_API_AUTH_SCHEME=Bearer           # or an empty value for the raw key
   EXPO_PUBLIC_API_TIMEOUT_MS=30000             # raise if detection is slow
   ```

   The `EXPO_PUBLIC_MOCK_*` values are ignored in http mode.

3. Restart Metro with a clean cache, because env values are inlined at build time: `npx expo start -c`.
4. Invalid or missing values fail fast at startup with a `ConfigError`. They're validated in `src/services/config.ts`, the only file that reads env.

**EAS builds don't read the local `.env`.** It's git-ignored, so it isn't uploaded. For a cloud build, set the same variables as EAS environment variables (`eas env:create`, or the profile's `env` in `eas.json`, for non-secret values only). The `preview` and `development` profiles currently pin `EXPO_PUBLIC_API_MODE=mock`; change the profile you ship.

## 3. Smoke the live endpoint

```bash
cd fridgechef-app
npm run api:smoke          # node --env-file-if-exists=.env --import tsx scripts/api-smoke.ts
```

In http mode it calls all 4 endpoints through the real `HttpApi`: `GET /v1/catalog`, `POST /v1/scans/detect` (a valid 1×1 JPEG), `POST /v1/recipes/suggest`, and `GET /v1/recipes/{id}`. It prints pass / fail per call with latency and any Zod issues, and exits 1 on failure.

For each endpoint, record in the Sprint 10 handbook: HTTP status, latency, and Zod pass / fail. Save sanitised sample responses (no keys, no personal data) under `fridgechef-app/docs/api-samples/`.

## 4. Reconcile the contract (only if the smoke shows mismatches)

The wire format lives in exactly three files. Change only these:

| File                                 | What to change                                                           |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `src/services/api/contract.ts`       | Zod schemas for requests / responses (field names, optionality, enums)   |
| `src/services/api/mappers.ts`        | DTO ↔ domain mapping (renames, unit conversions, enum mapping, defaults) |
| `src/services/api/http/endpoints.ts` | paths and methods                                                        |

Then:

- Update **both** copies of the contract: `sprints/reference/api-contract.md` and `fridgechef-app/docs/api-contract.md`. A test fails if they differ.
- Log each change in `sprints/reference/decisions.md`.
- If a screen, component, store or domain file seems to need a change, **stop**: the seam leaked. Fix it in the three files above if at all possible, and write down why if not.

Behaviour that is already in place (don't re-implement it):

- Auth header, plus `X-Client: fridgechef-ios/<version>`.
- Timeouts, and the retry policy in `api-contract.md`: network / timeout / 5xx are retried with 500 ms → 1 s backoff, the detect call once; 429 honours `Retry-After`; 4xx are never retried.
- Every response is Zod-validated. Unknown fields are dropped; a bad shape becomes `invalid_response` with user-safe copy.
- http mode only: TanStack Query follows the device connection (`src/services/network.ts`). Queries pause offline and refetch on reconnect, and the offline banner shows.
- http mode only: on an empty first launch, the catalog's `defaultStaples` fill the pantry at 3 bars, once per install.

## 5. Tests

```bash
npm run verify             # typecheck + lint + jest (mock mode; CI never needs the key) + iOS export
npx expo-doctor
```

- The contract test (`src/services/api/__tests__/contract.test.ts`) and the parity test (`parity.test.ts`) must stay green in mock mode.
- Add an opt-in live contract test: `API_LIVE=1 npm test -- contract.live`. It's skipped unless `API_LIVE=1`, and runs the seed DTO checks against the live responses.

## 6. Full regression in http mode (on a device)

Run `npx expo start -c` and open the app in Expo Go on an iPhone. Then:

1. Run the full loop: scan → confirm → mood → suggestions → recipe → cook → "Update pantry" → Home ("Running low" rises).
2. Airplane mode:
   - The offline banner shows.
   - Fetches pause and resume on reconnect.
   - The detect error shows "No connection. Check your internet and try again." with "Try again".
3. A wrong key → "The recipe service didn't accept this app. Try again later." (`unauthorized`, not retried).
4. A slow network → detection waits up to `EXPO_PUBLIC_API_TIMEOUT_MS`, then "That took too long. Try again in a moment."

## 7. Rollback

Set `EXPO_PUBLIC_API_MODE=mock` and restart with `npx expo start -c`; for EAS builds, change the env and rebuild. The app goes straight back to the on-device mock database (`fridgechef-mock.db`, reopened and seeded lazily on the first mock call).

The user's data in `fridgechef.db` (profile, pantry, scans, cookbook) is untouched in either direction: http mode never opens the mock database, and the mode switch doesn't touch the user database.

## 8. Done when

- The full loop works on a device against the live API.
- The Sprint 10 diff touches only env docs, `contract.ts`, `mappers.ts`, `endpoints.ts`, tests and docs (list the files in the handbook).
- `git grep --untracked <first characters of the key>` finds nothing. The key lives only in the git-ignored `.env` or EAS environment variables.
