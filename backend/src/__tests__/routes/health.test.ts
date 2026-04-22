/**
 * Integration tests for the /health endpoint (Slice 19, Task A2).
 *
 * The endpoint must probe both the database and Redis, return a
 * consistent response shape, and surface a 503 when either subsystem
 * is unhealthy.
 */

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

// Fake sequelize — only needs authenticate() for the /health probe.
// Using an object (not a real Sequelize instance) avoids needing a dialect driver.
const mockSequelize = {
  authenticate: jest.fn(),
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

// Stub all models so importing app doesn't try to connect to Postgres.
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

// Mock RedisService so we can control ping() outcomes per test.
const mockPing = jest.fn();
jest.mock('../../services/RedisService', () => ({
  __esModule: true,
  redisService: { ping: (...args: unknown[]) => mockPing(...args) },
  default: { ping: (...args: unknown[]) => mockPing(...args) },
}));

import request from 'supertest';
import app from '../../app';

describe('GET /health', () => {
  const authSpy = mockSequelize.authenticate as jest.Mock;

  beforeEach(() => {
    authSpy.mockReset();
    mockPing.mockReset();
  });

  it('returns 200 with status=ok when DB and Redis are both healthy', async () => {
    authSpy.mockResolvedValue(undefined);
    mockPing.mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        db: 'ok',
        redis: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      })
    );
  });

  it('returns 503 with status=degraded when DB authenticate rejects', async () => {
    authSpy.mockRejectedValue(new Error('connection refused'));
    mockPing.mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'degraded',
        db: 'error',
        redis: 'ok',
      })
    );
  });

  it('returns 503 with status=degraded when Redis ping rejects', async () => {
    authSpy.mockResolvedValue(undefined);
    mockPing.mockRejectedValue(new Error('redis unreachable'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'degraded',
        db: 'ok',
        redis: 'error',
      })
    );
  });

  it('returns 503 with both db and redis marked error when both fail', async () => {
    authSpy.mockRejectedValue(new Error('db down'));
    mockPing.mockRejectedValue(new Error('redis down'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'degraded',
        db: 'error',
        redis: 'error',
      })
    );
  });

  it('marks a subsystem as error when its probe exceeds the 2s timeout', async () => {
    // Never resolve — simulates a hung connection.
    authSpy.mockImplementation(() => new Promise(() => { /* hang */ }));
    mockPing.mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.db).toBe('error');
    expect(res.body.redis).toBe('ok');
  }, 5000);
});
