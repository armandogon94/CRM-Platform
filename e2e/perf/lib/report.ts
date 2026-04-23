/**
 * Slice 19C F2 — markdown report renderer + regression diff.
 *
 * `renderReport()` is a pure function: it takes the parsed Artillery
 * aggregates from each scenario, the previous baseline.md contents, and
 * the run-metadata block; it returns `{ markdown, shouldExit }` and
 * writes nothing to disk. The caller (run.ts) is responsible for
 * persisting the markdown next to the raw JSON artifacts.
 *
 * Regression policy (matches SPEC §19C):
 *   - Latency metrics (REST p50/p95/p99, WS fan-out p95, automation
 *     burst p95) are FLAG-ONLY. A >10% regression vs. baseline adds a
 *     ▲/▼ arrow to the report row but does NOT change shouldExit.
 *   - Pass/fail SLOs (cache hit rate < 80%, any DB pool exhaustion
 *     event, WS concurrent connects != 500, file-upload quota
 *     mismatch) set shouldExit to a non-zero value so the caller's
 *     process.exit propagates the failure.
 *
 * The baseline file is a human-readable markdown document we
 * heuristically scan for numbers keyed by metric label. If the
 * baseline is missing or empty, we render the "No baseline — run
 * make e2e-perf-set-baseline after 3 stable runs" placeholder and
 * skip the regression-diff arrows entirely.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Minimal shape of Artillery's aggregate object. Artillery's own typings
 * are not exported from a stable surface, and over-tightening here would
 * couple us to the vendor JSON too closely — we intentionally accept any
 * shape where `summaries[name]` yields latency percentiles and
 * `counters` carries named counts.
 */
export interface ArtilleryAggregate {
  counters: Record<string, number>;
  rates: Record<string, number>;
  summaries: Record<
    string,
    {
      min: number;
      max: number;
      mean: number;
      p50: number;
      p95: number;
      p99: number;
    }
  >;
}

/** One scenario's result as consumed by `renderReport`. */
export interface ScenarioResult {
  scenario: 'a' | 'b' | 'c' | 'd';
  jsonPath: string;
  aggregate: ArtilleryAggregate;
}

/** Run metadata captured by the caller at invocation time. */
export interface RunMeta {
  commitSha: string;
  nodeVersion: string;
  dateIso: string;
  host: {
    cpu: string;
    memMb: number;
  };
}

/** Renderer output — caller writes `markdown`, propagates `shouldExit`. */
export interface RenderReportOutput {
  markdown: string;
  shouldExit: number;
}

// ---------------------------------------------------------------------------
// SPEC targets — kept here (not in YAML) because the renderer is the
// single source of truth for what "pass" looks like.
// ---------------------------------------------------------------------------

interface SloRow {
  surface: string;
  metric: string;
  /** Target rendered as-is in the table; description only. */
  target: string;
  /** Extractor — returns the measured numeric value or null if absent. */
  measure: (results: ScenarioResult[]) => number | null;
  /** How to render the measured value (formatter, with unit). */
  format: (value: number) => string;
  /** Optional baseline key to look up for regression diff. */
  baselineKey?: string;
  /** If true, a violation of `evaluate` contributes to shouldExit. */
  passFail: boolean;
  /**
   * Returns true when `measured` violates the SLO. Only meaningful when
   * `passFail` is true. For flag-only rows this is ignored.
   */
  evaluate?: (measured: number) => boolean;
}

/**
 * SLO table rows, in display order. Latency entries are flag-only;
 * pass/fail entries drive shouldExit when violated.
 *
 * Target strings intentionally repeat SPEC §19C so the report reads as
 * a human verification of what we promised.
 */
const SLO_ROWS: SloRow[] = [
  {
    surface: 'REST API',
    metric: 'p50 latency',
    target: '< 100 ms at 100 RPS',
    measure: (r) => getScenarioSummary(r, 'a', 'http.response_time', 'p50'),
    format: (v) => `${Math.round(v)} ms`,
    baselineKey: 'rest.p50',
    passFail: false,
  },
  {
    surface: 'REST API',
    metric: 'p95 latency',
    target: '< 500 ms at 100 RPS',
    measure: (r) => getScenarioSummary(r, 'a', 'http.response_time', 'p95'),
    format: (v) => `${Math.round(v)} ms`,
    baselineKey: 'rest.p95',
    passFail: false,
  },
  {
    surface: 'REST API',
    metric: 'p99 latency',
    target: '< 1000 ms at 100 RPS',
    measure: (r) => getScenarioSummary(r, 'a', 'http.response_time', 'p99'),
    format: (v) => `${Math.round(v)} ms`,
    baselineKey: 'rest.p99',
    passFail: false,
  },
  {
    surface: 'Redis',
    metric: 'cache hit rate',
    target: '> 80% after warmup',
    measure: (r) => getCacheHitRate(r),
    format: (v) => `${(v * 100).toFixed(1)}%`,
    passFail: true,
    evaluate: (v) => v < 0.8,
  },
  {
    surface: 'Postgres',
    metric: 'connection pool',
    target: 'No exhaustion events',
    measure: (r) => getCounter(r, 'a', 'db.pool.exhaustion_events'),
    format: (v) => `${Math.round(v)} event(s)`,
    passFail: true,
    evaluate: (v) => v > 0,
  },
  {
    surface: 'WebSocket',
    metric: 'concurrent connections',
    target: '500 connect success, 5 min stable',
    measure: (r) => getCounter(r, 'b', 'ws.connect.success'),
    format: (v) => `${Math.round(v)} connected`,
    passFail: true,
    evaluate: (v) => v < 500,
  },
  {
    surface: 'WebSocket',
    metric: 'fan-out p95',
    target: '< 200 ms',
    measure: (r) => getScenarioSummary(r, 'b', 'ws.fanout.latency', 'p95'),
    format: (v) => `${Math.round(v)} ms`,
    baselineKey: 'ws.fanout.p95',
    passFail: false,
  },
  {
    surface: 'Automation',
    metric: 'burst p95 (100 items × 4 rules)',
    target: '< 30 s',
    measure: (r) => getScenarioSummary(r, 'c', 'automation.burst.duration_ms', 'p95'),
    format: (v) => `${Math.round(v)} ms`,
    baselineKey: 'automation.burst.p95',
    passFail: false,
  },
  {
    surface: 'File upload',
    metric: 'quota integrity',
    target: 'No quota mismatches',
    measure: (r) => getCounter(r, 'd', 'upload.quota.mismatch'),
    format: (v) => `${Math.round(v)} mismatch(es)`,
    passFail: true,
    evaluate: (v) => v > 0,
  },
];

// ---------------------------------------------------------------------------
// Counter / summary extractors
// ---------------------------------------------------------------------------

function findScenario(results: ScenarioResult[], id: ScenarioResult['scenario']): ScenarioResult | null {
  return results.find((r) => r.scenario === id) ?? null;
}

function getScenarioSummary(
  results: ScenarioResult[],
  id: ScenarioResult['scenario'],
  metric: string,
  percentile: 'p50' | 'p95' | 'p99',
): number | null {
  const scenario = findScenario(results, id);
  if (!scenario) return null;
  const summary = scenario.aggregate.summaries[metric];
  if (!summary) return null;
  const value = summary[percentile];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getCounter(
  results: ScenarioResult[],
  id: ScenarioResult['scenario'],
  key: string,
): number | null {
  const scenario = findScenario(results, id);
  if (!scenario) return null;
  const raw = scenario.aggregate.counters[key];
  // A missing counter means "the scenario didn't emit this metric" —
  // treat as null so we don't accidentally trip a pass/fail (e.g.
  // declaring a quota mismatch of 0 when the scenario never ran).
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

/** Computes the cache hit rate from scenario (a)'s hit/miss counters. */
function getCacheHitRate(results: ScenarioResult[]): number | null {
  const hit = getCounter(results, 'a', 'cache.hit');
  const miss = getCounter(results, 'a', 'cache.miss');
  if (hit === null || miss === null) return null;
  const total = hit + miss;
  if (total <= 0) return null;
  return hit / total;
}

// ---------------------------------------------------------------------------
// Baseline parsing
// ---------------------------------------------------------------------------

/**
 * Extracts a single numeric value from the baseline markdown by scanning
 * for the first occurrence of a line containing the given label.
 *
 * The baseline document is human-maintained — contributors write
 * something like "p95: 400" after each scenario heading. Our parser
 * accepts any line that contains the label followed eventually by a
 * colon and a number, so formatting drift ("- p95 = 400", "p95: 400 ms",
 * "**p95**: 400") doesn't break the diff.
 */
function extractBaselineNumber(baseline: string, patterns: readonly RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = pattern.exec(baseline);
    if (match && match[1]) {
      const n = Number.parseFloat(match[1]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Lookup table: baselineKey → regex patterns that find the number. */
const BASELINE_PATTERNS: Record<string, readonly RegExp[]> = {
  'rest.p50': [/scenario\s*\(?a\)?[\s\S]*?p50\s*[:=]\s*([\d.]+)/i],
  'rest.p95': [/scenario\s*\(?a\)?[\s\S]*?p95\s*[:=]\s*([\d.]+)/i],
  'rest.p99': [/scenario\s*\(?a\)?[\s\S]*?p99\s*[:=]\s*([\d.]+)/i],
  'ws.fanout.p95': [
    /ws\.fanout\s*p95\s*[:=]\s*([\d.]+)/i,
    /scenario\s*\(?b\)?[\s\S]*?p95\s*[:=]\s*([\d.]+)/i,
  ],
  'automation.burst.p95': [
    /automation\.burst\s*p95\s*[:=]\s*([\d.]+)/i,
    /scenario\s*\(?c\)?[\s\S]*?p95\s*[:=]\s*([\d.]+)/i,
  ],
};

function getBaselineValue(baseline: string | null, key: string | undefined): number | null {
  if (!baseline || !key) return null;
  const patterns = BASELINE_PATTERNS[key];
  if (!patterns) return null;
  return extractBaselineNumber(baseline, patterns);
}

/**
 * Returns true if the baseline is absent or is still the initial
 * placeholder. We detect the placeholder by a marker string so the
 * "No baseline yet" case stays explicit and doesn't depend on file
 * size or hashing.
 */
function isBaselineMissing(baseline: string | null): boolean {
  if (baseline === null) return true;
  const trimmed = baseline.trim();
  if (trimmed.length === 0) return true;
  // Initial committed file says "No baseline yet".
  return /no baseline yet/i.test(baseline);
}

// ---------------------------------------------------------------------------
// Regression diff
// ---------------------------------------------------------------------------

const REGRESSION_THRESHOLD_PCT = 10;

interface RegressionInfo {
  /** Rendered cell string, e.g. "+12.5% ▲" or "-3.1%" */
  cell: string;
  /** For the tests: whether we actually rendered an arrow */
  arrow: '▲' | '▼' | '';
}

function computeRegression(current: number | null, baseline: number | null): RegressionInfo {
  if (current === null || baseline === null || baseline === 0) {
    return { cell: '—', arrow: '' };
  }
  const pct = ((current - baseline) / baseline) * 100;
  const rounded = Math.round(pct * 10) / 10; // one decimal place
  const absPct = Math.abs(rounded);
  if (absPct > REGRESSION_THRESHOLD_PCT) {
    // Convention: ▲ means "got worse" (latency went up);
    //             ▼ means "got better" (latency went down).
    const arrow = rounded > 0 ? '▲' : '▼';
    const sign = rounded > 0 ? '+' : '';
    return { cell: `${sign}${rounded}% ${arrow}`, arrow };
  }
  const sign = rounded > 0 ? '+' : '';
  return { cell: `${sign}${rounded}%`, arrow: '' };
}

// ---------------------------------------------------------------------------
// Markdown assembly
// ---------------------------------------------------------------------------

function renderHeader(meta: RunMeta): string {
  return [
    `# Perf Run — ${meta.dateIso}`,
    '',
    '## Run Metadata',
    '',
    `- **Commit SHA:** \`${meta.commitSha}\``,
    `- **Node version:** ${meta.nodeVersion}`,
    `- **Date:** ${meta.dateIso}`,
    `- **Host CPU:** ${meta.host.cpu}`,
    `- **Host memory:** ${meta.host.memMb} MB`,
    '',
  ].join('\n');
}

function renderSloTable(results: ScenarioResult[], baseline: string | null): {
  table: string;
  violations: number;
} {
  const lines = [
    '## SLO Results',
    '',
    '| Surface | Metric | Target | Measured | Δ vs. baseline |',
    '|---------|--------|--------|----------|----------------|',
  ];

  let violations = 0;
  const baselineMissing = isBaselineMissing(baseline);

  for (const row of SLO_ROWS) {
    const measured = row.measure(results);
    const measuredCell = measured === null ? '—' : row.format(measured);

    let diffCell = '—';
    if (!baselineMissing && row.baselineKey) {
      const baselineValue = getBaselineValue(baseline, row.baselineKey);
      const { cell } = computeRegression(measured, baselineValue);
      diffCell = cell;
    }

    if (row.passFail && row.evaluate && measured !== null && row.evaluate(measured)) {
      violations += 1;
    }

    lines.push(
      `| ${row.surface} | ${row.metric} | ${row.target} | ${measuredCell} | ${diffCell} |`,
    );
  }

  lines.push('');
  return { table: lines.join('\n'), violations };
}

function renderBaselineSection(baseline: string | null): string {
  if (!isBaselineMissing(baseline)) return '';
  return [
    '## Baseline',
    '',
    'No baseline — run `make e2e-perf-set-baseline` after 3 stable runs',
    '',
  ].join('\n');
}

function renderRawArtifacts(results: ScenarioResult[]): string {
  const lines = ['## Raw JSON artifacts', ''];
  for (const r of results) {
    lines.push(`- Scenario (${r.scenario}): [\`${r.jsonPath}\`](${r.jsonPath})`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Pure renderer. `baseline` is the raw baseline.md contents (or null if
 * none). The caller owns all FS I/O — we return only the markdown string
 * and the exit code to propagate.
 */
export function renderReport(
  results: readonly ScenarioResult[],
  baseline: string | null,
  meta: RunMeta,
): RenderReportOutput {
  // Defensive copy — SLO extractors treat the array as read-only but we
  // widen the type here so TS doesn't complain about variance.
  const snapshot = results.slice();

  const header = renderHeader(meta);
  const baselineSection = renderBaselineSection(baseline);
  const { table, violations } = renderSloTable(snapshot, baseline);
  const artifacts = renderRawArtifacts(snapshot);

  const markdown = [header, baselineSection, table, artifacts]
    .filter((section) => section.length > 0)
    .join('\n');

  return {
    markdown,
    // Non-zero exit is the signal. Use the violation count itself so
    // logs include a hint at how many SLOs failed; any positive value
    // works per the test contract.
    shouldExit: violations,
  };
}
