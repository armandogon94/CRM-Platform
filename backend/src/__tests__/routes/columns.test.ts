/**
 * Integration tests for column CRUD routes.
 * Mocks ColumnService, verifies route param parsing and response formats.
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
  return {
    default: new Sequelize('sqlite::memory:', { logging: false }),
    sequelize: new Sequelize('sqlite::memory:', { logging: false }),
    __esModule: true,
  };
});

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Mock ColumnService
const mockList = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockReorder = jest.fn();

jest.mock('../../services/ColumnService', () => ({
  default: {
    list: (...args: any[]) => mockList(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
    reorder: (...args: any[]) => mockReorder(...args),
  },
  __esModule: true,
}));

// Mock models
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
    M.create = jest.fn(); M.update = jest.fn(); M.destroy = jest.fn();
    M.upsert = jest.fn(); M.hasMany = jest.fn(); M.belongsTo = jest.fn();
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

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function auth(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({
    id: 1, email: 'test@test.com', workspaceId: 1, role: 'admin',
  });
  return ['Authorization', 'Bearer valid-token'];
}

const BASE = '/api/v1/workspaces/1/boards/10/columns';

describe('Column routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /columns', () => {
    it('creates column with correct type and config', async () => {
      const created = { id: 1, boardId: 10, name: 'Status', columnType: 'status', config: { options: [] }, position: 0 };
      mockCreate.mockResolvedValue(created);

      const res = await request(app)
        .post(BASE)
        .set(...auth())
        .send({ name: 'Status', columnType: 'status', config: { options: [] } });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Status', columnType: 'status' }),
        10, 1, expect.any(Object)
      );
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post(BASE)
        .set(...auth())
        .send({ columnType: 'text' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid column type', async () => {
      mockCreate.mockRejectedValue(new Error('Invalid column type: bogus'));

      const res = await request(app)
        .post(BASE)
        .set(...auth())
        .send({ name: 'Bad', columnType: 'bogus' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });
  });

  describe('PUT /columns/:id', () => {
    it('updates column name', async () => {
      const updated = { id: 1, boardId: 10, name: 'New Name' };
      mockUpdate.mockResolvedValue(updated);

      const res = await request(app)
        .put(`${BASE}/1`)
        .set(...auth())
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        1, 10,
        expect.objectContaining({ name: 'New Name' }),
        1, expect.any(Object)
      );
    });
  });

  describe('PUT /columns/reorder', () => {
    it('reorders columns with valid columnIds', async () => {
      mockReorder.mockResolvedValue([{ id: 2 }, { id: 1 }]);

      const res = await request(app)
        .put(`${BASE}/reorder`)
        .set(...auth())
        .send({ columnIds: [2, 1] });

      expect(res.status).toBe(200);
      expect(mockReorder).toHaveBeenCalledWith(10, [2, 1], 1, expect.any(Object));
    });

    it('returns 400 for missing columnIds', async () => {
      const res = await request(app)
        .put(`${BASE}/reorder`)
        .set(...auth())
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /columns/:id', () => {
    it('deletes column and returns success', async () => {
      mockDelete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete(`${BASE}/1`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(mockDelete).toHaveBeenCalledWith(1, 10, 1, expect.any(Object));
    });

    it('returns 404 when column not found', async () => {
      mockDelete.mockRejectedValue(new Error('Column not found'));

      const res = await request(app)
        .delete(`${BASE}/999`)
        .set(...auth());

      expect(res.status).toBe(404);
    });
  });
});
