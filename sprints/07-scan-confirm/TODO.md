# Sprint 07 TODO - Scan → Analyzing → Confirm

## Start
- [x] Read `sprints/06-shell-core-screens/HANDBOOK.md`
- [x] Read `INSTRUCTIONS.md` + mockup README rows 3-5; click through the mockup flows (read `js/screens/{Scan,Analyzing,Confirm}.js`, the `app.js` actions and `screens.css`)
- [x] Set Sprint 07 to "In progress" in `sprints/README.md`

## Tasks
- [x] expo-camera + expo-image-picker plugins with iOS usage strings; denied states
  - [x] `npx expo install expo-camera expo-image-picker expo-image-manipulator` (57.0.6 / 57.0.20 / 57.0.20)
  - [x] Plugins in `app.config.ts`: no microphone, no barcode scanner, Android `RECORD_AUDIO` off
  - [x] First visit asks once; "Camera access" card (Allow camera / Choose from gallery); denied for good → "Camera is off" (Open Settings / Choose from gallery); mount error → "Camera unavailable"
- [x] `services/media/prepareImage.ts` (≤1280 px, JPEG 0.7, base64) + tests
  - [x] `resizeTarget` / `fittedSize` maths (never upscales, unknown size = leave alone)
  - [x] One render when the photo already fits (web encodes a PNG per render)
  - [x] `prepareImages` (sequential, abortable) + `services/media/pickPhotos.ts`
- [x] ScanScreen: camera, overlay, top bar, tip, warnings + Retake, thumb strip, shutter/flash/flip, gallery multi-pick, cap toast
  - [x] Retake replaces that photo (new camera shot, or a gallery pick when the camera is off): `markRetaken(id, uri?)`
  - [x] Capture flash (0.95 → 0, 420 ms; off with Reduce Motion); camera paused while not focused
- [x] "Use demo photos" chip (mock mode only, via `listDemoPhotos()`)
  - [x] Behind a `useDemoPhotos()` query hook (`services/queries`), so the screen doesn't call the API module
- [x] "Analyze N photos" CTA (text only) + disabled state
- [x] AnalyzingScreen: prepare → mutate → store; staggered reveal; auto-advance; skip; abort on leave; error state
  - [x] `useDetectIngredients().detect(input, { signal })`; an aborted call writes nothing; `isCancelled` / `errorMessageOf`
  - [x] Indeterminate `ProgressBar` (new `indeterminate` prop) until the reply arrives
  - [x] "No photos yet" state for a direct visit
- [x] ConfirmScreen: summary, warnings banner, sorted QuantitySliders, add-item sheet, pantry section, gate CTA → confirmScan → /mood
- [x] Empty detection state
- [x] Slider list performance (memo, no writes while dragging)
- [x] Tests (prepareImage, scan cap, analyzing success/failure, confirm gate, units, add/remove, staple toggle)
  - [x] `src/services/media/__tests__/prepareImage.test.ts` (13)
  - [x] `src/__tests__/scan-flow.test.tsx` (15): scan ×6, analyzing ×3 (incl. abort), confirm ×6
  - [x] `primitives.test.tsx`: indeterminate ProgressBar

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
- [ ] Manual on iPhone: camera + gallery → analyze → confirm → mood placeholder (no device reachable from this session; the same flow passed on the web preview via "Use demo photos")
- [ ] Manual: permission denied paths (on device; covered by flow tests, and the "Camera access" card was seen on the web preview)
- [x] Manual: mock failure rate 1 → error UI, retry works (web preview with a temporary git-ignored `.env.local`, since deleted)

## Close
- [x] `HANDBOOK.md` (warnings flow, device quirks)
- [x] Update the status board + decisions
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
