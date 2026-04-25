# Implementation Plan: Slice 20B — CRUD UI Fanout to Remaining 7 Industries

**Spec reference:** `SPEC.md` §Slice 20 (the same spec — Slice 20B is the staged-rollout completion). The Phase C ADR in §Slice 20 explicitly anticipates this: "Slice 20B extends to the remaining 7 with parallel subagents once the pattern is locked."

**Predecessor:** Slice 20 (`657f9c6` and prior) shipped CRUD wiring for NovaPay + MedVista + JurisPath. All shared-library deliverables (Toast, useBoard mutations, useCanEdit, ConfirmDialog, KanbanCard kebab, BoardListPage toast, A2.5 backend shims) are merged on `main`. No new shared work needed.

**Size:** L
**Estimated tasks:** 11 (7 per-industry + fixture matrix + make target + dead-code cleanup + verification)
**Estimated wall-clock:** ~35 minutes via 7 parallel worktree subagents on Opus + sequential cleanup.

---

## Overview

Apply the locked Slice 20 NovaPay/MedVista/JurisPath template to the remaining 7 industries: **TrustGuard, UrbanNest, SwiftRoute, DentaFlow, TableSync, CraneStack, EduPulse**. Each industry receives the C0+C2+C4 sequence — `@crm/shared` integration, BoardPage migration to shared BoardView, New Board dialog + RBAC gating in OverviewDashboard. After fanout, expand the E2E fixture matrix to all 10 industries and update the make target so `make e2e-slice-20` runs the whole suite end-to-end.

## Architecture decisions

- **Parallelization model:** 7 worktree-isolated Opus subagents, one per industry. Each industry's 3 commits are sequential WITHIN the agent's worktree (C0 must precede C2, which precedes C4) but ACROSS industries the agents are entirely independent — their file trees don't overlap. This mirrors the proven C0+C2+C4 fanout from Slice 20A (MedVista + JurisPath ran in parallel with zero conflict).
- **Reference template:** **MedVista** is the canonical template for all 7 because all remaining industries are state-based (no react-router) with the `BoardPage` + `OverviewDashboard` structure (verified during plan recon — none have a standalone `BoardListPage.tsx`). Reference commits:
  - C0: `533bab9 feat(medvista): wire @crm/shared as file dep + path aliases (Slice 20 C0)`
  - C2: `63ec93f feat(medvista): CRUD wiring via shared BoardView + ToastProvider (Slice 20 C2)`
  - C4: `289576c feat(medvista): New Board dialog + RBAC gating (Slice 20 C4)`
- **No spec changes:** Slice 20's spec (`SPEC.md` lines 1372–1556) already names this as the staged extension. No new ADR needed.
- **No new backend work:** The flat `DELETE /items/:id` and `POST /boards` shims (A2.5, commit `766dfb7`) already serve all industries. The viewer-user seed for CraneStack lives in `index.ts` (verified — `viewer@cranestack.com` exists); the other 6 industries have viewer users in `workspace.ts`.
- **No new shared-library work:** Phase A/B of Slice 20A locked the shared surface. Slice 20B is pure consumption.
- **Token-key divergence persists:** Each industry retains its own `<slug>_token` localStorage key. Real-time WS echo on Slice 20 CRUD remains the documented follow-up — out of scope for 20B.
- **Local forked components removed at end of slice:** `KanbanView.tsx`, `BoardTable.tsx`, `StatusBadge.tsx` per industry become dead code after BoardPage migration. Per-user decision (recorded here): the dead-code cleanup runs in **Phase B2 of this slice**, immediately after the fanout. Rationale: deleting these is only safe once ALL 10 industries have stopped importing them — which is exactly the state Phase B0 produces. Folding cleanup into 20B avoids a half-shipped state where the forks linger across releases.

---

## Industry inventory

Confirmed during plan recon. All 7 are state-based (sidebar-driven `activeView`), have `BoardPage.tsx` + `OverviewDashboard.tsx`, no `BoardListPage.tsx`. Fixture matrix data:

| # | Industry | Port | Brand color | Primary board name | Viewer seed |
|---|----------|------|-------------|--------------------|-------------|
| 3 | TrustGuard | 13003 | `#1E3A5F` | Claims Pipeline | ✅ workspace.ts |
| 4 | UrbanNest | 13004 | `#D97706` | Lead Pipeline | ✅ workspace.ts |
| 5 | SwiftRoute | 13005 | `#7C3AED` | Shipment Tracker | ✅ workspace.ts |
| 6 | DentaFlow | 13006 | `#06B6D4` | Patient Pipeline | ✅ workspace.ts |
| 8 | TableSync | 13008 | `#9F1239` | Reservation Board | ✅ workspace.ts |
| 9 | CraneStack | 13009 | `#EA580C` | Project Pipeline | ✅ index.ts (monolithic seed) |
| 10 | EduPulse | 13010 | `#6D28D9` | Student Enrollment | ✅ workspace.ts |

(NovaPay = #1, MedVista = #2, JurisPath = #7 already shipped in Slice 20A.)

---

## Dependency graph

```
Phase B0 — Industry-level CRUD wiring (parallel × 7)
   per industry: C0 → C2 → C4 (sequential within agent)
                      │
                      ▼
Phase B1 — Fixture matrix + make target (sequential, 2 tasks)
                      │
                      ▼
Phase B2 — Dead-code cleanup (sequential, 1 task)
   Delete unreferenced KanbanView/BoardTable/StatusBadge across all 10
                      │
                      ▼
Phase B3 — Verification (sequential, 1 task)
```

Sequential gates:
- Phase B0 → B1: all 7 industries must have replaced their local KanbanView/BoardTable usage before the fixture matrix expands (otherwise an E2E run against a non-yet-wired industry would hit the old read-only surface).
- Phase B1 → B2: cleanup grep depends on the post-B0 import graph.
- Phase B2 → B3: verification can't pass if cleanup deleted something still in use.

---

## Task list

### Phase B0 — Per-industry CRUD wiring (7 parallel worktree agents)

Each task below produces **3 atomic commits** following the MedVista template. Worktree-isolated; file trees do not overlap between industries.

#### Task B0-1: TrustGuard CRUD wiring

**Description:** Apply the MedVista C0+C2+C4 template to TrustGuard (`frontends/trustguard/`).

**Acceptance criteria:**
- [ ] Commit 1: `feat(trustguard): wire @crm/shared as file dep + path aliases (Slice 20B)` — adds `"@crm/shared": "file:../_shared"` to package.json, `"@crm/shared/*": ["../_shared/src/*"]` path alias to tsconfig, vite alias, sanity import in main.tsx; runs `npm install --legacy-peer-deps`.
- [ ] Commit 2: `feat(trustguard): CRUD wiring via shared BoardView + ToastProvider (Slice 20B)` — replaces sanity import with `<ToastProvider>` mount; adds `deleteItem` to local api.ts; rewrites BoardPage to use shared `BoardView` with optimistic CRUD handlers wired to local api; preserves state-based nav.
- [ ] Commit 3: `feat(trustguard): New Board dialog + RBAC gating (Slice 20B)` — adds `createBoard()` to api.ts; injects "+ New Board" button + admin-gated dialog into `OverviewDashboard.tsx`; gates BoardPage CRUD callbacks via `user.role === 'admin' || 'member'`.

**Verification (must all pass per commit):**
- [ ] `cd frontends/trustguard && npx tsc --noEmit` — clean
- [ ] `cd frontends/trustguard && npm run build` — succeeds
- [ ] After all 3 commits: `cd frontends/_shared && npm test -- --run` — 69/69 (no regression)

**Dependencies:** Slice 20A merged (Phase A/B complete on `main`).

**Files touched (~10 across 3 commits):**
- `frontends/trustguard/package.json`
- `frontends/trustguard/package-lock.json` (auto-generated)
- `frontends/trustguard/tsconfig.json`
- `frontends/trustguard/vite.config.ts`
- `frontends/trustguard/src/main.tsx`
- `frontends/trustguard/src/utils/api.ts`
- `frontends/trustguard/src/components/BoardPage.tsx`
- `frontends/trustguard/src/components/OverviewDashboard.tsx`
- `frontends/trustguard/src/App.tsx` (if `refreshBoards` callback needs threading)

**Estimated scope:** M (3 atomic commits, mostly mechanical mirror of MedVista).

---

#### Task B0-2 through B0-7

**Identical structure to B0-1**, applied to:

- **B0-2: UrbanNest** (port 13004, brand `#D97706`, board "Lead Pipeline")
- **B0-3: SwiftRoute** (port 13005, brand `#7C3AED`, board "Shipment Tracker")
- **B0-4: DentaFlow** (port 13006, brand `#06B6D4`, board "Patient Pipeline")
- **B0-5: TableSync** (port 13008, brand `#9F1239`, board "Reservation Board")
- **B0-6: CraneStack** (port 13009, brand `#EA580C`, board "Project Pipeline")
- **B0-7: EduPulse** (port 13010, brand `#6D28D9`, board "Student Enrollment")

Each one mirrors B0-1's acceptance criteria + verification + file list, scoped to its industry's directory.

**Special notes per industry:**

| Industry | Note |
|----------|------|
| DentaFlow | Primary board "Patient Pipeline" shares a name with MedVista's. Different workspace, no conflict — fixture matrix uses both unchanged. |
| CraneStack | Seed is monolithic (`backend/src/seeds/cranestack/index.ts`, no `workspace.ts`). Viewer user already exists at line ~150. No seed changes needed. |
| TableSync | "Reservation Board" status options differ from the other industries (Requested/Confirmed/Seated/Completed). The shared `normalizeStatusValue` from Slice 19.7 already handles arbitrary status options — no special-casing. |

---

### ✅ Checkpoint: Phase B0 complete

- [ ] All 7 per-industry agents committed 3 commits each (21 commits total)
- [ ] `cd frontends/_shared && npm test -- --run` — 69/69 (zero shared-lib regression)
- [ ] `cd backend && npm test --silent` — same pass count as Slice 20A baseline
- [ ] All 10 industries typecheck clean: `for d in $(ls frontends | grep -v _shared); do (cd frontends/$d && npx tsc --noEmit); done`
- [ ] Review with human before Phase B1

---

### Phase B1 — Fixture matrix expansion

#### Task B1-1: Expand `slice-20-industries.ts` to all 10 industries

**Description:** Add the 7 new industry fixtures to `e2e/fixtures/slice-20-industries.ts`. The 6 Phase D specs from Slice 20A automatically iterate over the expanded list because they call `selectedIndustries()` which respects `SLICE_20_INDUSTRIES` env var (defaults to all entries). No spec edits needed.

**Acceptance criteria:**
- [ ] `SLICE_20_INDUSTRIES` array has 10 entries (current 3 + new 7)
- [ ] Each new fixture has correct: `slug`, `baseURL`, `adminEmail`, `adminPassword: 'demo123'`, `primaryBoardName`, `tokenKey`, `brandColor`
- [ ] `selectedIndustries()` works unchanged — passes through env-var filter
- [ ] `findIndustry()` resolves all 10 slugs

**Verification:**
- [ ] `cd e2e && npx tsc --noEmit` — clean
- [ ] Manual check: `node -e "console.log(require('./e2e/fixtures/slice-20-industries').SLICE_20_INDUSTRIES.length)"` prints `10`

**Dependencies:** B0 complete (the new industries' frontends actually serve at the listed ports).

**Files touched (1):**
- `e2e/fixtures/slice-20-industries.ts`

**Estimated scope:** XS.

---

#### Task B1-2: Update `make e2e-slice-20` SLUGS default

**Description:** Change the default `SLUGS` value in the Makefile target from `novapay medvista jurispath` to all 10 slugs in port order. Single-industry overrides (`make e2e-slice-20 SLUGS=cranestack`) still work since SLUGS is a `?=` assignment.

**Acceptance criteria:**
- [ ] `make -n e2e-slice-20` shows all 10 slugs in the loop
- [ ] `make -n e2e-slice-20 SLUGS=trustguard` shows only TrustGuard
- [ ] No other Make targets affected

**Verification:**
- [ ] `make -n e2e-slice-20` parses cleanly with all 10 slugs

**Dependencies:** B1-1.

**Files touched (1):**
- `Makefile`

**Estimated scope:** XS.

---

### ✅ Checkpoint: Phase B1 complete

- [ ] Fixture matrix has 10 entries
- [ ] Make target defaults to all 10 slugs
- [ ] `cd e2e && npx tsc --noEmit` clean

---

### Phase B2 — Dead-code cleanup

#### Task B2-1: Delete unreferenced forked board components across all 10 industries

**Description:** After Phase B0 lands, every industry's `BoardPage.tsx` consumes the shared `BoardView` from `@crm/shared/components/board/BoardView`. The local forked `KanbanView.tsx` and `BoardTable.tsx` files in each industry's `src/components/` are now unreferenced. `StatusBadge.tsx` is a separate question — it may still be imported by `OverviewDashboard`, `Sidebar`, or other industry-specific surfaces. **Verify before deleting** rather than assuming.

This is a single-agent (or single-session) sequential task — not parallelized. The work is mechanical (grep + rm + commit) and the diff is large but boring; one careful pass beats seven racing agents.

**Methodology:**

For each industry directory (`frontends/{novapay,medvista,trustguard,urbannest,swiftroute,dentaflow,jurispath,tablesync,cranestack,edupulse}`):

1. **Audit imports** before deleting:
   ```bash
   for f in KanbanView BoardTable StatusBadge; do
     echo "--- $f ---"
     grep -rn "from.*['\"].*$f['\"]\|from.*['\"]\\./$f['\"]" frontends/<industry>/src/ 2>/dev/null
   done
   ```
2. **Delete files with zero remaining imports.** Expected: `KanbanView.tsx` + `BoardTable.tsx` are unimported in every industry. `StatusBadge.tsx` may still be used (e.g., by OverviewDashboard's KPI cards) — keep it if so.
3. **Re-run typecheck** after deletion: `cd frontends/<industry> && npx tsc --noEmit`. Must stay clean.
4. **Re-run build:** `npm run build`. Must succeed.

**Acceptance criteria:**
- [ ] For each of the 10 industries: `KanbanView.tsx` and `BoardTable.tsx` deleted IFF zero imports remain
- [ ] `StatusBadge.tsx` deleted IFF zero imports remain (audit per-industry; some may keep it)
- [ ] Per-industry typecheck stays clean after deletion
- [ ] Per-industry build still succeeds
- [ ] `@crm/shared` tests still 69/69 (no regression — unrelated, but proven)
- [ ] One atomic commit per industry: `chore(<industry>): remove unreferenced forked board components (Slice 20B B2)`. The 10 commits land in port order.
- [ ] Document in the commit body: which files were deleted, which were kept (with reason), and the line count delta.

**Verification:**
- [ ] After all deletions: `grep -r "from.*KanbanView\|from.*BoardTable" frontends/<industry>/src/` returns ZERO matches across all 10 industries (only OK matches: imports from `@crm/shared/components/board/...`).
- [ ] `cd frontends/_shared && npm test -- --run` — 69/69 (no shared-lib regression — verified the cleanup doesn't accidentally break shared imports either).

**Dependencies:** B0 + B1 complete (industries actually use shared BoardView).

**Files touched (variable per industry, ~2-3 deletions × 10 = ~20-30 files deleted):**
- `frontends/<industry>/src/components/KanbanView.tsx` — DELETE in all 10
- `frontends/<industry>/src/components/BoardTable.tsx` — DELETE in all 10
- `frontends/<industry>/src/components/StatusBadge.tsx` — DELETE if unimported

**Estimated scope:** M (mechanical but touches many files; one commit per industry keeps reverts targeted if a deletion breaks something).

**Risk:** A non-obvious StatusBadge import (e.g., test fixture, comment-stripped re-export) could silently break a build. Mitigation: typecheck + build per-industry after each deletion, BEFORE moving to the next industry. If anything fails, revert that industry's deletion and document why in the commit body.

---

### ✅ Checkpoint: Phase B2 complete

- [ ] 10 atomic cleanup commits on `main` (one per industry, port-ordered)
- [ ] All 10 industries typecheck + build clean
- [ ] Zero remaining imports of local-fork `KanbanView` / `BoardTable` anywhere in `frontends/*/src/`
- [ ] `@crm/shared` 69/69 (no regression)

---

### Phase B3 — Verification

#### Task B3-1: Cross-project verification + extend `slice-20-verification.md`

**Description:** Mirror Slice 20A's E1 verification across all 10 industries (now post-cleanup). Append a Slice 20B section to the existing `plans/slice-20-verification.md` rather than creating a new doc — keeps the slice's verification trail in one place.

**Acceptance criteria:**
- [ ] `@crm/shared` tests still 69/69 (no regression)
- [ ] Backend test suite same pass count as Slice 20A baseline (582-1 pre-existing flake)
- [ ] All 10 industries typecheck clean
- [ ] All 10 industries `npm run build` succeed
- [ ] Bundle size table per-industry (post-cleanup expected to drop slightly: ~5-15 KB shaved per industry from removing forked components)
- [ ] `plans/slice-20-verification.md` appended with Slice 20B status table per industry, including dead-code-removal audit (which files were deleted per industry).

**Verification:**
- [ ] Each command in the verification log reproducible

**Dependencies:** B2 complete.

**Files touched (1):**
- `plans/slice-20-verification.md`

**Estimated scope:** S (no code changes; the work is running commands and updating the log).

---

### ✅ Checkpoint: Slice 20B complete

- [ ] All 33 commits on `main` (21 from B0 + 1 fixture + 1 makefile + 10 cleanup + 1 verification log)
- [ ] All 10 industries pass typecheck + build
- [ ] Forked KanbanView/BoardTable deleted across all 10 (StatusBadge per-industry audit)
- [ ] Real-time + visual regression criteria still tracked as Slice 20A follow-ups (NOT introduced by 20B)
- [ ] Ready for `/review plans/slice-20b-plan.md`

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| One industry has a structural deviation that breaks the template | Med | Plan recon already spot-checked all 7 — they're identical. If an agent surfaces a new wrinkle, it stops and reports per the agent prompt's "report deviations" requirement. |
| Parallel `npm install` across 7 worktrees thrashes disk I/O | Low | Each worktree has its own `node_modules` (per the worktree isolation guarantees). Slice 20A C0 fanout already proved 2 parallel installs work; 7 may be slower but not failure-prone. |
| Shared-lib unused-import warnings surface for industries the existing ones didn't cover | Low | Slice 20A NovaPay C1 already cleaned up the dead `import React from 'react'` lines in 5 shared files. Remaining 7 industries SHOULD inherit clean state — but if any agent surfaces new ones, they apply the same fix in the same commit (per agent prompt instructions). |
| `useNavigate` crash when an industry adopts something router-only | Low (fictional) | None of the 7 currently use router. The MedVista template is explicitly state-based — agents apply that template, not the NovaPay router-based one. |
| Bundle size grows >1 MB after 7 fanouts | Low | Same shared lib code → same ~860 KB ceiling. Code-splitting is a polish slice candidate (already noted in Slice 20A verification). |
| Cherry-pick conflicts when 7 agents land near-simultaneously | Low | Each agent works in an isolated worktree on its own files. The `cherry-pick` is mechanical — Slice 20A's MedVista + JurisPath cherry-picks landed clean. |
| Slice 19B visual baselines need re-capture for 7 more industries | Low | Out of Slice 20B scope (per Slice 20A's open follow-up). Re-capture happens whenever a future slice next touches `make e2e-visual-update`. |
| Phase B2 cleanup deletes a StatusBadge.tsx still in use by OverviewDashboard or Sidebar | Med | Per-industry grep audit BEFORE delete. Only files with zero remaining imports are removed. Typecheck + build per industry IMMEDIATELY after deletion (not batched) so a regression surfaces in <2 minutes and can be reverted with a one-file `git revert`. |
| Phase B2 cleanup deletes a file the visual baseline still depends on (e.g. CSS class name change cascade) | Low | Visual regression is already an open Slice 20A follow-up — re-capture is required regardless. The cleanup doesn't change rendered output (it only removes unimported files), so this is theoretically risk-free for visuals. |

---

## Open questions

1. **Should Slice 20B run all 7 industry agents in parallel, or stage them in two waves?**
   - Recommendation: **all 7 in parallel.** Slice 20A's MedVista + JurisPath template is locked, the agents have a complete reference (commit SHAs), and the worktree isolation guarantees zero file conflict. The wall-clock saving is 2× over a 4+3 wave split, and we already validated parallel C0/C2/C4 dispatch works.

2. **Should the new fixtures land in port order (3,4,5,6,8,9,10) or alphabetical?**
   - Recommendation: **port order** to match the existing `SLICE_20_INDUSTRIES` ordering convention (NovaPay is port 13001 first, MedVista 13002 second, JurisPath 13007 third). Port order also makes the make target's loop output match `make e2e` ordering, which is the existing user-facing convention.

3. ~~**Should we migrate the local forked components (`KanbanView.tsx`, `BoardTable.tsx`, `StatusBadge.tsx`) for the 7 industries as part of 20B, or defer to a refactor-cleaner slice?**~~ — **RESOLVED: include in 20B as Phase B2** (per user direction). Cleanup is only safe once all 10 industries import from shared, which is the post-B0 state. Folding it into 20B avoids a half-shipped state. The grep+typecheck+build per-industry pattern (10 atomic commits) keeps reverts targeted if a deletion surfaces a non-obvious import.

---

## Parallelization strategy

Phase B0 is **embarrassingly parallel** — 7 worktree-isolated Opus subagents dispatch simultaneously:

```
Agent B0-1 (worktree slice-20b-trustguard):  3 commits (C0/C2/C4 for TrustGuard)
Agent B0-2 (worktree slice-20b-urbannest):   3 commits for UrbanNest
Agent B0-3 (worktree slice-20b-swiftroute):  3 commits for SwiftRoute
Agent B0-4 (worktree slice-20b-dentaflow):   3 commits for DentaFlow
Agent B0-5 (worktree slice-20b-tablesync):   3 commits for TableSync
Agent B0-6 (worktree slice-20b-cranestack):  3 commits for CraneStack
Agent B0-7 (worktree slice-20b-edupulse):    3 commits for EduPulse
```

Each agent's prompt:
1. Names its target industry slug (and port + board name + brand color from the fixture table).
2. Cites MedVista's three reference commits (`533bab9`, `63ec93f`, `289576c`) for the agent to study via `git show`.
3. Specifies the exact file list (8–10 files per industry).
4. Specifies the verification gate per commit (`tsc --noEmit` + `npm run build`).
5. Specifies the commit message format and Git config (Armando Gonzalez, no `Co-Authored-By`, no `--no-verify`).
6. Specifies what NOT to do (don't touch other industries, don't migrate forked components, don't change shared library).

After all 7 agents complete, cherry-pick their commits onto `main` (Slice 20A's pattern: agents land directly on main when their worktree base was current; otherwise `git cherry-pick <sha>` from main).

Phase B1 + B2 run sequentially after B0 completes.

---

## Todo checklist (copy into work session)

```
Phase B0 — Per-industry fanout (7 parallel agents)
- [ ] B0-1 TrustGuard  (3 commits)
- [ ] B0-2 UrbanNest   (3 commits)
- [ ] B0-3 SwiftRoute  (3 commits)
- [ ] B0-4 DentaFlow   (3 commits)
- [ ] B0-5 TableSync   (3 commits)
- [ ] B0-6 CraneStack  (3 commits)
- [ ] B0-7 EduPulse    (3 commits)
- [ ] Checkpoint B0: 21 commits on main, shared 69/69, all 10 typecheck+build clean

Phase B1 — Fixture matrix + make target (sequential)
- [ ] B1-1 Expand SLICE_20_INDUSTRIES to 10 entries
- [ ] B1-2 Update make e2e-slice-20 SLUGS default
- [ ] Checkpoint B1: e2e typecheck clean, make target parses

Phase B2 — Dead-code cleanup (sequential, one industry at a time)
- [ ] B2-1 NovaPay      cleanup commit (audit + delete + verify)
- [ ] B2-1 MedVista     cleanup commit
- [ ] B2-1 TrustGuard   cleanup commit
- [ ] B2-1 UrbanNest    cleanup commit
- [ ] B2-1 SwiftRoute   cleanup commit
- [ ] B2-1 DentaFlow    cleanup commit
- [ ] B2-1 JurisPath    cleanup commit
- [ ] B2-1 TableSync    cleanup commit
- [ ] B2-1 CraneStack   cleanup commit
- [ ] B2-1 EduPulse     cleanup commit
- [ ] Checkpoint B2: 10 cleanup commits, no remaining KanbanView/BoardTable imports

Phase B3 — Verification
- [ ] B3-1 Cross-project sweep + slice-20-verification.md addendum
- [ ] Checkpoint: Slice 20B shipped → /review
```

---

**Next step after this plan is approved:** Dispatch all 7 B0 agents in parallel via `Agent` tool with `isolation: "worktree"` + `run_in_background: true` + `model: "opus"`.
