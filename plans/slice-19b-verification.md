# Slice 19B — Verification Log (Task F1)

This document tracks the determinism verification for the visual
regression suite. It is deliberately a LIVE document — every time
the baseline set is rotated (new specs, theme migration, design
refresh), a verification entry should be appended here.

## Acceptance criteria (from plan)

1. Three consecutive `make e2e-visual` runs produce zero pixel diffs
   across every committed baseline.
2. Total size of `e2e/__screenshots__/` ≤ 50 MB.
3. A deliberate 1-char color change in `frontends/_shared/src/theme.ts`
   (NovaPay `primaryColor`) makes the suite fail with a readable HTML
   diff report. Reverting the change makes it green again.
4. The `scripts/verify-visual-determinism.sh` helper committed so
   future contributors can re-run the 3-run check before PRs that
   touch visual specs.

---

## Runs

### 2026-04-22 — Initial scope

**Status:** Verification deferred pending Slice 17/18 debt resolution.

**Blocker:** `make e2e-visual` cannot complete end-to-end against the
current repository state because the 10 industry frontends either have
TypeScript build errors (9 of 10) or use state-based navigation that
diverges from the shared-library's router-based pages (NovaPay).
See Slice 19 review findings for the same class of blocker.

Specifically, two classes of issue surface before any baseline can be
captured:

1. **Frontend build failures** — Non-NovaPay industries still fail
   `npm run build` on the same unused-import / type-conversion issues
   that NovaPay hit. NovaPay was fixed in commit `0514309` (Slice 19
   review-fix for I1 scope creep), but 9 others remain.
2. **Navigation contract mismatch** — NovaPay doesn't use react-router;
   the visual specs' `page.goto('/')` + state-based waits are
   deliberate workarounds but have never been exercised live.

Until both classes are addressed (probably a dedicated "Slice 19.5:
industry frontend production-readiness" ticket), the visual suite's
artifacts (spec files, helper, baseline-update workflow, make
targets, Docker container pinning) are committed but not live-verified.

**What IS verified locally (non-runtime):**

- `cd e2e && npx tsc --noEmit` exits 0 across the 5 visual spec files
- `E2E_DOCKER=true npx playwright test --config=playwright.visual.config.ts --list`
  reports 55 tests across 5 files (matches the scoped matrix:
  login × 10 + board-list × 2 + board-views × 16 + state-variants × 8
  mobile-skipped effectively + mobile-smoke × 1 × 2 projects with
  1 skipped)
- Host-run blocker in `playwright.visual.config.ts` throws when
  `E2E_DOCKER` / `CI` are unset (proven by failed `npx playwright
  test --config=playwright.visual.config.ts --list` without env)
- `docker compose -f docker-compose.yml -f docker-compose.e2e.yml --profile visual config`
  exits 0 and includes `e2e-visual` with the pinned Playwright image

**Follow-up tasks required to close F1 runtime verification:**

1. Resolve the 9 non-NovaPay industry frontend build failures (same
   type-error class NovaPay hit: unused imports, `as Type[]` casts
   against non-array response shapes). Estimated: ~90 minutes of
   mechanical edits.
2. Decide NovaPay navigation direction — either migrate to the shared
   library's router-based pages, or rewrite the 19 + 19B specs to
   consume state-based nav. Migration is the cleaner long-term
   choice; spec rewrite is faster.
3. Once 1 + 2 land, execute: `make e2e-visual-update` (first run
   generates baselines), then `bash scripts/verify-visual-determinism.sh`
   (proves 3-run reproducibility).
4. Execute the brand-break smoke test: temporarily change `NOVAPAY.primaryColor`
   in `frontends/_shared/src/theme.ts` from `#2563EB` to `#2563EC`
   (1 char). Run `make e2e-visual`. Suite should fail with the login
   and authenticated-page baselines showing a pixel delta. Revert,
   re-run, confirm green. Record the outputs in this doc.

---

### Template for future verification runs

```
### YYYY-MM-DD — <context>

**Host:** macOS 15.x / Ubuntu 24.04 (Docker Desktop vX.Y)
**Docker image:** mcr.microsoft.com/playwright:v1.59.1-jammy
**Commit baseline captured against:** <SHA>

Run 1: make e2e-visual → exit 0, N passed, 0 diffs
Run 2: make e2e-visual → exit 0, N passed, 0 diffs
Run 3: make e2e-visual → exit 0, N passed, 0 diffs

Baseline size: XX MB / 50 MB budget

Brand-break smoke:
  - theme.ts NOVAPAY.primaryColor: #2563EB → #2563EC
  - make e2e-visual → exit 1, <K> baselines diverged (expected: all
    NovaPay login + post-auth pages)
  - Revert + make e2e-visual → exit 0

Verified by: <name>
```
