/**
 * Slice 19C, Task A3 — Hard safety guard.
 *
 * `assertPerfIsolation()` is the defense-in-depth check that refuses to let
 * the Express server bind a port under `NODE_ENV=perf` unless every
 * observable env-var points at an isolated perf environment. It layers on
 * top of the docker-compose profile (C1) so a perf run can never silently
 * target the dev/staging/prod database or shared Redis cache.
 *
 * The function is a pure wrapper over `process.env` — we pass a synthetic
 * `env` object so cases don't leak into each other, and the production code
 * defaults to `process.env` when called without arguments.
 *
 * Each test case corresponds to one refusal path documented in the plan
 * (`plans/slice-19c-plan.md` — Phase A Task A3 acceptance).
 */

import { assertPerfIsolation } from '../../config/safety-guards';

describe('assertPerfIsolation() — Slice 19C A3', () => {
  // -------------------------------------------------------------------------
  // (a) Happy path — properly isolated perf environment.
  // -------------------------------------------------------------------------

  it('returns normally when NODE_ENV=perf + DB_NAME=crm_perf + REDIS_DB=1 + host "postgres"', () => {
    const env = {
      NODE_ENV: 'perf',
      DB_NAME: 'crm_perf',
      REDIS_DB: '1',
      DB_HOST: 'postgres',
    };
    expect(() => assertPerfIsolation(env)).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // (b) DB_NAME refusal — must start with crm_perf.
  // -------------------------------------------------------------------------

  it('throws when NODE_ENV=perf + DB_NAME=crm_platform — message references "must target crm_perf"', () => {
    const env = {
      NODE_ENV: 'perf',
      DB_NAME: 'crm_platform',
      REDIS_DB: '1',
      DB_HOST: 'postgres',
    };
    expect(() => assertPerfIsolation(env)).toThrow(/must target crm_perf/);
  });

  // -------------------------------------------------------------------------
  // (c) REDIS_DB refusal — must be the isolated index 1.
  // -------------------------------------------------------------------------

  it('throws when NODE_ENV=perf + DB_NAME=crm_perf + REDIS_DB=0 — message references Redis DB', () => {
    const env = {
      NODE_ENV: 'perf',
      DB_NAME: 'crm_perf',
      REDIS_DB: '0',
      DB_HOST: 'postgres',
    };
    expect(() => assertPerfIsolation(env)).toThrow(/redis|REDIS_DB/i);
  });

  // -------------------------------------------------------------------------
  // (d) Hostname refusal — never connect to protected environment names.
  // -------------------------------------------------------------------------

  it('throws when NODE_ENV=perf + DB_HOST=staging-db.example.com — message names the protected environment', () => {
    const env = {
      NODE_ENV: 'perf',
      DB_NAME: 'crm_perf',
      REDIS_DB: '1',
      DB_HOST: 'staging-db.example.com',
    };
    expect(() => assertPerfIsolation(env)).toThrow(/staging|protected/i);
  });

  it('throws when NODE_ENV=perf + DB_HOST=prod.example.com — message names the protected environment', () => {
    const env = {
      NODE_ENV: 'perf',
      DB_NAME: 'crm_perf',
      REDIS_DB: '1',
      DB_HOST: 'prod.example.com',
    };
    expect(() => assertPerfIsolation(env)).toThrow(/prod|protected/i);
  });

  // -------------------------------------------------------------------------
  // (e-g) No-op outside perf mode — other NODE_ENV values never trip the
  // guard, regardless of DB_NAME / REDIS_DB / DB_HOST values.
  // -------------------------------------------------------------------------

  it('is a NO-OP when NODE_ENV=development (returns without throwing regardless of other env values)', () => {
    const env = {
      NODE_ENV: 'development',
      DB_NAME: 'crm_platform',
      REDIS_DB: '0',
      DB_HOST: 'staging-db.example.com',
    };
    expect(() => assertPerfIsolation(env)).not.toThrow();
  });

  it('is a NO-OP when NODE_ENV=test', () => {
    const env = {
      NODE_ENV: 'test',
      DB_NAME: 'crm_platform',
      REDIS_DB: '0',
      DB_HOST: 'prod.example.com',
    };
    expect(() => assertPerfIsolation(env)).not.toThrow();
  });

  it('is a NO-OP when NODE_ENV=production (other modes have their own protections)', () => {
    const env = {
      NODE_ENV: 'production',
      DB_NAME: 'crm_platform',
      REDIS_DB: '0',
      DB_HOST: 'prod.example.com',
    };
    expect(() => assertPerfIsolation(env)).not.toThrow();
  });
});
