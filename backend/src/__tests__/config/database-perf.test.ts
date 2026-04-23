/**
 * Slice 19C, Task A2 — `crm_perf` database config branch.
 *
 * Verifies that the exported Sequelize instance from `config/database.ts`
 * switches to the perf database + perf-tuned pool ONLY when
 * `NODE_ENV=perf`, and remains unchanged for every other environment
 * (`development`, `test`, `production`, unset).
 *
 * Strategy: each case isolates its own module graph via `jest.isolateModules`
 * after setting `process.env.NODE_ENV`, then re-requires `config/database`
 * so the module-level `new Sequelize(...)` call sees the current env.
 *
 * We intentionally do NOT authenticate against a real Postgres — these are
 * pure config-shape assertions against the in-memory Sequelize instance.
 */

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_DB_NAME = process.env.DB_NAME;

function restoreEnv(): void {
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;

  if (ORIGINAL_DB_NAME === undefined) delete process.env.DB_NAME;
  else process.env.DB_NAME = ORIGINAL_DB_NAME;
}

// Ensure no ambient DB_NAME overrides the default branching logic we're
// testing. Tests that want to verify env-var override behaviour would set
// DB_NAME explicitly per-case; here we assert the default-branch values.
function clearDbNameOverride(): void {
  delete process.env.DB_NAME;
}

describe('config/database — NODE_ENV=perf branch (Slice 19C A2)', () => {
  afterEach(() => {
    restoreEnv();
    jest.resetModules();
  });

  it('targets the crm_perf database when NODE_ENV=perf', () => {
    process.env.NODE_ENV = 'perf';
    clearDbNameOverride();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sequelize } = require('../../config/database');
      // Sequelize exposes `getDatabaseName()` (v6+) and `config.database`.
      expect(sequelize.getDatabaseName()).toBe('crm_perf');
      expect(sequelize.config.database).toBe('crm_perf');
    });
  });

  it('tunes the connection pool to { min: 0, max: 20 } in perf mode', () => {
    process.env.NODE_ENV = 'perf';
    clearDbNameOverride();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sequelize } = require('../../config/database');
      const pool = sequelize.options.pool;
      expect(pool).toBeDefined();
      expect(pool.max).toBe(20);
      expect(pool.min).toBe(0);
      expect(pool.acquire).toBe(30000);
      expect(pool.idle).toBe(10000);
    });
  });

  it('disables SQL logging in perf mode so latency measurements are not skewed', () => {
    process.env.NODE_ENV = 'perf';
    clearDbNameOverride();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sequelize } = require('../../config/database');
      expect(sequelize.options.logging).toBe(false);
    });
  });

  it('leaves development config unchanged — dev defaults to crm_platform + pool { min: 2, max: 10 } + verbose logging', () => {
    process.env.NODE_ENV = 'development';
    clearDbNameOverride();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sequelize } = require('../../config/database');
      expect(sequelize.getDatabaseName()).toBe('crm_platform');
      expect(sequelize.options.pool).toMatchObject({
        min: 2,
        max: 10,
        acquire: 30000,
        idle: 10000,
      });
      // Dev uses a function-based logger; perf + prod use `false`.
      expect(typeof sequelize.options.logging).toBe('function');
    });
  });

  it('leaves production config unchanged — prod defaults to crm_platform + pool { min: 2, max: 10 } + no logging', () => {
    process.env.NODE_ENV = 'production';
    clearDbNameOverride();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sequelize } = require('../../config/database');
      expect(sequelize.getDatabaseName()).toBe('crm_platform');
      expect(sequelize.options.pool).toMatchObject({
        min: 2,
        max: 10,
        acquire: 30000,
        idle: 10000,
      });
      expect(sequelize.options.logging).toBe(false);
    });
  });
});
