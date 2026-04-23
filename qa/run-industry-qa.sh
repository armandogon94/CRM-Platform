#!/usr/bin/env bash
#
# run-industry-qa.sh — Slice 19.7 per-industry orchestrator.
#
# Usage:   ./qa/run-industry-qa.sh <slug>
# Example: ./qa/run-industry-qa.sh novapay
#
# Brings up postgres + redis + backend + <slug>-frontend, seeds just that
# industry, runs the QA harness, tears the stack down with `down -v` so
# the next invocation starts clean.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <industry-slug>"
  echo "Valid slugs: novapay, medvista, trustguard, urbannest, swiftroute,"
  echo "             dentaflow, jurispath, tablesync, cranestack, edupulse"
  exit 1
fi

SLUG="$1"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.e2e.yml"
HEALTH_URL="http://localhost:13000/health"

# Map slug -> frontend service name + seed script.
case "$SLUG" in
  novapay|medvista|trustguard|urbannest|swiftroute|dentaflow|jurispath|tablesync|cranestack|edupulse)
    FRONTEND="${SLUG}-frontend"
    SEED_SCRIPT="seed:${SLUG}"
    ;;
  *)
    echo "Unknown industry slug: $SLUG"; exit 1;;
esac

log() { printf '\n── [%s] %s ──\n' "$SLUG" "$1"; }

cleanup() {
  log "Teardown"
  $COMPOSE down -v > /dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

log "1/5 Starting postgres + redis"
$COMPOSE up -d --wait postgres redis

log "2/5 Starting backend"
$COMPOSE up -d backend
for i in $(seq 1 60); do
  if curl -sfS "$HEALTH_URL" > /dev/null 2>&1; then
    log "Backend /health up after ${i}s"
    break
  fi
  sleep 1
done
curl -sfS "$HEALTH_URL" > /dev/null || {
  echo "Backend /health never came up — aborting"
  exit 1
}

log "3/5 Seeding industry: $SLUG"
$COMPOSE exec -T backend npm run "$SEED_SCRIPT" > /tmp/seed-$SLUG.log 2>&1 || {
  echo "Seed failed — see /tmp/seed-$SLUG.log"
  tail -20 /tmp/seed-$SLUG.log
  exit 1
}
tail -3 /tmp/seed-$SLUG.log

# NovaPay seeds don't auto-run the main CRM admin user (admin@crm-platform.com),
# which other seed tasks inherit from the master seed. For QA we log in as the
# industry-specific admin (admin@<slug>.com / demo123) which EVERY industry
# seed creates, so this step is sufficient.

log "4/5 Starting $FRONTEND"
$COMPOSE up -d "$FRONTEND"
sleep 5
curl -sfS "http://localhost:$(grep -A5 "${FRONTEND}:" docker-compose.yml | grep -oE '[0-9]{5}:' | head -1 | tr -d ':')/" > /dev/null 2>&1 || {
  log "Frontend not yet serving — wait another 5s"
  sleep 5
}

log "5/5 Running Playwright QA spec"
mkdir -p "qa-results/$SLUG"
cd e2e
# Use e2e/'s installed @playwright/test. The harness lives at ../qa/harness.
INDUSTRY="$SLUG" npx playwright test --config=playwright.qa.config.ts 2>&1 | tee "../qa-results/$SLUG/playwright-stdout.log" || true
cd ..

log "Results saved to qa-results/$SLUG/"
ls -la "qa-results/$SLUG/" 2>/dev/null
