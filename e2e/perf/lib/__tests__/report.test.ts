/**
 * Tests for lib/report — Slice 19C F2.
 *
 * Uses Node's built-in test runner (`node:test`, Node 20+) to stay
 * consistent with fixtures.test.ts and avoid dragging Jest/Mocha into
 * the perf package.
 *
 * Run after `npm run build`:
 *   node --test dist/lib/__tests__/report.test.js
 *
 * Covers the task's RED contract:
 *   - `renderReport` is a pure function (returns { markdown, shouldExit };
 *     no filesystem writes).
 *   - Markdown contains an h1, a run-metadata section (commit SHA, node
 *     version, date, host CPU + RAM).
 *   - SLO table lists one row per SPEC metric with measured vs. target.
 *   - Latency regressions >10% are flagged with ▲/▼ arrows but do NOT
 *     cause shouldExit to be non-zero (flag-only policy).
 *   - Pass/fail SLOs (cache hit <80%, DB pool exhaustion, WS connect-all
 *     <500, file upload quota mismatch) DO cause shouldExit !== 0.
 *   - Missing baseline → renders the "no baseline yet" placeholder.
 *   - Raw JSON paths are linked at the bottom of the report.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderReport } from '../report';
import type {
  ArtilleryAggregate,
  RunMeta,
  ScenarioResult,
} from '../report';

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

/**
 * Baseline Artillery aggregate matching SPEC targets.
 * REST: p50 80, p95 400, p99 800 (inside SLO envelope)
 * Error rate: 0.05%  (0.0005)
 * Cache hit: 90% (0.9)
 * WS connect: 500 clients all succeed
 * File upload: quota integrity OK
 */
function makeRestAggregate(over: Partial<ArtilleryAggregate> = {}): ArtilleryAggregate {
  return {
    counters: {
      'http.requests': 60000,
      'http.codes.200': 59970,
      'http.codes.500': 30,
      'vusers.failed': 30,
      'vusers.completed': 59970,
      'cache.hit': 54000,
      'cache.miss': 6000,
      'db.pool.exhaustion_events': 0,
      ...(over.counters ?? {}),
    },
    rates: {},
    summaries: {
      'http.response_time': {
        min: 10,
        max: 1200,
        mean: 90,
        p50: 80,
        p95: 400,
        p99: 800,
      },
      ...(over.summaries ?? {}),
    },
  };
}

function makeWsAggregate(over: Partial<ArtilleryAggregate> = {}): ArtilleryAggregate {
  return {
    counters: {
      'ws.connect.success': 500,
      'ws.connect.fail': 0,
      ...(over.counters ?? {}),
    },
    rates: {},
    summaries: {
      'ws.fanout.latency': {
        min: 20,
        max: 400,
        mean: 120,
        p50: 100,
        p95: 180,
        p99: 220,
      },
      ...(over.summaries ?? {}),
    },
  };
}

function makeAutomationAggregate(): ArtilleryAggregate {
  return {
    counters: {
      'automation.log.rows': 400,
      'http.requests': 100,
      'http.codes.201': 100,
    },
    rates: {},
    summaries: {
      'automation.burst.duration_ms': {
        min: 1000,
        max: 12000,
        mean: 8000,
        p50: 8000,
        p95: 11000,
        p99: 11800,
      },
    },
  };
}

function makeFileUploadAggregate(over: Partial<ArtilleryAggregate> = {}): ArtilleryAggregate {
  return {
    counters: {
      'http.requests': 50,
      'http.codes.201': 40,
      'http.codes.413': 10,
      'upload.quota.mismatch': 0,
      ...(over.counters ?? {}),
    },
    rates: {},
    summaries: {
      'http.response_time': {
        min: 100,
        max: 3000,
        mean: 1500,
        p50: 1400,
        p95: 2800,
        p99: 2950,
      },
      ...(over.summaries ?? {}),
    },
  };
}

function makeMeta(over: Partial<RunMeta> = {}): RunMeta {
  return {
    commitSha: 'abc123456789',
    nodeVersion: 'v20.10.0',
    dateIso: '2026-04-22T12:00:00.000Z',
    host: { cpu: 'Apple M3 Pro', memMb: 32768 },
    ...over,
  };
}

function makeResults(
  override: Partial<Record<ScenarioResult['scenario'], ArtilleryAggregate>> = {},
): ScenarioResult[] {
  return [
    {
      scenario: 'a',
      jsonPath: 'results/2026-04-22T12-00-00-scenario-a.json',
      aggregate: override.a ?? makeRestAggregate(),
    },
    {
      scenario: 'b',
      jsonPath: 'results/2026-04-22T12-00-00-scenario-b.json',
      aggregate: override.b ?? makeWsAggregate(),
    },
    {
      scenario: 'c',
      jsonPath: 'results/2026-04-22T12-00-00-scenario-c.json',
      aggregate: override.c ?? makeAutomationAggregate(),
    },
    {
      scenario: 'd',
      jsonPath: 'results/2026-04-22T12-00-00-scenario-d.json',
      aggregate: override.d ?? makeFileUploadAggregate(),
    },
  ];
}

// A synthetic baseline with the same numbers as makeRestAggregate but
// slightly different so regression math has non-zero input.
const BASELINE_STABLE = `# Perf Baseline

## Scenario (a) REST
- p50: 80
- p95: 400
- p99: 800

## Scenario (b) WebSocket
- ws.fanout p95: 180

## Scenario (c) Automation
- automation.burst p95: 11000

## Scenario (d) File upload
- p95: 2800
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('renderReport returns a pure { markdown, shouldExit } object (no FS writes)', () => {
  const result = renderReport(makeResults(), BASELINE_STABLE, makeMeta());
  assert.equal(typeof result.markdown, 'string');
  assert.equal(typeof result.shouldExit, 'number');
  assert.ok(result.markdown.length > 0, 'expected non-empty markdown');
});

test('renderReport output has an h1 and a run metadata section', () => {
  const { markdown } = renderReport(makeResults(), BASELINE_STABLE, makeMeta());
  // h1 present
  assert.match(markdown, /^# /m, 'expected a top-level h1 heading');
  // Metadata: commit SHA, node version, date, host info all surfaced
  assert.match(markdown, /abc123456789/, 'expected commit SHA in metadata');
  assert.match(markdown, /v20\.10\.0/, 'expected node version in metadata');
  assert.match(markdown, /2026-04-22T12:00:00\.000Z/, 'expected ISO date in metadata');
  assert.match(markdown, /Apple M3 Pro/, 'expected host CPU in metadata');
  assert.match(markdown, /32768/, 'expected host memory in metadata');
});

test('renderReport includes SLO table rows for REST p50/p95/p99 and WS concurrent', () => {
  const { markdown } = renderReport(makeResults(), BASELINE_STABLE, makeMeta());
  // REST latency SLO rows
  assert.match(markdown, /REST.*p50/i, 'expected REST p50 row');
  assert.match(markdown, /REST.*p95/i, 'expected REST p95 row');
  assert.match(markdown, /REST.*p99/i, 'expected REST p99 row');
  // WS concurrent connections target
  assert.match(markdown, /WebSocket.*concurrent|concurrent.*connections/i, 'expected WS connect row');
  assert.match(markdown, /500/, 'expected WS target 500 in SLO table');
  // Target envelope numbers from SPEC
  assert.match(markdown, /100/, 'expected REST p50 target 100 ms');
  assert.match(markdown, /1000/, 'expected REST p99 target 1000 ms');
});

test('renderReport flags >10% latency regressions with ▲ arrow but keeps shouldExit === 0', () => {
  // Scenario (a) p95 = 600 vs baseline p95 = 400 → +50% regression (slower)
  const worseRest = makeRestAggregate({
    summaries: {
      'http.response_time': {
        min: 10,
        max: 1500,
        mean: 160,
        p50: 85,
        p95: 600,
        p99: 900,
      },
    },
  });
  const { markdown, shouldExit } = renderReport(
    makeResults({ a: worseRest }),
    BASELINE_STABLE,
    makeMeta(),
  );
  // Flag arrow present
  assert.match(markdown, /▲/, 'expected ▲ arrow for a >10% latency regression');
  // Flag-only: latency regressions must not fail the run
  assert.equal(shouldExit, 0, 'expected shouldExit=0 for latency-only regression');
});

test('renderReport marks >10% latency improvement with ▼ arrow', () => {
  const fasterRest = makeRestAggregate({
    summaries: {
      'http.response_time': {
        min: 5,
        max: 600,
        mean: 40,
        p50: 40,
        p95: 200,
        p99: 500,
      },
    },
  });
  const { markdown } = renderReport(
    makeResults({ a: fasterRest }),
    BASELINE_STABLE,
    makeMeta(),
  );
  assert.match(markdown, /▼/, 'expected ▼ arrow for a >10% latency improvement');
});

test('cache hit rate < 80% causes shouldExit to be non-zero', () => {
  // Force cache hit ratio below 80% — hit 50/100.
  const badCache = makeRestAggregate({
    counters: {
      'cache.hit': 50,
      'cache.miss': 50,
    },
  });
  const { shouldExit, markdown } = renderReport(
    makeResults({ a: badCache }),
    BASELINE_STABLE,
    makeMeta(),
  );
  assert.notEqual(shouldExit, 0, 'expected non-zero exit for cache hit < 80%');
  assert.match(markdown, /cache/i, 'expected cache row in report');
});

test('DB pool exhaustion event causes shouldExit to be non-zero', () => {
  const pooled = makeRestAggregate({
    counters: {
      'db.pool.exhaustion_events': 3,
    },
  });
  const { shouldExit, markdown } = renderReport(
    makeResults({ a: pooled }),
    BASELINE_STABLE,
    makeMeta(),
  );
  assert.notEqual(shouldExit, 0, 'expected non-zero exit for DB pool exhaustion');
  assert.match(markdown, /pool/i, 'expected DB pool row in report');
});

test('WS concurrent connect < 500 causes shouldExit to be non-zero', () => {
  const flakyWs = makeWsAggregate({
    counters: {
      'ws.connect.success': 497,
      'ws.connect.fail': 3,
    },
  });
  const { shouldExit } = renderReport(
    makeResults({ b: flakyWs }),
    BASELINE_STABLE,
    makeMeta(),
  );
  assert.notEqual(shouldExit, 0, 'expected non-zero exit for WS connect-count < 500');
});

test('file upload quota mismatch causes shouldExit to be non-zero', () => {
  const brokenUpload = makeFileUploadAggregate({
    counters: {
      'http.requests': 50,
      'http.codes.201': 40,
      'http.codes.413': 10,
      'upload.quota.mismatch': 1,
    },
  });
  const { shouldExit } = renderReport(
    makeResults({ d: brokenUpload }),
    BASELINE_STABLE,
    makeMeta(),
  );
  assert.notEqual(shouldExit, 0, 'expected non-zero exit for upload quota mismatch');
});

test('missing baseline renders the placeholder prompting set-baseline', () => {
  const { markdown, shouldExit } = renderReport(
    makeResults(),
    null,
    makeMeta(),
  );
  assert.match(
    markdown,
    /No baseline — run `make e2e-perf-set-baseline` after 3 stable runs/,
    'expected the "no baseline" placeholder line',
  );
  // A missing baseline is not a hard failure — only pass/fail SLO violations
  // should affect shouldExit. All SLOs are green in the default fixture.
  assert.equal(shouldExit, 0, 'missing baseline alone must not fail the run');
});

test('raw JSON paths are linked at the bottom of the report', () => {
  const { markdown } = renderReport(makeResults(), BASELINE_STABLE, makeMeta());
  // Each scenario's JSON path should appear as a link target
  for (const scenario of ['a', 'b', 'c', 'd'] as const) {
    const expectedPath = `results/2026-04-22T12-00-00-scenario-${scenario}.json`;
    assert.ok(
      markdown.includes(expectedPath),
      `expected raw JSON link to ${expectedPath}`,
    );
  }
  // Links section should appear in the latter half of the document.
  const idx = markdown.indexOf('results/2026-04-22T12-00-00-scenario-a.json');
  assert.ok(idx > markdown.length / 2, 'expected raw JSON links in the bottom half of the report');
});

test('multiple pass/fail violations still produce a single non-zero exit', () => {
  const badCache = makeRestAggregate({
    counters: { 'cache.hit': 10, 'cache.miss': 90, 'db.pool.exhaustion_events': 5 },
  });
  const flakyWs = makeWsAggregate({
    counters: { 'ws.connect.success': 0, 'ws.connect.fail': 500 },
  });
  const { shouldExit } = renderReport(
    makeResults({ a: badCache, b: flakyWs }),
    BASELINE_STABLE,
    makeMeta(),
  );
  // Non-zero is the contract — any positive value is fine.
  assert.ok(shouldExit > 0, `expected shouldExit > 0, got ${shouldExit}`);
});
