# Contributing to the CRM Platform

Thanks for contributing. The authoritative workflow artifacts for this repo live in [SPEC.md](./SPEC.md) (slice-by-slice specification and ADRs) and the [`plans/`](./plans/) directory (per-slice implementation plans). Read the relevant slice in `SPEC.md` and its matching `plans/slice-*.md` before starting any non-trivial change — every feature in the repo was shipped against one of those specs.

## Running the E2E suite

The Playwright suite runs against the full Docker Compose stack (Postgres + Redis + backend + 10 industry frontends). All targets are defined in the root `Makefile`.

- `make e2e` — full suite: boots the stack, seeds every industry, runs all Playwright projects, then tears the stack down (`down -v`, clean DB each run).
- `make e2e-desktop` — desktop-only projects (`desktop-novapay`, `desktop-branding-all`); same boot/teardown lifecycle as `make e2e`.
- `make e2e-mobile` — mobile project only (`mobile-novapay`); boots a minimal stack (backend + `novapay-frontend`) and seeds only NovaPay.
- `make e2e-ui` — Playwright UI mode against an already-running stack; no teardown, no DB wipe. Use for interactive debugging.

## Running visual regression (Slice 19B)

Visual regression uses Playwright-native `toHaveScreenshot()` with baselines committed under `e2e/__screenshots__/`. Snapshots are only deterministic when rendered inside the pinned Playwright Docker image (`mcr.microsoft.com/playwright:v1.48.0-jammy`); `e2e/playwright.visual.config.ts` detects host-machine runs (neither `CI=true` nor `E2E_DOCKER=1` set) and throws immediately.

- `make e2e-visual` — build the pinned image if needed, run the visual suite in the container, emit HTML diff report + JUnit XML. Fails on any snapshot mismatch.
- `make e2e-visual-update` — same as above but with `--update-snapshots`, regenerating every changed baseline in `e2e/__screenshots__/`. Never run this without first inspecting the diff report from `make e2e-visual` (see two-step workflow below).
- `make e2e-visual-ui` — Playwright UI mode against a running stack for interactive snapshot inspection; assumes the stack is already up and does not tear it down.

## Updating Visual Baselines

This is the two-step workflow every visual baseline update follows. The goal: force a deliberate review of each PNG diff before regenerating baselines, so a color or spacing regression can never be committed by reflex.

**When to update baselines:**

- You intentionally changed UI that is under snapshot coverage (brand color, layout, typography, added/removed element).
- You added a new `*.visual.spec.ts` that references a baseline that does not yet exist.

Do **not** update baselines to "make the build green" when you did not intend to change the UI — that is the failure mode this workflow exists to prevent.

### Step 1 — Generate the diff report (DO NOT update yet)

```bash
make e2e-visual
# Suite fails on any changed snapshot (expected).
# Open the HTML report and review each before/after side-by-side diff:
open e2e/playwright-report-visual/index.html
# Inspect every failing case. Confirm each diff reflects an intended change.
```

### Step 2 — If every diff is intentional, regenerate and commit

```bash
make e2e-visual-update
# Regenerates PNGs in e2e/__screenshots__/ using --update-snapshots.

# Verify the file-level change set matches what you expect:
git diff --stat e2e/__screenshots__/

# Stage and commit with a descriptive message:
git add e2e/__screenshots__/
git commit -m "visual: update baselines for <change description>"
```

**Never run `make e2e-visual-update` without first inspecting the diff report from Step 1.** The `--update-snapshots` flag silently overwrites every changed baseline; running it reflexively defeats the entire visual regression suite.

See [`SPEC.md#slice-19b-visual-regression-testing-size-l`](./SPEC.md#slice-19b-visual-regression-testing-size-l) for the full ADR, the ~119-snapshot matrix (desktop × mobile × state variants), and the determinism / flake-prevention strategy.

## Code review

Every change goes through review before merge. Reviewers check correctness, readability, test coverage, and spec alignment against the `SPEC.md` slice the change belongs to.

## Commit format

Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`). Keep commits atomic — one logical change per commit. Do **not** add `Co-Authored-By` trailers for AI assistants; only human contributors should appear as authors.
