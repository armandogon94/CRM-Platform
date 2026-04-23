# Implementation Plan: Slice 19 — End-to-End Testing with Playwright

**Spec reference:** `SPEC.md` §Slice 19 (lines 919–1057)
**Size:** XL
**Estimated tasks:** 19 tasks across 7 phases

---

## Overview

Deliver end-to-end browser coverage for the CRM Platform across 6 critical user flows, add accessibility audits via axe-core, and smoke-test mobile on iPhone 14 Pro. Establish deterministic Playwright infrastructure that Slice 19B (visual) and Slice 19C (perf) will extend.

## Architecture Decisions

- **Test data isolation:** Dedicated E2E workspace (`is_e2e_fixture = true` flag) inside the same Postgres database — no separate DB (per spec).
- **Reset path:** Dual (HTTP endpoint + CLI script) sharing a single `E2EResetService` to guarantee identical behavior.
- **Auth:** UI-based login once per Playwright project, `storageState` reused across specs.
- **Selector policy:** `getByRole` → `getByLabel` → `getByTestId`. Frontend receives minimal `data-testid` additions only where role-based selectors cannot resolve uniquely.
- **Determinism:** Fixed timestamps (baseline `2026-01-01T00:00:00Z`), no `waitForTimeout`, each spec independently runnable.
- **CI:** JUnit + HTML reports generated; `.github/workflows/e2e.yml` deferred to Slice 20.

---

## Dependency Graph

```
Phase A — Backend foundation (migration, health, reset service + route + script)
           │
           ▼
Phase B — Seed updates (e2e user, fixture workspace flag, Status=Flagged automation)
           │
           ▼
Phase C — Playwright infrastructure (config, globalSetup, auth.setup, fixtures)
           │
           ▼
Phase D — Desktop specs (one spec per flow)
           │
           ├──▶ Phase E — Accessibility (axe helper + wire into specs 01–05)
           │
           └──▶ Phase F — Mobile (project config + testMatch against flows 1, 3, 4)
           │
           ▼
Phase G — Docker + Make (compose overlay + 4 make targets)
           │
           ▼
Final checkpoint — 3 consecutive clean runs
```

---

## Task List

### Phase A — Backend Foundation

Goal: backend exposes a safe, env-guarded reset mechanism (HTTP + CLI) and reports DB/Redis health.

---

#### Task A1: Migration — `is_e2e_fixture` flag on workspaces

**RED test:** Jest integration test under `backend/src/__tests__/migrations/is-e2e-fixture.test.ts` — run migrations, query `information_schema.columns`, assert `workspaces.is_e2e_fixture` exists with type `boolean`, not null, default false.

**Files:**
- `backend/src/migrations/20260422000000-add-e2e-fixture-flag-to-workspaces.js` (new)
- `backend/src/models/Workspace.ts` (modify — add field + interface property)
- `backend/src/__tests__/migrations/is-e2e-fixture.test.ts` (new)

**Acceptance:**
- [ ] `npm run migrate` applies cleanly on an empty DB
- [ ] Existing rows receive `false` default (backward compatible)
- [ ] `Workspace` model TypeScript type includes `isE2eFixture: boolean`

**Verify:** `cd backend && npm test -- is-e2e-fixture`
**Dependencies:** None
**Size:** S (3 files)

---

#### Task A2: Enhance `/health` with DB + Redis checks

**RED test:** Supertest — `GET /health` → response body matches `{ status: 'ok', db: 'ok', redis: 'ok' }` when both up; status becomes `'degraded'` when Redis mocked down.

**Files:**
- `backend/src/app.ts` (modify the existing `/health` handler at line 64)
- `backend/src/__tests__/routes/health.test.ts` (new or extend if exists)

**Acceptance:**
- [ ] Response shape is `{ status, db, redis, timestamp, uptime }`
- [ ] DB check: `sequelize.authenticate()` with 2s timeout
- [ ] Redis check: `redisService.ping()` with 2s timeout
- [ ] Returns 503 when either subsystem is unhealthy

**Verify:** `cd backend && npm test -- health`
**Dependencies:** None
**Size:** S (2 files)

---

#### Task A3: `E2EResetService` — core reset logic

**RED test:** Unit test mocking Sequelize models — call `E2EResetService.reset()`; assert cascade-delete issued WHERE `workspace.is_e2e_fixture = true`, then assert `seedNovaPay` invoked. Verify non-fixture workspaces untouched.

**Files:**
- `backend/src/services/E2EResetService.ts` (new)
- `backend/src/__tests__/services/E2EResetService.test.ts` (new)

**Acceptance:**
- [ ] `reset()` deletes in dependency order: ColumnValue → Item → Column → BoardGroup → Board → AutomationRule
- [ ] Only rows tied to `is_e2e_fixture = true` workspaces touched
- [ ] After delete, invokes seeder subset (re-seeds NovaPay templates into fixture workspace only, NOT the full seed)
- [ ] Wrapped in a transaction; rollback on any error

**Verify:** `cd backend && npm test -- E2EResetService`
**Dependencies:** A1
**Size:** S (2 files)

---

#### Task A4: `POST /api/v1/admin/e2e/reset` route (env-guarded)

**RED test:** Supertest — three cases: (1) `NODE_ENV=production` → 404, (2) `E2E_RESET_ENABLED` unset → 404, (3) both flags correct → 200 with `{ ok: true }` and `E2EResetService.reset` called once.

**Files:**
- `backend/src/routes/admin.e2e.ts` (new)
- `backend/src/routes/index.ts` (modify — mount under `/admin/e2e` with env guard middleware)
- `backend/src/__tests__/routes/admin.e2e.test.ts` (new)

**Acceptance:**
- [ ] Route returns 404 (not 403) when guard fails — do not reveal existence in prod
- [ ] Requires valid JWT even when accessible (defense in depth)
- [ ] Success response under 5s on empty fixture workspace

**Verify:** `cd backend && npm test -- admin.e2e`
**Dependencies:** A3
**Size:** S (3 files)

---

#### Task A5: `reset-e2e.ts` CLI script + npm alias

**RED test:** Spawn `npx ts-node src/scripts/reset-e2e.ts` as child process in a Jest test, capture stdout, assert exit code 0 and log line `"E2E workspace reset complete"`.

**Files:**
- `backend/src/scripts/reset-e2e.ts` (new)
- `backend/package.json` (modify — add `"reset:e2e": "ts-node src/scripts/reset-e2e.ts"`)
- `backend/src/__tests__/scripts/reset-e2e.test.ts` (new)

**Acceptance:**
- [ ] Script calls `E2EResetService.reset()` (no HTTP surface)
- [ ] Exits 1 with clear error message if `NODE_ENV=production`
- [ ] `npm run reset:e2e` succeeds from repo root via `docker compose exec backend npm run reset:e2e`

**Verify:** `cd backend && npm test -- reset-e2e`
**Dependencies:** A3
**Size:** S (3 files)

---

### Checkpoint: Phase A Complete
- [ ] All A1–A5 Jest tests pass
- [ ] `cd backend && npx tsc --noEmit` clean
- [ ] `curl -X POST http://localhost:13000/api/v1/admin/e2e/reset` with env set returns 200 (manual smoke)

---

### Phase B — Seed Updates (NovaPay)

Goal: NovaPay seeder creates the fixture workspace, E2E user, and a Status=Flagged automation rule.

---

#### Task B1: NovaPay seeder — E2E user + fixture workspace flag

**RED test:** Jest integration — run `seedNovaPay()` on empty DB, query `User` for `e2e@novapay.test`, assert exists and password hashes against `e2epassword`; assert that user's workspace has `is_e2e_fixture = true`.

**Files:**
- `backend/src/seeds/novapay/workspace.ts` (modify — create or mark one workspace as `isE2eFixture: true`, add e2e user)
- `backend/src/__tests__/seeds/novapay-e2e-user.test.ts` (new)

**Acceptance:**
- [ ] Idempotent: running seed twice produces exactly one fixture workspace
- [ ] E2E user is admin in that workspace
- [ ] Dev admin user (`admin@crm-platform.com`) still present in a non-fixture workspace

**Verify:** `cd backend && npm test -- novapay-e2e-user`
**Dependencies:** A1
**Size:** S (2 files)

---

#### Task B2: NovaPay seeder — Status=Flagged → notification automation

**RED test:** Jest integration — run `seedNovaPay()`, query `AutomationRule` in fixture workspace with `trigger.type === 'column_value_changed' && trigger.config.toValue === 'Flagged'`, assert exactly one such rule exists with action type `create_notification`.

**Files:**
- `backend/src/seeds/novapay/automations.ts` (modify — add rule if absent)
- `backend/src/__tests__/seeds/novapay-flagged-automation.test.ts` (new)

**Acceptance:**
- [ ] Rule is `isActive: true`
- [ ] Rule scoped to the fixture workspace only (not main NovaPay workspace)
- [ ] Action creates notification for the E2E user

**Verify:** `cd backend && npm test -- novapay-flagged-automation`
**Dependencies:** B1
**Size:** S (2 files)

---

### Checkpoint: Phase B Complete
- [ ] `npm run seed:novapay` produces both fixture workspace + automation
- [ ] `E2EResetService.reset()` successfully re-seeds fixture end-to-end (manual smoke)

---

### Phase C — Playwright Infrastructure

Goal: `e2e/` directory scaffolded, Playwright projects configured, auth + global setup working.

---

#### Task C1: `e2e/` directory scaffold

**RED test:** `cd e2e && npx tsc --noEmit` passes (verifies tsconfig + deps installed).

**Files:**
- `e2e/package.json` (new — deps: `@playwright/test@^1.48`, `@axe-core/playwright@^4.10`, typescript dev deps)
- `e2e/tsconfig.json` (new — strict, target ES2022, moduleResolution node)
- `e2e/.gitignore` (new — `.auth/`, `results/`, `playwright-report/`, `node_modules/`)

**Acceptance:**
- [ ] `cd e2e && npm install` succeeds
- [ ] Type-check passes with no files yet
- [ ] `.gitignore` prevents committing auth state or results

**Verify:** `cd e2e && npm install && npx tsc --noEmit`
**Dependencies:** None
**Size:** XS (3 files)

---

#### Task C2: `playwright.config.ts` with 3 projects + reporters

**RED test:** `npx playwright test --list` lists the three project names (`desktop-novapay`, `desktop-branding-all`, `mobile-novapay`) with zero tests (specs not yet written).

**Files:**
- `e2e/playwright.config.ts` (new)

**Acceptance:**
- [ ] Projects: `desktop-novapay` (chromium 1440×900), `desktop-branding-all` (chromium 1440×900), `mobile-novapay` (`devices['iPhone 14 Pro']`)
- [ ] Reporters: `junit` → `results/junit.xml`, `html` → `playwright-report/`, `list`
- [ ] `trace: 'on-first-retry'`, `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'`
- [ ] `workers: 4`, `fullyParallel: true`
- [ ] `baseURL: http://localhost:13001` (NovaPay default); branding project parameterizes via fixture

**Verify:** `cd e2e && npx playwright test --list`
**Dependencies:** C1
**Size:** XS (1 file)

---

#### Task C3: `globalSetup.ts` — hit reset endpoint

**RED test:** Minimal placeholder spec imports globalSetup side effect; suite runs, assert network call made to `POST /api/v1/admin/e2e/reset` returned 200.

**Files:**
- `e2e/globalSetup.ts` (new)
- `e2e/playwright.config.ts` (modify — wire `globalSetup` option)
- `e2e/specs/_smoke.spec.ts` (new, temporary — one `test('setup ran')` assertion; removed after D1)

**Acceptance:**
- [ ] Uses Node `fetch` (no Playwright browser) to reach `http://backend:13000` in Docker or `http://localhost:13000` locally
- [ ] Fails fast with clear message if endpoint returns non-200 or times out (10s)
- [ ] Retry policy: 3 attempts, 2s back-off

**Verify:** `cd e2e && npx playwright test _smoke.spec.ts --project=desktop-novapay`
**Dependencies:** A4, B1, B2, C2
**Size:** S (3 files)

---

#### Task C4: `auth.setup.ts` — UI login, persist storageState

**RED test:** Run auth.setup as a `test.use({ storageState: ... })` dependency; after run, assert `e2e/.auth/novapay.json` exists with valid session cookie.

**Files:**
- `e2e/auth.setup.ts` (new)
- `e2e/playwright.config.ts` (modify — wire as setup project that runs before others)

**Acceptance:**
- [ ] Navigates to NovaPay login page, fills `e2e@novapay.test` / `e2epassword` via `getByLabel('Email')` / `getByLabel('Password')`, submits
- [ ] Waits for navigation to BoardListPage via `page.waitForURL(/\/boards/)`
- [ ] Writes `storageState` to `e2e/.auth/novapay.json`
- [ ] Projects `desktop-novapay`, `desktop-branding-all`, `mobile-novapay` list auth.setup as dependency

**Verify:** `cd e2e && npx playwright test --project=setup` then check `.auth/novapay.json`
**Dependencies:** C3
**Size:** S (2 files)

---

#### Task C5: Shared fixtures + WebSocket helper

**RED test:** Import `websocketClient` from helper into a throwaway test; assert second browser context connects to the same board room and receives a fixture event within 2s.

**Files:**
- `e2e/fixtures/test.ts` (new — extends base `test` with `a11yScan` method stub, storageState binding)
- `e2e/helpers/websocket.ts` (new — helper to open a second `browser.newContext()`, log in via stored state, subscribe to a board)

**Acceptance:**
- [ ] Base `test` export reuses `e2e/.auth/novapay.json`
- [ ] `websocketClient(board, callback)` returns `{ events, dispose }` for capturing WS events
- [ ] Type-check passes

**Verify:** `cd e2e && npx tsc --noEmit`
**Dependencies:** C4
**Size:** XS (2 files)

---

### Checkpoint: Phase C Complete
- [ ] Placeholder smoke spec passes via `npx playwright test`
- [ ] `.auth/novapay.json` generated and consumed across projects
- [ ] All e2e/ TypeScript clean

---

### Phase D — Desktop Specs (one per flow)

Goal: Six spec files each exercise one flow end-to-end and pass independently.

**Note per task:** Each spec may require adding up to ~3 `data-testid` attributes in frontend components when `getByRole`/`getByLabel` cannot disambiguate. These are frontend edits staying under the 5-file cap.

---

#### Task D1: `01-login-and-board.spec.ts` — Flow 1

**RED test:** Spec asserts: login redirects to BoardListPage → seeded "Transaction Pipeline" board is visible by role=link → click opens board → `page.url()` matches `/boards/:id`. Initially fails because auth setup hasn't been wired to this spec.

**Files:**
- `e2e/specs/01-login-and-board.spec.ts` (new)
- `e2e/specs/_smoke.spec.ts` (delete — replaced by this)
- Up to 2 frontend components for missing `data-testid` (if needed)

**Acceptance:**
- [ ] Passes on 3 consecutive runs with zero flake
- [ ] Runs in under 15s on desktop-novapay project
- [ ] No `waitForTimeout` or raw CSS selectors

**Verify:** `cd e2e && npx playwright test 01-login-and-board --project=desktop-novapay`
**Dependencies:** C5
**Size:** S (2–4 files)

---

#### Task D2: `02-item-crud-and-realtime.spec.ts` — Flow 2

**RED test:** Spec asserts: primary context creates item "E2E Test Deal"; secondary browser context subscribed to same board receives `item:created` WS event within 2s and renders the new row.

**Files:**
- `e2e/specs/02-item-crud-and-realtime.spec.ts` (new)
- Up to 2 frontend components for `data-testid` on item creation button + row

**Acceptance:**
- [ ] Secondary context uses `e2e/helpers/websocket.ts`
- [ ] Event received with correct `boardId` and payload shape
- [ ] Spec cleans up created item via API before finishing (determinism)

**Verify:** `cd e2e && npx playwright test 02-item-crud --project=desktop-novapay`
**Dependencies:** D1
**Size:** S (1–3 files)

---

#### Task D3: `03-column-value-edit.spec.ts` — Flow 3

**RED test:** Spec opens item, changes Status from "New" to "In Progress" via `getByRole('option')`; reloads page and asserts new value persists; secondary context receives `column_value:changed` event.

**Files:**
- `e2e/specs/03-column-value-edit.spec.ts` (new)
- Up to 2 frontend components for `data-testid` on status cell

**Acceptance:**
- [ ] Uses role-based selectors for status dropdown
- [ ] Persistence verified via full page reload, not DOM re-query
- [ ] WS event assertion under 2s

**Verify:** `cd e2e && npx playwright test 03-column-value-edit --project=desktop-novapay`
**Dependencies:** D2
**Size:** S (1–3 files)

---

#### Task D4: `04-all-eight-views.spec.ts` — Flow 4

**RED test:** Spec iterates through all 8 view types (Table, Kanban, Calendar, Timeline, Chart, Form, Dashboard, Map); for each: switch via view tab, assert view mounts, assert zero `console.error` and zero `pageerror` captured during mount.

**Files:**
- `e2e/specs/04-all-eight-views.spec.ts` (new)
- Up to 2 frontend components for view tab `data-testid` (one per view group if missing)

**Acceptance:**
- [ ] `page.on('console')` + `page.on('pageerror')` listeners attached before navigation
- [ ] Uses `test.step()` per view for readable report
- [ ] Calendar/Timeline views wait for data load via `waitForResponse` on aggregates endpoint

**Verify:** `cd e2e && npx playwright test 04-all-eight-views --project=desktop-novapay`
**Dependencies:** D1
**Size:** M (1–3 files, larger spec body)

---

#### Task D5: `05-automation-notification.spec.ts` — Flow 5

**RED test:** Spec: opens an item, changes Status to "Flagged"; within 3s, `NotificationBell` badge shows count `1`; opening the bell dropdown shows the new notification text.

**Files:**
- `e2e/specs/05-automation-notification.spec.ts` (new)
- Up to 2 frontend components for `data-testid` on NotificationBell badge + dropdown item

**Acceptance:**
- [ ] Uses `expect.poll()` with 3s ceiling (no fixed timeout)
- [ ] Resets notification state at test start (mark all read via API)
- [ ] Depends on B2 having seeded the automation rule

**Verify:** `cd e2e && npx playwright test 05-automation-notification --project=desktop-novapay`
**Dependencies:** B2, D1
**Size:** S (1–3 files)

---

#### Task D6: `06-branding-per-industry.spec.ts` — Flow 6 (parameterized × 10)

**RED test:** `test.describe.parallel` over the 10 industries; per industry: log in (using that industry's storage state), navigate to BoardListPage, assert computed `background-color` of `sidebar header` element equals the industry's primary color from `INDUSTRY_THEMES`.

**Files:**
- `e2e/specs/06-branding-per-industry.spec.ts` (new)
- `e2e/auth.setup.ts` (modify — generate 10 storage states, one per industry)
- `e2e/fixtures/test.ts` (modify — parameterize storageState by industry)

**Acceptance:**
- [ ] All 10 industries pass
- [ ] Uses `getComputedStyle` via `page.evaluate` once per assertion
- [ ] Color values sourced from `frontends/_shared/src/theme.ts` at import time (single source of truth)
- [ ] Spec runs under `desktop-branding-all` project only

**Verify:** `cd e2e && npx playwright test 06-branding --project=desktop-branding-all`
**Dependencies:** D1
**Size:** M (3 files)

---

### Checkpoint: Phase D Complete
- [ ] All 6 specs pass on `desktop-novapay` or `desktop-branding-all` project
- [ ] 3 consecutive runs with zero flake
- [ ] Total desktop runtime under 5 min

---

### Phase E — Accessibility

Goal: axe-core audits on every view render, baseline allowlist in place.

---

#### Task E1: a11y helper + baseline file

**RED test:** Unit — import `a11yScan` from helper, run against a known-violating HTML snippet (`<button>` with no accessible name), assert returned violations array has entry with `impact: 'serious'`.

**Files:**
- `e2e/helpers/a11y.ts` (new — wraps `AxeBuilder`, filters by impact, reconciles against baseline)
- `e2e/a11y-baseline.json` (new — empty array on first commit)
- `e2e/fixtures/test.ts` (modify — expose `a11yScan()` on test fixture)

**Acceptance:**
- [ ] Helper filters for `impact ∈ { serious, critical }` matching WCAG 2.1 AA
- [ ] Entries matching baseline `{ rule, selector }` are ignored
- [ ] Baseline entries require `{ justification, reviewedOn }` — missing fields cause startup error

**Verify:** `cd e2e && npx playwright test helpers/a11y --project=desktop-novapay` (or direct unit if split)
**Dependencies:** C5
**Size:** S (3 files)

---

#### Task E2: Wire a11y into specs 01–05

**RED test:** Introduce a deliberate heading-hierarchy violation in one view, run spec, assert suite fails with axe violation. Revert violation, suite passes.

**Files:**
- `e2e/specs/01-login-and-board.spec.ts` (modify)
- `e2e/specs/02-item-crud-and-realtime.spec.ts` (modify)
- `e2e/specs/03-column-value-edit.spec.ts` (modify)
- `e2e/specs/04-all-eight-views.spec.ts` (modify)
- `e2e/specs/05-automation-notification.spec.ts` (modify)

**Acceptance:**
- [ ] Each spec calls `a11yScan()` after view is fully rendered (post-networkidle)
- [ ] Existing violations (if any) captured in baseline with human-written justifications — no blanket allowlist
- [ ] Spec 04 scans each of the 8 views

**Verify:** `cd e2e && npx playwright test --project=desktop-novapay`
**Dependencies:** D1–D5, E1
**Size:** M (5 files — exactly at cap)

---

### Checkpoint: Phase E Complete
- [ ] Full desktop suite (5 flows × a11y) passes
- [ ] `e2e/a11y-baseline.json` either empty or contains justified entries only
- [ ] Intentional violation smoke test works (fail → revert → pass)

---

### Phase F — Mobile

Goal: iPhone 14 Pro runs flows 1, 3, 4 against the same specs via project-level `testMatch`.

---

#### Task F1: `mobile-novapay` project wiring

**RED test:** `npx playwright test --project=mobile-novapay --list` lists exactly flows 1, 3, 4 (three specs). Running the project executes them on mobile viewport.

**Files:**
- `e2e/playwright.config.ts` (modify — set `testMatch` on `mobile-novapay` to `['**/01-*.spec.ts', '**/03-*.spec.ts', '**/04-*.spec.ts']`, apply mobile-specific timeouts)
- `e2e/specs/01-login-and-board.spec.ts` (modify if any viewport-specific assertion fails on mobile — likely minimal)

**Acceptance:**
- [ ] Mobile project uses `devices['iPhone 14 Pro']`
- [ ] Mobile action timeout raised to 15s (slower mobile rendering)
- [ ] All 3 specs pass on mobile project

**Verify:** `cd e2e && npx playwright test --project=mobile-novapay`
**Dependencies:** D4, E2
**Size:** XS (1–2 files)

---

### Checkpoint: Phase F Complete
- [ ] Mobile project passes
- [ ] No shared spec regressions from mobile-specific branches

---

### Phase G — Docker + Make

Goal: `make e2e` spins up stack, waits for health, runs suite, tears down.

---

#### Task G1: `docker-compose.e2e.yml` overlay

**RED test:** `docker compose -f docker-compose.yml -f docker-compose.e2e.yml config` succeeds AND the backend env shows `E2E_RESET_ENABLED=true` and `NODE_ENV=test`.

**Files:**
- `docker-compose.e2e.yml` (new)

**Acceptance:**
- [ ] Sets `E2E_RESET_ENABLED=true` and `NODE_ENV=test` on backend only
- [ ] Mounts ephemeral upload volume (replaces persistent volume from base compose)
- [ ] Does NOT override production environment variables

**Verify:** `docker compose -f docker-compose.yml -f docker-compose.e2e.yml config`
**Dependencies:** A4
**Size:** XS (1 file)

---

#### Task G2: `Makefile` with 4 e2e targets

**RED test:** `make -n e2e` dry-run prints expected commands (compose up → wait-on health → playwright test → compose down). Running `make e2e` on a clean checkout exits 0.

**Files:**
- `Makefile` (new)

**Acceptance:**
- [ ] `make e2e` — start stack, wait-on `http://localhost:13000/health` (30s ceiling), run `cd e2e && npx playwright test`, teardown regardless of pass/fail
- [ ] `make e2e:desktop` — only `desktop-novapay` and `desktop-branding-all` projects
- [ ] `make e2e:mobile` — only `mobile-novapay` project
- [ ] `make e2e:ui` — opens Playwright UI mode (assumes stack already running, no teardown)
- [ ] Teardown reliable even on SIGINT (trap)

**Verify:** `make e2e` on a freshly cloned checkout
**Dependencies:** G1, all prior phases
**Size:** XS (1 file)

---

### Final Checkpoint: Slice 19 Complete

- [ ] `make e2e` exits 0 in under 10 minutes on a clean checkout
- [ ] 3 consecutive runs produce zero flakes
- [ ] `e2e/a11y-baseline.json` either empty or justified-only
- [ ] `e2e/results/junit.xml` generated and parseable
- [ ] `cd backend && npx tsc --noEmit` clean; `cd e2e && npx tsc --noEmit` clean
- [ ] Dev seed data unmutated (row-count diff on non-fixture workspaces before/after)
- [ ] `SPEC.md` §Slice 19 success criteria all checked
- [ ] Review with user before declaring slice done

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `data-testid` drift — specs need more frontend edits than forecasted | Medium | Budget up to 3 components per spec task; if exceeded, split the task and add a dedicated test-id-wiring task |
| Socket.io event timing flake on slow CI machines | Medium | Use `expect.poll()` with 3–5s ceilings, never fixed timeouts; second browser context connects before primary acts |
| Auth storage state staleness (JWT expiry) | Low | Access tokens last 1h per CLAUDE.md; suite runtime well under that. If tests ever exceed, add per-project auth re-setup |
| `globalSetup.ts` hits reset endpoint before backend container ready | Medium | Wait-on `/health` in `make e2e` before invoking Playwright; retry policy in globalSetup itself (3× 2s) |
| Reset endpoint accidentally enabled in prod | High | Double-gate (NODE_ENV + E2E_RESET_ENABLED); 404 not 403; integration test asserts both guards |
| a11y baseline grows uncontrollably | Medium | Each entry requires `{ justification, reviewedOn }` — enforced at helper startup; quarterly review cadence noted in SPEC |
| Branding spec flakes on color parsing (rgb vs rgba vs hex) | Low | Normalize all computed values to lowercase hex before comparison |
| Mobile spec layout differences break view assertions | Medium | Keep mobile to flows 1, 3, 4 only (spec-mandated); skip view-grid-specific assertions on mobile |

---

## Parallelization Opportunities

- **Parallel-safe during build:** Phase D specs (D1–D6) after D1 lands, since each spec is independently runnable. Agents can split D2/D3/D5 easily.
- **Must be sequential:** Phase A (migration → service → route → script chain), Phase B (depends on A1).
- **Can run in parallel branches:** Phase E and Phase F after Phase D completes.

Recommended execution: single-agent sequential for Phases A–C; optionally dispatch Phase D tasks in parallel via `dispatching-parallel-agents` skill if desired.

---

## Open Questions

- **None for planning.** The spec fully resolved the test-data strategy, tool choice, flow list, and boundaries.
- **For `/build` time:** whether any existing frontend component already exposes sufficient roles such that zero `data-testid` additions are needed. Will be discovered during D1 and drive actual file counts.

---

## Task Summary Table

| ID | Phase | Size | Files | Deps |
|----|-------|------|-------|------|
| A1 | Foundation | S | 3 | — |
| A2 | Foundation | S | 2 | — |
| A3 | Foundation | S | 2 | A1 |
| A4 | Foundation | S | 3 | A3 |
| A5 | Foundation | S | 3 | A3 |
| B1 | Seed | S | 2 | A1 |
| B2 | Seed | S | 2 | B1 |
| C1 | Infra | XS | 3 | — |
| C2 | Infra | XS | 1 | C1 |
| C3 | Infra | S | 3 | A4, B1, B2, C2 |
| C4 | Infra | S | 2 | C3 |
| C5 | Infra | XS | 2 | C4 |
| D1 | Specs | S | 2–4 | C5 |
| D2 | Specs | S | 1–3 | D1 |
| D3 | Specs | S | 1–3 | D2 |
| D4 | Specs | M | 1–3 | D1 |
| D5 | Specs | S | 1–3 | B2, D1 |
| D6 | Specs | M | 3 | D1 |
| E1 | A11y | S | 3 | C5 |
| E2 | A11y | M | 5 | D1–D5, E1 |
| F1 | Mobile | XS | 1–2 | D4, E2 |
| G1 | Docker | XS | 1 | A4 |
| G2 | Docker | XS | 1 | G1, all prior |

**Total:** 23 tasks. Every task ≤5 files.

---

## Next Command After Plan Approval

```
/build Start with Task A1 from plans/slice-19-plan.md — migration for is_e2e_fixture flag on workspaces. Follow RED → GREEN → REFACTOR → COMMIT. Skills: incremental-implementation, test-driven-development.
```
