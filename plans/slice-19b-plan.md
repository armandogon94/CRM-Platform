# Implementation Plan: Slice 19B — Visual Regression Testing

**Spec reference:** `SPEC.md` §Slice 19B (lines 1059–1197)
**Size:** L
**Estimated tasks:** 11 tasks across 6 phases
**Prerequisite:** Slice 19 must be merged before building 19B. Plan itself can be written now.

---

## Overview

Add screenshot-based visual regression coverage on top of the Slice 19 Playwright infrastructure. Capture ~119 deterministic baselines across 10 industries, 8 board views, state variants, and mobile. All snapshots generated inside a pinned Docker image so macOS dev and Linux CI produce byte-identical output. Use the HTML report's side-by-side diff plus a two-step update workflow instead of a paid SaaS.

## Architecture Decisions

- **Tool:** Playwright-native `toHaveScreenshot()` (free, baselines in repo, reuses Slice 19 infra). Decision ADR lives in `SPEC.md` §Slice 19B.
- **Pinned image:** `mcr.microsoft.com/playwright:v1.48.0-jammy` — any other runtime refuses to run.
- **Enforcement:** `playwright.visual.config.ts` throws unless `CI=true` OR `E2E_DOCKER=true` at startup.
- **Diff threshold:** `maxDiffPixelRatio = 0.01` global default; individual snapshots override only with an approved justification comment.
- **Review workflow:** Two-step — generate diff report first, then explicitly update with `make e2e:visual:update`. Documented in `CONTRIBUTING.md`.
- **Flake posture:** Reject non-deterministic snapshots rather than allowlist. Any snapshot that fails the 3-run check is a bug to fix, not mask.

---

## Dependency Graph

```
Phase A — Foundation (Docker service, visual config with host blocker)
           │
           ▼
Phase B — Helpers (prepareForSnapshot — fonts, networkidle, animations, masks)
           │
           ▼
Phase C — Review infrastructure (Makefile targets + CONTRIBUTING.md)
           │
           ▼
Phase D — Desktop specs (login → board-list → board-views → state-variants)
           │
           ▼
Phase E — Mobile spec (login + column-edit + TableView)
           │
           ▼
Phase F — Determinism verification (3-run flake check + size audit + brand-break smoke)
```

Review infrastructure (C) comes before specs (D) so the two-step workflow is documented before any baseline is committed.

---

## Task List

### Phase A — Foundation

Goal: pinned Docker container is the only way to run the visual suite; Playwright config refuses host-machine execution.

---

#### Task A1: `e2e-visual` Docker service with pinned Playwright image

**RED test:** Shell assertion — `docker compose -f docker-compose.yml -f docker-compose.e2e.yml config | grep 'image: mcr.microsoft.com/playwright:v1.48.0-jammy'` exits 0; `docker compose run --rm e2e-visual node -e "console.log('ok')"` prints `ok`.

**Files:**
- `docker-compose.e2e.yml` (modify — add `e2e-visual` service on the same `crm-network`, depends_on backend healthy, working_dir `/e2e`, command defaulting to `npx playwright test --config=playwright.visual.config.ts`, environment `E2E_DOCKER=true`)

**Acceptance:**
- [ ] Service uses exactly `mcr.microsoft.com/playwright:v1.48.0-jammy` (no `:latest`, no local build)
- [ ] Mounts `./e2e:/e2e:ro` and writable `./e2e/__screenshots__:/e2e/__screenshots__` so updated baselines land on host
- [ ] Environment sets `E2E_DOCKER=true` so the config's host-run blocker passes
- [ ] `depends_on: backend: condition: service_healthy`

**Verify:** `docker compose -f docker-compose.yml -f docker-compose.e2e.yml config && docker compose -f docker-compose.yml -f docker-compose.e2e.yml run --rm e2e-visual node -v`
**Dependencies:** Slice 19 complete (`docker-compose.e2e.yml` exists from Task G1)
**Size:** XS (1 file)

---

#### Task A2: `playwright.visual.config.ts` with host-run blocker + 2 projects

**RED test:** Run `npx playwright test --config=e2e/playwright.visual.config.ts --list` from the host (no env vars) → process exits non-zero with stderr containing "Refusing to run visual suite outside pinned container". Run with `E2E_DOCKER=true` → process lists `visual-desktop` and `visual-mobile` projects.

**Files:**
- `e2e/playwright.visual.config.ts` (new — extends base `playwright.config.ts`, overrides `testDir` to `./specs/visual`, adds `visual-desktop` (chromium 1440×900) and `visual-mobile` (iPhone 14 Pro) projects, sets `use.screenshot.maxDiffPixelRatio = 0.01`, reporter JUnit → `results/visual-junit.xml`)
- `e2e/package.json` (modify — add `"test:visual": "playwright test --config=playwright.visual.config.ts"` script)

**Acceptance:**
- [ ] Host-run blocker throws early (top of config file, before project resolution) when `CI !== 'true' && E2E_DOCKER !== 'true'`
- [ ] Projects inherit storageState/globalSetup from Slice 19 base config so authenticated pages are reachable
- [ ] Snapshot directory resolves to `e2e/__screenshots__/{spec-name}/{snapshot-name}-{project}.png` (Playwright default)
- [ ] `use.screenshot.maxDiffPixelRatio = 0.01` applied globally

**Verify:** `cd e2e && npx playwright test --config=playwright.visual.config.ts --list` fails on host; `E2E_DOCKER=true npx playwright test --config=playwright.visual.config.ts --list` succeeds
**Dependencies:** A1, Slice 19 (base config exists)
**Size:** XS (2 files)

---

### Checkpoint: Phase A Complete
- [ ] Host runs are refused with clear error
- [ ] `docker compose run --rm e2e-visual npx playwright test --config=playwright.visual.config.ts --list` lists both visual projects
- [ ] `cd e2e && npx tsc --noEmit` clean

---

### Phase B — Helpers

Goal: one helper call turns any page into a snapshot-ready state (fonts loaded, network idle, animations disabled, dynamic regions masked).

---

#### Task B1: `helpers/visual.ts` — prepareForSnapshot

**RED test:** Unit-style Playwright test that:
1. Navigates to a page with a CSS animation and a dynamic `<time>` element
2. Calls `prepareForSnapshot(page, { masks: ['time'] })`
3. Asserts animations are paused (`getComputedStyle` shows `animation-play-state: running` → expected to be overridden to no-op)
4. Asserts a follow-up `expect(page).toHaveScreenshot()` reports only stable pixels (masked region shows the pink mask overlay)

**Files:**
- `e2e/helpers/visual.ts` (new — exports `prepareForSnapshot(page, options)` and `DEFAULT_MASKS` constant)
- `e2e/helpers/__tests__/visual.prepare.spec.ts` (new — Playwright test using a local HTML fixture, runs under `visual-desktop` project)

**Acceptance:**
- [ ] `await page.evaluate(() => document.fonts.ready)` with 5s timeout
- [ ] `await page.waitForLoadState('networkidle')` with 10s timeout
- [ ] `page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })`
- [ ] `DEFAULT_MASKS` exports selectors for timestamps, color-hash avatar fallbacks, notification counts (per SPEC.md)
- [ ] Helper accepts `options.extraMasks: string[]` merged with defaults
- [ ] Returns the mask `Locator[]` array so callers can pass it into `toHaveScreenshot({ mask })`

**Verify:** `docker compose run --rm e2e-visual npx playwright test helpers/__tests__/visual.prepare --config=playwright.visual.config.ts`
**Dependencies:** A2
**Size:** S (2 files)

---

### Checkpoint: Phase B Complete
- [ ] Helper test passes 3 consecutive runs with zero diff
- [ ] Type-check clean

---

### Phase C — Review Infrastructure

Goal: make targets exist and the update workflow is documented BEFORE any baselines are committed, so the very first baseline commit follows the two-step process.

---

#### Task C1: `Makefile` targets `e2e:visual`, `e2e:visual:update`, `e2e:visual:ui`

**RED test:** `make -n e2e:visual` prints expected command sequence (compose up backend+postgres+redis, wait-on health, `docker compose run --rm e2e-visual ...`, teardown). Actual `make e2e:visual` exits 0 when no baselines differ.

**Files:**
- `Makefile` (modify — append 3 targets below existing Slice 19 e2e targets)

**Acceptance:**
- [ ] `make e2e:visual` — starts backend stack, waits for `/health`, runs `docker compose run --rm e2e-visual npx playwright test --config=playwright.visual.config.ts`, tears down regardless of pass/fail (trap)
- [ ] `make e2e:visual:update` — same as above but `-- --update-snapshots`; prints a reminder about the two-step review before exiting
- [ ] `make e2e:visual:ui` — boots stack WITHOUT teardown; prints instructions to open Playwright UI against running container; developer is expected to Ctrl-C when done
- [ ] All targets respect SIGINT (stack cleanly torn down)

**Verify:** `make -n e2e:visual` shows expected sequence; `make e2e:visual` succeeds when no visual specs exist yet (zero baselines to diff)
**Dependencies:** A1, A2
**Size:** XS (1 file)

---

#### Task C2: `CONTRIBUTING.md` with two-step visual update workflow

**RED test:** Grep-based assertion — `CONTRIBUTING.md` contains sections titled "Updating Visual Baselines", includes copy-paste commands `make e2e:visual`, `make e2e:visual:update`, `git add e2e/__screenshots__/`, and links to `SPEC.md#slice-19b-visual-regression-testing`.

**Files:**
- `CONTRIBUTING.md` (new)

**Acceptance:**
- [ ] "Updating Visual Baselines" section includes: purpose, when to update, two-step commands, how to review the HTML diff
- [ ] Explicit warning: "Never run `--update-snapshots` without first inspecting the diff report"
- [ ] Cross-reference to SPEC.md Slice 19B ADR
- [ ] Repo-root `README.md` link updated to point at CONTRIBUTING.md (single line edit — if this expands scope, split into a follow-up task)

**Verify:** `grep -c 'make e2e:visual' CONTRIBUTING.md` returns ≥2; `grep -c 'two-step' CONTRIBUTING.md` returns ≥1
**Dependencies:** None (parallel-safe with C1)
**Size:** XS (1 file; possibly 2 if README link edit is in scope)

---

### Checkpoint: Phase C Complete
- [ ] `make e2e:visual` works end-to-end (empty suite → exits 0)
- [ ] CONTRIBUTING.md merged; team is aware of two-step workflow before any baseline is committed

---

### Phase D — Desktop Specs (atomic baseline commits)

Goal: one spec per task, each commits its complete baseline set. Spec files are committed first without baselines (RED state — test fails with "No snapshot found"), then `--update-snapshots` generates PNGs (GREEN), then 3-run flake check (REFACTOR if any drift), then single commit.

---

#### Task D1: `01-login.visual.spec.ts` — 10 industries × 1 = 10 baselines

**RED test:** Spec exists with `test.describe.parallel('login visual', ...)` looping over all 10 industries. First run WITHOUT `--update-snapshots` fails because no baselines exist. After `--update-snapshots`, 10 PNGs appear in `e2e/__screenshots__/01-login.visual.spec.ts/`.

**Files:**
- `e2e/specs/visual/01-login.visual.spec.ts` (new)
- `e2e/__screenshots__/01-login.visual.spec.ts/*.png` (10 new PNGs, committed)

**Acceptance:**
- [ ] Parameterized across all 10 industries (NovaPay through EduPulse) pulling URLs from a shared `INDUSTRIES` constant
- [ ] Before each snapshot, calls `prepareForSnapshot(page, { masks: [...DEFAULT_MASKS] })`
- [ ] Uses `test.describe.parallel` so the 10 cases parallelize across workers
- [ ] No dynamic data visible (login page is inherently static, but masks timestamp element if present)
- [ ] 3-consecutive-run determinism check passes (run ×3 without `--update-snapshots`, all pass)
- [ ] Each PNG file < 200 KB

**Verify:** `make e2e:visual:update` generates PNGs; subsequent `make e2e:visual` (×3) passes with zero diff
**Dependencies:** B1, C1
**Size:** S (1 spec file + 10 generated PNGs)

---

#### Task D2: `02-board-list.visual.spec.ts` — 10 industries × 1 = 10 baselines

**RED test:** Spec navigates each industry's BoardListPage (post-login, with seeded boards), asserts snapshot matches. Initial run without baselines → 10 "no snapshot found" errors.

**Files:**
- `e2e/specs/visual/02-board-list.visual.spec.ts` (new)
- `e2e/__screenshots__/02-board-list.visual.spec.ts/*.png` (10 new PNGs)

**Acceptance:**
- [ ] Uses storageState from Slice 19 auth.setup (pre-authenticated per industry)
- [ ] Navigates to BoardListPage, waits for seeded boards to render via `getByRole('link', { name: /pipeline|dashboard/i }).first().waitFor()`
- [ ] Calls `prepareForSnapshot(page)` with default masks + any industry-specific timestamp element
- [ ] 3-run determinism check passes
- [ ] Total PNG size < 2 MB

**Verify:** Same as D1 but for board-list
**Dependencies:** D1 (proves helper + workflow) — can also run in parallel with D3 once D1 validates the pattern
**Size:** S (1 spec + 10 PNGs)

---

#### Task D3: `03-board-views.visual.spec.ts` — 8 views × 10 industries = 80 baselines

**RED test:** Spec navigates to each industry's NovaPay-equivalent seeded board and switches through all 8 view types (Table, Kanban, Calendar, Timeline, Chart, Form, Dashboard, Map), taking a snapshot after each view mounts. 80 "no snapshot found" errors initially.

**Files:**
- `e2e/specs/visual/03-board-views.visual.spec.ts` (new)
- `e2e/__screenshots__/03-board-views.visual.spec.ts/*.png` (80 new PNGs)

**Acceptance:**
- [ ] Double-parameterized: `test.describe.parallel` over industries, inner `for (const view of VIEW_TYPES)` per industry
- [ ] Each industry uses its first seeded board from workspace seeds (deterministic — pick by lowest ID)
- [ ] For data-driven views (Calendar, Timeline, Chart, Dashboard, Map), wait for data-load response via `page.waitForResponse` before snapshot
- [ ] MapView specifically masks the Leaflet attribution tile (non-deterministic timestamp in tile URL)
- [ ] 3-run determinism check passes
- [ ] Total PNG size < 15 MB (sanity — 80 × ~150 KB avg)
- [ ] Runtime budget: < 2 min on `make e2e:visual`

**Verify:** `make e2e:visual:update` generates 80 PNGs; 3-run diff check passes; `du -sh e2e/__screenshots__/03-board-views.visual.spec.ts` under 15 MB
**Dependencies:** D1 (pattern validated)
**Size:** M (1 spec + 80 PNGs — large commit, expected; use `git add` in a scripted step)

---

#### Task D4: `04-state-variants.visual.spec.ts` — 8 NovaPay-only baselines

**RED test:** Spec defines 8 state-variant scenarios per SPEC.md §Slice 19B. Uses `page.route` to simulate error and loading states. Initial run → 8 "no snapshot found" errors.

**Files:**
- `e2e/specs/visual/04-state-variants.visual.spec.ts` (new)
- `e2e/__screenshots__/04-state-variants.visual.spec.ts/*.png` (8 new PNGs)

**Acceptance:**
- [ ] 8 test cases matching spec exactly:
  1. LoginPage error (submit wrong password → await error aria-live)
  2. BoardListPage empty (use a freshly-created workspace with no boards; create via API helper, delete after)
  3. BoardListPage loading (`page.route('**/api/v1/boards*', route => setTimeout(() => route.continue(), 3000))` then snapshot during skeleton render)
  4. BoardListPage error (`page.route` returns 500)
  5. TableView empty (board created with zero items)
  6. TableView loading (route delays items list)
  7. KanbanView empty
  8. KanbanView loading
- [ ] Loading-state snapshots use `page.route` request delays (deterministic) rather than network throttling
- [ ] Each test case fully isolated — state mutations reverted in `afterEach`
- [ ] 3-run determinism check passes

**Verify:** Same pattern — generate, 3-run diff check, commit
**Dependencies:** D3 (pattern for snapshot-within-parametrized spec validated)
**Size:** M (1 spec + 8 PNGs; more complex spec body due to route interception)

---

### Checkpoint: Phase D Complete
- [ ] All 108 desktop baselines committed
- [ ] 3 consecutive `make e2e:visual` runs pass with zero diff
- [ ] Total desktop runtime under 3 min

---

### Phase E — Mobile Spec

Goal: 11 mobile baselines on iPhone 14 Pro covering login across 10 industries plus NovaPay column-edit and TableView.

---

#### Task E1: `05-mobile-smoke.visual.spec.ts` — 11 baselines

**RED test:** Spec targets `visual-mobile` project only (`test.skip(!project.name.startsWith('visual-mobile'))` guard at suite level). 11 tests — 10 login (per industry) + 1 NovaPay column-edit screen + 1 NovaPay TableView. Initial run: 11 missing-snapshot errors.

**Files:**
- `e2e/specs/visual/05-mobile-smoke.visual.spec.ts` (new)
- `e2e/__screenshots__/05-mobile-smoke.visual.spec.ts/*.png` (11 new PNGs)
- `e2e/playwright.visual.config.ts` (modify — set `testMatch` on `visual-mobile` to include `05-mobile-smoke.visual.spec.ts`; exclude from `visual-desktop`)

**Acceptance:**
- [ ] 10 LoginPage baselines (one per industry) at iPhone 14 Pro viewport
- [ ] 1 Column-edit screen baseline (NovaPay, Status cell open)
- [ ] 1 TableView baseline (NovaPay seeded board, mobile viewport — may show hamburger-menu layout)
- [ ] Mobile-specific masks: keyboard overlay region if visible, status bar simulation
- [ ] 3-run determinism check passes on mobile project

**Verify:** `docker compose run --rm e2e-visual npx playwright test 05-mobile-smoke --config=playwright.visual.config.ts --project=visual-mobile` × 3 runs, all identical
**Dependencies:** D4 (pattern fully settled)
**Size:** M (2 files + 11 PNGs)

---

### Checkpoint: Phase E Complete
- [ ] All ~119 baselines (108 desktop + 11 mobile) committed
- [ ] 3 runs clean
- [ ] Total `e2e/__screenshots__/` size < 50 MB (per spec cap)

---

### Phase F — Determinism Verification

Goal: prove the full suite is reproducible and that a real visual regression actually fails the suite.

---

#### Task F1: 3-run determinism + size audit + brand-break smoke test

**RED test:** Three assertions, one task, one commit:
1. Run `make e2e:visual` three times in succession. All three must pass with exit 0 and zero visible diffs.
2. Measure `du -sh e2e/__screenshots__`. Must be < 50 MB.
3. Introduce a deliberate 1-char color change in `frontends/_shared/src/theme.ts` (NovaPay `primaryColor`). Run `make e2e:visual`. Suite must fail with readable HTML diff report. Revert change. Re-run must pass.

**Files:**
- `scripts/verify-visual-determinism.sh` (new — runs the 3-run check, reports any diffs; commits to `scripts/` because this is reusable for future slices)
- `plans/slice-19b-verification.md` (new — captures results of the brand-break smoke test with screenshots of the HTML report for audit)

**Acceptance:**
- [ ] 3 consecutive runs produce zero pixel diffs across all ~119 baselines
- [ ] Total baseline directory size < 50 MB
- [ ] Brand-break smoke test fails with correct industry highlighted in HTML report
- [ ] Revert → suite green again
- [ ] Verification script committed so future contributors can re-run before PRs touching visual specs

**Verify:** `bash scripts/verify-visual-determinism.sh` completes with success message; `plans/slice-19b-verification.md` exists and documents the brand-break experiment
**Dependencies:** E1 (full suite present)
**Size:** S (2 files)

---

### Final Checkpoint: Slice 19B Complete

- [ ] `make e2e:visual` exits 0 on clean checkout in < 5 min
- [ ] All ~119 baselines committed, diff-stable across 3 consecutive runs
- [ ] Total `e2e/__screenshots__/` size < 50 MB (actual size documented in verification doc)
- [ ] `CONTRIBUTING.md` documents two-step update workflow with copy-paste commands
- [ ] Intentional brand-color change causes readable suite failure (demonstrated once)
- [ ] Host-run blocker refuses non-Docker execution with clear message
- [ ] `cd e2e && npx tsc --noEmit` clean
- [ ] Review with user before declaring slice done

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Font rendering drift between Slice 19 host runs and Slice 19B pinned container | High | Host-run blocker refuses to execute outside the pinned image; CI and dev both route through the same container |
| Skeleton loading states don't reliably render at snapshot time | Medium | Use `page.route` with explicit `setTimeout` delays rather than network throttling — deterministic |
| MapView tile URLs contain dynamic tokens | Medium | Mask the Leaflet attribution overlay; prefer a static tile provider in test env if flakes persist |
| `--update-snapshots` abuse (developer regenerates without reviewing) | Medium | `CONTRIBUTING.md` documents two-step workflow + `make e2e:visual:update` prints a reminder before exiting |
| 80-PNG single commit hard to review in PR | Low | Spot-check sample in PR description; reviewer can run `make e2e:visual` locally to verify |
| Baselines bloat past 50 MB as new slices add views | Medium | F1 records baseline size; future specs add to a size budget in the plan |
| `page.route` loading-state simulations break if frontend polling is introduced | Low | Loading-state tests mark polling endpoints explicitly; spec 04's route handler documents which requests are intercepted |
| Brand-break smoke test forgets to revert (poisons subsequent runs) | Medium | F1's script does the revert automatically inside a `try/finally`; verification doc records the experiment |

---

## Parallelization Opportunities

- **Sequential required:** A → B → C (infrastructure chain)
- **Safe to parallelize after D1 validates the pattern:** D2, D3, D4 can fan out to different agents if subagent-driven development is desired
- **E1 depends on D-phase** because mobile spec reuses the helper pattern stabilized by desktop specs
- **F1 must be last** — requires the full suite to exist

Recommended: single-agent sequential for A, B, C, D1. Then optionally dispatch D2/D3/D4 in parallel (using `dispatching-parallel-agents` skill) before proceeding to E1 and F1.

---

## Open Questions

- **None for planning.** SPEC.md resolved the tool choice, threshold, directory layout, workflow, and mobile scope.
- **For `/build` time:** Whether the MapView Leaflet attribution actually produces non-deterministic tile URLs — if not, the mask described in D3 can be dropped. Will be discovered when capturing the first MapView baseline.

---

## Task Summary Table

| ID | Phase | Size | Files | Baselines Created | Deps |
|----|-------|------|-------|-------------------|------|
| A1 | Foundation | XS | 1 | — | Slice 19 complete |
| A2 | Foundation | XS | 2 | — | A1 |
| B1 | Helpers | S | 2 | — | A2 |
| C1 | Review | XS | 1 | — | A1, A2 |
| C2 | Review | XS | 1–2 | — | — |
| D1 | Specs | S | 1 spec + 10 PNGs | 10 | B1, C1 |
| D2 | Specs | S | 1 spec + 10 PNGs | 10 | D1 |
| D3 | Specs | M | 1 spec + 80 PNGs | 80 | D1 |
| D4 | Specs | M | 1 spec + 8 PNGs | 8 | D3 |
| E1 | Mobile | M | 2 + 11 PNGs | 11 | D4 |
| F1 | Verify | S | 2 | — | E1 |

**Total:** 11 tasks. Every task ≤5 hand-authored files (generated PNGs committed atomically with their spec).

**Total baselines:** 119 (108 desktop + 11 mobile).

---

## Next Command After Plan Approval

```
/build Start with Task A1 from plans/slice-19b-plan.md — add e2e-visual Docker service with pinned Playwright image to docker-compose.e2e.yml. Follow RED → GREEN → REFACTOR → COMMIT. Skills: incremental-implementation, test-driven-development.
```
