# Sprint 07 - Scan → Analyzing → Confirm quantities

## Before you start

1. Read `sprints/06-shell-core-screens/HANDBOOK.md`.
2. Read this file and `fridgechef-mockup/README.md` → Screen reference rows 3-5.
3. Click through the mockup: `#/scan` (shutter, "+" picker, remove, Retake), `#/analyzing`, `#/confirm` (drag sliders, unit switch, "Looks right", add item, pantry toggles).

## Goal

The core capture flow on real device APIs, with detection served by the API seam (MockApi today). **The Confirm screen is a hard gate:** no suggestions until every low-confidence item is confirmed.

## Tasks

1. **Permissions and config**
   - Add the `expo-camera` and `expo-image-picker` config plugins with iOS usage strings:
     - camera: "FridgeChef uses the camera to photograph your fridge and pantry."
     - photos: "FridgeChef lets you pick photos of your fridge and pantry."
   - Denied-permission states offer "Open Settings" (`Linking.openSettings()`) and the gallery alternative.
2. **Media prep** (`services/media/prepareImage.ts`)
   - Use `expo-image-manipulator` to resize to at most 1280 px on the long edge, JPEG 0.7, base64 output.
   - Returns `{ id, mimeType, data, width, height }`.
   - Unit-test the resize-target maths (mock the manipulator).
3. **ScanScreen**
   - A full-screen `CameraView` with `ScanOverlay` brackets.
   - Overlay top bar: back, `LiveBadge` "Ready", flash toggle (lime when on).
   - The tip pill "Open the door wide · Good light · Multiple angles".
   - A bottom panel:
     - any photo warnings from the last detection (InfoCard alert "Photo N looks blurry" + "Retake")
     - the `PhotoThumbStrip` (max 6, remove ×, "+" opens the gallery picker)
     - controls: last-photo gallery button, `ShutterButton` (disabled at 6), flip camera
   - The capture flash animation.
   - The gallery uses `expo-image-picker` with `allowsMultipleSelection` and `selectionLimit = 6 - count`; show a toast when capped.
   - **Mock-mode helper:** when `config.API_MODE === 'mock'`, add a small "Use demo photos" chip that adds the images from `listDemoPhotos()` (`services/api/index.ts`, read from the mock database), so the flow is testable without a camera or simulator.
   - CTA **"Analyze N photos"** (text only). It is disabled at 0 photos, with the helper text "Take or upload at least one photo to continue."
4. **AnalyzingScreen**
   - On mount: prepare images → `useDetectIngredients().mutate` → the result is written to `scanStore.setDetection`.
   - UI:
     - `PhotoStack` with a sweeping overlay
     - `LiveBadge` "Scanning" ("Scan complete" when done)
     - "N / M FOUND" counter + ProgressBar
     - `DetectedChip`s revealed one by one (~230 ms stagger) after the response arrives; show an indeterminate state until then
     - a caption
   - Auto-advance to `/scan/confirm` about 900 ms after the reveal completes. "Skip" jumps there directly once data exists.
   - The mutation is abortable when leaving the screen.
   - Error state: `EmptyState` with `toUserMessage(err)` + "Try again" / "Back to camera".
   - Test it with `EXPO_PUBLIC_MOCK_FAILURE_RATE=1`.
5. **ConfirmScreen** ("Confirm / QUANTITIES")
   - Top bar: back, `CounterPill` "N items", + (add item).
   - Explainer copy.
   - Summary badges: "N need a check" (alert) and "N look good".
   - A photo-warning banner if detection returned warnings; "Retake" routes back to Scan.
   - A `QuantitySlider` per item, sorted low → med → high → manual:
     - drag → `setQty` on release (`onChanging` updates only the local value)
     - stepper, unit switch, remove (toast), "Looks right"
   - "Add missed item" Sheet: SearchField + `catalog.addableItems` chips; adds a manual item.
   - Collapsible "From your pantry" section: `PantryItem` toggles, the "Auto-included · you don't need to scan these." copy, and an InfoCard + toggle when auto-include is off.
   - The sticky CTA shows "Check N items first" (disabled) until `pendingChecks` is empty, then "Confirm quantities" → `confirmScan()` (sets `lastScan`) → `/mood`.
   - If detection is empty: EmptyState "Nothing found" + "Back to camera".
6. **Performance.** The slider list must stay smooth: memoised rows, and no store writes while dragging.
7. **Tests**
   - `prepareImage` maths.
   - Scan: the photo cap, and "Analyze" disabled at 0.
   - Analyzing: success → navigates; failure → error UI.
   - Confirm:
     - the gate (disabled until low items are confirmed)
     - unit switch shows converted values (eggs 6 pcs → 300 g)
     - add / remove item
     - a staple toggle affects the `useKitchen` result

## Out of scope

Mood → cook (Sprint 08).

## Acceptance criteria

- On an iPhone (Expo Go):
  1. take 2 photos plus pick 1 from the gallery
  2. Analyze
  3. confirm the flagged items
  4. land on the Mood placeholder
- In mock mode with no camera, the same flow works via "Use demo photos".
- Detection goes only through `useDetectIngredients` → `getApi()` (the architecture guard test is green).

## Build verification pass

`npm run verify` + `npx expo-doctor`. Run the manual flows above on a device and record the results, including permission-denied behaviour.

## End of sprint

Write the handbook, including how warnings flow from detection to UI and any device quirks. Update the status board and decisions. Do not commit.
