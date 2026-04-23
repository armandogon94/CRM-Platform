/**
 * Perf-mode config helpers (Slice 19C, Task A1).
 *
 * `NODE_ENV=perf` is a dedicated runtime mode used only by the Artillery-
 * driven performance test suite. It must:
 *   - never touch the dev or prod database (A2/A3 enforce via connection
 *     string guards; this file provides the canonical constants)
 *   - silence request logging and debug endpoints so the measured workload
 *     matches production as closely as possible
 *   - use production-style error responses (no stack traces in bodies)
 *
 * Keep this module zero-dependency and zero-side-effect — it is imported
 * from both `config/index.ts` (config branching) and `app.ts` (middleware
 * gating) without triggering any I/O.
 */

/**
 * True iff the process was started with `NODE_ENV=perf`. Evaluated at call
 * time (not import time) so tests can toggle the env var between cases.
 */
export function isPerfMode(): boolean {
  return process.env.NODE_ENV === 'perf';
}

/**
 * Canonical database name for the perf environment. Referenced by the
 * compose overlay, safety guard (A3), and seed script (B1/B2).
 */
export const perfDatabaseName = 'crm_perf';

/**
 * Redis logical DB index used during perf runs so the dev/prod db 0 cache
 * stays untouched. ioredis' `db` option takes a number, hence the type.
 */
export const perfRedisDb = 1;
