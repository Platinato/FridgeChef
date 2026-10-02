# Sprint 07 handbook - Scan → Analyzing → Confirm quantities

> Written by the agent at the end of the sprint. The next sprint reads this **first**.

## Status

- **Result:** Done with carry-over
- **Dates:** 2026-10-01 → 2026-10-01
- **Agent / session:** Claude Code (Opus 5.5), desktop app session

The whole capture flow is built and tested, and `verify` and `expo-doctor` pass (output below). The open items are the **device checks in Expo Go on a physical iPhone**: real camera capture, the iOS permission prompts, and the gallery picker. No device was reachable from this session. The same flow (demo photos → Analyze → confirm the flagged items → Mood placeholder) passed on the **web preview**, and so did the error state with `EXPO_PUBLIC_MOCK_FAILURE_RATE=1`.

## What was built

- **Config:** the `expo-camera` and `expo-image-picker` config plugins in `app.config.ts`, with the instructions' iOS usage strings.
  - No microphone, no barcode scanner, Android `RECORD_AUDIO` off.
  - Packages added with `npx expo install`: expo-camera 57.0.6, expo-image-picker 57.0.20, expo-image-manipulator 57.0.20. All three are in Expo Go.
- **Media** (`src/services/media/`):
  - `prepareImage` / `prepareImages`: at most 1280 px on the long edge (one-sided resize, never upscales), JPEG 0.7, base64 without the `data:` prefix. It renders only once when the photo already fits. `prepareImages` runs one photo at a time and is abortable.
  - `resizeTarget` / `fittedSize` hold the resize maths.
  - `pickPhotos(limit)` wraps the system picker (multi-select, `selectionLimit`, ordered).
- **Queries** (`src/services/queries`):
  - `useDetectIngredients().detect(input, { signal })` / `detectAsync(input, { signal })` are now abortable (D44). An aborted call writes nothing, and `errorMessage` is `null` for a cancelled call.
  - New exports: `isCancelled`, `errorMessageOf` and `useDemoPhotos()` (mock mode only).
- **State / domain:** `scan.markRetaken(id, uri?)` and `retakePhoto(…, uri?)`. A retake replaces the photo's uri and clears that photo's warnings.
- **Screens** (the routes in `src/app/scan/*` re-export them):
  - **`ScanScreen`:**
    - full-bleed `CameraView` (paused while the screen isn't focused) with `ScanOverlay` and a bottom fade
    - top bar: back, `LiveBadge` "Ready", flash toggle (lime when on); the tip pill
    - permission card (see below)
    - warning banner + "Retake"
    - mock-only "Use demo photos" chip
    - `PhotoThumbStrip` (remove ×, "+" opens the picker); gallery / last-photo button, `ShutterButton`, flip
    - the capture flash; cap toasts
    - "Analyze N photos" (text only), disabled with the helper text at 0 photos
  - **`AnalyzingScreen`:**
    - prepare → detect (abortable)
    - "0 FOUND" + an indeterminate bar until the reply arrives, then "N / M FOUND", chips every 230 ms, "Scan complete", and `router.replace('/scan/confirm')` 900 ms later
    - "Skip" once data exists
    - error state ("Couldn't scan your photos", Try again / Back to camera) and a no-photos state
  - **`ConfirmScreen`:**
    - top bar: back, "N items" counter, +
    - explainer copy; "N need a check" / "N look good" badges; warning banner + Retake
    - memoised `QuantityRow`s sorted low → med → high → manual
    - "Add missed item" sheet
    - collapsible "From your pantry": include toggles, or the auto-include-off InfoCard + toggle
    - sticky CTA: "Check N items first" (disabled), then "Confirm quantities" → `confirmScan()` → `/mood`
    - "Nothing found" empty state
  - `src/screens/scanShared.ts`: thumbs with the blurry ring, `activeWarning`, warning copy, toast copy, `deviceLocale()`.
- **Components:**
  - `ProgressBar` gets an `indeterminate` prop: a sliding segment, `busy`, no value, static with Reduce Motion.
  - New tokens: `scanPanelMid`, `viewfinderBg`.
- **Tests: 23 suites, 314 tests** (Sprint 06 ended at 21 / 285).
  - `src/services/media/__tests__/prepareImage.test.ts` (13)
  - `src/__tests__/scan-flow.test.tsx` (15)
  - +1 in `primitives.test.tsx`
  - `app-flows.test.tsx`: "Scan now opens /scan" now expects the real Scan screen instead of the placeholder text
  - the existing queries tests pass unchanged (`detect(input)` still works without options)

### Camera permission states (Scan)

| State | What shows |
|---|---|
| First visit (`undetermined`) | The prompt is requested once automatically. The "Camera access" card offers "Allow camera" / "Choose from gallery". |
| Denied for good (`canAskAgain: false`) | "Camera is off": "Open Settings" (`Linking.openSettings()`) / "Choose from gallery". Shutter and flip are disabled. |
| `onMountError` (no camera, e.g. the web preview) | "Camera unavailable" + "Choose from gallery". |
| Granted | The live camera. The shutter is enabled once `onCameraReady` fires. |

The gallery is the system picker (PHPicker on iOS 14+), which needs **no photo-library permission**, so the app never asks for one. `photosPermission` is still set in the plugin in case a future picker mode needs it.

### How photo warnings flow from detection to the UI

1. `POST /v1/scans/detect` returns `photoWarnings[]` (`photoIndex`, `type`: `blurry` | `dark` | `no_food`, `message`). The mock backend adds "Photo 2 looks blurry" when 3+ photos are sent.
2. The mapper turns them into domain `PhotoWarning`s. `useDetectIngredients` → `scan.setDetection(items, warnings)` stores them in `scan_warnings` (SQLite) and the store.
3. **Confirm** shows the first one that still applies (`activeWarning`: its photo exists and isn't retaken) as an alert InfoCard. The title is the backend's `message`; the body comes from `warningBody(type)`. "Retake" goes back to Scan.
4. **Scan** shows the same banner, and that photo's thumb gets the red "blurry" ring. "Retake" takes a new camera shot (or a one-photo gallery pick when the camera is off) and calls `markRetaken(photoId, uri)`. This replaces the uri, sets `retaken`, and drops that photo's warnings.
5. Removing a photo drops its warnings and shifts the later ones down (`removePhotoAt`, Sprint 04). The warnings stay attached to the right photo.
6. Warnings are only refreshed by the next "Analyze". A retake does not re-detect by itself.

## Changed files (uncommitted, for the user to review)

Sprints 02-06 are also still uncommitted. This sprint's changes:

- **Added:**
  - `fridgechef-app/src/screens/{ScanScreen,AnalyzingScreen,ConfirmScreen}.tsx`
  - `fridgechef-app/src/screens/scanShared.ts`
  - `fridgechef-app/src/services/media/{prepareImage,pickPhotos,index}.ts`
  - `fridgechef-app/src/services/media/__tests__/prepareImage.test.ts`
  - `fridgechef-app/src/__tests__/scan-flow.test.tsx`
  - `sprints/07-scan-confirm/HANDBOOK.md`
- **Modified:**
  - `fridgechef-app/app.config.ts` (plugins + usage strings)
  - `package.json` / `package-lock.json` (3 media packages)
  - `src/app/scan/{index,analyzing,confirm}.tsx` (the placeholders are replaced)
  - `src/components/ProgressBar.tsx` (`indeterminate`)
  - `src/components/__tests__/primitives.test.tsx`
  - `src/theme/tokens.ts`
  - `src/services/queries/{hooks,keys,index}.ts`
  - `src/state/scanStore.ts`
  - `src/domain/scan.ts`
  - `fridgechef-app/README.md`, `CLAUDE.md`
  - `sprints/README.md`, `sprints/07-scan-confirm/TODO.md`, `sprints/reference/decisions.md`
- **Deleted:** `fridgechef-app/src/services/media/.gitkeep`

## Decisions and deviations

D43-D47 were appended to `sprints/reference/decisions.md`:

- **D43:** media packages and plugins; the permission flow; no photo-library permission; `services/media`. `prepareImage` returns `PreparedImage` (`base64`) + `width` / `height`, not the instructions' `{ data }`. The wire rename to `data` already lives in `mappers.ts`.
- **D44:** abortable detection, `isCancelled` / `errorMessageOf` / `useDemoPhotos`. Screens never import `services/api`.
- **D45:** Scan keeps the session's photos (no auto `resetScan()`, unlike the Sprint 06 handover's hint). Why: resetting on entry would wipe the confirmed kitchen that Home's match % and Sprint 08 read. Also in D45:
  - Analyzing *replaces* itself with Confirm.
  - Retake replaces the photo.
  - The shutter waits for camera-ready.
  - The demo chip adds the whole library up to the cap.
  - The Confirm CTA proceeds even if the confirm write fails (the toast already shows).
  - Manual items read "Confirmed".
- **D46:** the Analyzing indeterminate state and error / no-photos states; the new tokens.
- **D47:** the test-harness traps (fake timers left on by `renderRouter`; `waitFor` for staggered timers).

Other notes:

- **Retake on Scan with the real camera captures right away** (like the mockup's mock camera): it uses whatever the viewfinder shows. Check on a device that this feels right. If not, switch Retake to "remove + prompt to shoot".
- **The shutter is disabled without a camera** (web, denied). The demo chip and the gallery cover those cases.
- **Detect request:** `knownStapleIds` = all pantry staple ids; `locale` = `Intl…resolvedOptions().locale` (fallback `en-IN`); `units` = `profile.units`.

## Handovers to the next sprint

**Sprint 08 (mood → cook):**
- **Entry:** Confirm pushes `/mood` after `confirmScan()`. `scan.status === 'confirmed'` and `lastScan` are set, and Mood's back returns to Confirm. Replace `src/app/mood.tsx` (still the placeholder).
- **The kitchen** for suggestions is `useKitchen()`: confirmed items (`value` in the base unit) + staples with `autoInclude` / `excluded`. Confirm's pantry toggles already write `excluded`.
- **A new detection** (Scan → Analyze) resets the confirmation (`status: 'detected'`). If Mood / Suggestions are reached with a non-confirmed session (e.g. a deep link), decide whether to send the user back to Confirm.
- **Flow tests:** copy the harness from `src/__tests__/scan-flow.test.tsx`:
  - device fakes
  - `seedDetection()`, using MockApi with `sleep: async () => undefined`
  - assert timer-driven UI (cook timer!) with `waitFor`, not one big `advanceTimersByTimeAsync` inside `act`
- **Typed routes:** run `npm run web` once after adding routes (see Sprint 06).

**Sprint 09 (polish):**
- **Image prep speed:** on the web preview, preparing the 6 remote demo photos takes about 13 s before the request even starts. The manipulator's web build encodes a PNG per render, and the images are downloaded. On iOS (local files, native encoder) it should be much faster: **measure on a device**. If it's slow there, prepare photos in parallel (2 at a time), or store the camera / picker `width` / `height` with the photo to skip the first render (a new migration for `scan_photos`).
- **Camera on a device:** check orientation / EXIF on captured photos, the front-camera mirror, and flash behaviour.

**Security note (carried):** anything prefixed `EXPO_PUBLIC_` is compiled into the app bundle and can be extracted. A secret LLM-provider key must stay on a server, never in this app. Photos are sent as base64 in the detect request: the real endpoint must be HTTPS.

**Carry-over (verbatim from TODO.md):**
- `[ ] Manual on iPhone: camera + gallery → analyze → confirm → mood placeholder (no device reachable from this session; the same flow passed on the web preview via "Use demo photos")`
- `[ ] Manual: permission denied paths (on device; covered by flow tests, and the "Camera access" card was seen on the web preview)`
- Sprint 06's carry-over is still open too: `[ ] Manual smoke on Expo Go: onboarding → home → pantry → saved → kill + reopen (SQLite persistence) → reset demo data`

## Known issues / tech debt

- **Slow web image prep** → about 13 s for 6 remote demo photos on the web preview (see Sprint 09 handover) → measure on iOS; parallelise or store photo sizes if needed.
- **Hidden browser pane** (carried from Sprint 06) → while the agent's pane is hidden, gorhom sheets mount but don't animate up. During this sprint's smoke, both the Confirm "Add missed item" sheet and Pantry's "Add a staple" sheet stayed just below the screen. It's an environment artefact: the sheet mounts and `open` is true. The add-item flow is covered by the Jest flow test.
- **Expo Go usage strings** → Expo Go shows its own camera / photos permission text; the app's strings only appear in a development / EAS build.
- **`npm audit`** → the same 14 moderate transitive advisories as Sprint 06 (the three media packages added none).

## How to run / try what this sprint added

```bash
cd fridgechef-app
npm run web          # http://localhost:8081 → Home → "Scan now" → "Use demo photos" → Analyze
npm start            # Expo Go on an iPhone: the real camera + gallery (the carry-over)
npm test -- src/__tests__/scan-flow.test.tsx
npm test -- src/services/media
```

To see the error state, create a git-ignored `fridgechef-app/.env.local` containing `EXPO_PUBLIC_MOCK_FAILURE_RATE=1`, restart `npm run web`, then delete the file afterwards.

## Build verification pass

```
npm run verify   → PASS
  typecheck   tsc --noEmit: 0 errors
  lint        expo lint: 0 errors, 0 warnings
  tests       jest --ci: 23 suites, 314 tests passed
  ios export  "iOS Bundled ... (2183 modules)" → .verify-dist (no node:sqlite / createNodeDriver /
              test fixtures in the bundle)
  (earlier runs in this sprint caught a test-only type error, lint errors in the camera fake, a
   jest.mock out-of-scope variable and the Sprint 06 test still expecting the Scan placeholder;
   all fixed before this run)
npx expo-doctor      → PASS: 21/21 checks passed, no issues
npm run format:check → PASS
Manual smoke (web preview, 375 × 812, real SQLite in the browser, mock mode):
  - Home "Scan now" → /scan: "Ready" badge, flash, tip pill, scan brackets, "Camera access" card
    (no camera in the pane), demo chip, empty strip, "Analyze photos" disabled + helper text
  - "Use demo photos" → 6 thumbs, demo chip hidden at the cap, "Analyze 6 photos"
  - Analyze → /scan/analyzing: sweeping stack, "0 FOUND" + indeterminate bar, "Reading labels…";
    timed: reply at ~13.9 s (image prep of 6 remote photos + 0.9 s mock latency), "Scan complete"
    ~3 s later (12 chips × 230 ms), /scan/confirm ~1.1 s after that (900 ms advance)
  - Confirm: "12 items", "3 need a check · 9 look good", "Photo 2 looks blurry" + Retake, flagged
    cards first; "Looks right" ×3 → CTA "Check 2 items first" → "Check 1 item first" → "Confirm
    quantities"; Eggs unit switch 6 pcs → 300 g; From your pantry (25 staples, 25 switches)
  - "Confirm quantities" → /mood placeholder; back → Confirm still confirmed; full reload →
    photos, items, confirmation and warning read back from SQLite
  - EXPO_PUBLIC_MOCK_FAILURE_RATE=1 (temporary git-ignored .env.local, deleted afterwards):
    Analyze → "Couldn't scan your photos" + "Something went wrong on our side. Try again." +
    Try again / Back to camera; "Try again" re-runs the scan (Scanning → error again)
  - Not verified on web: the add-item sheet animating up (hidden pane, see Known issues; the
    flow is covered by scan-flow.test.tsx)
  - Found and fixed during the smoke: an extra render (a full PNG encode on web) per photo in
    prepareImage
Manual on Expo Go (iPhone): camera capture, gallery multi-pick, permission prompts / denied
  → NOT RUN: no device reachable from this session (carry-over)
```

## Environment notes

- Windows 11 Pro 10.0.26200, Node v24.19.0, npm 11.17.0.
- Expo SDK 57 (expo 57.0.26, expo-router 57.0.24); new: expo-camera 57.0.6, expo-image-picker 57.0.20, expo-image-manipulator 57.0.20.
- The browser pane was intermittently hidden during the smoke: screenshots timed out and sheets didn't animate. Text and DOM checks were used instead.
