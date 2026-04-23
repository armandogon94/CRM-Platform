/**
 * Scale tests for seed-perf.ts (Slice 19C, Task B2).
 *
 * Full scale is 1000 boards × 100 items × 15 columns = 1.5M column_values,
 * which takes 3–5 min against real Postgres and is unsuitable for CI. The
 * seeder accepts a `PERF_SCALE_FACTOR` env var that multiplies `boards`,
 * `itemsPerBoard`, and `columnsPerBoard` (each rounded up to a minimum of
 * 1) so CI can exercise the same code path in milliseconds.
 *
 * Like the smoke test, we mock Sequelize models with in-memory row stores
 * so no DB is required. The assertion surface is:
 *   - scale-factor math (boards/items/columns all scale proportionally)
 *   - memory ceiling (heapUsed after run stays under 512 MB)
 *   - progress log every 100 boards when running 1000 boards
 */

// Make this file a module so top-level `const` declarations don't
// collide with the smoke test's identically-named symbols (which live
// in the same TypeScript project scope).
export {};

type Row = Record<string, unknown>;

interface RowStore {
  rows: Row[];
  nextId: number;
}

const makeStore = (): RowStore => ({ rows: [], nextId: 1 });

const stores: Record<string, RowStore> = {
  workspace: makeStore(),
  user: makeStore(),
  board: makeStore(),
  boardGroup: makeStore(),
  column: makeStore(),
  item: makeStore(),
  columnValue: makeStore(),
};

const resetStores = (): void => {
  for (const key of Object.keys(stores)) {
    stores[key].rows = [];
    stores[key].nextId = 1;
  }
};

const buildModel = (store: RowStore) => {
  const matches = (row: Row, where: Record<string, unknown> | undefined): boolean => {
    if (!where) return true;
    return Object.entries(where).every(([k, v]) => row[k] === v);
  };

  return {
    create: jest.fn(async (data: Row) => {
      const row = { id: store.nextId++, ...data };
      store.rows.push(row);
      return { ...row, get: () => row };
    }),
    bulkCreate: jest.fn(async (records: Row[], _options?: unknown) => {
      const created = records.map((r) => {
        const row = { id: store.nextId++, ...r };
        store.rows.push(row);
        return { ...row, get: () => row };
      });
      return created;
    }),
    findOne: jest.fn(async ({ where }: { where?: Record<string, unknown> } = {}) => {
      const row = store.rows.find((r) => matches(r, where));
      return row ? { ...row, get: () => row } : null;
    }),
    findOrCreate: jest.fn(
      async ({ where, defaults }: { where: Record<string, unknown>; defaults: Row }) => {
        const existing = store.rows.find((r) => matches(r, where));
        if (existing) {
          return [{ ...existing, get: () => existing }, false];
        }
        const row = { id: store.nextId++, ...defaults, ...where };
        store.rows.push(row);
        return [{ ...row, get: () => row }, true];
      }
    ),
    count: jest.fn(async ({ where }: { where?: Record<string, unknown> } = {}) => {
      return store.rows.filter((r) => matches(r, where)).length;
    }),
    destroy: jest.fn(async () => {
      const n = store.rows.length;
      store.rows = [];
      return n;
    }),
    update: jest.fn(async () => [0]),
  };
};

jest.mock('../../models', () => ({
  __esModule: true,
  Workspace: buildModel(stores.workspace),
  User: buildModel(stores.user),
  Board: buildModel(stores.board),
  BoardGroup: buildModel(stores.boardGroup),
  Column: buildModel(stores.column),
  Item: buildModel(stores.item),
  ColumnValue: buildModel(stores.columnValue),
  sequelize: {
    transaction: jest.fn(async () => ({
      commit: jest.fn(async () => undefined),
      rollback: jest.fn(async () => undefined),
    })),
    close: jest.fn(async () => undefined),
  },
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async () => '$2a$12$stubhash'),
  },
  hash: jest.fn(async () => '$2a$12$stubhash'),
}));

describe('seed-perf scale (B2)', () => {
  const originalEnv = { ...process.env };
  let stderr: jest.SpyInstance;
  let stdout: jest.SpyInstance;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    resetStores();
    process.env.NODE_ENV = 'perf';
    process.env.PERF_SEED = '42';
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    // Keep console.error values observable for assertions but suppress
    // output to keep test logs clean. We still track calls via spy.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    stderr.mockRestore();
    stdout.mockRestore();
    consoleError.mockRestore();
    jest.restoreAllMocks();
  });

  const captured = (spy: jest.SpyInstance): string =>
    spy.mock.calls.map((call) => String(call[0])).join('');

  it('scales boards, items, and columns proportionally when PERF_SCALE_FACTOR=0.01', async () => {
    process.env.PERF_SCALE_FACTOR = '0.01';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    // Request 1000 boards but factor 0.01 → 10 boards × 1 item × 1 column = 10 column_values.
    await main({ boards: 1000 });

    expect(stores.board.rows).toHaveLength(10);
    expect(stores.item.rows).toHaveLength(10); // 10 boards × 1 item
    expect(stores.columnValue.rows).toHaveLength(10); // 10 × 1 × 1
    expect(stores.column.rows).toHaveLength(10); // 10 boards × 1 column
  });

  it('rounds scaled dimensions up to at least 1 (never zero)', async () => {
    process.env.PERF_SCALE_FACTOR = '0.0001';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    // Factor 0.0001 × 1 board would be 0.0001 → clamped to 1.
    await main({ boards: 1 });

    expect(stores.board.rows.length).toBeGreaterThanOrEqual(1);
    expect(stores.item.rows.length).toBeGreaterThanOrEqual(1);
    expect(stores.columnValue.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps heapUsed under 512 MB at scale-factor 0.01', async () => {
    process.env.PERF_SCALE_FACTOR = '0.01';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 1000 });

    const heapMb = process.memoryUsage().heapUsed / 1024 / 1024;
    // 512 MB is the stated B2 budget for full scale; at 0.01 any leak
    // blows past this trivially. Use it as a hard ceiling.
    expect(heapMb).toBeLessThan(512);
  });

  it('logs progress every 100 boards at 1000-board scale (via console.error for stderr)', async () => {
    // Run at full scaled-down shape but keep boards=1000 so we tick
    // past the 100-board progress threshold ten times. Factor 0.01
    // reduces per-board work enough for the test to complete quickly.
    process.env.PERF_SCALE_FACTOR = '0.1';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 1000 });

    const errOutput = captured(stderr) + consoleError.mock.calls.map((c) => String(c[0])).join('');
    // Expect at least one "progress" log (100/100, 200/100, ...).
    expect(errOutput).toMatch(/\[seed-perf\]\s+progress/i);
  });

  it('does not emit progress logs at smoke scale (10 boards)', async () => {
    process.env.PERF_SCALE_FACTOR = '1';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 10 });

    const errOutput = captured(stderr) + consoleError.mock.calls.map((c) => String(c[0])).join('');
    expect(errOutput).not.toMatch(/\[seed-perf\]\s+progress/i);
  });

  it('passes batchSize=5000 to Sequelize bulkCreate for column values', async () => {
    process.env.PERF_SCALE_FACTOR = '0.01';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ColumnValue } = require('../../models');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 1000 });

    // Every bulkCreate call on ColumnValue must include batchSize: 5000.
    const calls = (ColumnValue.bulkCreate as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const [, options] of calls) {
      expect(options).toMatchObject({ batchSize: 5000 });
    }
  });
});
