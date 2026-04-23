#!/usr/bin/env bash
#
# verify-visual-determinism.sh — Slice 19B F1
#
# Proves the visual regression suite is deterministic by running
# `make e2e-visual` three times in succession against committed
# baselines and failing if any run produces a pixel diff.
#
# Also enforces the 50 MB budget on e2e/__screenshots__/ (SPEC §19B
# snapshot matrix) so an accidental un-masked region can't bloat the
# repo.
#
# Prerequisites:
#   - Docker must be running (make e2e-visual spins up 3 containers)
#   - The `e2e-visual` Playwright image must be pullable
#   - Baselines must already exist in e2e/__screenshots__/; if missing,
#     the script will fail on run #1 and tell you to `make
#     e2e-visual-update` first.
#
# Exit codes:
#   0  — all three runs clean, size under budget
#   1  — any run detected a diff (non-determinism bug)
#   2  — baseline directory exceeds 50 MB
#   3  — baselines missing entirely

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCREENSHOTS_DIR="e2e/__screenshots__"
SIZE_BUDGET_MB=50

log() {
  printf '\n── [visual-determinism] %s ──\n' "$1"
}

# ─── 0. Pre-flight ──────────────────────────────────────────────────
if [ ! -d "$SCREENSHOTS_DIR" ]; then
  log "No baselines found at $SCREENSHOTS_DIR"
  echo "Run \`make e2e-visual-update\` first to generate them, inspect"
  echo "the report, then commit the PNGs before rerunning this script."
  exit 3
fi

# ─── 1. Size budget ─────────────────────────────────────────────────
log "Measuring baseline directory size"
SIZE_BYTES="$(du -sk "$SCREENSHOTS_DIR" | awk '{print $1 * 1024}')"
SIZE_MB="$((SIZE_BYTES / 1024 / 1024))"
echo "Baseline size: ${SIZE_MB} MB (budget ${SIZE_BUDGET_MB} MB)"

if [ "$SIZE_MB" -gt "$SIZE_BUDGET_MB" ]; then
  log "FAIL: baseline directory exceeds ${SIZE_BUDGET_MB} MB"
  echo "Investigate: du -sh $SCREENSHOTS_DIR/*"
  exit 2
fi

# ─── 2. Three-run determinism ───────────────────────────────────────
for run in 1 2 3; do
  log "Run ${run}/3 — make e2e-visual"
  if ! make e2e-visual; then
    log "FAIL: run ${run} detected a diff"
    echo "Open e2e/playwright-report-visual/index.html for side-by-side"
    echo "diffs. Either the suite is non-deterministic (investigate"
    echo "masks, fonts, networkidle) or a real regression slipped in."
    exit 1
  fi
done

# ─── 3. Success ─────────────────────────────────────────────────────
log "All 3 runs clean; baseline directory ${SIZE_MB} MB / ${SIZE_BUDGET_MB} MB"
echo "Visual suite verified deterministic."
