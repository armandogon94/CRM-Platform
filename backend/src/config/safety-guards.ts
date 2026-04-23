/**
 * Runtime safety guards (Slice 19C, Task A3).
 *
 * Defense-in-depth boundary that refuses to boot the Express server under
 * `NODE_ENV=perf` unless every observable env-var points at an isolated
 * perf environment. Layered on top of the docker-compose perf overlay
 * (Task C1) so a perf run can never silently target the dev / staging /
 * prod database or share Redis DB 0 with another environment.
 *
 * The guard fires ONLY in perf mode — dev / test / production retain their
 * own protections (migrations, separate configs, ops review) and this file
 * intentionally no-ops for those cases.
 *
 * SPEC §Slice 19C — Boundaries (slice-specific):
 *   "Never: run perf scenarios against dev DB, shared Redis, or any
 *    environment named development/staging/production."
 *
 * Exported as a pure function of `env` so tests can pass synthetic
 * environments without mutating `process.env`. Callers in `server.ts`
 * invoke it with the default (`process.env`) immediately on bootstrap.
 */

/**
 * Name of the canonical perf database. Kept local to the safety guard to
 * avoid cross-imports from `config/perf.ts` — the constant is duplicated
 * on purpose so a typo in either place cannot silently defeat the check.
 */
const PERF_DB_PREFIX = 'crm_perf';

/**
 * Redis logical DB index that must be used during perf runs. The perf
 * profile (C1) sets `REDIS_DB=1`; any other value means the caller is
 * about to share cache state with another environment.
 */
const PERF_REDIS_DB = '1';

/**
 * Hostnames we refuse to connect to from perf mode, even if the operator
 * claims it's an isolated instance. Matches substrings `production`,
 * `staging`, and `prod.` (the trailing dot catches `prod.example.com`
 * without false-matching `postgres`).
 */
const PROTECTED_HOSTNAME_PATTERN = /production|staging|prod\./i;

/**
 * Refuse to continue if `NODE_ENV=perf` is paired with any env-var that
 * would cause the process to touch a non-perf environment.
 *
 * No-op for every other `NODE_ENV`. Throws an `Error` with a clear,
 * operator-actionable message identifying the offending env key + value
 * so a misconfigured compose file or shell export can be fixed quickly.
 *
 * @param env Process environment to inspect. Defaults to `process.env`
 *            so production callers need no argument; tests pass in a
 *            synthetic object per case.
 * @throws Error When any refusal condition matches.
 */
export function assertPerfIsolation(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'perf') {
    // Other modes have their own protections (separate configs, migration
    // policy, ops review). The guard is intentionally scoped to perf only.
    return;
  }

  // --- Database name check ------------------------------------------------
  // Must start with `crm_perf` so future per-shard suffixes (`crm_perf_1`,
  // `crm_perf_test`) remain allowed without relaxing the check.
  const dbName = env.DB_NAME;
  if (!dbName || !dbName.startsWith(PERF_DB_PREFIX)) {
    throw new Error(
      `Refusing to start: NODE_ENV=perf must target crm_perf database, ` +
        `got DB_NAME="${dbName ?? '<unset>'}"`,
    );
  }

  // --- Redis DB index check ----------------------------------------------
  // Perf mode must use Redis DB 1 so the dev/prod cache on DB 0 is never
  // evicted or polluted by an Artillery run.
  const redisDb = env.REDIS_DB;
  if (redisDb !== PERF_REDIS_DB) {
    throw new Error(
      `Refusing to start: NODE_ENV=perf requires REDIS_DB=1 (isolated ` +
        `cache), got REDIS_DB="${redisDb ?? '<unset>'}"`,
    );
  }

  // --- Hostname safety check ---------------------------------------------
  // Refuse anything that looks like a protected environment, regardless of
  // the DB name. Catches the case where someone points DB_HOST at a
  // staging/prod box but leaves the local DB_NAME intact.
  const dbHost = env.DB_HOST;
  if (dbHost && PROTECTED_HOSTNAME_PATTERN.test(dbHost)) {
    throw new Error(
      `Refusing to start: NODE_ENV=perf cannot target a protected ` +
        `environment hostname, got DB_HOST="${dbHost}"`,
    );
  }
}
