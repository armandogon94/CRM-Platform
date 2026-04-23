# Perf Baseline

No baseline yet — run `make e2e-perf-set-baseline` after 3 stable runs

<!--
When `make e2e-perf-set-baseline` is invoked (Slice 19C Task G1), it
will overwrite this file with the measured p50/p95/p99 values from the
most recent stable run. Until that happens, the regression diff in
`e2e/perf/lib/report.ts` falls through to the "No baseline" placeholder
and emits no ▲/▼ arrows.

Expected shape of a populated baseline (Slice 19C F2 consumer format):

  ## Scenario (a) REST
  - p50: <ms>
  - p95: <ms>
  - p99: <ms>

  ## Scenario (b) WebSocket
  - ws.fanout p95: <ms>

  ## Scenario (c) Automation
  - automation.burst p95: <ms>

Do NOT auto-populate this file. Baselines are a human decision per
SPEC §19C — only promote a run after three consecutive results agree
within 10%.
-->
