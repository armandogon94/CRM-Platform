/**
 * Tests for scenario-d-file-upload.yml — Slice 19C E4.
 *
 * This file stays at YAML-shape validation: parse the scenario, assert the
 * flow posts to the files endpoint at arrivalCount=50 over 10 s. The actual
 * 50-concurrent quota-integrity behaviour is verified by F1's orchestrator,
 * which runs a post-run SQL query against crm_perf to confirm:
 *   - SUM(file_size) == successful_uploads * 5 MiB
 *   - rejected 413 count == total − floor(quota / 5 MiB)
 *   - no orphan rows or partial writes.
 *
 * Uses the Node 20+ built-in test runner so the perf package doesn't have
 * to depend on Jest/Mocha just for a handful of structural assertions.
 *
 * Run with: `node dist/artillery/__tests__/scenario-d.test.js`
 * (after `npm run build`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

// js-yaml ships as a transitive dep of Artillery — no direct install needed.
// We require() it to dodge the missing-@types/js-yaml issue; a minimal shape
// is all we need for the parse result anyway.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml') as { load: (src: string) => unknown };

// --------------------------------------------------------------------------
// Locate scenario YAML relative to this test. Works both when running
// straight from source (via ts-node) and when running compiled JS under
// dist/. We walk up until we find e2e/perf/artillery/.
// --------------------------------------------------------------------------
function resolveScenarioPath(): string {
  // From dist/artillery/__tests__/*.js → ../../../artillery/scenario-*.yml
  // From artillery/__tests__/*.ts (source) → ../scenario-*.yml
  const candidates = [
    path.resolve(__dirname, '../scenario-d-file-upload.yml'),
    path.resolve(__dirname, '../../../artillery/scenario-d-file-upload.yml'),
    path.resolve(__dirname, '../../artillery/scenario-d-file-upload.yml'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `scenario-d-file-upload.yml not found. Searched:\n  ${candidates.join('\n  ')}`,
  );
}

const SCENARIO_PATH = resolveScenarioPath();
const parsed = yaml.load(fs.readFileSync(SCENARIO_PATH, 'utf8')) as {
  config?: {
    target?: string;
    processor?: string;
    phases?: Array<{ arrivalCount?: number; duration?: number; name?: string }>;
  };
  scenarios?: Array<{
    name?: string;
    flow?: Array<Record<string, unknown>>;
    beforeScenario?: string;
  }>;
};

// --------------------------------------------------------------------------
// Structural assertions
// --------------------------------------------------------------------------

test('scenario-d YAML parses successfully', () => {
  assert.ok(parsed, 'expected parsed YAML to be a non-null object');
  assert.equal(typeof parsed, 'object', 'expected parsed YAML to be an object');
});

test('scenario-d declares a config block with target + processor', () => {
  assert.ok(parsed.config, 'expected config block');
  assert.equal(
    typeof parsed.config.target,
    'string',
    'expected config.target to be a string',
  );
  assert.equal(
    parsed.config.processor,
    './dist/fixtures.js',
    'processor must point at compiled fixtures.js so Artillery can resolve hooks',
  );
});

test('scenario-d phase uses arrivalCount=50 over duration=10', () => {
  const phases = parsed.config?.phases;
  assert.ok(Array.isArray(phases) && phases.length >= 1, 'expected at least one phase');
  // First phase is the 50-concurrent load window. We pin exact values here —
  // the orchestrator can override arrivalCount via CLI for short-run mode,
  // but the YAML itself must describe the full-scale scenario from SPEC §19C.
  const [first] = phases;
  assert.equal(first.arrivalCount, 50, 'arrivalCount must be 50 (SPEC §19C Scenario d)');
  assert.equal(first.duration, 10, 'duration must be 10 s (SPEC §19C Scenario d)');
});

test('scenario-d has exactly one scenario flow', () => {
  const scenarios = parsed.scenarios;
  assert.ok(Array.isArray(scenarios), 'expected scenarios array');
  assert.equal(
    scenarios.length,
    1,
    'Scenario (d) is intentionally single-flow: one upload action per VU',
  );
});

test('scenario-d flow hits POST /api/v1/items/:id/files', () => {
  const flow = parsed.scenarios?.[0]?.flow;
  assert.ok(Array.isArray(flow) && flow.length >= 1, 'expected flow array with at least one step');

  // Exactly one POST step expected in the flow for this scenario.
  const postSteps = flow.filter((step) => 'post' in step) as Array<{
    post: { url?: string; beforeRequest?: string };
  }>;
  assert.equal(postSteps.length, 1, 'expected exactly one POST step in the flow');

  const { url, beforeRequest } = postSteps[0].post;
  assert.match(
    url ?? '',
    /^\/api\/v1\/items\/\{\{\s*seededItemId\s*\}\}\/files$/,
    `flow must POST to /api/v1/items/{{ seededItemId }}/files, got ${url}`,
  );
  // The 5 MiB payload is attached via a processor hook — without it the
  // upload is empty, so this reference is load-bearing.
  assert.equal(
    beforeRequest,
    'attachFilePayload',
    'flow must reference the attachFilePayload hook for the 5 MiB multipart body',
  );
});

test('scenario-d flow wires the setAuthToken hook at scenario scope', () => {
  // Token fetched once per VU — verified here so future refactors don't
  // silently drop auth and turn every request into a 401.
  const scenario = parsed.scenarios?.[0];
  assert.equal(
    scenario?.beforeScenario,
    'setAuthToken',
    'scenario must reference the setAuthToken hook from fixtures.ts',
  );
});
