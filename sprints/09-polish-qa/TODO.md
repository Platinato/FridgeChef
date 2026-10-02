# Sprint 09 TODO - Polish, QA and release readiness

## Start
- [x] Read `sprints/08-recipes-cook/HANDBOOK.md`
- [x] Collect open known issues from handbooks 01-08 into the backlog below
- [x] Read `INSTRUCTIONS.md` + the full mockup README
- [x] Set Sprint 09 to "In progress" in `sprints/README.md`

## Carried-over backlog (fill in from previous handbooks)
- [x] (01, 02, 03) Placeholder icon + splash → done (task "App icon + splash")
- [ ] (01) Placeholder bundle id `com.fridgechef.app` → open question for the user (handbook)
- [x] (01, 04, 05, 06, 07, 08) `npm audit`: 14 moderate transitive advisories → reviewed; two root advisories, no exploitable path, accepted (D60)
- [x] (02) ProgressBar fill isn't animated → eases over 300 ms now (D54)
- [ ] (03) Slider thumb alignment vs. the estimate tick on iOS → device check (carry-over)
- [x] (03) Glass variants have no backdrop blur (D21) → decided: keep translucent for v1 (D58); expo-blur is a later option
- [x] (04) No database encryption → documented in the README (Data storage)
- [x] (05) A changed seed module doesn't reach existing installs → documented in the README
- [x] (06) Web white flash before JS loads → `public/index.html` with the dark background
- [x] (06) `props.pointerEvents is deprecated` on web → traced to react-native-toast-message's AnimatedContainer (+ gorhom); web-only, harmless, documented
- [x] (06) Onboarding / seed images are remote Unsplash URLs → kept, documented as development only (task "Seed images")
- [ ] (07) Slow image prep on web (about 13 s for 6 remote photos) → documented; measure on device (carry-over)
- [x] (07) Expo Go shows its own permission strings → documented in the README
- [x] (08) Suggestions context row truncates → `ListRow` labels wrap, as in the mockup (D57)
- [x] (08) Long recipe titles at 62 pt → checked: "Butter Chicken Lite" wraps cleanly to 2 lines inside the gutters
- [ ] (08) Timer done while backgrounded has no alert (needs expo-notifications) → handover (out of scope for v1 polish)
- [ ] (06-08) Device checks still open: Expo Go smoke, camera / gallery / permissions, full loop (carry-over)

## Tasks
- [x] Mockup regression pass (11 screens) + table in the handbook
  - [x] Fixed: Mood section dividers, ListRow label wrap (Suggestions context row), Scan tip pill centring, row footer truncation ("Done cooking")
- [x] Content rules audit (strings, icons, images): the content-rules test is green; by eye across all 11 screens: no play icon (stopwatch only), no "AI", lime the only accent; the new icon / splash are the lime logo only
- [x] Motion polish + Reduce Motion support (stack fade under Reduce Motion; ProgressBar fill animation; loops already stop)
- [x] Haptics (shutter, looks right, toggles, timer end) via `components/haptics.ts`
- [x] VoiceOver pass, slider adjustable actions, Dynamic Type, 44 pt, contrast
  - [x] Code-level VoiceOver audit: every pressable has a role + label (scripted check); toasts announced
  - [x] `RangeSlider` adjustable (value + unit, step actions); Dynamic Type caps + `minHeight` controls; contrast test (AA)
  - [ ] On-device VoiceOver pass of the full loop (carry-over: no device)
- [x] Offline banner (netinfo) + retry UX + error boundary
- [x] Full loop at 30% mock failure rate: no crash (Jest, seeded; and on the web preview: 1 retry, completed)
  - [x] Found + fixed: Suggestions refetching under Recipe / Cook, and its empty state behind the stack (D56)
- [x] Database upgrade test (v1 → v2 keeps data; newer DB refused) + DB resilience (write-failure toast, reset, boot retry)
  - [x] A newer database now says "Update FridgeChef" on the boot screen
- [x] expo-image everywhere (`FallbackImage`; added this sprint: `cachePolicy="memory-disk"` + a `surface2` placeholder colour while loading; 150 ms fade), memoised rows (React Compiler + the explicit Confirm rows), bundle size recorded (5.5 MB Hermes bytecode, 6.8 MB export)
  - [ ] 60 fps slider dragging on a device (carry-over)
- [x] App icon + splash (`scripts/make-icons.ps1`; `ios.icon` → PNG; template `expo.icon` removed)
- [x] `eas.json` profiles (don't run cloud builds without the user's accounts)
- [x] Seed images: bundle licensed assets or document dev-only remote URLs (documented as dev-only)
- [x] Web preview with SQLite: works, or documented limitation (works; documented in the README)
- [x] `fridgechef-app/README.md`
- [x] `docs/API_GO_LIVE.md`
- [x] Root `CLAUDE.md` updated
- [x] Full-loop integration test (mock mode) + the seeded 30% failure run

## Verify
- [x] `npm run verify` passes
- [x] `npx expo-doctor`
- [x] `npm run api:smoke` (mock)
- [ ] Manual device full loop: normal + 30% failure (no device; both ran on the web preview + in Jest)
- [ ] VoiceOver spot check (no device; code-level audit + tests instead)

## Close
- [x] `HANDBOOK.md` (release readiness + open questions for the user)
- [x] Status board: 09 Done with carry-over (device checks), 10 stays Blocked
- [x] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
