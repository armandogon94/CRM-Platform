/**
 * Structural tests for scenario-b-websocket.yml — Slice 19C E2.
 *
 * Scenario (b) exercises WebSocket fan-out: ~500 subscriber clients ramp into
 * a single board room while one publisher emits `item:updated` at 2 Hz for
 * 5 min. Each subscriber records (receive_ts - server_ts) as fan-out latency.
 *
 * We deliberately validate the YAML *shape* here rather than booting a mock
 * Socket.io server: the Slice 19C plan (Phase E2 RED note) explicitly lists
 * "validate YAML shape via js-yaml parsing" as an acceptable test strategy
 * when a mock server isn't practical. It is NOT practical here because
 *   (a) the perf package does not depend on `socket.io` itself, and
 *   (b) the full-scale run is exercised end-to-end in Phase H verification
 *       against the real backend — adding a mock here would duplicate that
 *       coverage while giving us less signal about the YAML we actually ship.
 *
 * Run with:
 *   npm run build && node dist/artillery/__tests__/scenario-b.test.js
 * (tsc compiles under outDir=dist; the processor sits at dist/fixtures.js.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// js-yaml is pulled in transitively by artillery; no direct dep required.
// No @types/js-yaml available — declare a minimal shape locally so tsc is
// satisfied without pulling in extra devDeps just for a test-only import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml') as { load(src: string): unknown };

interface ArtilleryPhase {
  duration: number;
  arrivalRate?: number;
  arrivalCount?: number;
  rampTo?: number;
  name?: string;
}

interface ArtilleryStep {
  emit?: { channel: string; data?: unknown } | unknown[];
  on?: { channel: string; response?: unknown };
  // Artillery's socketio schema lets a step carry a sibling `response` next
  // to `emit`; the channel is declared as `on:` inside it and an optional
  // `function:` hook fires on each received message.
  response?: { on?: string; channel?: string; function?: string };
  function?: string;
  think?: number;
  loop?: ArtilleryStep[];
  count?: number;
  namespace?: string;
}

interface ArtilleryScenario {
  name?: string;
  weight?: number;
  engine?: string;
  beforeScenario?: string | string[];
  flow: ArtilleryStep[];
}

interface ArtilleryConfig {
  target?: string;
  processor?: string;
  engines?: Record<string, unknown>;
  phases?: ArtilleryPhase[];
  socketio?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  environments?: Record<string, { config?: Partial<ArtilleryConfig> }>;
}

interface ArtilleryDoc {
  config: ArtilleryConfig;
  scenarios: ArtilleryScenario[];
}

// __dirname at runtime points at dist/artillery/__tests__/ after tsc compiles.
// The YAML lives at the source path e2e/perf/artillery/scenario-b-websocket.yml.
// Walk up to the perf package root and re-enter the source tree so the test
// validates the YAML we actually ship, not a (nonexistent) compiled copy.
const PERF_ROOT = resolve(__dirname, '..', '..', '..');
const YAML_PATH = resolve(PERF_ROOT, 'artillery', 'scenario-b-websocket.yml');

function loadDoc(): ArtilleryDoc {
  const raw = readFileSync(YAML_PATH, 'utf8');
  const parsed = yaml.load(raw);
  assert.ok(parsed && typeof parsed === 'object', 'expected YAML to parse into an object');
  return parsed as ArtilleryDoc;
}

// ---------------------------------------------------------------------------
// YAML structural invariants
// ---------------------------------------------------------------------------

test('scenario-b YAML parses cleanly as an Artillery document', () => {
  const doc = loadDoc();
  assert.ok(doc.config, 'expected top-level `config` key');
  assert.ok(Array.isArray(doc.scenarios), 'expected top-level `scenarios` array');
});

test('scenario-b declares the socketio-v3 engine', () => {
  const doc = loadDoc();
  assert.ok(doc.config.engines, 'expected config.engines block');
  assert.ok(
    Object.prototype.hasOwnProperty.call(doc.config.engines, 'socketio-v3'),
    'expected socketio-v3 engine to be registered',
  );
});

test('scenario-b target uses the BACKEND_HOST_PORT env var with ws:// scheme', () => {
  const doc = loadDoc();
  assert.ok(typeof doc.config.target === 'string', 'expected string target');
  // The socketio engine accepts ws:// directly — the subscriber count is high
  // enough that we don't want an HTTP-upgrade round-trip per connection if we
  // can avoid it. BACKEND_HOST_PORT is set by the orchestrator (e2e/perf/run.ts).
  assert.match(
    doc.config.target!,
    /^ws:\/\/\{\{\s*\$processEnvironment\.BACKEND_HOST_PORT\s*\}\}/,
    `expected ws://{{ $processEnvironment.BACKEND_HOST_PORT }} prefix, got ${doc.config.target}`,
  );
});

test('scenario-b wires the shared processor so setAuthToken is available', () => {
  const doc = loadDoc();
  // The JWT handshake uses the setAuthToken hook exported by lib/fixtures.ts,
  // compiled under dist/fixtures.js at build time (matches common.yml).
  assert.equal(doc.config.processor, './dist/fixtures.js');
});

test('scenario-b configures the socketio client auth handshake via {{ authToken }}', () => {
  const doc = loadDoc();
  const sio = doc.config.socketio;
  assert.ok(sio && typeof sio === 'object', 'expected config.socketio block');
  const auth = (sio as { auth?: unknown }).auth;
  assert.ok(auth && typeof auth === 'object', 'expected config.socketio.auth');
  const token = (auth as { token?: unknown }).token;
  assert.equal(token, '{{ authToken }}', 'expected socketio.auth.token to template authToken');
});

// ---------------------------------------------------------------------------
// Scenario shape — one subscriber (weight 500) + one publisher (weight 1)
// ---------------------------------------------------------------------------

test('scenario-b defines exactly one subscriber scenario (weight 500) and one publisher (weight 1)', () => {
  const doc = loadDoc();
  assert.equal(doc.scenarios.length, 2, 'expected exactly two scenarios (subscriber + publisher)');
  const subscriber = doc.scenarios.find((s) => /sub/i.test(s.name ?? ''));
  const publisher = doc.scenarios.find((s) => /pub/i.test(s.name ?? ''));
  assert.ok(subscriber, 'expected a subscriber scenario');
  assert.ok(publisher, 'expected a publisher scenario');
  assert.equal(subscriber!.weight, 500, 'subscriber weight should be 500 (one per concurrent client)');
  assert.equal(publisher!.weight, 1, 'publisher weight should be 1 (exactly one publisher)');
});

test('both scenarios pin themselves to the socketio-v3 engine', () => {
  const doc = loadDoc();
  for (const scenario of doc.scenarios) {
    assert.equal(
      scenario.engine,
      'socketio-v3',
      `scenario "${scenario.name}" must declare engine: socketio-v3`,
    );
  }
});

test('both scenarios call setAuthToken before running the flow', () => {
  const doc = loadDoc();
  for (const scenario of doc.scenarios) {
    const hooks = Array.isArray(scenario.beforeScenario)
      ? scenario.beforeScenario
      : [scenario.beforeScenario];
    assert.ok(
      hooks.includes('setAuthToken'),
      `scenario "${scenario.name}" must register setAuthToken as a beforeScenario hook`,
    );
  }
});

// ---------------------------------------------------------------------------
// Subscriber flow — joins board room, listens for item:updated, records latency
// ---------------------------------------------------------------------------

test('subscriber flow joins the board room via board:subscribe', () => {
  const doc = loadDoc();
  const subscriber = doc.scenarios.find((s) => /sub/i.test(s.name ?? ''));
  assert.ok(subscriber, 'expected a subscriber scenario');

  // Walk every emit step (including inside loops) and look for board:subscribe.
  // The real backend listens for `board:subscribe` (see
  // backend/src/services/WebSocketService.ts) — the prompt's `board:join`
  // name is an alias; we use the canonical event so the scenario works
  // against the real server without a shim.
  const emits = collectEmits(subscriber!.flow);
  const hasBoardSubscribe = emits.some((e) => e.channel === 'board:subscribe');
  assert.ok(
    hasBoardSubscribe,
    'expected subscriber to emit `board:subscribe` so it joins the fan-out room',
  );
});

test('subscriber flow listens for item:updated via a response/on handler', () => {
  const doc = loadDoc();
  const subscriber = doc.scenarios.find((s) => /sub/i.test(s.name ?? ''));
  assert.ok(subscriber, 'expected a subscriber scenario');

  const listens = collectResponseChannels(subscriber!.flow);
  assert.ok(
    listens.includes('item:updated'),
    'expected subscriber to listen for `item:updated` events',
  );
});

test('subscriber flow invokes the recordFanOutLatency processor hook', () => {
  const doc = loadDoc();
  const subscriber = doc.scenarios.find((s) => /sub/i.test(s.name ?? ''));
  assert.ok(subscriber, 'expected a subscriber scenario');

  const funcs = collectFunctions(subscriber!.flow);
  assert.ok(
    funcs.includes('recordFanOutLatency'),
    'expected subscriber to call recordFanOutLatency (emits the fanOutLatency histogram)',
  );
});

// ---------------------------------------------------------------------------
// Publisher flow — fires item:updated at 2 Hz for 5 min
// ---------------------------------------------------------------------------

test('publisher flow emits item:updated and embeds server_ts for latency calc', () => {
  const doc = loadDoc();
  const publisher = doc.scenarios.find((s) => /pub/i.test(s.name ?? ''));
  assert.ok(publisher, 'expected a publisher scenario');

  const emits = collectEmits(publisher!.flow);
  const itemUpdated = emits.find((e) => e.channel === 'item:updated');
  assert.ok(itemUpdated, 'expected publisher to emit `item:updated`');
  // The publisher hook stamps server_ts on each payload — the YAML just needs
  // to wire the hook in as a function call adjacent to the emit. We assert
  // stampServerTs is part of the publisher flow so subscribers can compute
  // (clientNow - payload.server_ts).
  const funcs = collectFunctions(publisher!.flow);
  assert.ok(
    funcs.includes('stampServerTs'),
    'expected publisher to call stampServerTs so each payload carries a server_ts field',
  );
});

test('publisher flow loops the emit at ~2 Hz with a 500 ms think', () => {
  const doc = loadDoc();
  const publisher = doc.scenarios.find((s) => /pub/i.test(s.name ?? ''));
  assert.ok(publisher, 'expected a publisher scenario');

  const loop = findLoop(publisher!.flow);
  assert.ok(loop, 'expected publisher to wrap its emit in a loop');
  // think: 0.5 s = 2 events / sec.
  const thinks = collectThinks(loop!);
  assert.ok(
    thinks.includes(0.5),
    `expected a 0.5 s think inside the publisher loop (got ${JSON.stringify(thinks)})`,
  );
});

// ---------------------------------------------------------------------------
// Phase shape — full vs short run
// ---------------------------------------------------------------------------

test('full (default) config ramps 500 subscribers over 60s + sustains 5 min', () => {
  const doc = loadDoc();
  const phases = doc.config.phases;
  assert.ok(Array.isArray(phases) && phases.length >= 2, 'expected at least ramp + sustain phases');

  const ramp = phases!.find((p) => p.name === 'ramp');
  const sustain = phases!.find((p) => p.name === 'sustain');
  assert.ok(ramp, 'expected a phase named "ramp"');
  assert.ok(sustain, 'expected a phase named "sustain"');

  assert.equal(ramp!.duration, 60, 'ramp duration should be 60 seconds per SPEC §19C');
  // arrivalCount semantics: exactly N virtual users spread across the ramp
  // — gives us a deterministic 500 subscribers + 1 publisher rather than
  // relying on arrivalRate math.
  assert.equal(ramp!.arrivalCount, 501, 'ramp arrivalCount must be 501 (500 subscribers + 1 publisher)');

  assert.equal(sustain!.duration, 300, 'sustain should be 5 minutes (300s) per SPEC §19C');
});

test('short environment reduces to 50 subscribers + 1 publisher over 60s sustain', () => {
  const doc = loadDoc();
  const envs = doc.config.environments;
  assert.ok(envs && typeof envs === 'object', 'expected config.environments block');
  const short = envs!.short;
  assert.ok(short && short.config && Array.isArray(short.config.phases), 'expected `short` env with phases override');

  const ramp = short.config!.phases!.find((p) => p.name === 'ramp');
  const sustain = short.config!.phases!.find((p) => p.name === 'sustain');
  assert.ok(ramp, 'short env must define ramp phase');
  assert.ok(sustain, 'short env must define sustain phase');

  assert.equal(ramp!.arrivalCount, 51, 'short ramp arrivalCount = 50 subscribers + 1 publisher');
  assert.equal(sustain!.duration, 60, 'short sustain should be 60s for CI speed');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectEmits(flow: ArtilleryStep[]): Array<{ channel: string; data?: unknown }> {
  const out: Array<{ channel: string; data?: unknown }> = [];
  for (const step of flow) {
    if (step.emit && !Array.isArray(step.emit)) {
      out.push({ channel: step.emit.channel, data: step.emit.data });
    }
    if (step.loop) {
      out.push(...collectEmits(step.loop));
    }
  }
  return out;
}

function collectResponseChannels(flow: ArtilleryStep[]): string[] {
  const out: string[] = [];
  for (const step of flow) {
    // Subscriber pattern per Artillery's socketio schema: a sibling
    //   response: { on: 'item:updated', function: 'recordFanOutLatency' }
    // sits alongside `emit:` at the step level. Older YAMLs nest response
    // inside `emit:` — support both to stay resilient to future refactors.
    if (step.on?.channel) out.push(step.on.channel);
    if (step.response) {
      const ch = step.response.on ?? step.response.channel;
      if (ch) out.push(ch);
    }
    const emitObj = step.emit as { channel?: string; response?: { on?: string; channel?: string } } | undefined;
    if (emitObj?.response) {
      const ch = emitObj.response.on ?? emitObj.response.channel;
      if (ch) out.push(ch);
    }
    if (step.loop) out.push(...collectResponseChannels(step.loop));
  }
  return out;
}

function collectFunctions(flow: ArtilleryStep[]): string[] {
  const out: string[] = [];
  for (const step of flow) {
    if (step.function) out.push(step.function);
    // Functions can also hang off a sibling `response:` block — that's how
    // the subscriber fires recordFanOutLatency on each `item:updated`.
    if (step.response?.function) out.push(step.response.function);
    if (step.loop) out.push(...collectFunctions(step.loop));
  }
  return out;
}

function findLoop(flow: ArtilleryStep[]): ArtilleryStep[] | undefined {
  for (const step of flow) {
    if (step.loop) return step.loop;
  }
  return undefined;
}

function collectThinks(flow: ArtilleryStep[]): number[] {
  const out: number[] = [];
  for (const step of flow) {
    if (typeof step.think === 'number') out.push(step.think);
    if (step.loop) out.push(...collectThinks(step.loop));
  }
  return out;
}
