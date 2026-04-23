/**
 * Scenario (a) — shape & config validator — Slice 19C E1.
 *
 * Uses Node's built-in test runner (`node:test`) to avoid pulling
 * Jest/Mocha into the perf package. Run after `npm run build`:
 *
 *   node --test dist/artillery/__tests__/scenario-a.test.js
 *
 * Runtime validation note:
 *   A true end-to-end validation would spawn `artillery run --environment
 *   short` against a lightweight mock HTTP server, parse the JSON output,
 *   and assert method distribution, p99, and zero 5xx. That is deferred to
 *   F1's orchestrator (`run.ts`), which already owns live-run plumbing and
 *   a running perf backend. Duplicating that machinery here would double
 *   the test surface without extra coverage.
 *
 *   What this test *does* enforce:
 *     - YAML parses cleanly (catches syntax regressions at CI time).
 *     - Scenario shape matches SPEC §19C Scenario (a): 3 scenarios, weights
 *       60/30/10, correct HTTP verbs per flow, auth hook wired up, processor
 *       pointing at the D2 fixtures bundle.
 *     - Both `short` and `full` environments exist with the documented
 *       phase characteristics (short: 30s @ 20 RPS; full: 30s ramp + 600s
 *       sustain @ 100 RPS).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- js-yaml
// ships CJS; keep the import shape that plays nicely with the commonjs target.
const yaml = require('js-yaml') as { load: (s: string) => unknown };

// Resolve the YAML path relative to the compiled test location under
// dist/artillery/__tests__/. Two levels up lands in dist/, but the YAML
// lives at the repo source (e2e/perf/artillery/scenario-a-rest.yml), so we
// walk up to e2e/perf/ and back down. __dirname at runtime = .../dist/artillery/__tests__.
const SCENARIO_YAML_PATH = resolve(
  __dirname,
  '..',           // → dist/artillery
  '..',           // → dist
  '..',           // → e2e/perf
  'artillery',
  'scenario-a-rest.yml',
);

// --- Narrow types describing just the fields we assert on. ------------------
// We intentionally avoid importing Artillery's own types: they pull in the
// full Artillery TS dependency graph, which is both overkill and not a
// stable public API for us.

interface Phase {
  name?: string;
  duration: number;
  arrivalRate?: number;
  rampTo?: number;
}

interface EnvironmentBlock {
  phases: Phase[];
}

interface HttpStep {
  url: string;
  headers?: Record<string, string>;
  json?: unknown;
  capture?: unknown;
  expect?: unknown;
}

interface FlowStep {
  get?: HttpStep;
  post?: HttpStep;
  put?: HttpStep;
  delete?: HttpStep;
  patch?: HttpStep;
  function?: string;
}

interface Scenario {
  name?: string;
  weight?: number;
  beforeScenario?: string;
  flow: FlowStep[];
}

interface ScenarioYaml {
  config: {
    target: string;
    processor: string;
    http?: { timeout?: number; pool?: number };
    phases?: Phase[];
    environments: Record<string, EnvironmentBlock>;
  };
  scenarios: Scenario[];
}

/**
 * Loads + parses the scenario YAML once per test process. Throws (failing
 * the first test that calls it) if the file is malformed — which is
 * exactly the signal we want.
 */
function loadScenarioYaml(): ScenarioYaml {
  const raw = readFileSync(SCENARIO_YAML_PATH, 'utf8');
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`scenario-a-rest.yml did not parse to an object`);
  }
  return parsed as ScenarioYaml;
}

/** Extracts the first HTTP verb key from a flow step (ignores `function`). */
function stepVerb(step: FlowStep): 'get' | 'post' | 'put' | 'delete' | 'patch' | null {
  for (const verb of ['get', 'post', 'put', 'delete', 'patch'] as const) {
    if (step[verb] !== undefined) return verb;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('scenario-a-rest.yml parses as valid YAML', () => {
  const doc = loadScenarioYaml();
  assert.ok(doc.config, 'expected a top-level `config` block');
  assert.ok(doc.scenarios, 'expected a top-level `scenarios` list');
});

test('config points at BACKEND_URL and the D2 fixtures processor', () => {
  const { config } = loadScenarioYaml();
  assert.equal(
    config.target,
    '{{ $processEnvironment.BACKEND_URL }}',
    'target must be driven by the BACKEND_URL env var (matches common.yml)',
  );
  assert.equal(
    config.processor,
    '../dist/fixtures.js',
    'processor must point at the compiled D2 fixtures bundle',
  );
  assert.equal(config.http?.timeout, 30, 'http.timeout must be 30s per common.yml');
  assert.equal(config.http?.pool, 50, 'http.pool must be 50 per common.yml');
});

test('exposes a `short` environment: 30s sustained at 20 RPS', () => {
  const { config } = loadScenarioYaml();
  const short = config.environments.short;
  assert.ok(short, 'missing `short` environment');
  assert.equal(short.phases.length, 1, 'short environment should have exactly 1 phase');
  const [phase] = short.phases;
  assert.equal(phase.duration, 30, 'short phase duration must be 30s');
  assert.equal(phase.arrivalRate, 20, 'short phase arrivalRate must be 20 RPS');
  assert.equal(phase.rampTo, undefined, 'short phase must NOT ramp — sustained only');
});

test('exposes a `full` environment: 30s ramp 1→100 RPS, then 10 min sustain', () => {
  const { config } = loadScenarioYaml();
  const full = config.environments.full;
  assert.ok(full, 'missing `full` environment');
  assert.equal(full.phases.length, 2, 'full environment should have 2 phases (warmup + sustain)');

  const [warmup, sustain] = full.phases;
  assert.equal(warmup.duration, 30, 'warmup must be 30s');
  assert.equal(warmup.arrivalRate, 1, 'warmup starts at 1 RPS');
  assert.equal(warmup.rampTo, 100, 'warmup ramps to 100 RPS');

  assert.equal(sustain.duration, 600, 'sustain must be 600s (10 min)');
  assert.equal(sustain.arrivalRate, 100, 'sustain must be 100 RPS');
  assert.equal(sustain.rampTo, undefined, 'sustain must be flat, not ramping');
});

test('top-level phases is empty — --environment flag is mandatory', () => {
  const { config } = loadScenarioYaml();
  // Guard: running `artillery run` without `--environment short|full` should
  // NOT silently execute a default phase. If someone ever puts phases here,
  // a developer could accidentally fire a 10-min 100 RPS run from their laptop.
  assert.deepEqual(
    config.phases,
    [],
    'top-level phases must be empty; phases live under environments.{short,full}',
  );
});

test('has exactly three scenarios with 60/30/10 weight split', () => {
  const { scenarios } = loadScenarioYaml();
  assert.equal(scenarios.length, 3, 'must define read, write, and delete scenarios');

  const weights = scenarios.map((s) => s.weight);
  assert.deepEqual(
    [...weights].sort((a, b) => (b ?? 0) - (a ?? 0)),
    [60, 30, 10],
    `weights must be 60/30/10, got ${JSON.stringify(weights)}`,
  );

  const total = weights.reduce<number>((sum, w) => sum + (w ?? 0), 0);
  assert.equal(total, 100, 'weights must sum to 100');
});

test('every scenario wires `setAuthToken` as a beforeScenario hook', () => {
  const { scenarios } = loadScenarioYaml();
  for (const s of scenarios) {
    assert.equal(
      s.beforeScenario,
      'setAuthToken',
      `scenario "${s.name}" must call setAuthToken to populate {{ authToken }}`,
    );
  }
});

test('60%-weight scenario performs two GETs (items list + board detail)', () => {
  const { scenarios } = loadScenarioYaml();
  const read = scenarios.find((s) => s.weight === 60);
  assert.ok(read, 'missing the 60%-weight read scenario');

  const verbs = read.flow.map(stepVerb).filter((v) => v !== null);
  assert.deepEqual(verbs, ['get', 'get'], 'read flow must be two GETs');

  const [itemsStep, boardStep] = read.flow;
  assert.match(
    itemsStep.get!.url,
    /\/api\/v1\/boards\/\{\{ boardId \}\}\/items/,
    'first GET must fetch items for the selected board',
  );
  assert.match(
    boardStep.get!.url,
    /\/api\/v1\/boards\/\{\{ boardId \}\}$/,
    'second GET must fetch the board detail',
  );
});

test('30%-weight scenario POSTs to /items then PUTs column values', () => {
  const { scenarios } = loadScenarioYaml();
  const write = scenarios.find((s) => s.weight === 30);
  assert.ok(write, 'missing the 30%-weight write scenario');

  const verbs = write.flow.map(stepVerb).filter((v) => v !== null);
  assert.deepEqual(verbs, ['post', 'put'], 'write flow must be POST then PUT');

  const postStep = write.flow[0].post!;
  assert.equal(postStep.url, '/api/v1/items', 'POST must hit the flat /items endpoint');
  assert.ok(postStep.json, 'POST must include a JSON body');

  const putStep = write.flow[1].put!;
  assert.match(
    putStep.url,
    /\/api\/v1\/items\/\{\{ newItemId \}\}\/values/,
    'PUT must target the just-created item (captured as newItemId)',
  );
});

test('10%-weight scenario creates then deletes its own item', () => {
  const { scenarios } = loadScenarioYaml();
  const del = scenarios.find((s) => s.weight === 10);
  assert.ok(del, 'missing the 10%-weight delete scenario');

  const verbs = del.flow.map(stepVerb).filter((v) => v !== null);
  assert.deepEqual(verbs, ['post', 'delete'], 'delete flow must be POST then DELETE');

  const deleteStep = del.flow[1].delete!;
  // Delete uses the nested workspace/board path because no flat DELETE
  // /items route exists. The test pins the shape so a route change
  // surfaces as a scenario failure rather than a silent 404 flood.
  assert.match(
    deleteStep.url,
    /\/api\/v1\/workspaces\/\{\{ workspaceId \}\}\/boards\/\{\{ boardId \}\}\/items\/\{\{ deleteItemId \}\}/,
    'DELETE must use the nested workspaces/boards/items path',
  );
});

test('all authenticated flow steps attach `Bearer {{ authToken }}`', () => {
  const { scenarios } = loadScenarioYaml();
  for (const scenario of scenarios) {
    for (const step of scenario.flow) {
      const verb = stepVerb(step);
      if (!verb) continue;
      const req = step[verb]!;
      const authHeader = req.headers?.authorization;
      assert.equal(
        authHeader,
        'Bearer {{ authToken }}',
        `scenario "${scenario.name}" ${verb.toUpperCase()} ${req.url} must set the Authorization header`,
      );
    }
  }
});
