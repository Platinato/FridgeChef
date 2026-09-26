# Sprint 01 - Project bootstrap and tooling

## Before you start

1. Read `sprints/00-kickoff/HANDBOOK.md`.
2. Read this file, then `sprints/reference/architecture.md` and `sprints/reference/decisions.md`.
3. Skim `fridgechef-mockup/README.md` so you know what's being built.

## Goal

A clean, runnable Expo + TypeScript project at `fridgechef-app/` with the target folder skeleton, typed env config, tests, linting and the **`npm run verify`** build verification command that every later sprint relies on. The repo is under git.

## Tasks

1. **Scaffold**
   - From the repo root: `npx create-expo-app@latest fridgechef-app` (default template: Expo Router + TypeScript), then remove the example screens (`npm run reset-project` if the template provides it, otherwise delete them by hand).
   - Move routes to `src/app/` (Expo Router picks up `src/app` automatically) and create the empty folders from the architecture doc: `src/screens`, `src/components`, `src/theme`, `src/domain`, `src/state`, `src/services/api/{http,mock}`, `src/services/queries`, `src/services/media`, `src/mocks/fixtures`, `docs/`.
   - Record the Expo SDK, React Native and React versions in the handbook.
2. **TypeScript**
   - `strict: true`, `noUncheckedIndexedAccess: true`, and the path alias `@/*` → `src/*`. Make sure Metro and Jest resolve the alias too.
3. **App config** (`app.config.ts`)
   - name `FridgeChef`, slug `fridgechef`, scheme `fridgechef`, `userInterfaceStyle: "dark"`, portrait only
   - iOS `bundleIdentifier` placeholder `com.fridgechef.app` (record it as a placeholder in the handbook)
   - `ios.supportsTablet: false`, background colour `#0A0A0A`
4. **Env config**
   - Create `src/services/config.ts` with **all** variables from `architecture.md` → Environment variables.
   - Read them with static `process.env.EXPO_PUBLIC_*` references, apply defaults, validate with Zod (`npx expo install zod` or `npm i zod`), and export a frozen, typed `config`.
   - If `API_MODE=http` and `API_BASE_URL` is empty, fail fast with a clear message.
   - Create `.env.example` documenting every variable, including the security note from the architecture doc. `.env` itself is git-ignored.
5. **Quality tooling**
   - ESLint via `npx expo lint`, plus Prettier with `eslint-config-prettier`. Add a `.prettierrc`: single quotes, width 100.
   - Jest: `jest-expo` preset, `@testing-library/react-native`, and the AsyncStorage jest mock wired in `jest.setup.ts`.
   - Add a first test: `src/services/__tests__/config.test.ts`, covering defaults, http mode without a URL throwing, and the auth header/scheme defaults.
6. **npm scripts** (all must work in Windows `cmd`/PowerShell):
   ```json
   "start": "expo start",
   "ios": "expo start --ios",
   "typecheck": "tsc --noEmit",
   "lint": "expo lint",
   "format": "prettier --write .",
   "test": "jest",
   "bundle:ios": "expo export --platform ios --output-dir .verify-dist",
   "verify": "npm run typecheck && npm run lint && npm run test -- --ci && npm run bundle:ios"
   ```
7. **Placeholder UI**
   - `src/app/index.tsx` renders a dark (`#0A0A0A`) screen with "FridgeChef" and the current `config.API_MODE`.
   - Proves routing, the config wiring and the bundle work.
8. **Git** (at the repo root `FridgeChef/`, not inside the app)
   - `git init`, a `.gitignore` covering `node_modules/`, `.env`, `.env.*.local`, `.expo/`, `dist/`, `.verify-dist/`, `ios/`, `android/`, `*.log`, and a `.gitattributes` with `* text=auto eol=lf`.
   - **Do not commit or push.** Leave everything uncommitted for the user to review and commit.
9. **Docs**
   - Update the root `CLAUDE.md` → Commands with the real scripts.
   - Add `fridgechef-app/README.md` (how to run, env, verify).

## Out of scope

Design tokens, components, real screens, state and API code (Sprints 02-05).

## Acceptance criteria

- `npm run verify` passes from a clean clone (`npm ci` then `npm run verify`).
- `npx expo start` serves the placeholder, which shows "FridgeChef · mode: mock".
- `config` is the only module that reads `process.env`. Searching `src/` for `process.env` shows only `services/config.ts`.
- The repo is initialised with no commits made by the agent, and `git status` doesn't list `.env` or `node_modules` (both ignored).

## Build verification pass

Run `npm run verify` and `npx expo-doctor`. Paste the results into the handbook. Fix doctor warnings about mismatched package versions with `npx expo install --fix`.

## End of sprint

Write `sprints/01-bootstrap/HANDBOOK.md` from the template, update the status board, and append decisions (e.g. SDK version, lint config) to `reference/decisions.md`.
