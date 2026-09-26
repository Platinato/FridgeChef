# Sprint 09 TODO - Polish, QA and release readiness

## Start
- [ ] Read `sprints/08-recipes-cook/HANDBOOK.md`
- [ ] Collect open known issues from handbooks 01-08 into the backlog below
- [ ] Read `INSTRUCTIONS.md` + the full mockup README
- [ ] Set Sprint 09 to "In progress" in `sprints/README.md`

## Carried-over backlog (fill in from previous handbooks)
- [ ] …

## Tasks
- [ ] Mockup regression pass (11 screens) + table in the handbook
- [ ] Content rules audit (strings, icons, images)
- [ ] Motion polish + Reduce Motion support
- [ ] Haptics (shutter, looks right, toggles, timer end)
- [ ] VoiceOver pass, slider adjustable actions, Dynamic Type, 44 pt, contrast
- [ ] Offline banner (netinfo) + retry UX + error boundary
- [ ] Full loop at 30% mock failure rate: no crash
- [ ] Database upgrade test (v1 → v2 keeps data; newer DB refused) + DB resilience (write-failure toast, reset, boot retry)
- [ ] expo-image everywhere, memoised rows, 60 fps sliders, bundle size recorded
- [ ] App icon + splash
- [ ] `eas.json` profiles (don't run cloud builds without the user's accounts)
- [ ] Seed images: bundle licensed assets or document dev-only remote URLs
- [ ] Web preview with SQLite: works, or documented limitation
- [ ] `fridgechef-app/README.md`
- [ ] `docs/API_GO_LIVE.md`
- [ ] Root `CLAUDE.md` updated
- [ ] Full-loop integration test (mock mode)

## Verify
- [ ] `npm run verify` passes
- [ ] `npx expo-doctor`
- [ ] `npm run api:smoke` (mock)
- [ ] Manual device full loop: normal + 30% failure
- [ ] VoiceOver spot check

## Close
- [ ] `HANDBOOK.md` (release readiness + open questions for the user)
- [ ] Status board: 09 Done, 10 stays Blocked
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
