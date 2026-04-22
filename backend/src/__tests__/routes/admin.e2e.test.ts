/**
 * Integration tests for POST /api/v1/admin/e2e/reset (Slice 19, Task A4).
 *
 * Guard matrix (defense in depth):
 *   - NODE_ENV=production + E2E_RESET_ENABLED=true  → 404 (must not reveal)
 *   - NODE_ENV=test        + E2E_RESET_ENABLED unset → 404
 *   - NODE_ENV=test        + E2E_RESET_ENABLED=true  → auth required
 *     ├── no / invalid JWT → 401
 *     └── valid JWT        → 200 with { ok: true } and reset() called once
 *
 * We freeze process.env per-test so the module-level env-guard middleware
 * reads the correct values on every request. A singleton E2EResetService
 * mock captures call counts.
 */

import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

jest.mock('../../config', () => ({
  default: {
    env: 'test',
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
    database: { host: 'localhost', port: 5432, name: 'test', user: 'test', password: 'test' },
  },
  __esModule: true,
}));

jest.mock('../../config/database', () => {
  const { Sequelize } = jest.requireActual('sequelize');
  const s = new Sequelize('sqlite::memory:', { logging: false });
  return { default: s, sequelize: s, __esModule: true };
});

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

// Mock the reset service as a singleton with a jest.fn for reset()
const mockReset = jest.fn();
jest.mock('../../services/E2EResetService', () => ({
  __esModule: true,
  default: { reset: (...args: unknown[]) => mockReset(...args) },
  E2EResetService: jest.fn(),
}));

import request from 'supertest';
import app from '../../app';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function authHeader(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({
    sub: 1,
    email: 'e2e@novapay.test',
    workspaceId: 1,
    role: 'admin',
  });
  return ['Authorization', 'Bearer valid-token'];
}

describe('POST /api/v1/admin/e2e/reset — env-guarded', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  const ORIGINAL_FLAG = process.env.E2E_RESET_ENABLED;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReset.mockResolvedValue({ workspaceId: 42 });
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = ORIGINAL_ENV;
    if (ORIGINAL_FLAG === undefined) delete process.env.E2E_RESET_ENABLED;
    else process.env.E2E_RESET_ENABLED = ORIGINAL_FLAG;
  });

  it('returns 404 when NODE_ENV=production even if E2E_RESET_ENABLED=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.E2E_RESET_ENABLED = 'true';

    const res = await request(app)
      .post('/api/v1/admin/e2e/reset')
      .set(...authHeader());

    expect(res.status).toBe(404);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('returns 404 when E2E_RESET_ENABLED is unset (NODE_ENV=test)', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.E2E_RESET_ENABLED;

    const res = await request(app)
      .post('/api/v1/admin/e2e/reset')
      .set(...authHeader());

    expect(res.status).toBe(404);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('returns 404 when E2E_RESET_ENABLED is "false"', async () => {
    process.env.NODE_ENV = 'test';
    process.env.E2E_RESET_ENABLED = 'false';

    const res = await request(app)
      .post('/api/v1/admin/e2e/reset')
      .set(...authHeader());

    expect(res.status).toBe(404);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('returns 401 when JWT is missing (env valid)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.E2E_RESET_ENABLED = 'true';

    const res = await request(app).post('/api/v1/admin/e2e/reset');

    expect(res.status).toBe(401);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('returns 401 when JWT is invalid (env valid)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.E2E_RESET_ENABLED = 'true';
    (mockedJwtVerify as jest.Mock).mockImplementation(() => {
      const err: any = new Error('invalid');
      err.name = 'JsonWebTokenError';
      throw err;
    });

    const res = await request(app)
      .post('/api/v1/admin/e2e/reset')
      .set('Authorization', 'Bearer garbage');

    expect(res.status).toBe(401);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('returns 200 with { ok: true } and calls E2EResetService.reset once when env + JWT valid', async () => {
    process.env.NODE_ENV = 'test';
    process.env.E2E_RESET_ENABLED = 'true';

    const res = await request(app)
      .post('/api/v1/admin/e2e/reset')
      .set(...authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ ok: true, workspaceId: 42 })
    );
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('returns 200 with workspaceId=null when reset() returns null (no fixture workspace yet)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.E2E_RESET_ENABLED = 'true';
    mockReset.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/admin/e2e/reset')
      .set(...authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ ok: true, workspaceId: null })
    );
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
