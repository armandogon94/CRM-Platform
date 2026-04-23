/**
 * Smoke tests for seed-perf.ts (Slice 19C, Task B1).
 *
 * This is the small-scale version: verifies the shape and idempotency
 * contract at 10 boards. The full 1000-board scale is covered by B2.
 *
 * The script talks to Sequelize models at run time; we mock each model
 * with an in-memory row store so the test can run without a DB. The
 * assertion surface is the set of rows written, re-run stability, and
 * determinism keyed on `PERF_SEED`.
 */

type Row = Record<string, unknown>;

interface RowStore {
  rows: Row[];
  nextId: number;
}

const makeStore = (): RowStore => ({ rows: [], nextId: 1 });

// Row stores for each model — fresh per test via resetStores() below.
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

// Build a minimal Sequelize-like model around a given store. Supports
// `create`, `bulkCreate`, `findOne`, `findOrCreate`, `count`, and
// `destroy`; more than enough for the seed path.
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
    bulkCreate: jest.fn(async (records: Row[]) => {
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
    findOrCreate: jest.fn(async ({ where, defaults }: { where: Record<string, unknown>; defaults: Row }) => {
      const existing = store.rows.find((r) => matches(r, where));
      if (existing) {
        return [{ ...existing, get: () => existing }, false];
      }
      const row = { id: store.nextId++, ...defaults, ...where };
      store.rows.push(row);
      return [{ ...row, get: () => row }, true];
    }),
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
    transaction: jest.fn(async (fn: (t: unknown) => Promise<unknown>) => fn({})),
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

describe('seed-perf smoke (B1)', () => {
  const originalEnv = { ...process.env };
  let stderr: jest.SpyInstance;
  let stdout: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    resetStores();
    process.env.NODE_ENV = 'perf';
    process.env.PERF_SEED = '42';
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    stderr.mockRestore();
    stdout.mockRestore();
    jest.restoreAllMocks();
  });

  const captured = (spy: jest.SpyInstance): string =>
    spy.mock.calls.map((call) => String(call[0])).join('');

  it('seeds exactly 1 workspace, 10 boards, 1000 items, and 15000 column values at boards=10', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 10 });

    expect(stores.workspace.rows).toHaveLength(1);
    expect(stores.workspace.rows[0].name).toBe('perf-workspace');
    expect(stores.board.rows).toHaveLength(10);
    expect(stores.item.rows).toHaveLength(1000);
    expect(stores.columnValue.rows).toHaveLength(15000);
  });

  it('is idempotent — re-running produces the same counts', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 10 });
    const firstRunCounts = {
      workspaces: stores.workspace.rows.length,
      boards: stores.board.rows.length,
      items: stores.item.rows.length,
      columnValues: stores.columnValue.rows.length,
    };

    await main({ boards: 10 });
    const secondRunCounts = {
      workspaces: stores.workspace.rows.length,
      boards: stores.board.rows.length,
      items: stores.item.rows.length,
      columnValues: stores.columnValue.rows.length,
    };

    expect(secondRunCounts).toEqual(firstRunCounts);
  });

  it('logs an idempotent-skip message on re-run', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 10 });
    await main({ boards: 10 });

    const allOut = captured(stderr) + captured(stdout);
    expect(allOut).toMatch(/\[seed-perf\]\s+idempotent\s+skip/i);
  });

  it('reports peak memory usage to stderr at completion', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 10 });

    const errOutput = captured(stderr);
    expect(errOutput).toMatch(/heap/i);
  });

  it('is deterministic — same PERF_SEED produces identical row shape across invocations', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/seed-perf');

    await main({ boards: 10 });
    const firstItems = stores.item.rows.map((r) => r.name);
    const firstColumnValues = stores.columnValue.rows.map((r) => JSON.stringify(r.value));

    resetStores();
    // reset modules so module-scoped RNGs re-initialise
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main: main2 } = require('../../scripts/seed-perf');
    await main2({ boards: 10 });

    const secondItems = stores.item.rows.map((r) => r.name);
    const secondColumnValues = stores.columnValue.rows.map((r) => JSON.stringify(r.value));

    expect(secondItems).toEqual(firstItems);
    expect(secondColumnValues).toEqual(firstColumnValues);
  });
});
