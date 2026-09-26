# Sprint 01 TODO - Project bootstrap and tooling

## Start
- [x] Read `sprints/00-kickoff/HANDBOOK.md`
- [x] Read `INSTRUCTIONS.md`, `reference/architecture.md`, `reference/decisions.md`
- [x] Set Sprint 01 to "In progress" in `sprints/README.md`

## Tasks
- [x] Scaffold `fridgechef-app/` with create-expo-app (Router + TS); remove example screens
  - [x] Ran `npm run reset-project` (delete mode), then removed the script + its npm entry
  - [x] Removed the nested `fridgechef-app/.git` that create-expo-app initialised (empty, no commits); git lives at the repo root
  - [x] Removed the template's Expo `LICENSE`, example images, and unused deps (`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`)
- [x] Move routes to `src/app/`; create the folder skeleton from the architecture doc
  - [x] The SDK 57 template already uses `src/app/`; added `.gitkeep` so empty folders survive a clone
  - [x] `docs/api-contract.md` copied verbatim from `sprints/reference/api-contract.md` (Prettier-ignored so it stays identical)
- [x] tsconfig: strict, noUncheckedIndexedAccess, `@/*` alias (works in Metro + Jest)
- [x] `app.config.ts`: name, slug, scheme, dark UI, portrait, bundle id placeholder, bg colour (`app.json` removed)
- [x] `src/services/config.ts`: all env vars, defaults, Zod validation, frozen export, fail-fast for http mode
- [x] `.env.example` with every variable + security note
- [x] ESLint (`expo lint`) + Prettier + eslint-config-prettier
- [x] Jest (jest-expo) + RNTL + AsyncStorage mock in `jest.setup.ts`
  - [x] Installed `test-renderer` (required peer of RNTL 14)
- [x] `config.test.ts` (defaults, http-mode validation, auth header defaults)
  - [x] Extra: blank values, invalid values, import-time env wiring + fail-fast via `jest.isolateModules`
  - [x] Extra: `src/__tests__/index-route.test.tsx` renders the placeholder (tests must not live in `src/app/`)
- [x] npm scripts incl. `verify` (works on Windows)
- [x] Placeholder `src/app/index.tsx` showing app name + API mode
- [x] Git: init at repo root, `.gitignore`, `.gitattributes`
- [x] `fridgechef-app/README.md` + update root `CLAUDE.md` Commands
  - [x] Added a `fridgechef-app` web preview config to `.claude/launch.json`

## Verify
- [x] `npm run verify` passes (also after a clean `npm ci`)
- [x] `npx expo-doctor` clean (or warnings recorded): 21/21 checks passed
- [x] Manual smoke: `npx expo start` → placeholder renders (Expo Go on iPhone if available)
  - No iPhone reachable from this session. Checked via `expo start --web` in a browser (375x812) and by fetching the iOS manifest + iOS dev bundle from Metro. Expo Go on a real iPhone is still to do (handover).
- [x] `process.env` only appears in `services/config.ts` (plus `config.ts`'s own test, which sets env on purpose)

## Close
- [x] Write `HANDBOOK.md` (include the SDK / RN / React versions)
- [x] Update the status board + `reference/decisions.md`
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
