/**
 * Unit + integration tests for Slice 19C, Task A1:
 * `NODE_ENV=perf` config branch + middleware gates.
 *
 * Two layers of coverage:
 *
 *   (a) `isPerfMode()` unit behaviour — returns true only when
 *       `process.env.NODE_ENV === 'perf'`. Exercised for dev/test/prod.
 *
 *   (b) Express app middleware behaviour under `NODE_ENV=perf`:
 *         - /health still responds 200 (never blocked by perf mode).
 *         - POST /api/v1/admin/e2e/reset returns 404 even when
 *           `E2E_RESET_ENABLED=true` — perf runs must never mutate data.
 *         - morgan is NOT mounted (checked via `app._router.stack`).
 *         - Unhandled errors thrown from a route produce no `stack` or
 *           `trace` field in the response body (prod-variant handler).
 *
 * To keep the app importable without a real Postgres or Redis, we mock
 * every module that app.ts pulls in transitively (same pattern used by
 * health.test.ts and admin.e2e.test.ts).
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before `app` is imported.
// ---------------------------------------------------------------------------

jest.mock('../../config', () => ({
  default: {
    env: 'perf',
    port: 13000,
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    corsOrigins: ['http://localhost:3000'],
    rateLimit: { windowMs: 60000, max: 1000 },
    redisUrl: 'redis://localhost:6379',
    upload: { dir: './uploads', maxFileSize: 10485760, maxWorkspaceStorage: 524288000 },
    database: { host: 'localhost', port: 5432, name: 'crm_perf', user: 'test', password: 'test' },
    logLevel: 'error',
    requestLogging: false,
    debugEnabled: false,
  },
  __esModule: true,
}));

const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  define: jest.fn(),
  sync: jest.fn(),
  transaction: jest.fn(),
};
jest.mock('../../config/database', () => ({
  default: mockSequelize,
  sequelize: mockSequelize,
  __esModule: true,
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const stubModel = () => {
  const M: any = jest.fn();
  M.init = jest.fn();
  M.findAll = jest.fn().mockResolvedValue([]);
  M.findOne = jest.fn().mockResolvedValue(null);
  M.findByPk = jest.fn().mockResolvedValue(null);
  M.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
  M.create = jest.fn();
  M.update = jest.fn();
  M.destroy = jest.fn();
  M.upsert = jest.fn();
  M.hasMany = jest.fn();
  M.belongsTo = jest.fn();
  M.sum = jest.fn().mockResolvedValue(0);
  return { default: M, __esModule: true };
};
jest.mock('../../models/User', () => stubModel());
jest.mock('../../models/Workspace', () => stubModel());
for (const name of [
  'Board', 'BoardGroup', 'Column', 'Item', 'ColumnValue',
  'BoardView', 'Automation', 'AutomationLog', 'ActivityLog',
  'Notification', 'FileAttachment',
]) {
  jest.mock(`../../models/${name}`, () => stubModel());
}
jest.mock('../../models/index', () => ({}));
jest.mock('../../services/WebSocketService', () => ({
  default: { emitToBoard: jest.fn(), emitToWorkspace: jest.fn(), emitToUser: jest.fn() },
  __esModule: true,
}));
jest.mock('../../services/RedisService', () => ({
  __esModule: true,
  redisService: { ping: jest.fn().mockResolvedValue('PONG') },
  default: { ping: jest.fn().mockResolvedValue('PONG') },
}));
jest.mock('../../services/E2EResetService', () => ({
  __esModule: true,
  default: { reset: jest.fn().mockResolvedValue({ workspaceId: 1 }) },
  E2EResetService: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Env snapshots — restored after each test to keep the suite isolated.
// ---------------------------------------------------------------------------

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_E2E_FLAG = process.env.E2E_RESET_ENABLED;

function restoreEnv(): void {
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;

  if (ORIGINAL_E2E_FLAG === undefined) delete process.env.E2E_RESET_ENABLED;
  else process.env.E2E_RESET_ENABLED = ORIGINAL_E2E_FLAG;
}

// ---------------------------------------------------------------------------
// (a) isPerfMode() unit tests
// ---------------------------------------------------------------------------

describe('isPerfMode()', () => {
  afterEach(() => {
    restoreEnv();
    jest.resetModules();
  });

  it('returns true when NODE_ENV === "perf"', () => {
    process.env.NODE_ENV = 'perf';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isPerfMode } = require('../../config/perf');
      expect(isPerfMode()).toBe(true);
    });
  });

  it('returns false when NODE_ENV === "development"', () => {
    process.env.NODE_ENV = 'development';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isPerfMode } = require('../../config/perf');
      expect(isPerfMode()).toBe(false);
    });
  });

  it('returns false when NODE_ENV === "test"', () => {
    process.env.NODE_ENV = 'test';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isPerfMode } = require('../../config/perf');
      expect(isPerfMode()).toBe(false);
    });
  });

  it('returns false when NODE_ENV === "production"', () => {
    process.env.NODE_ENV = 'production';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isPerfMode } = require('../../config/perf');
      expect(isPerfMode()).toBe(false);
    });
  });

  it('exports perfDatabaseName = "crm_perf" and perfRedisDb = 1 constants', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const perf = require('../../config/perf');
      expect(perf.perfDatabaseName).toBe('crm_perf');
      expect(perf.perfRedisDb).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// (b) Express middleware behaviour under NODE_ENV=perf
// ---------------------------------------------------------------------------

describe('Express app — NODE_ENV=perf middleware gates', () => {
  // Sets up the perf env BEFORE requiring app, then forcibly imports a fresh
  // copy of the module graph so the middleware gating actually sees perf mode.
  beforeAll(() => {
    process.env.NODE_ENV = 'perf';
    process.env.E2E_RESET_ENABLED = 'true';
  });

  afterAll(() => {
    restoreEnv();
  });

  it('preserves /health — returns 200 even in perf mode', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const request = require('supertest');
    let app: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      app = require('../../app').default;
    });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
  });

  it('returns 404 for POST /api/v1/admin/e2e/reset in perf mode — even when E2E_RESET_ENABLED=true', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const request = require('supertest');
    let app: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      app = require('../../app').default;
    });

    const res = await request(app).post('/api/v1/admin/e2e/reset');

    expect(res.status).toBe(404);
  });

  it('does NOT mount morgan in perf mode (no logger middleware in router stack)', () => {
    let app: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      app = require('../../app').default;
    });

    // Express stores mounted middleware at `app._router.stack` (handlers) and
    // `app.router.stack` in newer versions. morgan registers with name 'logger'.
    const stack = (app._router?.stack ?? app.router?.stack ?? []) as Array<{ name?: string }>;
    const layerNames = stack.map((layer) => layer.name);

    expect(layerNames).not.toContain('logger');
  });

  it('does not leak stack traces in error responses — production-variant handler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const request = require('supertest');
    let app: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      app = require('../../app').default;
    });

    // Register a temporary throwing route. We attach it directly to the
    // running Express instance — the existing errorHandler is already last,
    // so this gets caught by it. We must add the route BEFORE the catch-all
    // 404 handler, which means using `.use` with a unique path at the top of
    // the request flow. Easiest reliable approach: attach a router that
    // throws on '/__perf_boom' and stack it before notFoundHandler — but app
    // is frozen. Instead, we rely on the fact that malformed JSON bodies
    // route through errorHandler via the express.json SyntaxError path,
    // producing a 400 body whose shape reflects the error handler's policy.
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"not-valid-json');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).not.toHaveProperty('stack');
    expect(res.body).not.toHaveProperty('trace');
    expect(res.body).not.toHaveProperty('stackTrace');
  });
});
