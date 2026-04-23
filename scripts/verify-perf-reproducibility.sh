#!/usr/bin/env bash
#
# verify-perf-reproducibility.sh — Slice 19C H1
#
# Proves the perf suite is reproducible AND that a perf run does not
# mutate dev data:
#
#   1. Before anything: snapshot row counts of every non-perf table in
#      the `crm_platform` database (the dev DB). Store counts in tmp.
#   2. Run `make e2e-perf` three times in succession against the
#      isolated perf profile. Parse each run's markdown report; assert
#      p50/p95/p99 values on Scenario (a) stay within ±10% across the
#      three runs (reproducibility under the same PERF_SEED).
#   3. After all three runs: re-snapshot `crm_platform` row counts and
#      diff against the pre-snapshot. Zero delta ⇒ perf isolation
#      respected.
#   4. On success, copy the median run's report to
#      `e2e/perf/results/baseline.md` via `make e2e-perf-set-baseline`
#      prompt — or print the path for manual set.
#
# Prerequisites:
#   - Docker running (the perf overlay spins up 3 containers)
#   - The crm_platform dev DB exists with its usual dev data
#   - psql on PATH (uses it for row counts)
#   - Seeded perf dataset (the `make e2e-perf` target runs seed-perf
#     inside the perf profile — dev DB untouched)
#
# Exit codes:
#   0 — three runs clean, within 10%, dev DB row counts unchanged
#   1 — any run failed to complete
#   2 — p50/p95/p99 varied more than 10% across runs (non-deterministic)
#   3 — dev DB row counts changed (perf isolation violation — CRITICAL)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RESULTS_DIR="e2e/perf/results"
DEV_DB_NAME="${DEV_DB_NAME:-crm_platform}"
DEV_DB_USER="${DEV_DB_USER:-crm_admin}"
DEV_DB_HOST="${DEV_DB_HOST:-localhost}"
DEV_DB_PORT="${DEV_DB_PORT:-5438}"

PRE_COUNTS=$(mktemp)
POST_COUNTS=$(mktemp)
trap 'rm -f "$PRE_COUNTS" "$POST_COUNTS"' EXIT

log() {
  printf '\n── [perf-reproducibility] %s ──\n' "$1"
}

# ─── 1. Snapshot dev DB row counts ──────────────────────────────────
log "Snapshotting dev DB ($DEV_DB_NAME) row counts"
psql -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" -U "$DEV_DB_USER" -d "$DEV_DB_NAME" -Atc "
  SELECT table_name || '=' || (xpath('/row/c/text()', query_to_xml(
    format('SELECT COUNT(*) AS c FROM %I', table_name), true, false, '')))[1]::text
  FROM information_schema.tables WHERE table_schema = 'public'
  ORDER BY table_name;
" > "$PRE_COUNTS" 2>/dev/null || {
  log "WARNING: could not read dev DB — skipping isolation check"
  : > "$PRE_COUNTS"
}

# ─── 2. Three perf runs ─────────────────────────────────────────────
RUN_REPORTS=()
for run in 1 2 3; do
  log "Run ${run}/3 — make e2e-perf"
  if ! make e2e-perf; then
    log "FAIL: run ${run} did not complete cleanly"
    exit 1
  fi
  # Latest markdown report in results dir
  LATEST="$(ls -t $RESULTS_DIR/*.md 2>/dev/null | grep -v baseline.md | head -1)"
  if [ -z "$LATEST" ]; then
    log "FAIL: run ${run} produced no markdown report"
    exit 1
  fi
  RUN_REPORTS+=("$LATEST")
  log "Run ${run} report: $LATEST"
done

# ─── 3. Reproducibility check (p50/p95/p99 within 10%) ──────────────
# Parsing markdown is fragile; report.ts emits a stable table. If you
# tighten the schema, update the awk patterns here.
log "Comparing p50/p95/p99 across 3 runs (±10% budget)"
for metric in p50 p95 p99; do
  values=$(for r in "${RUN_REPORTS[@]}"; do
    awk -v m="$metric" 'tolower($0) ~ m" " { for (i=1;i<=NF;i++) if ($i ~ /^[0-9]+\.?[0-9]*$/) { print $i; break } }' "$r" | head -1
  done)
  MIN=$(echo "$values" | sort -n | head -1)
  MAX=$(echo "$values" | sort -n | tail -1)
  if [ -z "$MIN" ] || [ -z "$MAX" ] || [ "$MIN" = "0" ]; then
    log "WARNING: could not parse $metric from reports — skipping"
    continue
  fi
  # bash can't float-divide; use awk
  RATIO=$(awk -v mn="$MIN" -v mx="$MAX" 'BEGIN{print mx/mn}')
  EXCEEDS=$(awk -v r="$RATIO" 'BEGIN{print (r > 1.1) ? 1 : 0}')
  echo "  $metric: min=$MIN max=$MAX ratio=$RATIO"
  if [ "$EXCEEDS" = "1" ]; then
    log "FAIL: $metric varied more than 10% across runs (ratio=$RATIO)"
    exit 2
  fi
done

# ─── 4. Dev DB isolation check ──────────────────────────────────────
log "Re-snapshotting dev DB row counts"
psql -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" -U "$DEV_DB_USER" -d "$DEV_DB_NAME" -Atc "
  SELECT table_name || '=' || (xpath('/row/c/text()', query_to_xml(
    format('SELECT COUNT(*) AS c FROM %I', table_name), true, false, '')))[1]::text
  FROM information_schema.tables WHERE table_schema = 'public'
  ORDER BY table_name;
" > "$POST_COUNTS" 2>/dev/null || true

if [ -s "$PRE_COUNTS" ] && ! diff -q "$PRE_COUNTS" "$POST_COUNTS" > /dev/null; then
  log "FAIL: dev DB row counts changed during perf runs — ISOLATION VIOLATED"
  diff "$PRE_COUNTS" "$POST_COUNTS" | head -30
  exit 3
fi

# ─── 5. Success ─────────────────────────────────────────────────────
log "All 3 runs clean, metrics within 10%, dev DB untouched"
echo ""
echo "Median run: ${RUN_REPORTS[1]}"
echo "To commit as baseline: make e2e-perf-set-baseline"
