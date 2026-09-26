# FridgeChef app

The iOS app (Expo SDK 57, React Native 0.86, TypeScript strict, Expo Router). UI, copy and behaviour follow the approved mockup in [`../fridgechef-mockup/`](../fridgechef-mockup/README.md). The build plan and its history live in [`../sprints/`](../sprints/README.md).

## Run

```bash
npm ci                 # install exactly what package-lock.json pins
npm start              # expo start - scan the QR code with Expo Go on an iPhone
npm run web            # quick browser preview (react-native-web) - handy on Windows
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
- Zustand stores load from the repositories at boot and write every change back through them.
- **Reset:** Profile → "Reset demo data" clears the user tables (and reseeds them in mock mode). Deleting the app from the phone removes both databases.
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
```

Add Expo-managed packages with `npx expo install <pkg>`. For dev tools add `-- --save-dev`, then check `package.json`: SDK-versioned packages (e.g. `jest-expo`, `eslint-config-expo`) can still land in `dependencies` and must be moved by hand.

## Layout

```
app.config.ts      name, bundle id (placeholder com.fridgechef.app), scheme, dark UI, portrait
docs/              api-contract.md - verbatim copy of sprints/reference/api-contract.md
src/app/           Expo Router routes (thin; render screens). No tests or helpers in here - every file is a route.
src/screens/       screen bodies
src/components/    one file per mockup component
src/theme/         tokens, fonts, icons
src/domain/        pure logic (no React, no IO)
src/state/         Zustand stores (hydrate from src/db at boot, write through)
src/db/            on-device SQLite (fridgechef.db): client, migrations, repositories, demo seed
src/services/      config.ts, api/ (FridgeChefApi, MockApi, HttpApi), queries/, media/
                   api/mock/db/ = the mock backend database (fridgechef-mock.db) + typed TS seed modules
```

The `@/*` import alias maps to `src/*` (TypeScript, Metro and Jest). See [`../sprints/reference/architecture.md`](../sprints/reference/architecture.md) for the API seam and data ownership.
