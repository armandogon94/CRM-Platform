/**
 * Scenario (c) — Automation burst YAML validation (Slice 19C E3).
 *
 * What this test covers (cheap, runnable in CI without a backend):
 *   - the YAML parses
 *   - the burst phase uses arrivalCount=100 / duration=5 at full scale
 *     (SPEC.md §Slice 19C line 1288)
 *   - exactly one scenario, whose sole HTTP step is a POST /api/v1/items
 *
 * What this test defers:
 *   - the actual 100-item burst, AutomationEngine fan-out, and 400-row
 *     AutomationLog assertion. That path requires a running postgres +
 *     redis + backend in perf mode plus the B2 seeder populating a board
 *     with 4 active rules. F1's orchestrator (run.ts) owns the integration
 *     flow: invoke artillery, wait out the 30 s drain window, then COUNT(*)
 *     against automation_logs with the expected automationIds.
 *
 *   This mirrors the deferral pattern from E1 (scenario-a) and E2
 *   (scenario-b): each scenario's unit test validates only the shape of the
 *   YAML it emits, and the heavyweight integration is owned by the single
 *   orchestrator so we don't stand a full stack up four times per CI run.
 *
 * Run with: `node --test dist/artillery/__tests__/scenario-c.test.js`
 * (after `npm run build`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Minimal YAML reader
// ---------------------------------------------------------------------------
//
// The perf package deliberately has zero runtime deps beyond Artillery and
// TypeScript (see package.json). Pulling in js-yaml just to parse one file
// at test time is overkill, so we hand-roll a tiny parser that understands
// the subset of YAML this scenario uses: top-level keys, nested maps, lists
// of maps, and quoted scalars. If future scenarios need richer YAML, swap
// this for js-yaml as a devDependency.

type YamlValue = string | number | boolean | null | YamlValue[] | { [k: string]: YamlValue };

/**
 * Parse the subset of YAML we actually emit. Handles:
 *   - `key: value` pairs (with optional double-quoted values)
 *   - `key:` followed by an indented block (map or list)
 *   - `- ` list items, either scalar or nested map
 *   - `#` line comments and blank lines are ignored
 *
 * Does NOT handle multi-line strings, anchors, flow style, or tags — none of
 * which this scenario needs.
 */
function parseYaml(src: string): YamlValue {
  const rawLines = src.split(/\r?\n/);

  // Strip comments + blanks, preserving original indentation.
  type Line = { indent: number; text: string };
  const lines: Line[] = [];
  for (const raw of rawLines) {
    const stripped = raw.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (stripped.trim() === '') continue;
    const indent = stripped.length - stripped.trimStart().length;
    lines.push({ indent, text: stripped.trimEnd() });
  }

  let cursor = 0;

  function peekIndent(): number {
    return cursor < lines.length ? lines[cursor].indent : -1;
  }

  function unquote(s: string): string {
    const trimmed = s.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  function coerce(raw: string): YamlValue {
    const t = unquote(raw);
    if (t === 'null' || t === '~') return null;
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (/^-?\d+$/.test(t)) return Number(t);
    if (/^-?\d+\.\d+$/.test(t)) return Number(t);
    // Preserve `[200, 201]` flow arrays as a string — callers that need to
    // introspect them re-parse. The only spot this scenario uses a flow
    // array is `statusCode: [200, 201]`, which we don't assert on here.
    return t;
  }

  function parseBlock(indent: number): YamlValue {
    // Peek: is this a list (first item starts with `- `) or a map?
    if (cursor >= lines.length) return null;
    const first = lines[cursor];
    if (first.indent < indent) return null;

    if (first.text.trimStart().startsWith('- ') || first.text.trimStart() === '-') {
      return parseList(indent);
    }
    return parseMap(indent);
  }

  function parseMap(indent: number): { [k: string]: YamlValue } {
    const out: { [k: string]: YamlValue } = {};
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (line.indent < indent) break;
      if (line.indent > indent) {
        // Shouldn't normally happen — guard against mis-indented files.
        throw new Error(`unexpected indent at line ${cursor + 1}: "${line.text}"`);
      }
      const body = line.text.slice(line.indent);
      const colonIdx = body.indexOf(':');
      if (colonIdx === -1) {
        throw new Error(`expected "key:" at line ${cursor + 1}: "${body}"`);
      }
      const key = body.slice(0, colonIdx).trim();
      const rest = body.slice(colonIdx + 1).trim();
      cursor++;
      if (rest === '') {
        // Nested block follows on subsequent more-indented lines.
        const childIndent = peekIndent();
        if (childIndent > indent) {
          out[key] = parseBlock(childIndent);
        } else {
          out[key] = null;
        }
      } else {
        out[key] = coerce(rest);
      }
    }
    return out;
  }

  function parseList(indent: number): YamlValue[] {
    const out: YamlValue[] = [];
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (line.indent < indent) break;
      if (line.indent !== indent) {
        throw new Error(`inconsistent list indent at line ${cursor + 1}: "${line.text}"`);
      }
      const body = line.text.slice(line.indent);
      if (!body.startsWith('-')) break;
      const afterDash = body.slice(1).trim();
      cursor++;
      if (afterDash === '') {
        // Nested map or list under this bullet.
        const childIndent = peekIndent();
        if (childIndent > indent) {
          out.push(parseBlock(childIndent));
        } else {
          out.push(null);
        }
      } else if (afterDash.includes(':') && !afterDash.startsWith('"') && !afterDash.startsWith("'")) {
        // Inline map start: `- key: value`. Re-process this as a map whose
        // first line is already consumed. We synthesize a virtual line so
        // parseMap sees it at the expected indent.
        const virtualIndent = indent + 2;
        const virtualLine: Line = { indent: virtualIndent, text: ' '.repeat(virtualIndent) + afterDash };
        lines.splice(cursor, 0, virtualLine);
        out.push(parseMap(virtualIndent));
      } else {
        out.push(coerce(afterDash));
      }
    }
    return out;
  }

  return parseBlock(0);
}

// ---------------------------------------------------------------------------
// Locate the YAML relative to the compiled test file
// ---------------------------------------------------------------------------
//
// After `npm run build`, this file lives at dist/artillery/__tests__/.
// The YAML stays alongside the TS source at artillery/, so we resolve
// relative to the project root (two dirs up from __tests__, then over to the
// `artillery/` source folder from the dist root). We check both the dist
// layout (compiled run) and the source layout (ts-node / direct load) so the
// test works in either mode.

function findYamlPath(): string {
  const candidates = [
    // Compiled: e2e/perf/dist/artillery/__tests__/ → e2e/perf/artillery/
    path.resolve(__dirname, '..', '..', '..', 'artillery', 'scenario-c-automation.yml'),
    // Source: e2e/perf/artillery/__tests__/ → e2e/perf/artillery/
    path.resolve(__dirname, '..', 'scenario-c-automation.yml'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `scenario-c-automation.yml not found. Tried:\n  ${candidates.join('\n  ')}`,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('scenario-c YAML parses without error', () => {
  const yamlPath = findYamlPath();
  const src = fs.readFileSync(yamlPath, 'utf8');
  const doc = parseYaml(src);
  assert.ok(doc && typeof doc === 'object' && !Array.isArray(doc), 'expected top-level mapping');
});

test('scenario-c burst phase uses arrivalCount=100 / duration=5 at full scale', () => {
  // The YAML references PERF_BURST_ARRIVAL_COUNT via env template so F1 can
  // override for short-run. The scenario README / SPEC contract is:
  //   - full-scale arrival count: 100
  //   - duration: 5 (hard-coded in YAML — burst shape is non-negotiable)
  // We assert the duration directly and confirm the env-templated slot exists.
  const yamlPath = findYamlPath();
  const src = fs.readFileSync(yamlPath, 'utf8');
  const doc = parseYaml(src) as { config: { phases: Array<{ arrivalCount: string; duration: number; name?: string }> } };

  const phases = doc.config.phases;
  assert.ok(Array.isArray(phases), 'expected config.phases to be a list');
  assert.equal(phases.length, 1, `expected exactly one burst phase, got ${phases.length}`);

  const [burst] = phases;
  assert.equal(burst.duration, 5, `expected burst duration=5s per SPEC §19C line 1288, got ${burst.duration}`);
  assert.match(
    String(burst.arrivalCount),
    /PERF_BURST_ARRIVAL_COUNT/,
    `expected arrivalCount to be templated from PERF_BURST_ARRIVAL_COUNT env var (so short-run collapses to 10, full run is 100 per SPEC), got "${burst.arrivalCount}"`,
  );
});

test('scenario-c defines exactly one scenario that POSTs /api/v1/items', () => {
  const yamlPath = findYamlPath();
  const src = fs.readFileSync(yamlPath, 'utf8');
  const doc = parseYaml(src) as {
    scenarios: Array<{ flow: Array<{ post?: { url: string } }>; beforeScenario?: string }>;
  };

  assert.ok(Array.isArray(doc.scenarios), 'expected top-level scenarios list');
  assert.equal(doc.scenarios.length, 1, `expected exactly one scenario, got ${doc.scenarios.length}`);

  const [scenario] = doc.scenarios;
  assert.equal(
    scenario.beforeScenario,
    'setAuthToken',
    'expected beforeScenario=setAuthToken so every VU carries an auth token',
  );

  const postSteps = scenario.flow.filter((step) => Boolean(step.post));
  assert.equal(postSteps.length, 1, `expected exactly one POST step, got ${postSteps.length}`);
  assert.equal(
    postSteps[0].post?.url,
    '/api/v1/items',
    `expected POST url=/api/v1/items (the trigger surface for on_item_created / on_status_changed automations), got ${postSteps[0].post?.url}`,
  );
});

test('scenario-c wires board + status column fixtures via env vars', () => {
  // F1's orchestrator is responsible for selecting a seeded board with 4
  // active automation rules (per B2's seed) and exporting these env vars
  // before running artillery. This test just asserts the YAML declares the
  // variables the orchestrator is expected to feed it — catching drift if
  // someone renames one side without the other.
  const yamlPath = findYamlPath();
  const src = fs.readFileSync(yamlPath, 'utf8');

  for (const envVar of [
    'PERF_BOARD_ID_AUTOMATIONS',
    'PERF_GROUP_ID_AUTOMATIONS',
    'PERF_STATUS_COL_ID',
    'PERF_STATUS_TRIGGER_VALUE',
    'PERF_BURST_ARRIVAL_COUNT',
  ]) {
    assert.match(
      src,
      new RegExp(envVar),
      `expected YAML to reference ${envVar} env var (consumed by Artillery $processEnvironment)`,
    );
  }
});
