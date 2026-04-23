# Implementation Plan: Slice 19C — Load and Performance Testing

**Spec reference:** `SPEC.md` §Slice 19C (lines 1199–1369)
**Size:** XL
**Estimated tasks:** 16 tasks across 8 phases
**Prerequisite:** Slice 19 must be merged before building 19C. Independent of 19B. Plan can be written now.

---

## Overview

Stand up an isolated performance environment and run four Artillery scenarios against it: REST CRUD, WebSocket fan-out, automation burst, and concurrent file upload. Produce a reproducible markdown report with p50/p95/p99 metrics, flag >10% regressions vs. a manually-approved baseline, and enforce pass/fail SLOs for the non-latency invariants (cache hit rate, DB pool health, WS connect success, file upload quota integrity). Zero risk to dev or production data — hard boundary.

## Architecture Decisions

- **Tool:** Artillery (Socket.io v4 first-class support is decisive). ADR in `SPEC.md` §Slice 19C.
- **Environment isolation:** `NODE_ENV=perf` branch + dedicated `crm_perf` database (same Postgres container, different DB) + Redis logical DB 1. Guarded by runtime checks that refuse to start if connection strings point at `crm` or any name containing `production`/`staging`.
- **Seed reproducibility:** Fixed `PERF_SEED=42`. Seeder is idempotent — re-running skips work if row counts match expected.
- **Regression gate:** Flag-only for the first three runs. Upgrade to tiered enforcement (p50 flag, p95/p99 fail) only after 3 stable baselines exist.
- **Baseline update:** Manual via `make e2e:perf:set-baseline`. Never auto-updated.
- **Build mode:** Compiled `node dist/server.js`, not `ts-node-dev`. Matches production runtime profile.
- **No frontends in perf:** backend-only load test; the 10 industry frontends are not started.

---

## Dependency Graph

```
Phase A — Backend perf config + safety guards
           │
           ▼
Phase B — Perf seeder (small → scaled to 1.5M column values)
           │
           ▼
Phase C — Docker perf profile (resource limits, isolated DB + Redis db 1)
           │
           ▼
Phase D — Artillery infrastructure (directory, common.yml, fixtures)
           │
           ▼
Phase E — Scenarios (REST → WebSocket → Automation → File upload)
           │
           ▼
Phase F — Orchestrator + report (run.ts, report.ts, regression diff)
           │
           ▼
Phase G — Make targets (5 e2e:perf* recipes)
           │
           ▼
Phase H — Verification (3-run reproducibility + dev-DB untouched audit + first baseline capture)
```

---

## Task List

### Phase A — Backend Perf Config + Safety Guards

Goal: `NODE_ENV=perf` activates a distinct config branch (perf-mode middleware gates, Redis db 1, compiled server) while hard-refusing any attempt to touch the dev/prod database.

---

#### Task A1: `NODE_ENV=perf` config branch + middleware gates

**RED test:** Jest integration — boot Express with `NODE_ENV=perf`, assert morgan logger NOT registered, debug endpoints (`/api/v1/admin/e2e/reset`) return 404, error handler is the production variant (no stack trace in response body).

**Files:**
- `backend/src/config/perf.ts` (new — exports `isPerfMode()`, `perfDatabaseName`, `perfRedisDb`)
- `backend/src/config/index.ts` (modify — add `perf` branch: logLevel='error', requestLogging=false, debugEnabled=false)
- `backend/src/app.ts` (modify — gate morgan + debug routes on `!isPerfMode()`)
- `backend/src/__tests__/config/perf-mode.test.ts` (new)

**Acceptance:**
- [ ] `isPerfMode()` returns true only when `process.env.NODE_ENV === 'perf'`
- [ ] morgan / dev logger not mounted in perf mode
- [ ] Admin + debug routes return 404 in perf mode (defense in depth; perf runs should never reset data)
- [ ] Error handler returns generic 500 body (no stack traces) in perf mode

**Verify:** `cd backend && npm test -- perf-mode`
**Dependencies:** Slice 19 complete
**Size:** S (4 files)

---

#### Task A2: `crm_perf` database config branch

**RED test:** Unit test — import `getDatabaseConfig()` with `NODE_ENV=perf`; assert returned config has `database: 'crm_perf'` and connection pool max=20 (perf profile tunes pool independently from dev's defaults).

**Files:**
- `backend/src/config/database.ts` (modify — branch on `isPerfMode()` to return perf DB config)
- `backend/src/__tests__/config/database-perf.test.ts` (new)

**Acceptance:**
- [ ] `NODE_ENV=perf` → `database: 'crm_perf'`, `pool.max: 20`, `logging: false`
- [ ] `NODE_ENV=development` → unchanged (`crm_platform`, default pool)
- [ ] `NODE_ENV=production` → unchanged (guards future)
- [ ] Migrations target the perf DB when run with `NODE_ENV=perf` (inferred from sequelize-cli config)

**Verify:** `cd backend && npm test -- database-perf`
**Dependencies:** A1
**Size:** XS (2 files)

---

#### Task A3: Hard safety guard — refuse any non-`crm_perf` connection under `NODE_ENV=perf`

**RED test:** Start backend with `NODE_ENV=perf` but `DB_NAME=crm_platform` override. Process exits within 2s with stderr `"Refusing to start: NODE_ENV=perf must target crm_perf database, got crm_platform"`. Also test: start with `DB_NAME=crm_production` → same refusal. Also test: `NODE_ENV=production` with any `REDIS_DB=1` → ignored (perf-DB check only fires in perf mode).

**Files:**
- `backend/src/config/safety-guards.ts` (new — export `assertPerfIsolation()` called by server bootstrap)
- `backend/src/server.ts` (modify — call `assertPerfIsolation()` before `app.listen()`)
- `backend/src/__tests__/config/safety-guards.test.ts` (new)

**Acceptance:**
- [ ] Guard fires ONLY when `NODE_ENV=perf`
- [ ] Exits non-zero with clear message if DB name doesn't start with `crm_perf`
- [ ] Exits non-zero if Redis DB index is not 1
- [ ] Exits non-zero if hostname matches `/production|staging|prod\./i`
- [ ] Does NOT fire in dev, test, or production modes

**Verify:** `cd backend && npm test -- safety-guards`
**Dependencies:** A1, A2
**Size:** S (3 files)

---

### Checkpoint: Phase A Complete
- [ ] Backend boots in `NODE_ENV=perf` with correct gates
- [ ] Safety guard refuses misconfiguration
- [ ] `cd backend && npx tsc --noEmit` clean

---

### Phase B — Perf Seeder

Goal: Deterministic seed of 1 workspace × 1000 boards × 100 items × 15 columns = 1.5M column values, idempotent, runs in under 5 min.

---

#### Task B1: `seed-perf.ts` smoke version — 10 boards

**RED test:** Run `npm run seed:perf -- --boards=10`; assert exactly 1 perf workspace exists with 10 boards, 1000 items (10 × 100), and 15,000 column values (10 × 100 × 15). Re-running with same flag produces same counts (idempotency).

**Files:**
- `backend/src/scripts/seed-perf.ts` (new — accepts `--boards=N` for smoke; defaults to full 1000)
- `backend/package.json` (modify — add `"seed:perf": "NODE_ENV=perf ts-node src/scripts/seed-perf.ts"`)
- `backend/src/__tests__/scripts/seed-perf-smoke.test.ts` (new — runs against a test DB with 10-board flag)

**Acceptance:**
- [ ] Fixed `PERF_SEED=42` drives all random generators (seedrandom library or similar)
- [ ] Single workspace named `perf-workspace` with fixed UUID
- [ ] Idempotent: detects existing perf workspace by name and skips re-creation if row counts match
- [ ] `bulkCreate` used for items and column values (not per-row INSERT)
- [ ] Reports elapsed time per table to stderr

**Verify:** `cd backend && npm test -- seed-perf-smoke`
**Dependencies:** A2 (crm_perf DB exists)
**Size:** S (3 files)

---

#### Task B2: `seed-perf.ts` full scale — 1.5M column values

**RED test:** Run `npm run seed:perf` (no flag); assert exactly 1000 boards, 100000 items, 1500000 column values in `crm_perf`. Elapsed time < 5 min on standard hardware. Re-run produces zero additional rows (idempotency).

**Files:**
- `backend/src/scripts/seed-perf.ts` (modify — remove `--boards` default smoke cap, add 5000-row batching and parallel-per-table inserts where FK allows)
- `backend/src/__tests__/scripts/seed-perf-scale.test.ts` (new — uses smaller scale factor via env var for CI, asserts scaling math)

**Acceptance:**
- [ ] Batch size 5000 for bulkCreate
- [ ] Transactions scoped per-batch (not one giant transaction)
- [ ] Column values seeded per handler-type distribution (realistic mix of Status/Text/Number/etc per SPEC)
- [ ] Peak memory usage under 512 MB (measured via `process.memoryUsage()`)
- [ ] Progress log every 100 boards
- [ ] Runs on commodity dev hardware in < 5 min

**Verify:** Manual: `NODE_ENV=perf npm run seed:perf` against an empty crm_perf DB; automated: `cd backend && npm test -- seed-perf-scale` (uses scale factor 0.01 for CI speed)
**Dependencies:** B1
**Size:** S (2 files)

---

### Checkpoint: Phase B Complete
- [ ] Full seeder produces exactly 1.5M column values
- [ ] Re-run is a no-op (idempotent)
- [ ] Runtime < 5 min

---

### Phase C — Docker Perf Profile

Goal: isolated compose overlay with production-like resource limits; backend runs compiled JS; no frontends started.

---

#### Task C1: `docker-compose.perf.yml` with resource limits

**RED test:** `docker compose -f docker-compose.yml -f docker-compose.perf.yml config` succeeds. Running `docker compose -f docker-compose.yml -f docker-compose.perf.yml up backend` starts only backend + postgres + redis (no industry frontends). `docker stats` on the running backend shows CPU limit 1.0 and memory limit 1 GB.

**Files:**
- `docker-compose.perf.yml` (new)

**Acceptance:**
- [ ] `deploy.resources.limits`: backend 1 CPU / 1 GB, postgres 2 CPU / 2 GB, redis 0.5 CPU / 256 MB
- [ ] Overrides backend `command` to `npm run build && node dist/server.js` (compiled)
- [ ] Sets `NODE_ENV=perf`, `DB_NAME=crm_perf`, `REDIS_DB=1` on backend env
- [ ] Explicitly `profiles: [perf]` so compose ignores it in default `up`
- [ ] Frontends excluded (either omitted or placed in conflicting non-perf profile)

**Verify:** `docker compose -f docker-compose.yml -f docker-compose.perf.yml --profile perf config | yq '.services | keys'` shows only `postgres`, `redis`, `backend`
**Dependencies:** A3 (safety guard must be in place before the perf profile can activate)
**Size:** XS (1 file)

---

### Checkpoint: Phase C Complete
- [ ] Perf profile starts successfully with resource limits enforced
- [ ] Backend runs compiled JS, not ts-node
- [ ] `/health` returns 200 from the perf backend

---

### Phase D — Artillery Infrastructure

Goal: `e2e/perf/` directory scaffolded, common Artillery config defined, shared fixtures (auth, 5 MB payload) ready.

---

#### Task D1: `e2e/perf/` directory scaffold

**RED test:** `cd e2e/perf && npx tsc --noEmit` passes with an empty project (no files to compile yet — succeeds vacuously but proves tsconfig is valid). `npm install` succeeds.

**Files:**
- `e2e/perf/package.json` (new — deps: `artillery@^2.0.x`, `@types/node`, typescript; NO global artillery install — local only)
- `e2e/perf/tsconfig.json` (new — strict, target ES2022, outDir `dist`)
- `e2e/perf/.gitignore` (new — `node_modules/`, `results/{ISO-timestamp}.md`, `dist/`)

**Acceptance:**
- [ ] Artillery 2.x pinned (socketio-v3 engine available in 2.x)
- [ ] `cd e2e/perf && npm install` succeeds
- [ ] `.gitignore` excludes run outputs but NOT `results/baseline.md` (baseline committed)
- [ ] Type-check passes

**Verify:** `cd e2e/perf && npm install && npx tsc --noEmit`
**Dependencies:** None (can run in parallel with Phase C)
**Size:** XS (3 files)

---

#### Task D2: `common.yml` + `fixtures.ts` (shared Artillery config + payload helpers)

**RED test:** Unit — import `generate5MbPayload()` from fixtures, assert returned Buffer.length === 5_242_880 (5 MiB exactly), and calling it twice returns deterministically identical bytes (seeded). Separately, `artillery run --dry common.yml` (via an empty test scenario) parses cleanly.

**Files:**
- `e2e/perf/artillery/common.yml` (new — defines HTTP keep-alive, Socket.io engine pointer, target base URL variable)
- `e2e/perf/lib/fixtures.ts` (new — `generate5MbPayload()`, `getAuthToken()` helper that calls backend login once and caches token, `pickRandomBoard(seed)` deterministic selection)
- `e2e/perf/lib/__tests__/fixtures.test.ts` (new)

**Acceptance:**
- [ ] 5 MB payload is deterministic across calls (fixed seed + prebuilt buffer)
- [ ] `getAuthToken` caches the token in-module so repeated calls don't hammer `/auth/login`
- [ ] `common.yml` defines `processor: lib/fixtures.js` so Artillery YAML can call TS helpers (compiled to JS at run time)
- [ ] `pickRandomBoard` uses seeded PRNG so the same VU hits the same board across scenario runs

**Verify:** `cd e2e/perf && npm test -- fixtures && npx artillery run --dry artillery/common.yml`
**Dependencies:** D1
**Size:** S (3 files)

---

### Checkpoint: Phase D Complete
- [ ] `e2e/perf/` project installs and type-checks
- [ ] Fixtures return deterministic 5 MB payload
- [ ] Auth token acquisition works against perf backend

---

### Phase E — Scenarios (one per task)

Goal: each scenario is a single Artillery YAML plus a validation test that proves it exercises the intended code paths.

---

#### Task E1: Scenario (a) — REST mixed CRUD

**RED test:** Run `artillery run scenario-a-rest.yml -o /tmp/a.json` against the perf backend for 30 seconds (reduced duration via env var for test speed). Parse the JSON output; assert: GET/POST/DELETE all present with 60/30/10 distribution within 5% tolerance, p99 recorded, zero 5xx errors.

**Files:**
- `e2e/perf/artillery/scenario-a-rest.yml` (new — 100 RPS, 50 VUs, 10-min sustained phase)
- `e2e/perf/artillery/__tests__/scenario-a.test.ts` (new — spawns short-duration run, validates JSON output shape)

**Acceptance:**
- [ ] Phases: warmup 30s ramp to 100 RPS, sustain 10 min at 100 RPS
- [ ] Request mix enforced by `weight`: 60% reads (`GET /items?boardId`, `GET /boards/:id`), 30% writes (`POST /items`, `PATCH /column-values`), 10% deletes
- [ ] Each VU picks a random board from seeded data at session start and reuses it
- [ ] Redis cache hit rate captured via custom metric emitted from fixtures.ts after each request
- [ ] Test uses `PERF_SHORT_RUN=1` env var to override phase durations (keeps CI fast)

**Verify:** `cd e2e/perf && npm test -- scenario-a`
**Dependencies:** D2, B2, C1
**Size:** S (2 files)

---

#### Task E2: Scenario (b) — WebSocket fan-out

**RED test:** Run scenario-b with 50 clients and 60-second sustain (short-run env). Parse JSON; assert: all 50 clients successfully connected (zero connect errors), `item:updated` events received by all clients, p95 fan-out latency recorded under a relaxed threshold (1s — real 200ms target validated at full 500-client scale).

**Files:**
- `e2e/perf/artillery/scenario-b-websocket.yml` (new — `engine: socketio-v3`, 500 clients ramping over 60s, sustain 5 min, publisher emits 2 events/sec)
- `e2e/perf/artillery/__tests__/scenario-b.test.ts` (new)

**Acceptance:**
- [ ] Uses `engine: socketio-v3` (Artillery plugin) — compatible with Socket.io v4 server
- [ ] Publisher client is a separate scenario flow in the same YAML, emits `item:updated`
- [ ] Subscriber clients record `receivedAt - publishedAt` delta via custom fixture function
- [ ] Connection failures fail the pass/fail SLO (integrated by F2 later)
- [ ] Short-run test variant reduces to 50 clients / 60s for CI

**Verify:** `cd e2e/perf && npm test -- scenario-b`
**Dependencies:** E1 (scenario pattern validated)
**Size:** S (2 files)

---

#### Task E3: Scenario (c) — Automation burst

**RED test:** Fire a burst of 10 `POST /items` calls (short-run) against a board with 4 automation rules. Within 30s, query `AutomationLog` — assert 40 rows present (10 × 4). Latency between first POST and last log row recorded.

**Files:**
- `e2e/perf/artillery/scenario-c-automation.yml` (new — 100-item burst in 5 seconds at full scale)
- `e2e/perf/artillery/__tests__/scenario-c.test.ts` (new — short-run burst + DB assertion)

**Acceptance:**
- [ ] Burst phase uses `arrivalCount: 100, duration: 5` (not RPS — explicit burst semantics)
- [ ] Each POST targets one of the seeded boards that has 4 active automation rules (seed in B2 must include these)
- [ ] Test asserts `AutomationLog` row count equals expected × 4
- [ ] Queue depth peak captured via custom metric (query Redis BullMQ key during run)
- [ ] Drain window 30s after burst to let async automations complete

**Verify:** `cd e2e/perf && npm test -- scenario-c`
**Dependencies:** E1
**Size:** S (2 files)

---

#### Task E4: Scenario (d) — Concurrent file upload + quota integrity

**RED test:** Run 10 concurrent 5 MB uploads (short-run) against a workspace with 40 MB quota (allows 8 uploads, rejects last 2). Assert exactly 8 files persisted, 2 rejected with HTTP 413, no partial writes (uploaded file sizes all = 5 MB), quota sum = 40 MB.

**Files:**
- `e2e/perf/artillery/scenario-d-file-upload.yml` (new — 50 concurrent uploads at full scale, workspace quota 200 MB)
- `e2e/perf/artillery/__tests__/scenario-d.test.ts` (new — short-run + quota integrity DB check)

**Acceptance:**
- [ ] All uploads use deterministic 5 MB payload from fixtures
- [ ] Workspace quota configured via API or seed override before scenario starts
- [ ] Post-run integrity check: file rows in DB match actual files on disk (no orphans, no partials)
- [ ] Quota rejection count matches math: `floor(quota / 5MB)` successful, rest rejected with 413
- [ ] No request timeouts (50 concurrent should complete within scenario duration)

**Verify:** `cd e2e/perf && npm test -- scenario-d`
**Dependencies:** E1
**Size:** S (2 files)

---

### Checkpoint: Phase E Complete
- [ ] All four scenarios pass their short-run validation tests
- [ ] Each emits parseable Artillery JSON
- [ ] Redis cache hit rate and DB pool metrics captured in at least one scenario

---

### Phase F — Orchestrator + Report

Goal: single command runs warmup + 4 scenarios + teardown, aggregates JSON into markdown with regression diff.

---

#### Task F1: `run.ts` orchestrator

**RED test:** Call `run.ts` with `--scenarios=a,c --short` flag; assert: runs warmup (observable via cache primed log), runs scenarios a and c sequentially, each emits JSON to `results/`, final summary prints exit 0.

**Files:**
- `e2e/perf/run.ts` (new — imports Artillery programmatic API, runs warmup + scenarios in sequence, prunes older runs beyond 10)
- `e2e/perf/__tests__/run.test.ts` (new — uses short-run flag to validate orchestration without full duration)

**Acceptance:**
- [ ] Warmup (2 min) primes Redis cache with 100 random `GET /boards/:id` then establishes HTTP pool
- [ ] Scenarios run strictly sequentially (no concurrent load)
- [ ] Each scenario's Artillery JSON written to `results/{ISO-timestamp}-{scenario}.json`
- [ ] After all scenarios, invokes `report.ts` to render markdown
- [ ] Prunes `results/*.md` and `results/*.json` older than the last 10 runs (baseline.md exempt)
- [ ] Handles SIGINT: aborts current scenario cleanly, runs teardown, exits 130

**Verify:** `cd e2e/perf && npm test -- run`
**Dependencies:** E1–E4
**Size:** S (2 files)

---

#### Task F2: `report.ts` markdown renderer + regression diff

**RED test:** Feed synthetic scenario JSONs into `renderReport(jsons, baselinePath)`. Assert output contains: run metadata section, SLO table with measured vs. target, regression diff with ▲/▼ arrows on >10% changes, flag-only behavior (no non-zero exit even when regressions present). Pass/fail SLOs (cache hit, DB pool, WS connect, file quota) DO exit non-zero when violated.

**Files:**
- `e2e/perf/lib/report.ts` (new — pure function `renderReport(results, baseline, meta)`)
- `e2e/perf/results/baseline.md` (new — empty initial file with `# Perf Baseline` heading and "no baseline yet" placeholder)
- `e2e/perf/lib/__tests__/report.test.ts` (new — snapshot-style tests with fixture JSONs)

**Acceptance:**
- [ ] Markdown includes: commit SHA, node version, host CPU/RAM, date, per-scenario p50/p95/p99
- [ ] Regression calc: `(current - baseline) / baseline * 100`; flag if abs > 10%
- [ ] Flag-only for latency metrics (report only, no exit change)
- [ ] Pass/fail SLOs cause non-zero exit: cache hit < 80%, DB pool exhaustion event, WS connect count < 500, file upload quota mismatch
- [ ] Raw JSON paths linked at bottom of report
- [ ] Baseline.md absent → first run writes "No baseline — run `make e2e:perf:set-baseline` after 3 stable runs"

**Verify:** `cd e2e/perf && npm test -- report`
**Dependencies:** F1
**Size:** S (3 files)

---

### Checkpoint: Phase F Complete
- [ ] Full short-run (`npm run run -- --short`) completes end-to-end with markdown report emitted
- [ ] Regression flags appear correctly against a synthetic baseline
- [ ] Pass/fail SLOs exit non-zero when violated

---

### Phase G — Make Targets

---

#### Task G1: `Makefile` perf targets

**RED test:** `make -n e2e:perf` prints expected command sequence: compose up (perf profile) → wait-on health → seed-perf → run.ts → teardown. Each subtarget's dry-run prints correct commands.

**Files:**
- `Makefile` (modify — append 5 perf targets below existing e2e targets)

**Acceptance:**
- [ ] `make e2e:perf` — full happy path; teardown guaranteed via `trap`
- [ ] `make e2e:perf:seed-only` — brings up perf stack, runs seed-perf, leaves stack running (dev debug)
- [ ] `make e2e:perf:scenario NAME=a` — runs single scenario against already-running stack; refuses unknown NAME values
- [ ] `make e2e:perf:set-baseline` — prompts for confirmation (`[y/N]`), copies latest result to baseline.md, commits nothing (user commits manually)
- [ ] `make e2e:perf:teardown` — stops perf profile, drops `crm_perf` DB, flushes Redis db 1
- [ ] `make -n e2e:perf` is parseable and correct

**Verify:** `make -n e2e:perf` and `make -n e2e:perf:teardown`
**Dependencies:** F1
**Size:** XS (1 file)

---

### Checkpoint: Phase G Complete
- [ ] All 5 targets work against a clean checkout
- [ ] `make e2e:perf` completes within 30-min cap

---

### Phase H — Verification

---

#### Task H1: 3-run reproducibility audit + dev-DB-untouched audit + first baseline

**RED test:** Three assertions in one task:
1. Run `make e2e:perf` three times consecutively; parse each markdown report; assert p50/p95/p99 values of scenario (a) differ by < 10% across runs (reproducibility).
2. Record `crm_platform` row counts on `users`, `workspaces`, `items` before and after all three runs; assert zero delta (dev DB untouched).
3. Copy the median run's report to `baseline.md` via `make e2e:perf:set-baseline`; commit with message `perf: initial baseline`.

**Files:**
- `scripts/verify-perf-reproducibility.sh` (new — runs make × 3, captures crm_platform counts pre/post, prints pass/fail)
- `plans/slice-19c-verification.md` (new — documents run dates, host hardware, pass/fail evidence, baseline commit SHA)

**Acceptance:**
- [ ] 3 runs produce latency metrics within 10% of each other
- [ ] Dev database completely untouched (zero row deltas)
- [ ] `e2e/perf/results/baseline.md` committed with median run's numbers
- [ ] Verification doc captures raw numbers + hardware context so future regressions have provenance

**Verify:** `bash scripts/verify-perf-reproducibility.sh`
**Dependencies:** G1 (make target must exist), B2 (full seed required)
**Size:** S (2 files)

---

### Final Checkpoint: Slice 19C Complete

- [ ] `make e2e:perf` exits 0 in < 30 min on clean checkout
- [ ] All pass/fail SLOs pass (cache hit > 80%, DB pool healthy, WS connect=500, file quota integrity)
- [ ] Markdown report generated with p50/p95/p99 and regression diff
- [ ] 3-run reproducibility verified (< 10% variance)
- [ ] 1.5M column values present in `crm_perf` after seed
- [ ] `crm_platform` dev DB row counts unchanged by any perf run
- [ ] `cd backend && npx tsc --noEmit` clean; `cd e2e/perf && npx tsc --noEmit` clean
- [ ] `baseline.md` committed with initial numbers
- [ ] Review with user before declaring slice done

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Seeder OOMs or exceeds 5-min budget on commodity hardware | High | 5000-row batching; per-batch transactions; memory profile captured in B2 test; scale factor knob for CI |
| Artillery `socketio-v3` engine incompatible with Socket.io v4 server (protocol mismatch) | High | Validate in E2 short-run early; if incompatible, fall back to custom Artillery engine plugin or isolate WS to a different tool |
| Resource limits cause immediate backend OOM under 100 RPS | Medium | Start with generous limits (A3's guard enforces isolation, not sizing); tune limits if first run fails; document final values in baseline metadata |
| Flaky metrics due to shared Docker host (noisy neighbor) | Medium | Document host hardware in every run's report; 3-run reproducibility check catches environmental variance; > 10% drift on identical seed = investigation trigger |
| `crm_perf` accidentally points at `crm_platform` via misconfigured env | Catastrophic | Hard safety guard in A3 refuses to start; plus Phase H audits row counts before/after |
| Automation engine queue backs up and scenario C hangs | Medium | Drain window (30s) has hard ceiling; scenario asserts all AutomationLog rows present by drain end; timeout fails loudly |
| File upload scenario D deadlocks at concurrent quota check | High | Pre-flight integrity check; lock-ordering reviewed; test with 10 concurrent first (E4 RED) before scaling to 50 |
| Baseline drift accumulates silently (nobody updates) | Low | `set-baseline` is manual + interactive; verification doc tracks cadence; spec's "upgrade to tiered after 3 stable" creates pressure to review |
| Compiled build path (`npm run build && node dist/server.js`) breaks in perf profile | Medium | Build step in Dockerfile.perf or in compose `command`; smoke-test in C1 before any perf run |

---

## Parallelization Opportunities

- **Sequential required:** A1 → A2 → A3 → B1 → B2 (backend foundation chain)
- **After Phase C completes:** Phase D can fan out in parallel with continued backend work if any remains
- **After Phase D completes:** E1, E2, E3, E4 can be built in parallel (each is isolated scenario YAML + short-run test)
- **Must be last:** F1 → F2 → G1 → H1 (orchestration + verification depend on all scenarios existing)

Recommended: single-agent serial through Phase A–D (complex safety-critical work). Optionally dispatch E2, E3, E4 in parallel after E1 validates the short-run test pattern.

---

## Open Questions

- **None for planning.** SPEC resolved tool choice, SLO table, regression gate behavior, environment isolation, and data volume.
- **For `/build` time:**
  - Exact memory ceiling for the seeder under Docker resource limits — discovered in B2.
  - Artillery's `socketio-v3` engine compatibility with Socket.io v4 server — validated in E2 (fallback path noted in risks).
  - Whether seed needs an index on `column_values.item_id` in the perf DB for scenario A queries to stay sub-second (may emerge during first E1 full run).

---

## Task Summary Table

| ID | Phase | Size | Files | Deps |
|----|-------|------|-------|------|
| A1 | Config | S | 4 | Slice 19 |
| A2 | Config | XS | 2 | A1 |
| A3 | Safety | S | 3 | A1, A2 |
| B1 | Seed | S | 3 | A2 |
| B2 | Seed | S | 2 | B1 |
| C1 | Docker | XS | 1 | A3 |
| D1 | Artillery | XS | 3 | — |
| D2 | Artillery | S | 3 | D1 |
| E1 | Scenario | S | 2 | D2, B2, C1 |
| E2 | Scenario | S | 2 | E1 |
| E3 | Scenario | S | 2 | E1 |
| E4 | Scenario | S | 2 | E1 |
| F1 | Orchestrator | S | 2 | E1–E4 |
| F2 | Report | S | 3 | F1 |
| G1 | Make | XS | 1 | F1 |
| H1 | Verify | S | 2 | G1, B2 |

**Total:** 16 tasks. Every task ≤5 files.

---

## Next Command After Plan Approval

```
/build Start with Task A1 from plans/slice-19c-plan.md — NODE_ENV=perf config branch + middleware gates. Follow RED → GREEN → REFACTOR → COMMIT. Skills: incremental-implementation, test-driven-development.
```
