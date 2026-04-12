/**
 * Integration tests for activity log routes.
 */

import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

jest.mock('../../config', () => ({
  default: {
    env: 'test', port: 13000,
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh-secret', expiresIn: '1h', refreshExpiresIn: '7d' },
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
  return { default: new Sequelize('sqlite::memory:', { logging: false }), sequelize: new Sequelize('sqlite::memory:', { logging: false }), __esModule: true };
});

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../models/User', () => {
  const M: any = jest.fn();
  M.findOne = jest.fn(); M.findByPk = jest.fn(); M.create = jest.fn();
  M.update = jest.fn(); M.init = jest.fn(); M.belongsTo = jest.fn(); M.hasMany = jest.fn();
  return { default: M, __esModule: true };
});

jest.mock('../../models/Workspace', () => {
  const M: any = jest.fn();
  M.create = jest.fn(); M.update = jest.fn(); M.init = jest.fn();
  M.hasMany = jest.fn(); M.belongsTo = jest.fn();
  return { default: M, __esModule: true };
});

const modelNames = [
  'Board', 'BoardGroup', 'Column', 'Item', 'ColumnValue',
  'BoardView', 'Automation', 'AutomationLog', 'ActivityLog',
  'Notification', 'FileAttachment',
];
for (const name of modelNames) {
  jest.mock(`../../models/${name}`, () => {
    const M: any = jest.fn();
    M.init = jest.fn(); M.findAll = jest.fn().mockResolvedValue([]);
    M.findOne = jest.fn().mockResolvedValue(null); M.findByPk = jest.fn().mockResolvedValue(null);
    M.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
    M.create = jest.fn(); M.update = jest.fn(); M.destroy = jest.fn();
    M.upsert = jest.fn(); M.hasMany = jest.fn(); M.belongsTo = jest.fn();
    M.sum = jest.fn().mockResolvedValue(0);
    return { default: M, __esModule: true };
  });
}

jest.mock('../../models/index', () => ({}));
jest.mock('../../services/WebSocketService', () => ({
  default: { emitToBoard: jest.fn(), emitToWorkspace: jest.fn(), emitToUser: jest.fn() },
  __esModule: true,
}));

import request from 'supertest';
import app from '../../app';
import ActivityLog from '../../models/ActivityLog';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function auth(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({ sub: 5, email: 'test@test.com', workspaceId: 1, role: 'admin' });
  return ['Authorization', 'Bearer valid-token'];
}

const BASE = '/api/v1/activity';

describe('Activity log routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /activity', () => {
    it('returns paginated activity logs for workspace', async () => {
      const logs = [
        { id: 1, workspaceId: 1, userId: 5, entityType: 'item', entityId: 10, action: 'created', changes: null, createdAt: '2026-04-12T10:00:00Z' },
        { id: 2, workspaceId: 1, userId: 5, entityType: 'item', entityId: 11, action: 'updated', changes: { name: 'New name' }, createdAt: '2026-04-12T09:00:00Z' },
      ];
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: logs, count: 2 });

      const res = await request(app)
        .get(BASE)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities).toHaveLength(2);
      expect(res.body.data.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 20, total: 2 })
      );
      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: 1 }),
          order: [['createdAt', 'DESC']],
          limit: 20,
          offset: 0,
        })
      );
    });

    it('filters by boardId when provided', async () => {
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const res = await request(app)
        .get(`${BASE}?boardId=42`)
        .set(...auth());

      expect(res.status).toBe(200);
      // The route should look up items belonging to the board and filter
      // For simplicity, boardId filtering uses entityType + entityId lookup
      expect(ActivityLog.findAndCountAll).toHaveBeenCalled();
    });

    it('filters by entityType when provided', async () => {
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const res = await request(app)
        .get(`${BASE}?entityType=item`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: 1, entityType: 'item' }),
        })
      );
    });

    it('filters by action when provided', async () => {
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const res = await request(app)
        .get(`${BASE}?action=created`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: 1, action: 'created' }),
        })
      );
    });

    it('filters by userId when provided', async () => {
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const res = await request(app)
        .get(`${BASE}?userId=3`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: 1, userId: 3 }),
        })
      );
    });

    it('parses page and limit from query params', async () => {
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      await request(app)
        .get(`${BASE}?page=3&limit=10`)
        .set(...auth());

      expect(ActivityLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20, // (page 3 - 1) * limit 10
        })
      );
    });
  });

  describe('GET /activity/board/:boardId', () => {
    it('returns activity logs scoped to a board', async () => {
      const logs = [
        { id: 1, workspaceId: 1, userId: 5, entityType: 'item', entityId: 10, action: 'created', changes: null, createdAt: '2026-04-12T10:00:00Z' },
      ];
      (ActivityLog.findAndCountAll as jest.Mock).mockResolvedValue({ rows: logs, count: 1 });

      const res = await request(app)
        .get(`${BASE}/board/42`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities).toHaveLength(1);
    });

    it('returns 400 for invalid board ID', async () => {
      const res = await request(app)
        .get(`${BASE}/board/abc`)
        .set(...auth());

      expect(res.status).toBe(400);
    });
  });
});
