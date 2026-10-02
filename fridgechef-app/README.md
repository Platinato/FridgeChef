# FridgeChef app

The iOS app (Expo SDK 57, React Native 0.86, TypeScript strict, Expo Router). UI, copy and behaviour follow the approved mockup in [`../fridgechef-mockup/`](../fridgechef-mockup/README.md). The build plan and its history live in [`../sprints/`](../sprints/README.md).

## Run

```bash
npm ci                 # install exactly what package-lock.json pins
npm start              # expo start - scan the QR code with Expo Go on an iPhone
npm run web            # browser preview (react-native-web) with real SQLite - handy on Windows; also refreshes typed routes
```

This project is developed on Windows, so there is no iOS Simulator. Test on a physical iPhone with Expo Go (same Wi-Fi as the PC, or `npx expo start --tunnel`). Expo Go only has its bundled native modules: once a library with custom native code is added, a development build (`eas build --profile development`) is needed.

## Environment

```bash
cp .env.example .env   # every variable is documented there; all are optional in mock mode
```

| Variable                        | Default         | Purpose                                                          |
| ------------------------------- | --------------- | ---------------------------------------------------------------- |
| `EXPO_PUBLIC_API_MODE`          | `mock`          | `mock` (on-device SQLite mock database) or `http` (real backend) |
| `EXPO_PUBLIC_API_BASE_URL`      | empty           | required when mode is `http`                                     |
| `EXPO_PUBLIC_API_KEY`           | empty           | sent with every request                                          |
| `EXPO_PUBLIC_API_AUTH_HEADER`   | `Authorization` | header name for the key                                          |
| `EXPO_PUBLIC_API_AUTH_SCHEME`   | `Bearer`        | prefix before the key; empty = raw key                           |
| `EXPO_PUBLIC_API_TIMEOUT_MS`    | `30000`         | per-request timeout                                              |
| `EXPO_PUBLIC_MOCK_LATENCY_MS`   | `900`           | simulated latency in mock mode                                   |
| `EXPO_PUBLIC_MOCK_FAILURE_RATE` | `0`             | 0-1 random failure rate in mock mode                             |

- `src/services/config.ts` is the **only** module that reads `process.env`. Import `config` from `@/services/config` everywhere else.
- Invalid values, or `http` mode without a base URL, throw a `ConfigError` at startup.
- Restart Metro with `npx expo start -c` after editing `.env`.

> **Security:** every `EXPO_PUBLIC_*` value is compiled into the app bundle and can be extracted. Only use a key intended for a client (e.g. a rate-limited key for our own backend). A secret LLM-provider key must stay on a server.

## Data storage

Everything the app stores stays on the phone, in SQLite (`expo-sqlite`, included in Expo Go). Nothing is synced.

- **`fridgechef.db`** holds user data: profile, preferences, pantry staples, the current scan, saved recipes and cooked history. SQL lives only in `src/db/repositories/`. Schema changes go in a **new** numbered file in `src/db/migrations/` (tracked with `PRAGMA user_version`); a shipped migration is never edited.
- **`fridgechef-mock.db`** is the stand-in backend, opened **only** in mock mode. It is seeded on first launch from typed TypeScript seed modules in `src/services/api/mock/db/seed/`. There are no JSON data files. http mode never opens it.
- Zustand stores (`src/state`) load from the repositories at boot (`initDatabase()` then `hydrateStores()`) and write every change back through them, one queued write at a time.
- **Reset:** Profile → "Reset demo data" clears the user tables (and reseeds them in mock mode). Deleting the app from the phone removes both databases.
- **Upgrades:** a new app version runs any newer migrations at launch and keeps every row (tested: `database.test.ts` → "upgrades a v1 database…"). A database written by a _newer_ app is refused untouched, and the boot screen says "Update FridgeChef".
- **Changing mock seed data:** the seed is inserted by a mock-database migration once, so an edited seed module doesn't reach existing installs. Add a migration that reseeds, or use "Reset demo data" (it also resets the mock database).
- **Encryption:** none in v1. The database sits in the app's documents folder (included in device / iCloud backups). The `expo-sqlite` plugin's `useSQLCipher` option can turn it on, but SQLCipher isn't in Expo Go (it needs a development build).
- **Tests** run real SQL through a Node driver (`src/db/testing/nodeDriver.ts`, built-in `node:sqlite`). Nothing in Jest mocks `expo-sqlite` call by call.

Details: [`../sprints/reference/architecture.md`](../sprints/reference/architecture.md) → Local database.

## Verify

Every sprint ends with:

```bash
npm run verify         # typecheck + lint + jest --ci + expo export --platform ios (to .verify-dist/)
npx expo-doctor        # dependency / config health (needs network)
```

Individual steps:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint (eslint-config-expo + eslint-config-prettier)
npm test               # jest (jest-expo preset + React Native Testing Library)
npm test -- src/services/__tests__/config.test.ts
npm test -- -t "http mode"
npm run format         # prettier --write .   (format:check to only check)
npm run bundle:ios     # the iOS production bundle export on its own
npm run api:smoke      # calls all 4 endpoints in the configured mode (mock: temp in-memory mock DB; http: .env backend)
npx jest --coverage --collectCoverageFrom="src/domain/**" src/domain   # domain coverage (keep lines >= 90%; output in coverage/, git-ignored)
```

Add Expo-managed packages with `npx expo install <pkg>`. For dev tools add `-- --save-dev`, then check `package.json`: SDK-versioned packages (e.g. `jest-expo`, `eslint-config-expo`) can still land in `dependencies` and must be moved by hand.

## Going live (real backend)

The exact checklist (env values, smoke, contract tests, what may change, rollback) is [`docs/API_GO_LIVE.md`](docs/API_GO_LIVE.md). In short, no code changes are needed if the backend follows [`docs/api-contract.md`](docs/api-contract.md):

1. In `.env`: `EXPO_PUBLIC_API_MODE=http`, `EXPO_PUBLIC_API_BASE_URL=https://…`, `EXPO_PUBLIC_API_KEY=…` (+ `EXPO_PUBLIC_API_AUTH_HEADER` / `EXPO_PUBLIC_API_AUTH_SCHEME` if it isn't `Authorization: Bearer`).
2. `npm run api:smoke`: every call must print PASS (Zod issues are printed on a mismatch).
3. `npx expo start -c` (clear the cache: `EXPO_PUBLIC_*` values are inlined at build time).

If the backend's shapes differ, only `src/services/api/contract.ts`, `mappers.ts` and `http/endpoints.ts` change. **Rollback:** set `EXPO_PUBLIC_API_MODE=mock` again. User data in `fridgechef.db` is untouched either way.

## Mock mode and the demo-photos helper

The default mode. The whole loop works with no network and no backend: Scan → Analyzing → Confirm quantities → Mood → Suggestions → Recipe → Cook → "Update pantry" → Home.

- **"Use demo photos"** (Scan screen, mock mode only) adds the mock database's 6 demo photos, so the flow runs without a camera (the web preview has none). 3+ photos trigger the "Photo 2 looks blurry" warning.
- On an iPhone, Expo Go asks for the camera on the first visit. If it's denied, the card offers "Open Settings" and the gallery. Expo Go shows its _own_ permission text; the app's usage strings (`app.config.ts`) appear in development / EAS builds.
- **Error states:** start with `EXPO_PUBLIC_MOCK_FAILURE_RATE=1` (every call fails) or `0.3` (the QA rate), e.g. in a git-ignored `.env.local`. Every fetched screen offers "Try again".
- The demo photos, onboarding slides and seed recipes use **remote Unsplash URLs, for development only**. Offline they fall back to initials tiles. Replace them with licensed or bundled images before a public release.

## Release builds (EAS)

`eas.json` has three profiles. Cloud builds need the user's Expo account and Apple credentials; nothing has been built yet.

```bash
npx eas-cli@latest build -p ios --profile preview       # internal-distribution build, mock mode
npx eas-cli@latest build -p ios --profile production    # store build (set the http env first, see docs/API_GO_LIVE.md)
```

- `development` needs `expo-dev-client` (`npx expo install expo-dev-client`). It isn't installed, so `npm start` keeps opening Expo Go.
- EAS doesn't read the git-ignored `.env`: set env with `eas env:create` or in the profile's `env`.
- Before the first build: confirm the app name ("FridgeChef") and replace the placeholder bundle id `com.fridgechef.app` in `app.config.ts`.
- Icon and splash are generated from the logo geometry: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-icons.ps1` (writes `assets/images/*.png`).

## Accessibility and resilience

- **VoiceOver:** every control has a role and a label. Sliders are single "adjustable" elements (swipe up / down moves one step and reads the value with its unit). Toasts are announced.
- **Dynamic Type:** reading text scales up to 2×, display titles up to 1.1×, and controls grow with their text instead of clipping. Text / background pairs meet WCAG AA (`src/theme/__tests__/contrast.test.ts`).
- **Motion:** Reduce Motion turns the screen slide into a fade and stops looping animations (scan sweep, live-dot pulse, progress shimmer). Light haptics: shutter, "Looks right", switches, cook timer end.
- **Resilience:**
  - an offline banner (`@react-native-community/netinfo`); in http mode, queries pause offline
  - "Try again" on every fetched screen
  - an app-level error boundary ("Something went wrong" → "Restart")
  - "Couldn't save that change" when a database write fails
  - the boot error screen with "Try again"

## Troubleshooting

| Problem                                          | Fix                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Start over with fresh demo data                  | Profile → "Reset demo data"                                                                        |
| Wipe everything (both databases)                 | Delete the app from the phone (web preview: clear the site data)                                   |
| "Update FridgeChef" at launch                    | The database came from a newer app build; install that build (nothing was changed)                 |
| "Couldn't open your kitchen" at launch           | "Try again". If it persists, delete and reinstall the app (this wipes local data)                  |
| Env change has no effect                         | `npx expo start -c`: `EXPO_PUBLIC_*` values are inlined at build time                              |
| `tsc` rejects a new route's href                 | Run `npm run web` (or `npm start`) once to regenerate `.expo/types/router.d.ts`                    |
| Web preview images / sheets stay blank           | The browser tab is in the background (animations and lazy images pause); bring it to the front     |
| Web console: `props.pointerEvents is deprecated` | From `react-native-toast-message` / `@gorhom/bottom-sheet` on react-native-web; harmless, web only |

The web preview (`npm run web`) runs the real SQLite database in the browser (wasm + COOP / COEP headers in `metro.config.js`, `web.output: 'single'`, the dark `public/index.html`). It's a development aid only: the app ships on iOS.

## Layout

```
app.config.ts      name, bundle id (placeholder com.fridgechef.app), scheme, dark UI, portrait
eas.json           EAS build profiles: development / preview / production
docs/              api-contract.md (verbatim copy of sprints/reference/api-contract.md), API_GO_LIVE.md
public/index.html  web preview page template (dark background before the bundle loads)
scripts/           api-smoke.ts (npm run api:smoke), make-icons.ps1 (icon + splash PNGs)
src/app/           Expo Router routes (thin; render screens). No tests or helpers in here - every file is a route.
                   dev/gallery.tsx: component gallery, __DEV__ only (long-press the logo on the start screen)
src/screens/       screen bodies (HomeScreen, PantryScreen, …); shell/ = boot gate, tab bar, app effects
src/components/    one file per mockup component
src/theme/         tokens.ts (the only place colours live), fonts.ts, icons.ts
src/domain/        pure logic (no React, no IO)
src/state/         Zustand stores (hydrate from src/db at boot, write through)
src/db/            on-device SQLite (fridgechef.db): client, migrations, repositories, demo seed
src/testing/       test-only fixtures (the mockup data as domain types); never imported by app code
src/services/      config.ts, network.ts (offline state), api/ (FridgeChefApi, MockApi, HttpApi), queries/,
                   media/ (prepareImage: ≤1280 px, JPEG 0.7, base64; pickPhotos: the system picker)
                   api/mock/db/ = the mock backend database (fridgechef-mock.db) + typed TS seed modules
```

The `@/*` import alias maps to `src/*` (TypeScript, Metro and Jest). See [`../sprints/reference/architecture.md`](../sprints/reference/architecture.md) for the API seam and data ownership.
