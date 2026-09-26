# Sprint 07 TODO - Scan → Analyzing → Confirm

## Start
- [ ] Read `sprints/06-shell-core-screens/HANDBOOK.md`
- [ ] Read `INSTRUCTIONS.md` + mockup README rows 3-5; click through the mockup flows
- [ ] Set Sprint 07 to "In progress" in `sprints/README.md`

## Tasks
- [ ] expo-camera + expo-image-picker plugins with iOS usage strings; denied states
- [ ] `services/media/prepareImage.ts` (≤1280 px, JPEG 0.7, base64) + tests
- [ ] ScanScreen: camera, overlay, top bar, tip, warnings + Retake, thumb strip, shutter/flash/flip, gallery multi-pick, cap toast
- [ ] "Use demo photos" chip (mock mode only, via `listDemoPhotos()`)
- [ ] "Analyze N photos" CTA (text only) + disabled state
- [ ] AnalyzingScreen: prepare → mutate → store; staggered reveal; auto-advance; skip; abort on leave; error state
- [ ] ConfirmScreen: summary, warnings banner, sorted QuantitySliders, add-item sheet, pantry section, gate CTA → confirmScan → /mood
- [ ] Empty detection state
- [ ] Slider list performance (memo, no writes while dragging)
- [ ] Tests (prepareImage, scan cap, analyzing success/failure, confirm gate, units, add/remove, staple toggle)

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor`
- [ ] Manual on iPhone: camera + gallery → analyze → confirm → mood placeholder
- [ ] Manual: permission denied paths
- [ ] Manual: mock failure rate 1 → error UI, retry works

## Close
- [ ] `HANDBOOK.md` (warnings flow, device quirks)
- [ ] Update the status board + decisions
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
