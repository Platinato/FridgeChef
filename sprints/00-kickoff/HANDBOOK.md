# Sprint 00 handbook - Kickoff (planning handover)

> This isn't a build sprint. It hands the planning and design phase over to Sprint 01.

## Status

- **Result:** Done
- **Date:** 2026-09-26

## What exists

- **`fridgechef-mockup/`**: the final, approved clickable HTML/CSS/JS mockup.
  - Its README has the screen reference, content rules, component → React Native mapping and design tokens.
  - Run it by double-clicking `index.html`, or `node .claude/static-server.js` → http://localhost:5173 (also wired in `.claude/launch.json`).
  - `#/gallery` shows every screen.
- **`MOCKUP_PROMPT.md`**: the original product and design brief. It is historical; where it differs from the mockup README, the README wins.
- **`sprints/reference/`**: target architecture, API contract v1 (draft) and the decision log.
- **Root `CLAUDE.md`**: repo guidance for agents.
- No git repository yet. Sprint 01 initialises it.

## Product in one paragraph

FridgeChef (iOS, React Native):

1. The user photographs their fridge or pantry, or picks photos from the gallery.
2. Ingredients are detected with estimated quantities.
3. The user **must confirm quantities** with sliders before any recipe is suggested; low-confidence items are flagged.
4. The user sets mood, time, effort, servings, hunger, cuisine, diet, equipment and spice.
5. The app suggests recipes with brief steps and cooks along with a timer.
6. Pantry staples (spices, oils, basics) are remembered, auto-included, and deducted after cooking.

## Decisions already made (see `reference/decisions.md`)

- Expo + TypeScript strict + Expo Router, in `fridgechef-app/`.
- **The backend is not available yet.** Build the complete app on **mock JSON data** behind the `FridgeChefApi` interface.
  - The user will later supply an endpoint + API key for `.env`.
  - Going live must need minimal changes: env values, plus `contract.ts` / `mappers.ts` / `endpoints.ts` if the wire shape differs.
- Matching and scoring are computed on-device. Profile, pantry and cookbook are local-first.

## Content rules from design review (do not regress)

- Never show the word **"AI"** in the UI. Use "Ready", "Scanning", and "Sure" / "Fairly sure" / "Unsure"; estimate ticks show a bare number.
- **No play-button icons** anywhere, including "Start cooking". The cook timer uses a stopwatch icon.
- Recipe detail:
  - the top bar has only back + save
  - the stat tiles are **lime = time**, white = kcal, soft-lime = protein
  - there is no match tile
- Saved recipe cards show **effort bars** instead of match %. Home "Cook again" and Suggestions keep match %.
- Profile "Default effort" is a plain segmented control with no level bars. The Mood screen's effort control keeps its bars.
- Scan CTA "Analyze N photos" and "Start cooking" are text-only buttons.
- Use hyphens, never em dashes, in copy.

## Handovers to Sprint 01

- Scaffold `fridgechef-app/` exactly as `reference/architecture.md` describes, and create the `npm run verify` script. Every later sprint depends on it.
- Create `.env.example` with **all** variables from the architecture doc. Default to `EXPO_PUBLIC_API_MODE=mock`.
- Initialise git at the repo root (it doesn't exist yet), with a `.gitignore` covering `node_modules`, `.env`, `.expo`, `dist`, `.verify-dist`, `ios`, `android`.
- The user develops on **Windows**. There is no iOS Simulator, so:
  - build verification relies on `expo export --platform ios`
  - manual testing is Expo Go on a physical iPhone (`npx expo start`, scan the QR code)

## Known issues

- None in code. The Unsplash image URLs in the mockup fixtures are fine for development, but should be replaced with bundled or licensed assets before release (Sprint 09).

## Environment notes

- Windows 11, Node v24.19.0, npm 11.17.0, git 2.55.
- The Expo SDK version is decided at bootstrap (use the latest stable). Record it in the Sprint 01 handbook.
