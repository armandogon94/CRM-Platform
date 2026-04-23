/**
 * Slice 19C F1 — perf-scenario orchestrator.
 *
 * Runs the four Slice 19C scenarios (a REST, b WebSocket, c automation,
 * d file upload) strictly sequentially after a 2-minute cache-priming
 * warmup. Pipes each Artillery JSON output into
 *   <output-dir>/{ISO-timestamp}-scenario-<x>.json
 * then prunes older runs so `<output-dir>/` never keeps more than 10
 * JSONs per scenario.
 *
 * Design notes
 * ------------
 *  - Every side-effectful dependency (process spawn, fetch, filesystem,
 *    clock, abort signal, streams) flows through the `RunDeps` shim so
 *    tests can drive the orchestrator without starting real subprocesses.
 *    The CLI entry point `main()` supplies the real implementations.
 *
 *  - Warmup is an inline fetch loop (no Artillery YAML). This keeps F1
 *    self-contained — no extra warmup scenario file to ship, rename, or
 *    forget to ignore in prune math. Warmup metrics are NOT captured; we
 *    only care that the Redis cache is primed before scenario (a) starts.
 *
 *  - F2 (`report.ts`) lands the markdown renderer. F1 imports it lazily
 *    via dynamic `import()` and gracefully no-ops with a warning if F2
 *    isn't committed yet — avoids blocking F1 on a sibling task.
 *
 *  - SIGINT handling: when `deps.signal` fires (wired to the real
 *    `process.on('SIGINT', ...)` in `main()`), the orchestrator kills the
 *    live Artillery child, skips any remaining scenarios, and resolves
 *    with exit code 130 (the POSIX convention for SIGINT terminations).
 */

import { spawn as nodeSpawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Public types — exported for tests + any future wrappers.
// ---------------------------------------------------------------------------

/** Shape of the args passed to our `spawn` shim — mirrors Node's signature. */
export interface SpawnArgs {
  command: string;
  args: readonly string[];
  options?: { cwd?: string; env?: NodeJS.ProcessEnv };
}

/**
 * Minimal subset of `ChildProcess` the orchestrator actually uses. Modelled
 * as an event emitter with `kill()`, `stdout`, and `stderr` so FakeChild
 * instances from `run.test.ts` satisfy the contract without importing
 * Node's full `ChildProcess` class.
 */
export interface RunChildProcess extends EventEmitter {
  stdout: EventEmitter | NodeJS.ReadableStream;
  stderr: EventEmitter | NodeJS.ReadableStream;
  kill(signal?: NodeJS.Signals): boolean;
}

/** Response shape the orchestrator uses from its fetch implementation. */
interface MinimalResponse {
  ok: boolean;
  status: number;
}

/** Dependency-injected surface for testability. */
export interface RunDeps {
  /**
   * Spawn shim. In production this is `child_process.spawn`; tests pass a
   * fake that records calls and returns a `FakeChild`.
   */
  spawn: (
    command: string,
    args: readonly string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv },
  ) => RunChildProcess;

  /** HTTP shim — used only by the warmup loop. */
  fetch: (input: string, init?: unknown) => Promise<MinimalResponse>;

  /** Working directory for relative paths (YAMLs, processor). */
  cwd: string;
  env: NodeJS.ProcessEnv;
  now: () => Date;

  /**
   * Abort signal bridged to SIGINT by `main()`. If omitted, the orchestrator
   * simply has no way to be cancelled externally (tests that don't cover
   * SIGINT leave this undefined).
   */
  signal?: AbortSignal;

  /** Observable stdout/stderr — real streams in prod, sinks in tests. */
  out: NodeJS.WritableStream;
  err: NodeJS.WritableStream;

  /**
   * Override for the board IDs hit during warmup. If empty, warmup still
   * runs against `GET /health` to prove the backend is reachable — just no
   * cache priming happens. Tests override this to keep URLs small.
   */
  warmupBoardIds?: readonly string[];

  /**
   * How many warmup requests to issue in total. SPEC asks for 100; tests
   * pass a smaller number to keep the loop short. Defaults to 100 when
   * omitted by callers who use the public API.
   */
  warmupRequestCount?: number;
}

// ---------------------------------------------------------------------------
// Config — constants derived from SPEC §19C.
// ---------------------------------------------------------------------------

/**
 * Canonical registry of the four scenarios. Kept here — not in the YAMLs —
 * because the orchestrator needs to know which YAML each letter maps to and
 * which scenario order to run. Order matches the SPEC's "30 min total
 * budget" narrative (REST → WS → automation → file upload).
 */
const SCENARIO_REGISTRY: readonly { id: ScenarioId; yamlRelative: string }[] = [
  { id: 'a', yamlRelative: 'artillery/scenario-a-rest.yml' },
  { id: 'b', yamlRelative: 'artillery/scenario-b-websocket.yml' },
  { id: 'c', yamlRelative: 'artillery/scenario-c-automation.yml' },
  { id: 'd', yamlRelative: 'artillery/scenario-d-file-upload.yml' },
];

type ScenarioId = 'a' | 'b' | 'c' | 'd';

/** Max JSON files to keep per scenario in the output directory. */
const MAX_RUNS_PER_SCENARIO = 10;

/** POSIX exit code convention for SIGINT-terminated processes. */
const EXIT_SIGINT = 130;

/** Exit code returned when any scenario fails — aborts remaining scenarios. */
const EXIT_SCENARIO_FAIL = 1;

// ---------------------------------------------------------------------------
// Parsed CLI args
// ---------------------------------------------------------------------------

interface ParsedArgs {
  scenarios: readonly ScenarioId[];
  short: boolean;
  outputDir: string;
}

/**
 * Minimal CLI parser. Accepts:
 *   --scenarios=a,c      CSV of scenario IDs (default: all four)
 *   --short              Use the YAML `short` environment (default full)
 *   --output-dir=PATH    Override results directory (default `results/`)
 *
 * Intentionally terse — no yargs/commander, just substring checks. If
 * requirements grow, revisit this choice.
 */
function parseArgs(argv: readonly string[]): ParsedArgs {
  let scenarios: readonly ScenarioId[] = SCENARIO_REGISTRY.map((s) => s.id);
  let short = false;
  let outputDir = 'results';

  for (const raw of argv) {
    if (raw === '--short') {
      short = true;
      continue;
    }
    const eqIdx = raw.indexOf('=');
    if (eqIdx === -1) continue;
    const key = raw.slice(0, eqIdx);
    const value = raw.slice(eqIdx + 1);
    switch (key) {
      case '--scenarios': {
        const ids = value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .filter((s): s is ScenarioId => ['a', 'b', 'c', 'd'].includes(s));
        if (ids.length === 0) {
          throw new Error(`--scenarios needs one or more of a,b,c,d (got "${value}")`);
        }
        scenarios = ids;
        break;
      }
      case '--output-dir':
        outputDir = value;
        break;
      default:
        // Silently ignore unknown flags so CI harnesses can pass-through.
        break;
    }
  }

  return { scenarios, short, outputDir };
}

// ---------------------------------------------------------------------------
// Warmup
// ---------------------------------------------------------------------------

/**
 * Fires N `GET /api/v1/boards/:id` requests against the perf backend to
 * prime the Redis cache. Failures do NOT abort the run — warmup is a
 * best-effort step; if the backend isn't healthy, the subsequent scenario
 * will produce the real failure signal.
 */
async function runWarmup(deps: RunDeps): Promise<void> {
  const baseUrl = deps.env.BACKEND_URL ?? deps.env.PERF_BACKEND_URL ?? 'http://backend:13000';
  const requests = deps.warmupRequestCount ?? 100;
  const boards = deps.warmupBoardIds && deps.warmupBoardIds.length > 0
    ? deps.warmupBoardIds
    : [];

  deps.out.write(`[warmup] firing ${requests} request(s) against ${baseUrl}\n`);

  if (boards.length === 0) {
    // No seeded boards supplied — fall back to /health so we at least
    // probe the backend. Still issues `requests` calls to exercise the
    // HTTP pool.
    for (let i = 0; i < requests; i++) {
      if (deps.signal?.aborted) return;
      try {
        await deps.fetch(`${baseUrl}/health`);
      } catch {
        /* best-effort — ignore warmup errors */
      }
    }
    return;
  }

  for (let i = 0; i < requests; i++) {
    if (deps.signal?.aborted) return;
    const boardId = boards[i % boards.length];
    try {
      await deps.fetch(`${baseUrl}/api/v1/boards/${boardId}`);
    } catch {
      /* best-effort */
    }
  }
}

// ---------------------------------------------------------------------------
// Scenario execution
// ---------------------------------------------------------------------------

/** ISO timestamp safe for filenames (Windows-incompatible chars replaced). */
function isoStamp(now: Date): string {
  return now.toISOString().replace(/:/g, '-').replace(/\..+$/, '');
}

/**
 * Runs a single Artillery scenario to completion. Resolves with the exit
 * code; rejects only if `spawn` itself errors (missing binary, etc).
 *
 * The returned promise races against `deps.signal` — when aborted, we
 * `kill('SIGINT')` the child and wait for it to actually exit before
 * resolving. This avoids leaving zombie child processes in CI.
 */
function runScenario(
  deps: RunDeps,
  scenarioId: ScenarioId,
  outputPath: string,
  short: boolean,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const entry = SCENARIO_REGISTRY.find((s) => s.id === scenarioId);
    if (!entry) {
      reject(new Error(`Unknown scenario id: ${scenarioId}`));
      return;
    }
    const environment = short ? 'short' : 'full';
    const args: string[] = [
      'artillery',
      'run',
      '--output',
      outputPath,
      '--environment',
      environment,
      entry.yamlRelative,
    ];
    deps.out.write(`[scenario-${scenarioId}] npx ${args.join(' ')}\n`);

    let child: RunChildProcess;
    try {
      child = deps.spawn('npx', args, { cwd: deps.cwd, env: deps.env });
    } catch (err) {
      reject(err as Error);
      return;
    }

    // Stream child output upward so operators see live Artillery progress.
    pipeStream(child.stdout, deps.out);
    pipeStream(child.stderr, deps.err);

    let settled = false;
    const settle = (code: number) => {
      if (settled) return;
      settled = true;
      deps.signal?.removeEventListener('abort', onAbort);
      resolve(code);
    };

    const onAbort = (): void => {
      deps.out.write(`[scenario-${scenarioId}] abort requested — killing child\n`);
      try {
        child.kill('SIGINT');
      } catch {
        /* ignore — child may already be dead */
      }
      // Don't resolve yet — wait for the 'exit' event so we don't leave
      // zombies. If the child refuses to die within 5 s, force-resolve.
      setTimeout(() => settle(EXIT_SIGINT), 5000).unref?.();
    };

    if (deps.signal) {
      if (deps.signal.aborted) {
        onAbort();
      } else {
        deps.signal.addEventListener('abort', onAbort, { once: true });
      }
    }

    child.on('exit', (code: number | null) => {
      // Child killed by SIGINT → code is null or 130. Normalise to 130
      // so the orchestrator's POSIX-convention exit path is consistent.
      if (deps.signal?.aborted) {
        settle(EXIT_SIGINT);
        return;
      }
      settle(code ?? 0);
    });

    child.on('error', (err: Error) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

/**
 * Best-effort pipe from a child's stdout/stderr emitter into one of our
 * writable sinks. We accept either a real `Readable` (stdout is a stream in
 * production) or a bare `EventEmitter` with `data` events (fake children in
 * tests). The `.on('data', ...)` contract works for both.
 */
function pipeStream(src: EventEmitter | NodeJS.ReadableStream, dest: NodeJS.WritableStream): void {
  (src as EventEmitter).on('data', (chunk: Buffer | string) => {
    try {
      dest.write(chunk);
    } catch {
      /* sink full — drop the chunk */
    }
  });
}

// ---------------------------------------------------------------------------
// Prune
// ---------------------------------------------------------------------------

/**
 * Keeps at most `MAX_RUNS_PER_SCENARIO` JSON files per scenario in
 * `outputDir`. Files are bucketed by scenario ID (extracted from the
 * filename suffix `-scenario-<x>.json`) and the oldest-mtime files in each
 * bucket are unlinked until the bucket is within quota.
 *
 * Non-scenario files (baseline.md, markdown reports, stray JSON that
 * doesn't match the suffix) are left alone — the orchestrator only
 * curates its own output.
 */
function prune(outputDir: string): void {
  if (!fs.existsSync(outputDir)) return;
  const entries = fs.readdirSync(outputDir);

  // Bucket by scenario id.
  const buckets = new Map<ScenarioId, Array<{ file: string; mtimeMs: number }>>();
  const scenarioPattern = /-scenario-([abcd])\.json$/;

  for (const file of entries) {
    const match = scenarioPattern.exec(file);
    if (!match) continue;
    const id = match[1] as ScenarioId;
    const full = path.join(outputDir, file);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue; // File vanished between readdir and stat — ignore.
    }
    const bucket = buckets.get(id) ?? [];
    bucket.push({ file: full, mtimeMs: stat.mtimeMs });
    buckets.set(id, bucket);
  }

  for (const bucket of buckets.values()) {
    if (bucket.length <= MAX_RUNS_PER_SCENARIO) continue;
    // Sort newest first — keep the first N, drop the rest.
    bucket.sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const { file } of bucket.slice(MAX_RUNS_PER_SCENARIO)) {
      try {
        fs.unlinkSync(file);
      } catch {
        /* race with another prune — benign */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report (F2) — lazy import
// ---------------------------------------------------------------------------

/**
 * Attempts to delegate markdown rendering to F2's `report.ts`. F2 is a
 * sibling task that may land after F1; if its module isn't present yet,
 * we emit a warning and continue — perf runs must NOT fail just because
 * the renderer is unshipped.
 */
async function invokeReportIfAvailable(deps: RunDeps, outputDir: string): Promise<void> {
  try {
    // Relative to `run.ts`'s compiled location (dist/run.js), report lives
    // at dist/lib/report.js (tsc rootDir collapses to e2e/perf/).
    //
    // The module path is computed at runtime so tsc doesn't resolve it at
    // compile time — F2 (`lib/report.ts`) lands in a sibling task and may
    // not yet be committed when F1 builds. A literal `import('./lib/report')`
    // would fail with TS2307 until F2 ships; the indirection defers the
    // lookup to Node's runtime resolver, which cleanly throws an ERR_MODULE
    // we catch below.
    const modulePath = './lib/report';
    const dynamicImport = new Function('p', 'return import(p)') as (p: string) => Promise<unknown>;
    const mod = (await dynamicImport(modulePath)) as {
      renderReport?: (outputDir: string) => Promise<void> | void;
    };
    if (typeof mod.renderReport === 'function') {
      await mod.renderReport(outputDir);
    } else {
      deps.err.write('[report] F2 renderReport() not exported yet — skipping.\n');
    }
  } catch {
    deps.err.write('[report] F2 report.ts not present yet — skipping markdown render.\n');
  }
}

// ---------------------------------------------------------------------------
// Core run() — exported for tests
// ---------------------------------------------------------------------------

/**
 * Orchestrates warmup + selected scenarios + prune + report. Returns the
 * process exit code rather than calling process.exit() so tests can assert
 * on the result without tearing down the worker.
 */
export async function run(deps: RunDeps, argv: readonly string[]): Promise<number> {
  const { scenarios, short, outputDir } = parseArgs(argv);
  const absOutputDir = path.isAbsolute(outputDir) ? outputDir : path.join(deps.cwd, outputDir);

  fs.mkdirSync(absOutputDir, { recursive: true });

  // Step 1: Warmup.
  await runWarmup(deps);
  if (deps.signal?.aborted) return EXIT_SIGINT;

  // Step 2: Scenarios, strictly sequential.
  const stamp = isoStamp(deps.now());
  for (const id of scenarios) {
    if (deps.signal?.aborted) {
      deps.err.write('[run] abort received — skipping remaining scenarios\n');
      return EXIT_SIGINT;
    }
    const outputPath = path.join(absOutputDir, `${stamp}-scenario-${id}.json`);
    let exitCode: number;
    try {
      exitCode = await runScenario(deps, id, outputPath, short);
    } catch (err) {
      deps.err.write(`[scenario-${id}] spawn error: ${(err as Error).message}\n`);
      return EXIT_SCENARIO_FAIL;
    }
    if (deps.signal?.aborted || exitCode === EXIT_SIGINT) {
      return EXIT_SIGINT;
    }
    if (exitCode !== 0) {
      deps.err.write(`[scenario-${id}] exited ${exitCode} — aborting run\n`);
      return exitCode;
    }
  }

  // Step 3: Prune.
  prune(absOutputDir);

  // Step 4: Report (lazy; may no-op if F2 not yet shipped).
  await invokeReportIfAvailable(deps, absOutputDir);

  return 0;
}

// ---------------------------------------------------------------------------
// CLI entry — `node dist/run.js` or `npx ts-node run.ts`
// ---------------------------------------------------------------------------

/**
 * Real-dependencies wrapper. Wires `child_process.spawn`, Node's global
 * `fetch`, a SIGINT-linked AbortController, and process streams, then
 * calls `run()` and propagates the returned exit code to the process.
 */
export async function main(argv: readonly string[]): Promise<void> {
  const abort = new AbortController();
  const onSigint = (): void => {
    process.stderr.write('\n[run] SIGINT received — aborting\n');
    abort.abort();
  };
  process.on('SIGINT', onSigint);

  const deps: RunDeps = {
    spawn: nodeSpawn as unknown as RunDeps['spawn'],
    fetch: globalThis.fetch as unknown as RunDeps['fetch'],
    cwd: process.cwd(),
    env: process.env,
    now: () => new Date(),
    signal: abort.signal,
    out: process.stdout,
    err: process.stderr,
    warmupRequestCount: 100,
  };

  try {
    const code = await run(deps, argv);
    process.exit(code);
  } finally {
    process.off('SIGINT', onSigint);
  }
}

// Invoke `main()` only when this file is executed directly (not when
// imported by tests). `require.main === module` is the canonical CJS check.
/* istanbul ignore next */
if (require.main === module) {
  void main(process.argv.slice(2));
}
