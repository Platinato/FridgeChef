# Sprint 09 - Polish, QA and release readiness

## Before you start

1. Read `sprints/08-recipes-cook/HANDBOOK.md`. Collect every open "Known issues" item from handbooks 01-08; they are this sprint's backlog.
2. Read this file and all of `fridgechef-mockup/README.md`.

## Goal

A mock-mode app you'd be happy to put in front of testers:

- visually faithful to the mockup
- accessible, resilient and smooth
- configured for EAS builds
- with a precise go-live checklist ready for when the user supplies the API

## Tasks

1. **Mockup regression pass.** For each of the 11 screens in the mockup README table, compare the app with the mockup side by side and fix any drift: spacing, type, colours, radii, the ticket notches, the fades. Record a table in the handbook: screen → OK / fixed / deviation + reason.
2. **Content rules audit.** No "AI", no play icons, no em dashes, lime as the only accent. The automated content-rules test covers strings; also check icons and images by eye.
3. **Motion and haptics**
   - Motion: screen transitions, sheet spring, the DetectedChip pop, the scan sweep, the LiveBadge pulse, pressed scale.
   - Respect Reduce Motion (`AccessibilityInfo.isReduceMotionEnabled` / Reanimated `useReducedMotion`).
   - Light haptics: shutter, "Looks right", toggles, timer end.
4. **Accessibility**
   - VoiceOver pass on every screen: labels, roles, reading order.
   - Sliders expose `accessibilityValue` and adjustable actions.
   - Dynamic Type: cap scaling on display text, and let body text scale without clipping.
   - 44 pt targets.
   - Contrast check.
5. **Resilience**
   - Offline detection (`@react-native-community/netinfo`) with a small banner.
   - Query retry UX.
   - Every error path shows `toUserMessage`.
   - Mock failure injection (`EXPO_PUBLIC_MOCK_FAILURE_RATE=0.3`) for a full-loop run with no crashes and a clear retry everywhere.
   - An app-level error boundary with a friendly fallback + "Restart".
   - **Database upgrade test:** build a v1 database with data (Node driver), add a throwaway `0002` migration in the test, run `migrate`, and verify the data survives and `user_version` is 2. Also verify that a database newer than the app is refused cleanly.
   - **Database resilience:** a write failure shows the toast and keeps the UI consistent; "Reset demo data" works after a long session; the Retry on the boot error screen recovers.
6. **Performance**
   - Use `expo-image` for all remote images, with caching + a placeholder colour.
   - Memoise list rows; confirm slider dragging stays at 60 fps on device.
   - Check the JS bundle size in the `bundle:ios` output and record it.
7. **Assets and release config**
   - App icon: the lime logo disc on `#0A0A0A`.
   - Splash: a centred logo on `#0A0A0A`.
   - Confirm the app name and bundle id with the user, and record them as open questions if they're unanswered.
   - Create `eas.json` with `development` / `preview` / `production` profiles and document `eas build -p ios --profile preview` (it needs the user's Expo account and Apple credentials, so don't run it without them).
   - Replace or bundle the Unsplash images used by the seed modules. Either bundle licensed images under `assets/demo/` and point the seeds at them, or keep the remote URLs and document that they're for development only.
   - Web preview: record whether `npm run web` works with SQLite (wasm + COOP/COEP setup), or document it as a known limitation.
8. **Docs**
   - `fridgechef-app/README.md` covering: run, env, verify, mock mode, the demo-photos helper, data storage (the two SQLite files, migrations, reset), the architecture summary, and troubleshooting (e.g. "delete the app to wipe both databases").
   - **`fridgechef-app/docs/API_GO_LIVE.md`**: the exact checklist Sprint 10 executes (env values, smoke, contract tests, what may change, rollback = set mode back to `mock`, which reopens the on-device mock database; user data in `fridgechef.db` is unaffected either way).
   - Update the root `CLAUDE.md`.
9. **Test hardening**
   - Fill test gaps found during QA.
   - Add one integration test for the full loop in mock mode (onboarding skipped via a seeded Node-driver database → scan with demo photos → confirm → suggestions → recipe → cook → pantry updated).

## Acceptance criteria

- The regression table shows every screen OK, or a deviation with a documented reason.
- A full loop with a 30% mock failure rate completes with retries and no crash.
- VoiceOver can complete the full loop.
- `API_GO_LIVE.md` exists and is specific: it names the exact files, commands and env vars.

## Build verification pass

`npm run verify` + `npx expo-doctor` + `npm run api:smoke` (mock) + a manual device full loop (normal and 30% failure) + a VoiceOver spot check. Record everything in the handbook.

## End of sprint

Write the handbook with a release-readiness summary and open questions for the user (app name, bundle id, Apple account, API details). Update the status board: Sprint 10 stays **Blocked** until the user supplies the endpoint + key. Do not commit.
