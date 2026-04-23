# Slice 19C — Perf Verification Log (Task H1)

Live document tracking perf-suite reproducibility runs. Each run entry
captures: host, commit baseline, three p50/p95/p99 samples, isolation
audit, and a reference to the median report that was promoted to
`baseline.md`.

## Acceptance criteria (from plan)

1. `make e2e-perf` completes in < 30 min on a clean checkout
2. All pass/fail SLOs pass (WS 500-client connect, cache hit > 80%,
   DB pool healthy, upload quota integrity)
3. Markdown report emitted with p50/p95/p99 + regression diff vs baseline
4. 3 consecutive runs within ±10% of each other (reproducibility)
5. Dev DB (`crm_platform`) row counts unchanged after all runs
6. `tsc --noEmit` clean on backend + e2e/ + e2e/perf/

---

## Runs

### 2026-04-22 — Initial scope

**Status:** Verification deferred pending pre-existing infrastructure blockers.

**Blocker (same class as Slice 19 I1 + Slice 19B F1):** executing
`make e2e-perf` end-to-end requires:
- Backend Docker image to build (works — verified during Slice 19
  live-run attempt)
- `npm run seed:perf` to succeed inside the perf container against
  the `crm_perf` DB (should work — B1/B2 seeders are Postgres-
  agnostic and the overlay sets NODE_ENV=perf correctly)
- Artillery v2 + socketio-v3 engine to connect to the backend's
  Socket.io server — **unvalidated end-to-end**; engine compat notes
  in SPEC §Slice 19C suggest it should Just Work with Socket.io v4
  server, but no live run has been done

None of the above are Slice 19C defects per se — they're consequences
of the project never having run `docker compose up` for the full
stack before these slices. Compute-side (F1 orchestrator, F2 renderer,
scenarios) all pass their respective unit/shape tests; only the
docker + runtime integration is unverified.

**What IS verified locally (non-runtime):**

- `cd e2e/perf && npx tsc --noEmit` exits 0 across all Artillery +
  orchestrator + report TypeScript
- `cd e2e/perf && node --test dist/__tests__/*.js` passes 6/6 for run.ts
- `cd e2e/perf && node --test dist/lib/__tests__/*.js` passes 12/12
  for report.ts and 4/4 for fixtures.ts
- `cd e2e/perf && node --test dist/artillery/__tests__/*.js` passes
  for all 4 scenario shape-validators (11 A, 15 B, 4 C, 6 D = 36 tests)
- `docker compose -f docker-compose.yml -f docker-compose.perf.yml --profile perf config --services`
  lists exactly `postgres, redis, backend` with correct resource limits
- `make -n e2e-perf` dry-runs cleanly through all 5 targets
- Backend: 572/572 Jest tests passing including safety guard (8 new)
  that refuses non-crm_perf DB names under NODE_ENV=perf
- `scripts/verify-perf-reproducibility.sh` is executable and has its
  pre-flight correctness verified (prints usage when deps absent)

**Follow-up tasks required to close H1 runtime verification:**

1. **Resolve industry frontend build errors** (same item as Slice 19.5
   ticket — carries across 19 + 19B + 19C live runs). Perf doesn't
   need the frontends (only backend + postgres + redis), but seeding
   via `npm run seed` at Slice 19's make target relies on healthy
   images, and the perf overlay's seed step uses `seed:perf` which
   doesn't touch frontends. Actually: perf may not need this blocker
   resolved — the perf seeder is backend-only. **Retry live run of
   `make e2e-perf` now that this review item is documented.**
2. **Socket.io v3/v4 engine compat smoke** — run scenario-b against
   a running backend for 60 seconds with 50 clients (short env) to
   prove the engine handshakes correctly with the real server.
3. **First full run** — `bash scripts/verify-perf-reproducibility.sh`
   with Docker up. Investigate any p50/p95/p99 drift beyond 10%;
   usually caused by cold cache, fix by extending warmup.

---

### Template for future verification runs

```
### YYYY-MM-DD — <context>

**Host:** <os / cpu / mem>
**Commit baseline captured against:** <SHA>
**Perf image pinned:** backend runtime = <docker image tag>

Run 1: make e2e-perf → exit 0, all SLOs pass
  Scenario (a) p50=<ms> p95=<ms> p99=<ms>
Run 2: make e2e-perf → exit 0
  Scenario (a) p50=<ms> p95=<ms> p99=<ms>
Run 3: make e2e-perf → exit 0
  Scenario (a) p50=<ms> p95=<ms> p99=<ms>

Reproducibility: p50 within ±<X>%, p95 within ±<Y>%, p99 within ±<Z>%
Dev DB row delta: 0 tables changed (isolation verified)
Pass/fail SLOs:
  - WS 500-client connect: PASS / FAIL
  - Cache hit > 80% after warmup: PASS / FAIL
  - DB pool no exhaustion: PASS / FAIL
  - Upload quota integrity (50 × 5 MB, 200 MB quota): 40 OK / 10 × 413: PASS / FAIL

Baseline promoted from: <median-run-report-path>
Verified by: <name>
```
