# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules for every agent (non-negotiable)

1. **No worktrees.** Never create or use git worktrees (`git worktree`, isolated worktree sessions, or similar). Work only in this repository's main working tree.
2. **No `git commit` and no `git push`, ever.** Leave all changes uncommitted; the user reviews and commits. Read-only git commands (`status`, `diff`, `log`, `grep`) are fine, and so is `git init` when a sprint needs it.

## What this repo is

FridgeChef is an iOS app (React Native / Expo). The user photographs their fridge or pantry and ingredients are detected. The user **must confirm quantities with sliders** before any recipe is suggested, then picks mood, time, effort and similar preferences to get recipes. Pantry staples are remembered and deducted after cooking.

| Path | What it is |
|---|---|
| `fridgechef-mockup/` | The **approved** clickable HTML/CSS/JS mockup. The source of truth for UI, copy and behaviour. Its `README.md` holds the screen reference, content rules, design tokens and the component → React Native mapping. |
| `fridgechef-app/` | The Expo app (SDK 57, RN 0.86, React 19.2, TS strict, Expo Router with routes in `src/app/`). Scaffolded in Sprint 01. Its `README.md` covers run, env and verify. |
| `sprints/` | The build plan **and the build's memory**: protocol, status board, per-sprint instructions / TODO / handbook, and `reference/` (architecture, API contract, decision log). |
| `MOCKUP_PROMPT.md` | The original design brief. Historical: where it conflicts with the mockup README, the README wins. |
| `.claude/static-server.js`, `.claude/launch.json` | Preview configs: `fridgechef-mockup` (zero-dependency static server, port 5173) and `fridgechef-app` (`expo start --web`, port 8081). |
| `.gitignore`, `.gitattributes` | Repo-level git config (git lives at the repo root, initialised in Sprint 01, no agent commits). |

## Working in sprints (mandatory for app work)

All app development follows `sprints/README.md`:

1. Read the **previous sprint's `HANDBOOK.md`**.
2. Read this sprint's `INSTRUCTIONS.md`.
3. Work through and tick `TODO.md`.
4. Finish with the **build verification pass**.
5. Write this sprint's `HANDBOOK.md` from `sprints/_templates/HANDBOOK.md`.
6. Update the status board and `sprints/reference/decisions.md`.

Sprint progress and handovers live only in `sprints/`. Sprint 10 (API go-live) is blocked until the user provides the endpoint + key.

## Commands

Mockup (no build step):

```bash
node .claude/static-server.js          # http://localhost:5173 ; #/gallery shows every screen
```

App (from `fridgechef-app/`; keep this list in sync with `package.json`):

```bash
npm ci                                 # clean install from package-lock.json
npm start                              # expo start (Expo Go on a physical iPhone; this is a Windows machine, no iOS Simulator)
npm run web                            # browser preview via react-native-web (quick visual check on Windows)
npm run verify                         # build verification: typecheck + lint + jest --ci + expo export --platform ios (.verify-dist/)
npx expo-doctor                        # dependency/config health, part of every verification pass
npm run typecheck                      # tsc --noEmit
npm run lint                           # expo lint (eslint-config-expo flat config + eslint-config-prettier)
npm run format                         # prettier --write . (format:check only checks)
npm test -- src/services/__tests__/config.test.ts   # single test file
npm test -- -t "http mode"             # tests matching a name
npm run bundle:ios                     # iOS export only
npm run api:smoke                      # exercises every endpoint through the configured API mode (added in Sprint 05; not yet present)
npx expo install <pkg>                 # always add Expo-managed deps this way (dev deps: add `-- --save-dev`, then check package.json: SDK-versioned packages can still land in dependencies)
```

Testing notes: React Native Testing Library 14 is async (`await render(...)`). Never put tests or helpers under `src/app/`, because every file there is a route; app-level tests go in `src/__tests__/`.

## Architecture (big picture)

See `sprints/reference/architecture.md` for the full picture. The parts that span many files:

- **API seam.** The backend doesn't exist yet. The app runs on an on-device mock database, and going live must only need `.env` changes.
  - Data flows: screens → `services/queries` hooks → the `FridgeChefApi` interface → `MockApi` (reads `fridgechef-mock.db`) **or** `HttpApi` (`EXPO_PUBLIC_API_BASE_URL`), chosen by `EXPO_PUBLIC_API_MODE`.
  - The wire format lives only in `services/api/contract.ts` (Zod), `mappers.ts` and `http/endpoints.ts`.
  - MockApi reads wire DTOs from SQLite and runs them through the same Zod + mappers as HttpApi.
  - Guard tests fail if anything outside `services/api/` imports MockApi / HttpApi / `services/api/mock/**` or calls `fetch`.
- **Local database (SQLite, `expo-sqlite`).** All app data stays on the phone. There are **no JSON data files**. Full rules: `sprints/reference/architecture.md` → Local database.
  - Two files:
    - `fridgechef.db` holds user data and is owned by `src/db/`.
    - `fridgechef-mock.db` is the mock backend, opened only in mock mode, and seeded from typed TS modules in `services/api/mock/db/seed/`.
  - `expo-sqlite` is imported only in `src/db/client.ts`. Everything else uses the `SqlDriver` port.
  - SQL lives only in `src/db/repositories/` and `services/api/mock/db/`. Screens and components never import `src/db`.
  - Migrations (`src/db/migrations/`, `PRAGMA user_version`) are append-only. Never edit one that has shipped; add a new numbered file.
  - Tests run real SQL through the Node driver `src/db/testing/nodeDriver.ts` (`node:sqlite`), injected with `setDatabaseForTests()`.
- **Env** is read only in `src/services/config.ts`, via static `process.env.EXPO_PUBLIC_*` references.
  - `EXPO_PUBLIC_*` values are bundled into the app, so a secret provider key must never go there.
- **Logic is on-device and pure** (`src/domain/`, a port of the mockup's `js/logic.js`): match %, have / short / missing, scoring, filters, sort, unit conversion, pantry deduction. The backend only detects ingredients and proposes recipes.
- **State is local-first.** Zustand stores in `src/state/` (profile, prefs, pantry, scan, cookbook) hydrate from the SQLite repositories at boot and write every change back through them. There is no `persist` middleware and no AsyncStorage.
- **UI.** Each mockup component in `fridgechef-mockup/js/components/` becomes a same-named RN component in `src/components/`. Tokens in `src/theme/tokens.ts` port the mockup's `js/theme.js`. Screens compose components and never hand-style one-off views.

## Content rules (from design review, enforced by a test)

- Never show the word "AI" in the UI: use "Ready" / "Scanning" / "Sure" / "Fairly sure" / "Unsure", and show estimate ticks as a bare number.
- No play-button icons (the cook timer uses a stopwatch). "Start cooking" and "Analyze N photos" are text-only.
- Use hyphens, never em dashes, in copy.
- Lime `#C6F432` is the only accent; the red dot means live / low / needs check.
- Recipe detail stat tiles are time / kcal / protein, with no match tile. Saved cards show effort, not match %.
