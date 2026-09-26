# Sprint 01 handbook - Project bootstrap and tooling

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done
- **Dates:** 2026-09-26 → 2026-09-27
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

The one open item is a manual smoke test in Expo Go on a physical iPhone. No iPhone was reachable from this session, so the app was smoke-tested in a browser and through Metro's iOS manifest and bundle instead (see below). This is a handover, not a blocker.

## What was built

- **`fridgechef-app/`** scaffolded with `create-expo-app@latest` (default template).
  - Examples removed with `reset-project`, and the script deleted afterwards.
  - Unused template deps removed: `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`.
- **Versions:** Expo SDK **57.0.25** · React Native **0.86.3** · React **19.2.3** · TypeScript 6.0.3 · Expo Router 57.0.23 · Zod 4.6.5 · jest-expo 57.0.5 · ESLint 9.39 · Prettier 3.9 · RNTL 14.0.1.
- **Folder skeleton** (with `.gitkeep`):
  - `src/{app,screens,components,theme,domain,state,mocks/fixtures}`
  - `src/services/{api/http,api/mock,queries,media}`
  - `docs/api-contract.md`: a verbatim copy of `sprints/reference/api-contract.md`
- **`tsconfig.json`:**
  - `strict`, `noUncheckedIndexedAccess`, `types: ["jest"]`
  - aliases `@/*` → `src/*` and `@/assets/*` → `assets/*` (template default)
  - Metro resolves them natively; `jest.config.js` mirrors them in `moduleNameMapper`
- **`app.config.ts`** (replaces `app.json`):
  - name `FridgeChef`, slug and scheme `fridgechef`
  - `userInterfaceStyle: 'dark'`, portrait only
  - `backgroundColor` and splash background `#0A0A0A`
  - iOS `bundleIdentifier: 'com.fridgechef.app'` (**placeholder**), `supportsTablet: false`
  - React Compiler and typed routes stay enabled (template defaults)
- **`src/services/config.ts`:** the only env reader.
  - Reads all 8 `EXPO_PUBLIC_*` variables through static references.
  - Validates with Zod and applies the documented defaults.
  - `parseConfig(raw)` is pure and exported for tests. `config` is frozen and parsed at import.
  - `ConfigError` lists every bad variable, and `http` mode without `API_BASE_URL` fails fast.
- **`.env.example`:** every variable with its default, meaning, and the security note.
- **Quality tooling:**
  - `eslint.config.js`: `eslint-config-expo/flat` + `eslint-config-prettier/flat`
  - `.prettierrc`: single quotes, width 100; plus `.prettierignore`
  - `jest.config.js`: `jest-expo` preset
  - `jest.setup.ts`: AsyncStorage mock
- **Tests** (19, all passing):
  - `src/services/__tests__/config.test.ts`: defaults, blank values, frozen output, parsing, the http-mode fail-fast, auth header/scheme defaults, a raw-key (empty scheme), invalid values, and the real `process.env` wiring at import time (`jest.isolateModules`)
  - `src/__tests__/index-route.test.tsx`: the placeholder renders "FridgeChef · mode: mock"
- **npm scripts:** `start`, `ios`, `web`, `typecheck`, `lint`, `format`, `format:check`, `test`, `bundle:ios`, `verify`. They are identical to the instructions, plus `web` and `format:check`.
- **Placeholder route:** `src/app/index.tsx` shows a dark screen with "FridgeChef · mode: mock". `src/app/_layout.tsx` is a headerless `Stack` on `#0A0A0A`.
- **Git** at the repo root:
  - `git init`, no commits
  - root `.gitignore` covering `node_modules/`, `.env`, `.env.*.local`, `.expo/`, `dist/`, `.verify-dist/`, `ios/`, `android/`, `*.log`, signing files and `.claude/settings.local.json`
  - `.gitattributes`: `* text=auto eol=lf`, with images and fonts marked binary
- **Docs:**
  - new `fridgechef-app/README.md` (run, env, verify, layout)
  - root `CLAUDE.md` updated: repo table and Commands
  - `.claude/launch.json` gained a `fridgechef-app` preview (`expo start --web`, port 8081)

## Changed files (uncommitted, for the user to review)

The repo was just initialised, so `git status` lists everything as untracked. Files this sprint added or changed:

- **Repo root:** `.gitignore` (new), `.gitattributes` (new), `CLAUDE.md` (modified), `.claude/launch.json` (modified)
- **Sprints:** `sprints/README.md` (status board), `sprints/01-bootstrap/TODO.md`, `sprints/01-bootstrap/HANDBOOK.md` (new), `sprints/reference/decisions.md` (D6-D11)
- **`fridgechef-app/`** (all new):
  - Config: `package.json`, `package-lock.json`, `app.config.ts`, `tsconfig.json`, `eslint.config.js`, `jest.config.js`, `jest.setup.ts`, `.prettierrc`, `.prettierignore`, `.env.example`
  - Docs: `README.md`, `docs/api-contract.md`
  - Source and tests: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/services/config.ts`, `src/services/__tests__/config.test.ts`, `src/__tests__/index-route.test.tsx`, `.gitkeep` in the 10 empty skeleton folders
  - Template files kept: `assets/` (placeholder icons and splash), `AGENTS.md` (one line edited: `app.json` → `app.config.ts`), `CLAUDE.md` (`@AGENTS.md`), `.claude/settings.json` (enables the official `expo` Claude plugin), `.vscode/{extensions,settings}.json`
  - `.gitignore` is generated and kept up to date by Expo CLI (it adds `expo-env.d.ts`). Deleting it is pointless: `expo start` / `expo export` recreate it.
- **Deleted from the template:** `app.json`, `LICENSE` (Expo's template licence), `scripts/reset-project.js`, example `src/` (tabs, themed components, hooks), example images, and the nested `fridgechef-app/.git` (empty, no commits)

## Decisions and deviations

Decisions D6-D11 were appended to `sprints/reference/decisions.md`:

- **D6:** SDK 57 / RN 0.86 / React 19.2.
- **D7:** `app.config.ts`, with the bundle id as a placeholder.
- **D8:** `config.ts` shape.
  - Keys drop the prefix (`config.API_MODE`).
  - Blank values count as unset, so the default applies.
  - `EXPO_PUBLIC_API_AUTH_SCHEME=` (explicitly empty) means send the raw key. If the variable is missing entirely, the scheme is `Bearer`.
  - `API_BASE_URL` must be http(s), and any trailing `/` is trimmed.
  - `API_AUTH_HEADER` must be a valid header token.
- **D9:** `eslint-config-prettier` only, with no `eslint-plugin-prettier`. Formatting is checked by `npm run format:check`, which is **not** part of `verify`.
- **D10:** Jest / RNTL 14 setup; no tests under `src/app/`.
- **D11:** git at the repo root; `react-native-web` kept for a browser preview.

Deviations:

- **`process.env` in `src/`.** It appears in `services/config.ts` and in **`services/__tests__/config.test.ts`**. The test sets `process.env` on purpose, to prove the import-time wiring and fail-fast. No app code reads env. Sprint 05's guard test should allowlist `config.ts` and its test (or only scan non-test files).
- **Web kept.** The architecture targets iOS only, but `react-native-web` / `react-dom` (template defaults) stay so agents can preview on Windows. Drop them in Sprint 09 if the user prefers.
- **Extra dev dependency:** `test-renderer` (RNTL 14 peer).
- **Extra runtime dependency:** `@react-native-async-storage/async-storage` 2.2.0 was installed now, so the jest mock has something to mock. Sprint 04 uses it.
- **Guidance file kept:** the template's `fridgechef-app/AGENTS.md` / `CLAUDE.md` (Expo guidance: "do not trust your training data", fetch the versioned docs) stay because they're useful to agents. The root `CLAUDE.md` and the sprint rules win on any conflict. In particular, **never commit** even though AGENTS.md mentions EAS workflows.

## Handovers to the next sprint

Sprints 02 (design system) and 04 (domain / state) can both start now.

- **Smoke test on a real iPhone (carry-over):** `cd fridgechef-app && npm start`, then scan the QR code with Expo Go (SDK 57). Expect a black screen with "FridgeChef · mode: mock". Nobody has done this yet.
- **Imports:** use `import { config } from '@/services/config'`. Never read `process.env` elsewhere. Add any new env variable to `config.ts`, `.env.example`, `fridgechef-app/README.md` and `architecture.md` together.
- **RNTL 14 is async:** `await render(...)`, and prefer `userEvent`. Matchers like `toBeOnTheScreen()` are built in; importing from `@testing-library/react-native` is enough.
- **No non-route files in `src/app/`:** Expo Router treats every file there as a route. Put tests in `src/**/__tests__/`.
- **Colours:** `#0A0A0A` / `#FFFFFF` are hard-coded in `app.config.ts`, `src/app/_layout.tsx` and `src/app/index.tsx`. Sprint 02 should swap the two `src/app` files to `src/theme/tokens.ts`. `app.config.ts` can't import RN code, so keep its constant and its "keep in sync" comment.
- **Dev dependencies with `npx expo install`:** `npx expo install <pkg> -- --save-dev` only partly works. SDK-versioned packages (`jest-expo`, `eslint-config-expo`) still landed in `dependencies`. Check `package.json` afterwards and move them by hand.
- **Native modules and Expo Go:** packages from the architecture list (`@gorhom/bottom-sheet`, `@react-native-community/slider`, `@react-native-masked-view/masked-view`, and others) must be checked against Expo Go SDK 57. Anything with native code outside Expo Go needs a development build (`eas build --profile development`), and this Windows machine can't build iOS locally.
- **`docs/api-contract.md`:** keep it byte-identical to `sprints/reference/api-contract.md` whenever Sprint 05 changes the contract. It is Prettier-ignored for that reason.
- **Formatting:** run `npm run format` before finishing a sprint (`format:check` passes now).

## Known issues / tech debt

- **`npm audit`: 14 moderate advisories** (`decode-uri-component`, `uuid` < 11.1.1). They come in transitively through Expo / Metro tooling. `npm audit fix --force` would break the SDK pins. Re-check on the next Expo patch release; Sprint 09 should review them before release.
- **npm 11 `allow-scripts` warning:** `unrs-resolver`'s `postinstall` isn't approved. It's only a fallback that downloads the native binding, which npm already installs (`@unrs/resolver-binding-win32-x64-msvc`), so lint works. Ignore it, or run `npm approve-scripts unrs-resolver` if it becomes noisy.
- **Placeholder icons and splash:** app icon, splash and `assets/expo.icon` are Expo template placeholders. Replace them in Sprint 09.
- **Placeholder bundle id:** `com.fridgechef.app` must be replaced before the first EAS build.

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm ci
npm start            # Expo Go on iPhone → "FridgeChef · mode: mock"
npm run web          # or: browser preview at http://localhost:8081
npm run verify
```

To try the env fail-fast, create `fridgechef-app/.env` with `EXPO_PUBLIC_API_MODE=http` (no base URL), then `npx expo start -c`. The app shows a `ConfigError` naming `EXPO_PUBLIC_API_BASE_URL`. The unit tests cover this; it wasn't run on a device.

## Build verification pass

```
npm ci && npm run verify  → PASS (exit 0, from a clean npm ci)
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 2 suites, 19 tests passed
  ios export  expo export --platform ios: "iOS Bundled ... (1201 modules)", Hermes bundle 3 MB → .verify-dist
npx expo-doctor           → PASS: 21/21 checks passed. No issues detected!
npm run format:check      → PASS: all matched files use Prettier code style
Manual smoke              → PARTIAL
  - `expo start --web` in the in-app browser (375x812 mobile viewport): black #0A0A0A screen,
    centred white "FridgeChef · mode: mock", no console errors.
  - Same Metro server, iOS manifest (expo-platform: ios): sdkVersion 57.0.0, name FridgeChef,
    slug/scheme fridgechef, userInterfaceStyle dark, bundleIdentifier com.fridgechef.app.
    The iOS dev bundle (platform=ios, hermes) compiled: HTTP 200, 6.5 MB.
  - Expo Go on a physical iPhone: NOT run (no device reachable from the agent session). Carry-over.
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0, npm 11.17.0 (npm 12 is available but not needed), git 2.55.0.
- Expo SDK 57.0.25, from `create-expo-app@latest` on 2026-09-26.
- `npx expo install ... "--" --dev` is the Windows form in the Expo docs. From Git Bash, `-- --save-dev` worked for non-SDK packages only (see handovers).
- `expo start` / `expo export` create `fridgechef-app/.gitignore` (an `expo-env.d.ts` entry) and `.expo/`. Both are expected; `.expo/` is ignored.
