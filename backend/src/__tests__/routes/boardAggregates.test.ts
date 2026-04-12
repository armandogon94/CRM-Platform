/**
 * Integration tests for board aggregates endpoint (Dashboard).
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
    M.count = jest.fn().mockResolvedValue(0);
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
import Board from '../../models/Board';
import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import Column from '../../models/Column';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function auth(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({ sub: 5, email: 'test@test.com', workspaceId: 1, role: 'admin' });
  return ['Authorization', 'Bearer valid-token'];
}

describe('Board aggregates endpoint', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /boards/:boardId/aggregates', () => {
    it('returns aggregated data for a board', async () => {
      // Mock board exists
      (Board.findOne as jest.Mock).mockResolvedValue({ id: 42, workspaceId: 1 });

      // Mock items count
      (Item.count as jest.Mock).mockResolvedValue(15);

      // Mock items grouped
      (Item.findAll as jest.Mock).mockResolvedValue([
        { groupId: 1, dataValues: { count: 8 } },
        { groupId: 2, dataValues: { count: 7 } },
      ]);

      // Mock status column values for status counts
      (Column.findAll as jest.Mock).mockResolvedValue([
        { id: 1, columnType: 'status', name: 'Status' },
      ]);
      (ColumnValue.findAll as jest.Mock).mockResolvedValue([
        { value: 'Done', dataValues: { count: 5 } },
        { value: 'Working on it', dataValues: { count: 7 } },
        { value: 'Stuck', dataValues: { count: 3 } },
      ]);

      const res = await request(app)
        .get('/api/v1/boards/42/aggregates')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalItems');
      expect(res.body.data).toHaveProperty('statusCounts');
      expect(res.body.data).toHaveProperty('itemsByGroup');
    });

    it('returns 404 when board not found', async () => {
      (Board.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/boards/999/aggregates')
        .set(...auth());

      expect(res.status).toBe(404);
    });

    it('returns empty statusCounts when no status columns exist', async () => {
      (Board.findOne as jest.Mock).mockResolvedValue({ id: 42, workspaceId: 1 });
      (Item.count as jest.Mock).mockResolvedValue(5);
      (Item.findAll as jest.Mock).mockResolvedValue([]);
      (Column.findAll as jest.Mock).mockResolvedValue([]);
      (ColumnValue.findAll as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/boards/42/aggregates')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.data.statusCounts).toEqual({});
      expect(res.body.data.totalItems).toBe(5);
    });
  });
});
