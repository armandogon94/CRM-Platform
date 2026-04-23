/**
 * Tests for run.ts orchestrator — Slice 19C F1.
 *
 * Uses Node 20+ built-in test runner (`node:test`) so the perf package
 * stays Jest/Mocha-free. The orchestrator is exercised via a dependency-
 * injection shim: we pass synthetic `spawn` / `fetch` / filesystem fakes
 * and assert on what the orchestrator attempts — no real Artillery child
 * processes, no real HTTP, no real disk writes outside a tmp dir.
 *
 * Run after `npm run build`:
 *   node --test dist/__tests__/run.test.js
 *
 * Covers the task's RED contract:
 *   - Module is importable (`run` named export from ../run).
 *   - Invoking with `--scenarios=a,c --short` spawns Artillery twice in
 *     sequence (a then c), each with `--environment short`.
 *   - Warmup always fires first.
 *   - SIGINT aborts the currently-running child cleanly and exits 130.
 *   - After a successful run, `results/` holds ≤10 JSON files per scenario.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { run } from '../run';
import type { RunDeps, SpawnArgs } from '../run';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

/**
 * Fake ChildProcess — minimal EventEmitter with `stdout`, `stderr`, `kill`,
 * and an `exitCode`-setter helper. Enough shape for run.ts to treat it as a
 * real spawn result without pulling the `child_process.ChildProcess` class.
 */
class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  pid = 1234;
  killed = false;
  killSignal?: NodeJS.Signals;

  kill(signal?: NodeJS.Signals): boolean {
    this.killed = true;
    this.killSignal = signal;
    return true;
  }

  /** Schedules a clean exit with the given code on the next microtask. */
  finish(code: number): void {
    queueMicrotask(() => this.emit('exit', code, null));
  }
}

interface SpawnCall {
  command: string;
  args: readonly string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Builds a spawn fake that records every call and hands back FakeChildren
 * for the caller to drive. `autoFinish` auto-exits each child with code 0
 * on the next tick; disable it if the test needs to kill the child first.
 */
function makeSpawnFake(opts: { autoFinish?: boolean } = {}) {
  const { autoFinish = true } = opts;
  const calls: SpawnCall[] = [];
  const children: FakeChild[] = [];
  const spawn = ((command: string, args: readonly string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }) => {
    calls.push({ command, args, cwd: options?.cwd, env: options?.env });
    const child = new FakeChild();
    children.push(child);
    if (autoFinish) child.finish(0);
    return child;
  }) as unknown as RunDeps['spawn'];
  return { spawn, calls, children };
}

/** Fake fetch that records every URL it was called with. */
function makeFetchFake(): { fetch: RunDeps['fetch']; urls: string[] } {
  const urls: string[] = [];
  const fakeFetch = (async (input: unknown) => {
    const url = typeof input === 'string' ? input : String((input as { url?: string }).url ?? '');
    urls.push(url);
    return {
      ok: true,
      status: 200,
      text: async () => '{}',
      json: async () => ({}),
    };
  }) as unknown as RunDeps['fetch'];
  return { fetch: fakeFetch, urls };
}

/** Creates a fresh tmp output dir for each test. Auto-cleaned at end. */
function makeTmpOutputDir(t: { after: (fn: () => void) => void }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-run-test-'));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

/**
 * Default deps bundle — each test overrides the pieces it cares about.
 */
function makeDeps(overrides: Partial<RunDeps> = {}): RunDeps {
  const spawnFake = makeSpawnFake();
  const fetchFake = makeFetchFake();
  return {
    spawn: spawnFake.spawn,
    fetch: fetchFake.fetch,
    cwd: process.cwd(),
    env: { ...process.env },
    now: () => new Date('2026-04-22T12:00:00.000Z'),
    out: { write: (_: string): boolean => true } as NodeJS.WritableStream,
    err: { write: (_: string): boolean => true } as NodeJS.WritableStream,
    warmupBoardIds: ['board-1', 'board-2', 'board-3'],
    warmupRequestCount: 3,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('run is importable as a named export', () => {
  assert.equal(typeof run, 'function', '`run` must be an exported function');
});

test('--scenarios=a,c --short spawns Artillery twice in sequence with --environment short', async (t) => {
  const outputDir = makeTmpOutputDir(t);
  const spawnFake = makeSpawnFake();
  const { fetch } = makeFetchFake();

  const exitCode = await run({
    ...makeDeps(),
    spawn: spawnFake.spawn,
    fetch,
  }, ['--scenarios=a,c', '--short', `--output-dir=${outputDir}`]);

  assert.equal(exitCode, 0, `expected clean exit, got ${exitCode}`);

  // Exactly two Artillery invocations: a then c, in order.
  assert.equal(
    spawnFake.calls.length,
    2,
    `expected 2 Artillery spawns, got ${spawnFake.calls.length}`,
  );

  const firstArgs = spawnFake.calls[0].args.join(' ');
  const secondArgs = spawnFake.calls[1].args.join(' ');

  assert.match(firstArgs, /scenario-a-rest\.yml/, 'first spawn must run scenario-a');
  assert.match(secondArgs, /scenario-c-automation\.yml/, 'second spawn must run scenario-c');

  for (const call of spawnFake.calls) {
    const joined = call.args.join(' ');
    assert.match(joined, /--environment\s+short/, '--short flag must select the short Artillery environment');
    assert.match(joined, /--output\s+\S+\.json/, 'each spawn must emit JSON output via --output');
  }
});

test('scenarios run strictly sequentially (not concurrently)', async (t) => {
  const outputDir = makeTmpOutputDir(t);

  // Custom spawn fake that does NOT auto-finish — we finish each child
  // manually, asserting the orchestrator only spawned the NEXT scenario
  // once the CURRENT one's exit event has fired.
  const calls: SpawnCall[] = [];
  const children: FakeChild[] = [];
  const spawn = ((command: string, args: readonly string[], options?: { cwd?: string }) => {
    calls.push({ command, args, cwd: options?.cwd });
    const child = new FakeChild();
    children.push(child);
    return child;
  }) as unknown as RunDeps['spawn'];

  const deps = makeDeps({ spawn });

  const runPromise = run(deps, ['--scenarios=a,b', '--short', `--output-dir=${outputDir}`]);

  // Poll until the first child is spawned. Warmup uses fetch (not spawn),
  // so the first spawn must be scenario-a.
  await waitUntil(() => children.length >= 1, 1000);
  assert.equal(children.length, 1, 'second scenario must NOT spawn until first exits');
  assert.match(calls[0].args.join(' '), /scenario-a-rest\.yml/);

  // Finish child 1; child 2 should spawn shortly after.
  children[0].finish(0);
  await waitUntil(() => children.length >= 2, 1000);
  assert.equal(children.length, 2, 'second scenario must spawn after first finishes');
  assert.match(calls[1].args.join(' '), /scenario-b-websocket\.yml/);

  children[1].finish(0);
  const exitCode = await runPromise;
  assert.equal(exitCode, 0);
});

test('warmup runs before any Artillery scenario spawn', async (t) => {
  const outputDir = makeTmpOutputDir(t);
  const spawnFake = makeSpawnFake();

  // Custom fetch that records ordering against spawn.
  const events: Array<{ kind: 'fetch' | 'spawn'; at: number }> = [];
  let clock = 0;
  const fetchFake = (async () => {
    events.push({ kind: 'fetch', at: clock++ });
    return {
      ok: true,
      status: 200,
      text: async () => '{}',
      json: async () => ({}),
    };
  }) as unknown as RunDeps['fetch'];

  const recordingSpawn = ((command: string, args: readonly string[], options?: { cwd?: string }) => {
    events.push({ kind: 'spawn', at: clock++ });
    const child = new FakeChild();
    spawnFake.children.push(child);
    spawnFake.calls.push({ command, args, cwd: options?.cwd });
    child.finish(0);
    return child;
  }) as unknown as RunDeps['spawn'];

  const exitCode = await run(
    makeDeps({ spawn: recordingSpawn, fetch: fetchFake, warmupRequestCount: 3 }),
    ['--scenarios=a', '--short', `--output-dir=${outputDir}`],
  );

  assert.equal(exitCode, 0);
  assert.ok(events.length >= 2, 'expected at least one fetch + one spawn event');

  const firstFetchIdx = events.findIndex((e) => e.kind === 'fetch');
  const firstSpawnIdx = events.findIndex((e) => e.kind === 'spawn');
  assert.ok(firstFetchIdx >= 0, 'warmup must issue at least one fetch');
  assert.ok(firstSpawnIdx >= 0, 'at least one scenario must spawn');
  assert.ok(
    firstFetchIdx < firstSpawnIdx,
    `warmup fetch (#${firstFetchIdx}) must precede first scenario spawn (#${firstSpawnIdx})`,
  );
});

test('SIGINT aborts the in-flight child and exits with code 130', async (t) => {
  const outputDir = makeTmpOutputDir(t);

  const calls: SpawnCall[] = [];
  const children: FakeChild[] = [];
  const spawn = ((command: string, args: readonly string[], options?: { cwd?: string }) => {
    calls.push({ command, args, cwd: options?.cwd });
    const child = new FakeChild();
    children.push(child);
    // Deliberately don't auto-finish — the test simulates SIGINT mid-run.
    return child;
  }) as unknown as RunDeps['spawn'];

  const abort = new AbortController();

  const runPromise = run(
    makeDeps({ spawn, signal: abort.signal }),
    ['--scenarios=a,b,c,d', '--short', `--output-dir=${outputDir}`],
  );

  // Wait for the first child to spawn, then trigger the abort signal
  // (simulates an operator hitting ^C).
  await waitUntil(() => children.length >= 1, 1000);
  const firstChild = children[0];
  abort.abort();

  // The orchestrator should kill the live child. Simulate the kernel
  // delivering the signal by emitting an exit event with code null.
  await waitUntil(() => firstChild.killed, 1000);
  assert.equal(firstChild.killed, true, 'orchestrator must kill() the live child on SIGINT');

  // Child eventually exits because of the kill.
  firstChild.finish(130);

  const exitCode = await runPromise;
  assert.equal(exitCode, 130, 'SIGINT must translate to exit code 130');
  assert.equal(children.length, 1, 'no further scenarios may spawn after abort');
});

test('prune: after a successful run, results/ keeps ≤10 JSON files per scenario', async (t) => {
  const outputDir = makeTmpOutputDir(t);

  // Pre-seed the output dir with 12 stale JSONs for scenario-a and 15 for
  // scenario-b, stamped with progressively older mtimes so the orchestrator
  // has a clear oldest-first order to prune.
  const seed = (scenario: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const p = path.join(outputDir, `2026-01-0${(i % 9) + 1}T00-00-${String(i).padStart(2, '0')}-${scenario}.json`);
      fs.writeFileSync(p, '{}');
      // Back-date mtime so older files are clearly older.
      const past = Date.now() - (count - i) * 60_000;
      fs.utimesSync(p, past / 1000, past / 1000);
    }
  };
  seed('scenario-a', 12);
  seed('scenario-b', 15);

  const spawnFake = makeSpawnFake();
  const exitCode = await run(
    makeDeps({ spawn: spawnFake.spawn }),
    ['--scenarios=a,b', '--short', `--output-dir=${outputDir}`],
  );
  assert.equal(exitCode, 0);

  const entries = fs.readdirSync(outputDir).filter((f) => f.endsWith('.json'));
  const countFor = (scenario: string) => entries.filter((f) => f.includes(scenario)).length;

  assert.ok(
    countFor('scenario-a') <= 10,
    `expected ≤10 scenario-a JSONs after prune, got ${countFor('scenario-a')}`,
  );
  assert.ok(
    countFor('scenario-b') <= 10,
    `expected ≤10 scenario-b JSONs after prune, got ${countFor('scenario-b')}`,
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Polls `predicate` every 5 ms until it returns true or `timeoutMs` elapses.
 * Throws if the timeout fires. Used to synchronise test code against the
 * orchestrator's microtask-driven child lifecycle.
 */
async function waitUntil(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  if (!predicate()) {
    throw new Error(`waitUntil timed out after ${timeoutMs}ms`);
  }
}

// SpawnArgs export is only used in narrow assertions; referencing it here
// keeps tsc from tree-shaking the import warning under noUnusedLocals.
void (null as unknown as SpawnArgs | null);
