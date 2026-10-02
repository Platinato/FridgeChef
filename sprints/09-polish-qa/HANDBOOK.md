# Sprint 09 handbook - Polish, QA and release readiness

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done with carry-over
- **Dates:** 2026-10-01 → 2026-10-01
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

Everything that can be built and checked on this Windows machine is done, and `verify`, `expo-doctor` and `api:smoke` pass. The carry-over is the work that needs a physical iPhone, plus open questions only the user can answer:

- the device full loop (normal and 30% failure)
- the VoiceOver pass
- 60 fps sliders
- camera / permissions

Both full loops ran instead on the **web preview** (real SQLite) and as repeatable **Jest integration tests** (normal + a seeded 30% failure rate). Sprint 10 stays **Blocked** until the user supplies the API.

## Release readiness summary

| Area | State |
|---|---|
| Mockup parity | 11 / 11 screens compared side by side at 390 × 844: 8 OK, 3 fixed this sprint; web-only differences documented (table below) |
| Content rules | Test green; by eye: no "AI", no play icon (stopwatch only), hyphens only, lime the only accent; the new icon / splash are the lime logo |
| Accessibility | Roles + labels on every control (scripted audit); adjustable sliders; toasts announced; Dynamic Type caps + growing controls; AA contrast test. **Device VoiceOver pass: open** |
| Motion | Reduce Motion: stack fade, loops stop; ProgressBar fill animates; haptics on shutter, "Looks right", switches, timer end |
| Resilience | Offline banner; "Try again" on every fetch; app error boundary + "Restart"; write-failure toast; boot retry; "Update FridgeChef" for a newer database; a 30% failure full loop completes |
| Data | v1 → v2 migration keeps every row (test); a newer database is refused untouched; reset works after a long session |
| Performance | expo-image everywhere (memory + disk cache, fade, a placeholder colour while loading); memoised rows (React Compiler + Confirm rows); iOS bundle **5.5 MB** Hermes bytecode, export **6.8 MB** (1.5 MB assets, mostly fonts). **60 fps on device: open** |
| Release config | Icon + splash from the logo; `eas.json` (development / preview / production); app name, bundle id and Apple account: **open questions** |
| Go-live | `fridgechef-app/docs/API_GO_LIVE.md`, step by step; rollback = `EXPO_PUBLIC_API_MODE=mock` |

## What was built

- **Accessibility:**
  - `AppText` `FONT_SCALE_CAP` (display 1.1×, reading text 2×, micro 1.3×).
  - Every control that holds text uses `minHeight`: PrimaryButton, Badge, Chip, SegmentedControl, TabBar, DetectedChip, StatTile, Stepper.
  - `RangeSlider` is one `adjustable` element: value + unit, increment / decrement by `step`.
  - `showToast()` announces for VoiceOver.
  - `src/theme/__tests__/contrast.test.ts` checks the UI's text / background pairs against WCAG AA (translucent backgrounds blended), and keeps `text3` (2.96:1) out of the app UI.
- **Motion + haptics:**
  - Reduce Motion → `fade` stack transitions (root layout).
  - `ProgressBar` fill eases over 300 ms.
  - `src/components/haptics.ts` (`tap` / `selection` / `success`, a no-op on web), wired into ShutterButton, QuantitySlider's "Looks right", Toggle and the cook timer.
  - `expo-haptics` was already added in Sprint 08.
- **Resilience:**
  - `@react-native-community/netinfo` 12.0.1 with `src/services/network.ts` (`useIsOffline`, and `connectOnlineManager()` for http mode only), plus `src/components/OfflineBanner.tsx`, rendered by `AppEffects`.
  - Root-layout `ErrorBoundary` → `src/screens/shell/AppErrorScreen.tsx`.
  - `MigrationError.code` + `bootErrorKind()`; `BootErrorScreen` says "Update FridgeChef" for a database from a newer app.
- **Performance:** `FallbackImage` (every photo in the app, on `expo-image`) gets `cachePolicy="memory-disk"` and a `surface2` placeholder colour while a remote photo loads. Before, a loading photo was transparent.
- **Behaviour fixes found in QA:**
  - Suggestions keep the last focused request (no wasted refetch under Recipe / Cook, no empty state on swipe-back; D56).
  - Mood section dividers.
  - `ListRow` labels wrap.
  - The Scan tip pill and the offline banner are centred.
  - The `Screen` row footer no longer truncates "Done cooking" (D57).
- **Release config:**
  - `scripts/make-icons.ps1` renders the icon, splash, favicon and Android adaptive layers from the `AppLogo` geometry.
  - `ios.icon` → `assets/images/icon.png`; the template's Expo `assets/expo.icon` is removed. The splash is the 96 pt logo disc on `#0A0A0A`.
  - `eas.json`.
  - `public/index.html`: a dark web-preview page (no white flash).
- **Docs:**
  - `fridgechef-app/README.md`: mock mode + demo photos, data storage (upgrades, seeds, encryption), release builds, accessibility + resilience, troubleshooting, layout.
  - `fridgechef-app/docs/API_GO_LIVE.md`.
  - Root `CLAUDE.md`.
- **Tests: 27 suites, 352 tests** (Sprint 08 ended at 24 / 326).
  - `src/__tests__/full-loop.test.tsx` (2): the whole loop + reset, and the loop at a seeded 30% failure rate.
  - `src/__tests__/resilience.test.tsx` (6).
  - `src/theme/__tests__/contrast.test.ts` (11).
  - Database upgrade test (1).
  - Accessibility / haptics / toast / image component tests (6).

### Mockup regression table (390 × 844, web preview vs. `fridgechef-mockup`)

| # | Screen | Result | Notes |
|---|---|---|---|
| 1 | Onboarding (slides + taste setup) | OK | Same layout, dots, copy and CTA. Web-only: display titles render solid white (the mockup's white → grey title gradient uses `MaskedView`, which react-native-web doesn't render; iOS shows it) |
| 2 | Home | OK | Ticket notches + dashed seam, card widths, floating nav (73% width) match |
| 3 | Scan | **Fixed** | The tip pill was left-aligned (`Badge` self-aligns `flex-start`); now centred. Web has no camera, so the "Camera access" card shows where the mockup has its fake feed |
| 4 | Analyzing | OK | Stack + sweep, "N / M FOUND", chips with connectors. "Skip" appears once data exists (D46, deliberate) |
| 5 | Confirm quantities | OK | The extra "Photo 2 looks blurry" banner is from the Sprint 07 instructions |
| 6 | Your MOOD | **Fixed** | The dashed rules between form sections were missing |
| 7 | For you TONIGHT | **Fixed** | The context row now wraps to 2 lines like the mockup (`ListRow` label) |
| 8 | Recipe detail | OK | Hero (back + save only), tiles, tabs and lime footer pixel-close; the long title wraps cleanly |
| 9 | Cook mode | OK (+ fix) | Matches. "Done cooking" no longer truncates at 390 pt (row footer, D57); the Back / Next halves are no longer exactly equal |
| 10 | Pantry | OK | 1:1 |
| 11 | Saved / Profile | OK | Effort bars, no %, same rows |

Not visible on the web preview, so check on a device: the glass blur (none by design, D21/D58), the iOS title gradient, slider thumb vs. estimate tick alignment, and safe-area insets. Photos sometimes rendered blank in the agent's browser: expo-image's fade-in pauses while the pane is hidden. That's the known environment artefact; they load when the tab is in front.

### Full loop at a 30% mock failure rate

- **Jest** (`full-loop.test.tsx`, seed 285): detection fails once → "Try again" → OK; suggestions fail once → "Try again" → OK; the loop completes with no error boundary, "Pantry updated · 2 items running low", and persisted.
- **Web preview** (`EXPO_PUBLIC_MOCK_FAILURE_RATE=0.3` in a temporary git-ignored `.env.local`, since deleted), driven by a script: scan → confirm → mood → suggestions (failed once, recovered with "Try again") → recipe → cook → "Update pantry" → Home, with the toast "Pantry updated · 2 items running low", Running low 3 → 5, and no crash screen.
- **Device: open** (carry-over).

## Changed files (uncommitted, for the user to review)

Sprints 02-08 are also still uncommitted. This sprint's changes:

- **Added:**
  - `fridgechef-app/eas.json`
  - `fridgechef-app/public/index.html`
  - `fridgechef-app/scripts/make-icons.ps1`
  - `fridgechef-app/docs/API_GO_LIVE.md`
  - `src/components/{haptics.ts,OfflineBanner.tsx}`
  - `src/services/network.ts`
  - `src/screens/shell/AppErrorScreen.tsx`
  - `src/__tests__/{full-loop,resilience}.test.tsx`
  - `src/theme/__tests__/contrast.test.ts`
  - `sprints/09-polish-qa/HANDBOOK.md`
- **Modified:**
  - `app.config.ts` (ios.icon, splash width)
  - `assets/images/{icon,splash-icon,favicon,android-icon-*}.png` (regenerated)
  - `package.json` / `package-lock.json` (netinfo)
  - `jest.setup.ts` (netinfo mock)
  - `src/app/_layout.tsx` (Reduce Motion, ErrorBoundary, online manager, AppEffects after the Stack, boot error kind)
  - `src/components/{AppText,Badge,Chip,DetectedChip,FallbackImage,ListRow,PrimaryButton,ProgressBar,QuantitySlider,RangeSlider,Screen,SegmentedControl,ShutterButton,StatTile,Stepper,TabBar,Toast,Toggle}.tsx`
  - `src/components/__tests__/primitives.test.tsx`
  - `src/screens/{CookModeScreen,MoodScreen,ScanScreen,SuggestionsScreen}.tsx`
  - `src/screens/shell/{AppEffects,BootErrorScreen}.tsx`, `src/screens/shell/useBoot.ts`
  - `src/state/{boot,index}.ts`
  - `src/db/migrate.ts` (error code)
  - `src/db/__tests__/database.test.ts`
  - `src/__tests__/recipe-flow.test.tsx` (haptics mock)
  - `fridgechef-app/README.md`, `CLAUDE.md`
  - `sprints/README.md`, `sprints/09-polish-qa/TODO.md`, `sprints/reference/decisions.md`
- **Deleted:** `fridgechef-app/assets/expo.icon/` (the template's Expo-branded Icon Composer bundle)

## Decisions and deviations

D53-D61 were appended to `sprints/reference/decisions.md`:

- **D53:** Dynamic Type caps, `minHeight` controls, the adjustable slider, toast announcements, the contrast test.
- **D54:** Reduce Motion fade, ProgressBar animation, the haptics helper.
- **D55:** the offline banner (http-only `onlineManager`), the error boundary, `MigrationError.code` / "Update FridgeChef".
- **D56:** Suggestions keep the last focused request.
- **D57:** the mockup regression fixes and the CSS-vs-Yoga flex note.
- **D58:** icons from the logo geometry, `eas.json` (dev client deliberately not installed), the dark web template, dev-only remote images, glass without blur.
- **D59:** the full-loop + resilience test design, and the two test traps.
- **D60:** the `npm audit` assessment.
- **D61:** image caching (memory + disk) and the loading placeholder colour.

Deviations from the instructions:

- **Device-only checks** (VoiceOver pass, 60 fps, device full loops) weren't possible: there's no iPhone in this session. They're replaced by a code-level audit, tests and web-preview runs, and carried over.
- **Seed images** stay remote (option 2 in the instructions), documented as development only.
- **`eas.json` was not exercised:** no cloud build without the user's accounts, as instructed.

## Open questions for the user

1. **App name:** "FridgeChef" (`app.config.ts` `name` / `slug`). Is that final for the App Store?
2. **Bundle id:** `com.fridgechef.app` is a placeholder (since Sprint 01). What reverse-DNS id should the build use? It's needed before the first EAS build.
3. **Apple / Expo accounts:** an Expo account (for `eas build`) and an Apple Developer account + team (for signing / TestFlight).
4. **API details (unblocks Sprint 10):**
   - the base URL
   - the key
   - the header + scheme (`Authorization: Bearer …` or `x-api-key`)
   - docs or sample responses
   - confirmation that the key is safe to ship in a mobile app (see `docs/API_GO_LIVE.md` step 1)
5. **Images:** keep remote Unsplash photos for testers, or supply / approve bundled licensed images before release?
6. **Glass blur:** keep the translucent glass (no blur), or add `expo-blur` (in Expo Go) for closer mockup parity?
7. **Background timer alert:** should a cook timer that finishes while the app is in the background send a local notification (`expo-notifications`)?

## Handovers to the next sprint

**Sprint 10 (go-live, blocked):**
- Execute `fridgechef-app/docs/API_GO_LIVE.md` exactly. It names the env vars, files, commands and the rollback.
- **EAS builds don't read the local `.env`.** Set EAS environment variables, and note that the `preview` / `development` profiles pin `EXPO_PUBLIC_API_MODE=mock`.
- In http mode, the offline banner also pauses queries (`connectOnlineManager`). Test airplane mode on a device.

**Still open (device), carried from Sprints 06-09 (do these first with a phone):**
- Expo Go smoke: onboarding → home → pantry → saved → kill + reopen → reset.
- Camera capture, gallery multi-pick, permission prompts and the denied path.
- The full loop (normal + `EXPO_PUBLIC_MOCK_FAILURE_RATE=0.3`), with Running low rising on Home.
- A VoiceOver run through the full loop.
- Slider dragging at 60 fps; slider thumb vs. the estimate tick.
- Keep-awake and the haptic at timer 0; the timer after lock / unlock.
- Image prep time for 3-6 camera photos (it was 13 s for remote images on web).

**Security note (carried):** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. A secret LLM-provider key must stay on a server, never in this app.

**Carry-over (verbatim from TODO.md):**
- `[ ] (01) Placeholder bundle id \`com.fridgechef.app\` → open question for the user (handbook)`
- `[ ] (03) Slider thumb alignment vs. the estimate tick on iOS → device check (carry-over)`
- `[ ] (07) Slow image prep on web (about 13 s for 6 remote photos) → documented; measure on device (carry-over)`
- `[ ] (08) Timer done while backgrounded has no alert (needs expo-notifications) → handover (out of scope for v1 polish)`
- `[ ] (06-08) Device checks still open: Expo Go smoke, camera / gallery / permissions, full loop (carry-over)`
- `[ ] On-device VoiceOver pass of the full loop (carry-over: no device)`
- `[ ] 60 fps slider dragging on a device (carry-over)`
- `[ ] Manual device full loop: normal + 30% failure (no device; both ran on the web preview + in Jest)`
- `[ ] VoiceOver spot check (no device; code-level audit + tests instead)`

## Known issues / tech debt

- **`npm audit`: 14 moderate** → assessed in D60 (`uuid` via build tooling, `decode-uri-component` via expo-router's deep-link parsing) → accepted; re-check on each Expo patch release.
- **Web-only:**
  - `props.pointerEvents is deprecated` (from react-native-toast-message's AnimatedContainer and gorhom).
  - Titles without the gradient (MaskedView).
  - Images / sheets pause while the browser tab is hidden.
  - All documented in the README's troubleshooting table. iOS is unaffected.
- **Row footer halves:** Back / Next are now sized from their content (156 / 192 pt at 390) instead of exactly equal; CSS's `min-width: auto` has no Yoga equivalent (D57).
- **`development` EAS profile** needs `expo-dev-client` first. It's not installed, on purpose, so `npm start` keeps opening Expo Go.
- **Encryption:** none in v1 (documented). SQLCipher needs a development build.
- **Test-renderer peer warning** (Sprint 03) is unchanged.

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm run web                                      # the full loop in the browser (Scan → "Use demo photos")
npm test -- src/__tests__/full-loop.test.tsx     # the whole loop, plus the 30% failure run
npm test -- src/__tests__/resilience.test.tsx
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-icons.ps1   # regenerate icons / splash
```

- Error states: put `EXPO_PUBLIC_MOCK_FAILURE_RATE=0.3` (or `1`) in a git-ignored `.env.local` and restart.
- Reduce Motion / Dynamic Type / VoiceOver: iPhone Settings → Accessibility, then Expo Go.

## Build verification pass

```
npm run verify   → PASS
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 27 suites, 352 tests passed (guard + content-rules + contrast green)
  ios export  "iOS Bundled ... (2205 modules)" → .verify-dist
              entry-*.hbc 5.5 MB (Hermes bytecode); export 6.8 MB total, assets 1.5 MB
              (no node:sqlite / createNodeDriver / test fixtures in the bundle)
npx expo-doctor      → PASS: 21/21 checks passed, no issues
npm run api:smoke    → PASS (mock): catalog 8 moods / 8 cuisines / 25 default staples; detect 12 items +
                       1 photo warning; suggest 9 recipes; recipe butter-chicken (11 ingredients,
                       5 steps); unknown id → not_found. "All 5 checks passed"
npm run format:check → PASS
Web preview (390 × 844, real SQLite):
  - 11-screen side-by-side regression against the mockup (table above)
  - full loop at EXPO_PUBLIC_MOCK_FAILURE_RATE=0.3: completed, 1 "Try again" (suggestions), no crash,
    "Pantry updated · 2 items running low", Running low 3 → 5
  - fresh install (OPFS cleared) → onboarding → home; dark page before the bundle loads
  - cook footer at 390 pt: Back 156 / Next 192, Back 139 / "Done cooking" 209, no label clipped
Device (Expo Go on an iPhone): full loop normal + 30%, VoiceOver, 60 fps → NOT RUN: no device
  reachable (carry-over)
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0, npm 11.17.0.
- Expo SDK 57 (expo 57.0.26, expo-router 57.0.24); new this sprint: `@react-native-community/netinfo` 12.0.1.
- The browser pane was hidden for parts of the session: some screenshots timed out, image fades and sheets paused. Layout was checked with DOM measurements where screenshots failed.
