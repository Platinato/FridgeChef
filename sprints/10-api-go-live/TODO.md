# Sprint 10 TODO - API go-live (BLOCKED until the user supplies the endpoint + key)

## Prerequisites from the user
- [ ] API base URL
- [ ] API key (goes only into `fridgechef-app/.env`)
- [ ] Auth style: header name + scheme
- [ ] API docs / sample responses (if any)

## Start
- [ ] Read `sprints/09-polish-qa/HANDBOOK.md` + `sprints/05-api-layer/HANDBOOK.md` ("How to go live")
- [ ] Read `INSTRUCTIONS.md`, `docs/API_GO_LIVE.md`, `reference/api-contract.md`
- [ ] Set Sprint 10 to "In progress" in `sprints/README.md`

## Tasks
- [ ] Fill `.env` (mode `http`, URL, key, header, scheme, timeout); never commit it
- [ ] Security check: the key is safe to ship in a client (else stop → recommend a proxy)
- [ ] `npm run api:smoke` live: record status / latency / Zod result per endpoint
- [ ] Save sanitised samples to `docs/api-samples/`
- [ ] Reconcile mismatches in `contract.ts` / `mappers.ts` / `endpoints.ts` only; update both contract docs + decisions
- [ ] Opt-in live contract test (`API_LIVE=1`)
- [ ] Device full loop in http mode + error paths (offline, wrong key, slow network)
- [ ] Document rollback (mode → `mock` = on-device mock database; `fridgechef.db` untouched)

## Verify
- [ ] `npm run verify` (mock mode) passes
- [ ] `npx expo-doctor`
- [ ] `npm run api:smoke` live passes
- [ ] Changed-file list confined to the API layer, tests and docs
- [ ] Key appears only in the git-ignored `.env` (`git grep --untracked`)

## Close
- [ ] `HANDBOOK.md` (live status, contract changes, samples, open issues; keys redacted)
- [ ] Status board: Sprint 10 Done
- [ ] Do NOT commit or push; leave changes uncommitted and list changed files in the handbook
