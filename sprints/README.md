# FridgeChef - sprint system

This folder is the **memory of the build**. Every agent that works on the app uses these files to learn what happened before, what to do now, and what to hand over next. Nothing about sprint progress lives anywhere else.

## Protocol (every sprint, every agent)

1. **Read the previous handbook first:** `sprints/<previous-sprint>/HANDBOOK.md`. Honour its handovers, known issues and warnings.
2. **Then read this sprint's instructions:** `sprints/<this-sprint>/INSTRUCTIONS.md`, plus the references it names (`reference/architecture.md`, `reference/api-contract.md`, `reference/decisions.md`, and the mockup).
3. **Mark the sprint "In progress"** in the status board below.
4. **Work from `TODO.md`.** Tick items (`- [x]`) as they are done and keep the file current, since it is the in-sprint progress tracker. Add sub-items if you discover work. Never delete items; strike through (`~~…~~`) anything descoped and say why.
5. **Finish with the build verification pass** (below). A sprint is not done until it passes. If something can't pass, record it as a blocker in the handbook.
6. **Write `sprints/<this-sprint>/HANDBOOK.md`** from `_templates/HANDBOOK.md`: status, what was built, decisions, deviations, handovers to the next sprint, known issues, and verification output.
7. **Update the status board**, and append any architectural decisions to `reference/decisions.md`. If commands or architecture changed, update the root `CLAUDE.md`.
8. **Never commit, never push, never use worktrees.** Work directly in the main working tree and leave every change uncommitted; the user reviews and commits. List the files you changed in the handbook.

## Build verification pass

Sprint 01 creates this command. After that, every sprint ends with:

```bash
cd fridgechef-app
npm run verify          # = typecheck + lint + jest --ci + expo export --platform ios
npx expo-doctor         # dependency / config health (needs network; record warnings)
```

Paste the pass/fail summary of both into the handbook. Also add any manual smoke test you did (e.g. `npx expo start` + Expo Go on an iPhone, and which flows you exercised). If you couldn't run a manual smoke test, say so.

## Sprint order and status board

| # | Sprint | Folder | Depends on | Status |
|---|---|---|---|---|
| 00 | Kickoff (planning handover) | `00-kickoff/` | - | Done |
| 01 | Project bootstrap and tooling | `01-bootstrap/` | 00 | Done |
| 02 | Design system: tokens, fonts, icons, primitives | `02-design-system/` | 01 | Done |
| 03 | Composite components | `03-components/` | 02 | Done |
| 04 | Domain logic, SQLite storage and on-device state | `04-domain-state/` | 01 | Done |
| 05 | API layer (mock + http seam) | `05-api-layer/` | 04 | Done |
| 06 | App shell, onboarding, Home, Pantry, Saved/Profile | `06-shell-core-screens/` | 03, 05 | Done with carry-over |
| 07 | Scan → Analyzing → Confirm quantities | `07-scan-confirm/` | 06 | Done with carry-over |
| 08 | Mood → Suggestions → Recipe → Cook → pantry update | `08-recipes-cook/` | 07 | Done with carry-over |
| 09 | Polish, QA and release readiness | `09-polish-qa/` | 08 | Done with carry-over |
| 10 | API go-live (**blocked until the user supplies the endpoint + key**) | `10-api-go-live/` | 09 + user input | Blocked |

Status values: `Not started` · `In progress` · `Done` · `Done with carry-over` · `Blocked`.

Sprints 02-03 and 04-05 only depend on 01, so they can run in either order or in parallel. They still follow the handbook chain: the later sprint reads the handbooks of **all** sprints it depends on.

## Folder layout

```
sprints/
├─ README.md                  ← this file (protocol + status board)
├─ _templates/HANDBOOK.md     ← copy this at the end of each sprint
├─ reference/
│  ├─ architecture.md         ← target stack, folders, API seam, env
│  ├─ api-contract.md         ← endpoints + DTOs the mock and real backend share
│  └─ decisions.md            ← append-only decision log
└─ NN-name/
   ├─ INSTRUCTIONS.md         ← what to do (written up front)
   ├─ TODO.md                 ← in-sprint checklist (kept current by the agent)
   └─ HANDBOOK.md             ← written by the agent at sprint end
```

## Global rules

- **Source of truth for UI and behaviour:** `fridgechef-mockup/`. Open `index.html` or `#/gallery`, and read its README (screen reference, content rules, component → React Native mapping).
- **Content rules:** never show the word "AI" in the UI; no play-button icons; hyphens, never em dashes, in copy; lime is the only accent.
- **API seam:** screens never touch `services/api/mock/**`, `fetch`, `MockApi` or `HttpApi` directly (see `reference/architecture.md`).
- **Local database:** all app data lives on the phone in SQLite (`expo-sqlite`). `expo-sqlite` is imported only in `src/db/client.ts`; SQL lives only in `src/db/repositories/` and `services/api/mock/db/`; migrations are append-only; no JSON data files (see `reference/architecture.md` → Local database).
- **Flexbox-only layouts;** reuse components rather than one-off styled views in screens.
- Add packages with `npx expo install`. Don't downgrade or pin against the SDK without recording why.
